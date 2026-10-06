import { useUploadStore } from "../store/uploadStore";
import { uploadsAPI } from "../api/uploadApi";
import { importAPI } from "../api/importApi";
import { GDRIVE_POLL_INTERVAL_MS } from "./constants";
import { generateThumbnail, getImageMimeType } from "./fileUtils";

const MAX_CONCURRENCY = 3;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CHUNK_THRESHOLD = 5 * 1024 * 1024;

const MAX_PART_ATTEMPTS = 3;
const PART_RETRY_BASE_DELAY_MS = 2000;
const PART_UPLOAD_TIMEOUT_MS = 150000;

/** Track active XHRs so in-flight uploads can be aborted on cancel. */
const activeXhrs = new Map();

/**
 * Cancel an upload: abort the in-flight XHR (if any), tell the server to
 * discard the multipart session, and mark the item cancelled.
 */
export function cancelUpload(localId) {
  const store = useUploadStore.getState();
  const item = store.uploads.find((u) => u.localId === localId);
  // Already cancelled (double-click, Cancel + Cancel All): the first call
  // already notified the server — a second DELETE would just 404.
  if (!item || item.status === "cancelled") return;

  const xhr = activeXhrs.get(localId);
  if (xhr) {
    try {
      xhr.abort();
    } catch {
      /* ignore */
    }
    activeXhrs.delete(localId);
  }

  // Only live sessions need server cleanup. Completed/failed rows keep their
  // uploadId but the session is already gone — notifying then just 404s.
  if (
    item.uploadId &&
    ["queued", "uploading", "paused"].includes(item.status)
  ) {
    uploadsAPI.cancel(item.uploadId).catch(() => {});
  }
  store.cancelUploadLocal(localId);
  window.dispatchEvent(
    new CustomEvent("vd:upload-cancelled", {
      detail: { localId, name: item.name },
    }),
  );
}

/**
 * Upload a single file through the S3 presigned URL flow.
 * Reads from the Zustand store directly (getState) so it doesn't
 * require React context or hooks.
 */
