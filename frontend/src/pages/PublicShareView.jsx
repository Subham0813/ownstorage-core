import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getSharedItemInfo,
  getSharedPreviewUrl,
  getSharedDownloadUrl,
  getSharedDirList,
  getSharedFileList,
  getSharedFilePreviewUrl,
  getSharedFileDownloadUrl,
} from "../api/publicApi";
import { formatFileSize } from "../utils/formatHelpers";
import { getExtColor } from "../utils/fileUtils";
import { getPreviewType, PREVIEW_TYPES } from "../utils/previewUtils";
import { Btn } from "../components/ui/UI";
import Toast from "../components/ui/Toast";
import { Icon, FileIcon } from "../components/ui/Icon";
import { useApp } from "../context/AppContext";

function FileIconTile({ item, size = 44 }) {
  return (
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center"
      style={{ backgroundColor: `${getExtColor(item.extension || "")}18` }}
    >
      <FileIcon ext={item.extension} size={size} />
    </div>
  );
}

const pad = (n) => String(n).padStart(2, "0");

function ExpiryBadge({ expiresAt }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-zinc-400">
        <Icon name="clock" size={13} />
        No expiry
      </span>
    );
  }

  const diff = new Date(expiresAt).getTime() - now;

  if (diff <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-500">
        <Icon name="alertTriangle" size={13} />
        Link expired
      </span>
    );
  }

  const s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const mins = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  const text =
    days > 0
      ? `${days}d ${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`
      : hours > 0
        ? `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`
        : `${pad(mins)}m ${pad(secs)}s`;

  const urgent = diff < 60 * 60 * 1000;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border ${
        urgent
          ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/25"
          : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border-slate-200/60 dark:border-zinc-700"
      }`}
    >
      <Icon name="timer" size={13} />
      <span className="font-mono tracking-tight">Link expires in {text}</span>
    </span>
  );
}

function SharedFolderBrowser({ rootId, rootName, token, showMessage }) {
  const [crumbs, setCrumbs] = useState([{ id: rootId, name: rootName }]);
  const [dirId, setDirId] = useState(rootId);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const loadDir = useCallback(
    async (id) => {
      setLoading(true);
      setError(null);
      setSelected(null);
      setPreviewUrl(null);
      try {
        const [dirsRes, filesRes] = await Promise.all([
          getSharedDirList(id, token),
          getSharedFileList(id, token),
        ]);
        const dirs = (dirsRes.data?.items || []).map((i) => ({
          ...i,
          type: "directory",
        }));
        const files = (filesRes.data?.items || []).map((i) => ({
          ...i,
          type: "file",
        }));
        setItems([...dirs, ...files]);
      } catch (err) {
        setError(
          err?.response?.data?.message ||
            "Failed to load folder contents. Please login and try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    loadDir(dirId);
  }, [dirId, loadDir]);

  const openFolder = (id, name) => {
    setCrumbs((c) => [...c, { id, name }]);
    setDirId(id);
  };

  const goToCrumb = (idx) => {
    const next = crumbs.slice(0, idx + 1);
    setCrumbs(next);
    setDirId(next[next.length - 1].id);
  };

  const openFile = async (file) => {
    setSelected(file);
    setPreviewUrl(null);
    setPreviewLoading(true);
    try {
      const res = await getSharedFilePreviewUrl(file.id, token);
      if (res.data?.url) setPreviewUrl(res.data.url);
      else showMessage("error", "Preview is not available for this file.");
    } catch {
      showMessage("error", "Preview is not available for this file.");
    } finally {
      setPreviewLoading(false);
    }
  };

  const downloadFile = async (file) => {
    try {
      const res = await getSharedFileDownloadUrl(file.id, token);
      if (res.data?.url) {
        const a = document.createElement("a");
        a.href = res.data.url;
        a.download = file.name || "download";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        showMessage("error", "Failed to start download.");
      }
    } catch {
      showMessage("error", "Failed to start download.");
    }
  };

  const previewType = selected
    ? getPreviewType(selected.mime, selected.extension)
    : PREVIEW_TYPES.none;
  const isPreviewable = previewType !== PREVIEW_TYPES.none;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-2 flex-wrap mb-5">
        <Icon name="folder" size={16} color="#3b82f6" />
        {crumbs.map((c, i) => (
          <div key={c.id} className="flex items-center gap-2">
            {i > 0 && (
              <span className="text-slate-400 dark:text-zinc-500">/</span>
            )}
            <button
              onClick={() => goToCrumb(i)}
              className={`text-sm font-semibold transition-colors ${
                i === crumbs.length - 1
                  ? "text-slate-900 dark:text-zinc-100"
                  : "text-blue-600 dark:text-blue-400 hover:underline"
              }`}
            >
              {c.name}
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <div className="mb-6 bg-zinc-900 dark:bg-black rounded-xl border border-slate-700/60 dark:border-zinc-800 shadow-xl shadow-slate-900/20 overflow-hidden">
          {previewLoading && !previewUrl ? (
            <div className="flex flex-col items-center justify-center gap-3 h-60 text-zinc-400">
              <Icon
                name="spinner"
                size={26}
                className="animate-spin text-blue-400"
              />
              <span className="text-sm font-medium">Preparing preview…</span>
            </div>
          ) : isPreviewable && previewUrl ? (
            <div className="bg-black">
              {previewType === PREVIEW_TYPES.image ? (
                <img
                  src={previewUrl}
                  alt={selected.name}
                  className="w-full h-auto max-h-[65vh] object-contain mx-auto"
                />
              ) : previewType === PREVIEW_TYPES.video ? (
                <video
                  src={previewUrl}
                  controls
                  autoPlay
                  className="w-full max-h-[65vh] object-contain bg-black"
                />
              ) : previewType === PREVIEW_TYPES.audio ? (
                <div className="flex flex-col items-center justify-center gap-5 p-8 sm:p-12 bg-zinc-900">
                  <div className="w-20 h-20 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Icon name="audio" size={38} />
                  </div>
                  <p className="text-sm font-semibold text-zinc-300 break-all text-center max-w-md">
                    {selected.name}
                  </p>
                  <audio
                    src={previewUrl}
                    controls
                    className="w-full max-w-md"
                  />
                </div>
              ) : (
                <iframe
                  src={previewUrl}
                  title={selected.name}
                  className="w-full h-[60vh] bg-white"
                  sandbox=""
                  referrerPolicy="no-referrer"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-12 px-6">
              <div className="w-16 h-16 rounded-xl bg-zinc-800 flex items-center justify-center">
                <Icon name="fileText" size={32} className="text-zinc-500" />
              </div>
              <p className="text-sm font-semibold text-zinc-400 text-center max-w-xs">
                Preview isn&apos;t available for this file type. You can still
                download it.
              </p>
              {isPreviewable && (
                <Btn
                  variant="info"
                  size="sm"
                  onClick={() => openFile(selected)}
                  disabled={previewLoading}
                >
                  <Icon name="eye" size={14} />
                  {previewLoading ? "Loading…" : "Retry preview"}
                </Btn>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-slate-200/70 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200/70 dark:border-zinc-800">
          <span className="text-sm font-bold text-slate-700 dark:text-zinc-300">
            {loading
              ? "Loading…"
              : `${items.length} item${items.length === 1 ? "" : "s"}`}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/30">
            Shared with you
          </span>
        </div>

        {error ? (
          <div className="px-5 py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-3">
              <Icon name="alertTriangle" size={26} color="#ef4444" />
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">
              {error}
            </p>
          </div>
        ) : loading ? (
          <div className="divide-y divide-slate-100 dark:divide-zinc-800">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 px-5 py-4 animate-pulse"
              >
                <div className="w-11 h-11 rounded-xl bg-slate-200/70 dark:bg-zinc-800" />
                <div className="flex-1 h-4 rounded-lg bg-slate-200/70 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-3">
              <Icon
                name="folder"
                size={26}
                className="text-slate-400 dark:text-zinc-500"
              />
            </div>
            <p className="text-sm font-semibold text-slate-600 dark:text-zinc-400">
              This folder is empty.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
            {items.map((it) =>
              it.type === "directory" ? (
                <li key={it.id}>
                  <button
                    onClick={() => openFolder(it.id, it.name)}
                    className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-zinc-800/60 transition-colors text-left"
                  >
                    <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Icon name="folder" size={22} color="#f59e0b" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 truncate">
                        {it.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
                        {it.dirsCount || 0} folders · {it.filesCount || 0} files
                      </p>
                    </div>
                    <Icon
                      name="chevronRight"
                      size={18}
                      className="text-slate-400 dark:text-zinc-500 shrink-0"
                    />
                  </button>
                </li>
              ) : (
                <li
                  key={it.id}
                  className={`flex items-center gap-4 px-5 py-3.5 ${
                    selected?.id === it.id
                      ? "bg-blue-50/60 dark:bg-blue-500/10"
                      : ""
                  }`}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${getExtColor(it.extension || "")}18`,
                    }}
                  >
                    <FileIcon ext={it.extension} size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 dark:text-zinc-200 truncate">
                      {it.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-zinc-500 mt-0.5">
                      {formatFileSize(it.size)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openFile(it)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                      title="Preview"
                    >
                      <Icon name="eye" size={17} />
                    </button>
                    <button
                      onClick={() => downloadFile(it)}
                      className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors"
                      title="Download"
                    >
                      <Icon name="download" size={17} />
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </div>
  );
}

