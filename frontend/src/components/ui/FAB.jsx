import { useState, useRef, useEffect } from "react";
import { Icon } from "../ui/Icon";
import { Tooltip } from "../ui/Tooltip";
import { GoogleDriveLogo } from "../auth/OAuthButtons";

export default function FAB ({
  onUpload,
  onUploadFolder,
  onNewFolder,
  onGDriveImport,
  detailsPanelOpen = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handle = (fn) => {
    setOpen(false);
    fn?.();
  };

  return (
    <>
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/20 backdrop-blur-[2px] animate-in fade-in duration-150"
        />
      )}

      <div
        ref={ref}
        className={`fixed z-40 bottom-28 right-4 sm:right-6 md:bottom-6 md:right-6 lg:bottom-8 lg:right-8 ${detailsPanelOpen ? "lg:right-[344px] xl:right-[364px]" : ""}`}
      >
        {open && (
          <div className="absolute bottom-16 right-0 flex flex-col items-end gap-2.5 animate-in fade-in slide-in-from-bottom-4 zoom-in-95 duration-200 select-none">
            <FabAction
              icon="upload"
              label="Upload File"
              onClick={() => handle(onUpload)}
            />
            <FabAction
              icon="folder"
              label="Upload Folder"
              onClick={() => handle(onUploadFolder)}
            />
            <FabAction
              icon="folderPlus"
              label="New Folder"
              onClick={() => handle(onNewFolder)}
            />
            <FabAction
              icon="googleDrive"
              label="Google Drive Import"
              onClick={() => handle(onGDriveImport)}
            />
          </div>
        )}

        <Tooltip
          content={open ? "Close quick actions" : "Quick actions"}
          position="top"
        >
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={
              open ? "Close quick actions menu" : "Open quick actions menu"
            }
            className={`w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/35 border border-blue-400/30 flex items-center justify-center transition-[transform,background-color,box-shadow] duration-300 ease-out hover:scale-105 active:scale-95 cursor-pointer ${open ? "rotate-45 shadow-blue-500/50" : "rotate-0"
              }`}
          >
            <Icon
              name="plus"
              size={22}
              color="white"
              className="transition-transform duration-300"
            />
          </button>
        </Tooltip>
      </div>
    </>
  );
}

function FabAction ({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 pl-4 pr-2.5 py-2.5 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-slate-950/10 dark:shadow-black/50 border border-slate-200/90 dark:border-zinc-800 hover:border-blue-500/40 dark:hover:border-blue-500/40 hover:scale-105 active:scale-95 transition-[transform,border-color,box-shadow] duration-200 group cursor-pointer"
    >
      <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-zinc-200 whitespace-nowrap tracking-tight">
        {label}
      </span>
      <div className={`w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/20 flex items-center justify-center ${icon === "googleDrive" ? "group-hover:bg-slate-200" : "group-hover:bg-blue-600"} "text-blue-600 dark:text-blue-400" group-hover:bg-blue-600 group-hover:text-white dark:group-hover:text-white transition-[background-color,color] duration-200 shadow-xs`}>
        {icon === "googleDrive" ? (
          <GoogleDriveLogo size={16} />
        ) : (
          <Icon name={icon} size={16} />
        )}
      </div>
    </button>
  );
}