async function uploadFile(localId) {
  const store = useUploadStore.getState();
  const item = store.uploads.find((u) => u.localId === localId);
  if (!item || item.status === "cancelled") return;

  try {
    store.updateUpload(localId, { status: "uploading", startedAt: Date.now() });

    const mime = (item.type && item.type !== "application/octet-stream")
      ? item.type
      : (getImageMimeType(item.name, item.type) || "application/octet-stream");

    const fileMeta = {
      name: item.name,
      size: item.size,
      mime,
    };

    // Reuse the existing backend session when retrying (the same S3 uploadId keeps
    // already-uploaded parts in S3, so we can resume from a prior attempt). Fall back
    // to a fresh initiate if the session expired or was never created.
    let session = null;
    let uploadedParts = [];

    if (item.uploadId) {
      try {
        const retryRes = await uploadsAPI.retry(item.uploadId);
        session = retryRes.data?.data?.session;
        uploadedParts = Array.isArray(item.uploadedParts)
          ? item.uploadedParts
          : [];
      } catch (retryErr) {
        session = null;
      }
    }

    if (!session) {
      const initiateRes = await uploadsAPI.initiate({
        file: fileMeta,
        targetId: item.parentId,
      });
      session = initiateRes.data?.data?.session;
      uploadedParts = [];
    }

    if (!session) throw new Error("No session returned from server.");

    const { id: uploadId, urls, totalParts, partSize, uploadType, maxConcurrency } = session;

    store.updateUpload(localId, {
      uploadId,
      urls,
      totalParts,
      partSize,
      uploadType,
      uploadedParts,
      error: null,
    });

    const uploadedPartNumbers = new Set(uploadedParts.map((p) => p.partNumber));
    const thumbPromise = generateThumbnail(item.file).catch(() => undefined);

    if (uploadType === "standard") {
      const { url, partNumber, contentLength } = urls[0];

      // Part already confirmed on a prior attempt — nothing left to upload.
      if (uploadedPartNumbers.has(partNumber)) {
        store.updateUpload(localId, { progress: 100 });
      } else {
        const blob = item.file.slice(0, contentLength);

        const xhr = new XMLHttpRequest();
        activeXhrs.set(localId, xhr);
        await new Promise((resolve, reject) => {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              store.updateUpload(localId, {
                progress: Math.round((e.loaded / e.total) * 100),
              });
            }
          };
          xhr.onload = () => {
            activeXhrs.delete(localId);
            if (xhr.status >= 200 && xhr.status < 300) {
              const etag = xhr.getResponseHeader("ETag");
              uploadedParts.push({ ETag: etag, partNumber });
              resolve();
            } else {
              reject(new Error(`S3 PUT failed with status ${xhr.status}`));
            }
          };
          xhr.onerror = () => {
            activeXhrs.delete(localId);
            reject(new Error("Network error during upload."));
          };
          xhr.open("PUT", url);
          xhr.setRequestHeader("Content-Type", item.type);
          xhr.send(blob);
        });
      }
    } else {
      const concurrency = Math.min(maxConcurrency || 3, totalParts);
      let nextPart = 0;
      let stopped = false;
      let completedParts = uploadedParts.length;

      await Promise.all(
        Array.from({ length: concurrency }, async () => {
          while (nextPart < totalParts && !stopped) {
            const current = useUploadStore.getState().uploads.find((u) => u.localId === localId);
            if (!current || current.status === "cancelled") {
              stopped = true;
              return;
            }
            if (current.status === "paused") {
              await waitForResume(localId);
              const check = useUploadStore.getState().uploads.find((u) => u.localId === localId);
              if (!check || check.status === "cancelled") {
                stopped = true;
                return;
              }
            }

            const i = nextPart++;
            const partNumber = i + 1;

            // Skip parts already confirmed in a previous attempt.
            if (uploadedPartNumbers.has(partNumber)) {
              completedParts++;
              store.updateUpload(localId, {
                partIndex: partNumber,
                progress: Math.round((completedParts / totalParts) * 100),
              });
              continue;
            }

            const { url, contentLength } = urls[i];
            const start = i * partSize;
            const end = Math.min(start + contentLength, item.size);
            const blob = item.file.slice(start, end);

            try {
              const etag = await uploadPartWithRetries(
                localId,
                url,
                blob,
                item.type,
              );
              uploadedParts.push({ ETag: etag, partNumber });
              completedParts++;
              store.updateUpload(localId, {
                partIndex: partNumber,
                uploadedParts: [...uploadedParts],
                progress: Math.round((completedParts / totalParts) * 100),
              });
            } catch (err) {
              activeXhrs.delete(localId);
              const current = useUploadStore
                .getState()
                .uploads.find((u) => u.localId === localId);
              if (err.aborted || current?.status === "cancelled") {
                stopped = true;
                return;
              }
              stopped = true;
              throw err;
            }
          }
        })
      );

      // Stopped by user cancel: cancelUpload() already discarded the server
      // session — just exit instead of notifying a second time.
      if (stopped) {
        return;
      }
    }

    store.updateUpload(localId, { progress: 100 });

    const thumbnailBase64 = await thumbPromise;

    const completeBody = { parts: uploadedParts };
    if (thumbnailBase64) completeBody.thumbnailBase64 = thumbnailBase64;
    const completeRes = await uploadsAPI.complete(uploadId, completeBody);

    store.updateUpload(localId, { status: "completed", progress: 100 });

    const completedFile = completeRes.data?.data;
    window.dispatchEvent(
      new CustomEvent("vd:upload-completed", {
        detail: {
          localId,
          parentId: item.parentId,
          file: completedFile,
        },
      })
    );

    return completedFile;
  } catch (err) {
    const current = useUploadStore.getState().uploads.find((u) => u.localId === localId);
    if (current?.status === "cancelled") return;
    store.updateUpload(localId, {
      status: "failed",
      error: err.message || "Upload failed",
    });
  }
}

function uploadPartWithRetries(localId, url, blob, contentType) {
  return (async () => {
    let lastErr;
    for (let attempt = 0; attempt < MAX_PART_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await sleep(PART_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1));
      }
      try {
        return await uploadPartXhr(localId, url, blob, contentType);
      } catch (err) {
        lastErr = err;
        if (!err.retryable) throw err;
        const current = useUploadStore
          .getState()
          .uploads.find((u) => u.localId === localId);
        if (!current || current.status === "cancelled") throw err;
      }
    }
    throw lastErr;
  })();
}