function ShareHeader({ theme, toggleTheme, user }) {
  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg border-b border-slate-200/70 dark:border-zinc-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          <div className="flex items-center gap-2.5">
            <span className="font-display text-2xl font-extrabold tracking-tight whitespace-nowrap">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                Own
              </span>
              <span className="text-slate-700 dark:text-zinc-300 font-normal">
                Storage
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-full text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center"
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
            </button>
            {user ? (
              <Link to="/myfiles">
                <Btn variant="primary" size="sm" className="font-bold">
                  <Icon name="folder" size={14} className="mr-1.5" />
                  Open in Drive
                </Btn>
              </Link>
            ) : (
              <>
                <Link to="/signin" className="hidden sm:block">
                  <Btn variant="ghost" size="sm" className="font-bold">
                    Sign In
                  </Btn>
                </Link>
                <Link to="/register">
                  <Btn variant="primary" size="sm" className="font-bold">
                    Sign Up Free
                  </Btn>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b]">
      <div className="h-16 lg:h-[72px] border-b border-slate-200/70 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-lg" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-16 animate-pulse">
        <div className="h-72 sm:h-96 rounded-xl bg-slate-200/70 dark:bg-zinc-800/70" />
        <div className="mt-6 h-6 w-2/3 rounded-lg bg-slate-200/70 dark:bg-zinc-800/70 mx-auto" />
        <div className="mt-3 h-4 w-1/3 rounded-lg bg-slate-200/60 dark:bg-zinc-800/60 mx-auto" />
      </div>
    </div>
  );
}

