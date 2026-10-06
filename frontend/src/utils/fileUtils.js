const EXT_COLORS = {
  pdf: '#ef4444', doc: '#3b82f6', docx: '#3b82f6',
  xls: '#22c55e', xlsx: '#22c55e', csv: '#22c55e',
  ppt: '#f97316', pptx: '#f97316',
  png: '#8b5cf6', jpg: '#8b5cf6', jpeg: '#8b5cf6', gif: '#8b5cf6', webp: '#8b5cf6', svg: '#8b5cf6',
  mp4: '#ec4899', mov: '#ec4899',
  mp3: '#f59e0b', wav: '#f59e0b',
  zip: '#f59e0b', rar: '#f59e0b', tar: '#f59e0b', gz: '#f59e0b',
  md: '#94a3b8', txt: '#94a3b8',
  js: '#f59e0b', ts: '#3b82f6', jsx: '#61dafb', tsx: '#61dafb',
  py: '#3b82f6', java: '#ef4444', go: '#22c55e', rs: '#f97316',
  html: '#f97316', css: '#3b82f6', json: '#22c55e',
};
export const getExtColor = (ext) => EXT_COLORS[ext?.toLowerCase()] ?? '#64748b';

export const getExtIcon = (ext) => {
  const e = ext?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(e)) return 'image';
  if (['mp4', 'mov', 'avi', 'mkv'].includes(e)) return 'video';
  if (['mp3', 'wav', 'flac', 'ogg'].includes(e)) return 'audio';
  if (['zip', 'rar', 'tar', 'gz', '7z'].includes(e)) return 'archive';
  if (['xls', 'xlsx', 'csv'].includes(e)) return 'spreadsheet';
  if (['ppt', 'pptx'].includes(e)) return 'presentation';
  if (['doc', 'docx'].includes(e)) return 'document';
  if (e === 'pdf') return 'pdf';
  if (['js', 'ts', 'jsx', 'tsx', 'py', 'go', 'rs', 'java', 'html', 'css', 'json'].includes(e)) return 'code';
  return 'file';
};

export const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  if (bytes === 0) return '0 B';
  const k = 1000, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const s = parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];

  return s;
};

export const timeAgo = (date) => {
  if (!date) return '—';
  const ms = Date.now() - new Date(date).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatDate = (date) => {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

export const getInitials = (name = '') =>
  name.trim().split(' ').map(n => n[0]?.toUpperCase()).slice(0, 2).join('');

export const genId = () => Math.random().toString(36).slice(2, 10);

/**
 * Infer MIME type from file extension if file.type is empty or generic
 */
export function getImageMimeType(fileName, fileType) {
  if (fileType && fileType.startsWith("image/")) return fileType;
  const ext = (fileName || "").split(".").pop()?.toLowerCase();
  const mimeMap = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    bmp: "image/bmp",
    ico: "image/x-icon",
    avif: "image/avif",
  };
  return mimeMap[ext] || null;
}

/**
 * Generate a WebP thumbnail (base64 data URL) from an image File.
 * Supports single file uploads and folder uploads (even if browser sets empty file.type).
 * Includes multi-tier image loader fallbacks & 3-second timeout protection.
 */
async function generateImageThumbnail(file) {
  const fileName = file.name || "";
  const fileType = file.type || "";

  // Strategy 1: createImageBitmap (hardware-accelerated scaling for standard bitmaps)
  try {
    if (typeof createImageBitmap === "function" && !fileName.toLowerCase().endsWith(".svg") && fileType !== "image/svg+xml") {
      const bitmap = await createImageBitmap(file, { resizeWidth: 400, resizeQuality: "medium" });
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(bitmap.width, 400);
      canvas.height = Math.max(1, Math.round(bitmap.height * (canvas.width / bitmap.width)));
      const ctx = canvas.getContext("2d");
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      return canvas.toDataURL("image/webp", 0.75);
    }
  } catch {}

  // Strategy 2: Image element + ObjectURL (handles SVGs, BMPs, empty file.type, and createImageBitmap errors)
  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;

    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    const maxDim = 400;
    let width = img.naturalWidth || img.width || maxDim;
    let height = img.naturalHeight || img.height || maxDim;

    if (width > maxDim) {
      height = Math.round(height * (maxDim / width));
      width = maxDim;
    }

    canvas.width = Math.max(1, width);
    canvas.height = Math.max(1, height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    return canvas.toDataURL("image/webp", 0.75);
  } catch {}

  // Strategy 3: Small image direct FileReader data URL fallback (if <= 500KB)
  if (file.size && file.size <= 500 * 1024) {
    try {
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    } catch {}
  }

  return null;
}

/**
 * Generate a WebP thumbnail from a video file by capturing the first frame.
 */
async function generateVideoThumbnail(file) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";

    const url = URL.createObjectURL(file);
    video.src = url;

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute("src");
      video.load();
    };

    video.onloadedmetadata = () => {
      const seekTime = Math.min(1, video.duration * 0.25);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        const maxDim = 400;
        let width = video.videoWidth || 640;
        let height = video.videoHeight || 480;

        if (width > maxDim) {
          height = Math.round(height * (maxDim / width));
          width = maxDim;
        }

        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        cleanup();
        resolve(canvas.toDataURL("image/webp", 0.75));
      } catch {
        cleanup();
        resolve(null);
      }
    };

    video.onerror = () => {
      cleanup();
      resolve(null);
    };
  });
}