function uploadPartXhr(localId, url, blob, contentType) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    activeXhrs.set(localId, xhr);
    xhr.timeout = PART_UPLOAD_TIMEOUT_MS;
    xhr.onload = () => {
      activeXhrs.delete(localId);
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.getResponseHeader("ETag"));
      } else {
        const err = new Error(`S3 part upload failed (${xhr.status})`);
        err.status = xhr.status;
        err.retryable = xhr.status >= 500 || xhr.status === 408;
        reject(err);
      }
    };
    xhr.onerror = () => {
      activeXhrs.delete(localId);
      const err = new Error("Network error during part upload.");
      err.retryable = true;
      reject(err);
    };
    xhr.ontimeout = () => {
      activeXhrs.delete(localId);
      const err = new Error("Part upload timed out.");
      err.retryable = true;
      reject(err);
    };
    xhr.onabort = () => {
      activeXhrs.delete(localId);
      const err = new Error("Part upload aborted.");
      err.aborted = true;
      reject(err);
    };
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.send(blob);
  });
}

function waitForResume(localId) {
  return new Promise((resolve) => {
    const unsub = useUploadStore.subscribe((state) => {
      const item = state.uploads.find((u) => u.localId === localId);
      if (!item || item.status !== "paused") {
        unsub();
        resolve();
      }
    });
  });
}

/**
 * Process queued uploads with concurrency limit.
 * Called whenever new items are added to the queue.
 */
let processing = false;

export async function processQueue() {
  if (processing) return;
  processing = true;

  while (true) {
    const store = useUploadStore.getState();
    const active = store.uploads.filter((u) => u.status === "uploading").length;
    const queued = store.uploads.filter((u) => u.status === "queued");

    if (queued.length === 0 && active === 0) break;
    if (queued.length === 0 || active >= MAX_CONCURRENCY) {
      await sleep(200);
      continue;
    }

    const next = queued[0];
    uploadFile(next.localId);
    await sleep(50);
  }

  processing = false;
}

/**
 * Import a single Google Drive file.
 * Flow: initiate (create Redis session) → start (202 fire-and-forget) → poll progress → complete (finalize DB record).
 */
async function importFile(localId) {
  const store = useUploadStore.getState;
  const item = store().imports.find((i) => i.localId === localId);
  if (!item || item.status === "cancelled") return;

  try {
    store().updateImport(localId, { status: "uploading", startedAt: Date.now() });

    const initRes = await importAPI.initiate({
      file: {
        id: item.file.googleDriveId,
        name: item.name,
        mime: item.type || "application/octet-stream",
        size: Math.max(Number(item.size) || 0, 1),
      },
      targetId: item.parentId,
    });
    const sessionId = initRes.data?.data?.file?.id;
    if (!sessionId) throw new Error("No import session returned from server.");
    store().updateImport(localId, { sessionId });

    await importAPI.startImport(sessionId);

    while (true) {
      const fresh = store().imports.find((i) => i.localId === localId);
      if (!fresh || fresh.status === "cancelled") return;

      const { data: progData } = await importAPI.getProgress(sessionId);
      const { status, progress } = progData.data.file;
      store().updateImport(localId, { progress: progress ?? 0 });

      if (status === "can_complete") break;
      if (status === "completed") {
        store().updateImport(localId, { status: "completed", progress: 100 });
        return;
      }
      if (status === "failed") throw new Error("Google Drive import failed on server.");

      await new Promise((r) => setTimeout(r, GDRIVE_POLL_INTERVAL_MS));
    }

    const completeRes = await importAPI.complete(sessionId);
    store().updateImport(localId, { status: "completed", progress: 100 });

    window.dispatchEvent(
      new CustomEvent("vd:import-completed", {
        detail: {
          localId,
          parentId: item.parentId,
          file: completeRes.data?.data?.item,
        },
      })
    );
  } catch (err) {
    const current = store().imports.find((i) => i.localId === localId);
    if (current && current.status !== "cancelled") {
      console.error("GDrive import error:", err);
      store().updateImport(localId, {
        status: "failed",
        error: err.message || "Import failed",
      });
    }
  }
}

/**
 * Process queued imports with concurrency limit.
 * Called after confirming pending imports.
 */
let importProcessing = false;

export async function processImportQueue() {
  if (importProcessing) return;
  importProcessing = true;

  while (true) {
    const store = useUploadStore.getState();
    const active = store.imports.filter((i) => i.status === "uploading").length;
    const queued = store.imports.filter((i) => i.status === "queued");

    if (queued.length === 0 && active === 0) break;
    if (queued.length === 0 || active >= MAX_CONCURRENCY) {
      await sleep(200);
      continue;
    }

    const next = queued[0];
    importFile(next.localId);
    await sleep(50);
  }

  importProcessing = false;
}