export default function PublicShareView() {
  const { token } = useParams();
  const { theme, toggleTheme, showMessage, user } = useApp();
  const [item, setItem] = useState(null);
  const [dirShare, setDirShare] = useState(null);
  const [loginMessage, setLoginMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setItem(null);
    setDirShare(null);
    setLoginMessage(null);
    setPreviewUrl(null);

    getSharedItemInfo(token)
      .then((res) => {
        if (res.data?.item) {
          setItem(res.data.item);
        } else if (res.item?.type === "directory") {
          if (user) {
            setDirShare({ rootId: res.item.id, rootName: res.item.name });
          } else {
            setLoginMessage(res.message || "Please login to get full access.");
          }
        } else {
          setError("This share link is invalid or has expired.");
        }
      })
      .catch((err) => {
        const msg =
          err?.response?.data?.message ||
          "This share link is invalid or has expired.";
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [token, user]);

  const loadPreview = useCallback(async () => {
    if (previewUrl || previewLoading) return;
    setPreviewLoading(true);
    try {
      const res = await getSharedPreviewUrl(token);
      if (res.data?.url) setPreviewUrl(res.data.url);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Preview is not available for this file.";
      showMessage("error", msg);
    } finally {
      setPreviewLoading(false);
    }
  }, [token, previewUrl, previewLoading, showMessage]);

  useEffect(() => {
    if (
      item &&
      getPreviewType(item.mime, item.extension) !== PREVIEW_TYPES.none
    ) {
      loadPreview();
    }
  }, [item, loadPreview]);

  const handleDownload = async () => {
    try {
      const res = await getSharedDownloadUrl(token);
      if (res.data?.url) {
        const a = document.createElement("a");
        a.href = res.data.url;
        a.download = item?.name || "download";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        showMessage("error", "Failed to start download.");
      }
    } catch {
      showMessage("error", "Failed to start download.");
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      showMessage("error", "Failed to copy link.");
    }
  };

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="alertTriangle" size={28} color="#ef4444" />
          </div>
          <h1 className="font-display text-xl font-extrabold text-slate-900 dark:text-zinc-100 mb-2">
            Link not available
          </h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400 mb-8 leading-relaxed">
            {error}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signin">
              <Btn variant="primary" className="w-full sm:w-auto">
                Sign In
              </Btn>
            </Link>
            <Link to="/register">
              <Btn variant="ghost" className="w-full sm:w-auto">
                Create Account
              </Btn>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loginMessage) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
            <Icon name="folder" size={28} color="#3b82f6" />
          </div>
          <h1 className="font-display text-xl font-extrabold text-slate-900 dark:text-zinc-100 mb-2">
            Shared Folder
          </h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400 mb-8 leading-relaxed">
            {loginMessage}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/signin">
              <Btn variant="primary" className="w-full sm:w-auto">
                Sign In
              </Btn>
            </Link>
            <Link to="/register">
              <Btn variant="ghost" className="w-full sm:w-auto">
                Create Account
              </Btn>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (dirShare) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] flex flex-col">
        <ShareHeader theme={theme} toggleTheme={toggleTheme} user={user} />
        <main className="flex-1 w-full px-4 sm:px-6 py-10 pb-16">
          <SharedFolderBrowser
            rootId={dirShare.rootId}
            rootName={dirShare.rootName}
            token={token}
            showMessage={showMessage}
          />
        </main>
        <Toast />
      </div>
    );
  }

  if (!item) return null;

  const ext = item.extension || "";
  const mimeLabel =
    item.mime?.split("/")[1]?.toUpperCase() || ext.toUpperCase() || "File";
  const previewType = getPreviewType(item.mime, item.extension);
  const isPreviewable = previewType !== PREVIEW_TYPES.none;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] flex flex-col">
      <ShareHeader theme={theme} toggleTheme={toggleTheme} user={user} />

      <main className="flex-1 w-full px-4 sm:px-6 py-10 pb-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 flex-wrap mb-5">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="shrink-0">
                <FileIconTile item={item} />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-lg sm:text-xl font-extrabold text-slate-900 dark:text-zinc-100 break-all leading-tight">
                  {item.name}
                </h1>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 border border-slate-200/60 dark:border-zinc-700">
                    {formatFileSize(item.size)}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/30">
                    {mimeLabel}
                  </span>
                  <ExpiryBadge expiresAt={item.shareTokenExpiresAt} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 dark:bg-black rounded-xl border border-slate-700/60 dark:border-zinc-800 shadow-xl shadow-slate-900/20 overflow-hidden">
            {previewLoading && !previewUrl ? (
              <div className="flex flex-col items-center justify-center gap-3 h-72 sm:h-96 text-zinc-400">
                <Icon
                  name="spinner"
                  size={28}
                  className="animate-spin text-blue-400"
                />
                <span className="text-sm font-medium">Preparing preview…</span>
              </div>
            ) : isPreviewable && previewUrl ? (
              <div className="bg-black">
                {previewType === PREVIEW_TYPES.image ? (
                  <img
                    src={previewUrl}
                    alt={item.name}
                    className="w-full h-auto max-h-[70vh] object-contain mx-auto"
                  />
                ) : previewType === PREVIEW_TYPES.video ? (
                  <video
                    src={previewUrl}
                    controls
                    autoPlay
                    className="w-full max-h-[70vh] object-contain bg-black"
                  />
                ) : previewType === PREVIEW_TYPES.audio ? (
                  <div className="flex flex-col items-center justify-center gap-6 p-10 sm:p-16 bg-zinc-900">
                    <div className="w-24 h-24 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Icon name="audio" size={44} />
                    </div>
                    <p className="text-sm font-semibold text-zinc-300 break-all text-center max-w-md">
                      {item.name}
                    </p>
                    <audio
                      src={previewUrl}
                      controls
                      className="w-full max-w-md"
                    />
                  </div>
                ) : (
                  <iframe
                    src={previewUrl}
                    title={item.name}
                    className="w-full h-[70vh] bg-white"
                    sandbox=""
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 py-16 sm:py-24 px-6">
                <div className="w-20 h-20 rounded-xl bg-zinc-800 flex items-center justify-center">
                  <Icon name="fileText" size={40} className="text-zinc-500" />
                </div>
                <p className="text-sm font-semibold text-zinc-400 text-center max-w-xs">
                  Preview isn&apos;t available for this file type. You can still
                  download it.
                </p>
                {isPreviewable && (
                  <Btn
                    variant="info"
                    size="sm"
                    onClick={loadPreview}
                    disabled={previewLoading}
                  >
                    <Icon name="eye" size={14} />
                    {previewLoading ? "Loading…" : "Retry preview"}
                  </Btn>
                )}
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5 flex-wrap justify-center">
              <Btn variant="primary" onClick={handleDownload}>
                <Icon name="download" size={16} />
                Download
              </Btn>
              <Btn variant="ghost" onClick={handleCopyLink}>
                <Icon name={copied ? "check" : "link"} size={16} />
                {copied ? "Copied!" : "Copy link"}
              </Btn>
            </div>
            <Link
              to="/register"
              className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Powered by OwnStorage — save files to your cloud →
            </Link>
          </div>
        </div>
      </main>
      <Toast />
    </div>
  );
}