/**
 * Generate a WebP thumbnail from a PDF by rendering the first page.
 */
async function generatePdfThumbnail(file) {
  try {
    const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
    if (!GlobalWorkerOptions.workerSrc) {
      const workerUrl = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
      GlobalWorkerOptions.workerSrc = workerUrl.default;
    }

    const loadingTask = getDocument({ data: await file.arrayBuffer() });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const scale = 0.5;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");

    await page.render({ canvasContext: ctx, viewport }).promise;
    await loadingTask.destroy();

    const maxDim = 400;
    let width = canvas.width;
    let height = canvas.height;
    if (width > maxDim) {
      height = Math.round(height * (maxDim / width));
      width = maxDim;
    }

    const finalCanvas = document.createElement("canvas");
    finalCanvas.width = Math.max(1, width);
    finalCanvas.height = Math.max(1, height);
    const finalCtx = finalCanvas.getContext("2d");
    finalCtx.drawImage(canvas, 0, 0, finalCanvas.width, finalCanvas.height);

    return finalCanvas.toDataURL("image/webp", 0.75);
  } catch {
    return null;
  }
}

/**
 * Generate a WebP thumbnail (base64 data URL) from an image, video, or PDF File.
 */
export async function generateThumbnail(file) {
  if (!file) return null;

  const fileName = file.name || "";
  const fileType = file.type || "";
  const isImageMime = fileType.startsWith("image/");
  const isImageExt = /\.(jpg|jpeg|png|webp|gif|bmp|svg|avif|ico)$/i.test(fileName);
  const isVideoMime = fileType.startsWith("video/");
  const isVideoExt = /\.(mp4|webm|mov|avi|mkv|wmv|flv|ogv)$/i.test(fileName);
  const isPdf = fileType === "application/pdf" || /\.pdf$/i.test(fileName);

  if (!isImageMime && !isImageExt && !isVideoMime && !isVideoExt && !isPdf) return null;

  const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 3000));

  const generatorPromise = (async () => {
    if (isVideoMime || isVideoExt) {
      return await generateVideoThumbnail(file);
    }
    if (isPdf) {
      return await generatePdfThumbnail(file);
    }
    return await generateImageThumbnail(file);
  })();

  try {
    const result = await Promise.race([generatorPromise, timeoutPromise]);
    return result;
  } catch {
    return null;
  }
}
