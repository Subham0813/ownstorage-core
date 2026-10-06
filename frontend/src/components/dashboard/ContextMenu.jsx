import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../ui/Icon";

const FILE_MENU_ITEMS = [
  { key: "preview", icon: "eye", label: "Preview" },
  { key: "download", icon: "download", label: "Download" },
  { key: "divider1" },
  { key: "share", icon: "share", label: "Share" },
  { key: "getLink", icon: "link", label: "Get Link" },
  { key: "divider2" },
  { key: "rename", icon: "edit", label: "Rename" },
  { key: "copy", icon: "copy", label: "Copy" },
  { key: "move", icon: "move", label: "Move" },
  { key: "divider3" },
  { key: "star", icon: "star", label: "Star", labelActive: "Unstar" },
  { key: "details", icon: "info", label: "Details" },
  { key: "divider4" },
  { key: "trash", icon: "trash", label: "Move to Bin", variant: "danger" },
];

const DIR_MENU_ITEMS = [
  { key: "open", icon: "folder", label: "Open" },
  { key: "download", icon: "download", label: "Download ZIP" },
  { key: "divider1" },
  { key: "share", icon: "share", label: "Share" },
  { key: "getLink", icon: "link", label: "Get Link" },
  { key: "divider2" },
  { key: "rename", icon: "edit", label: "Rename" },
  { key: "move", icon: "move", label: "Move" },
  { key: "divider3" },
  { key: "star", icon: "star", label: "Star", labelActive: "Unstar" },
  { key: "details", icon: "info", label: "Details" },
  { key: "divider4" },
  { key: "trash", icon: "trash", label: "Move to Bin", variant: "danger" },
];

const SHARED_FILE_MENU_ITEMS = [
  { key: "getLink", icon: "link", label: "Get Link" },
  { key: "share", icon: "share", label: "Share" },
  { key: "divider1" },
  { key: "open", icon: "eye", label: "Open" },
  { key: "download", icon: "download", label: "Download" },
  { key: "divider2" },
  { key: "star", icon: "star", label: "Star", labelActive: "Unstar" },
  { key: "divider3" },
  { key: "trash", icon: "trash", label: "Move to Bin", variant: "danger" },
];

const SHARED_DIR_MENU_ITEMS = [
  { key: "getLink", icon: "link", label: "Get Link" },
  { key: "share", icon: "share", label: "Share" },
  { key: "divider1" },
  { key: "open", icon: "folder", label: "Open" },
  { key: "download", icon: "download", label: "Download ZIP" },
  { key: "divider2" },
  { key: "star", icon: "star", label: "Star", labelActive: "Unstar" },
  { key: "divider3" },
  { key: "trash", icon: "trash", label: "Move to Bin", variant: "danger" },
];

const BIN_MENU_ITEMS = [
  { key: "restore", icon: "restore", label: "Restore" },
  { key: "divider1" },
  { key: "delete", icon: "trash", label: "Delete Permanently", variant: "danger" },
];

function clampPosition(x, y, menuWidth, menuHeight) {
  const pad = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let cx = x;
  let cy = y;
  if (cx + menuWidth > vw - pad) cx = vw - menuWidth - pad;
  if (cy + menuHeight > vh - pad) cy = vh - menuHeight - pad;
  if (cx < pad) cx = pad;
  if (cy < pad) cy = pad;
  return { x: cx, y: cy };
}

function estimateMenuSize(items) {
  const ITEM_H = 36;
  const DIVIDER_H = 10;
  const PY = 12;
  let h = PY;
  for (const mi of items) {
    h += mi.key.startsWith("divider") ? DIVIDER_H : ITEM_H;
  }
  h += PY;
  return { width: 230, height: h };
}

const READONLY_KEYS = new Set(["open", "preview", "download", "details"]);

export function ContextMenu({ isOpen, position, item, menuItems, onClose, onAction, variant = "default", readOnly = false }) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleKeyDown = (e) => {
      if (!menuRef.current) return;
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
      const buttons = Array.from(menuRef.current.querySelectorAll("[data-menu-item]"));
      if (buttons.length === 0) return;
      const idx = buttons.indexOf(document.activeElement);
      e.preventDefault();
      if (e.key === "ArrowDown") buttons[idx < buttons.length - 1 ? idx + 1 : 0]?.focus();
      else if (e.key === "ArrowUp") buttons[idx > 0 ? idx - 1 : buttons.length - 1]?.focus();
      else if (e.key === "Home") buttons[0]?.focus();
      else if (e.key === "End") buttons[buttons.length - 1]?.focus();
    };

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const isDir = item.type === "directory";
  let resolvedMenuItems;
  if (menuItems) {
    resolvedMenuItems = menuItems;
  } else if (variant === "bin") {
    resolvedMenuItems = BIN_MENU_ITEMS;
  } else if (variant === "shared") {
    resolvedMenuItems = isDir ? SHARED_DIR_MENU_ITEMS : SHARED_FILE_MENU_ITEMS;
  } else {
    resolvedMenuItems = isDir ? DIR_MENU_ITEMS : FILE_MENU_ITEMS;
  }

  // View-only callers (Shared with Me): keep open/download/details, drop
  // share/link/star/trash and clean up orphaned dividers.
  if (readOnly) {
    const kept = resolvedMenuItems.filter(
      (mi) => mi.key.startsWith("divider") || READONLY_KEYS.has(mi.key),
    );
    const cleaned = [];
    for (const mi of kept) {
      const isDiv = mi.key.startsWith("divider");
      if (isDiv && (cleaned.length === 0 || cleaned[cleaned.length - 1].key.startsWith("divider"))) continue;
      cleaned.push(mi);
    }
    if (cleaned.length > 0 && cleaned[cleaned.length - 1].key.startsWith("divider")) cleaned.pop();
    resolvedMenuItems = cleaned;
  }

  const { width: menuW, height: menuH } = estimateMenuSize(resolvedMenuItems);
  const { x, y } = clampPosition(position.x, position.y, menuW, menuH);

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[1500] w-[230px] max-w-[calc(100vw-16px)] bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-2xl shadow-slate-950/25 backdrop-blur-xl p-1.5 animate-in fade-in zoom-in-95 duration-150 select-none"
      style={{ left: x, top: y }}
    >
      {resolvedMenuItems.map((mi) => {
        if (mi.key.startsWith("divider")) {
          return (
            <div
              key={mi.key}
              className="h-px mx-2 my-1.5 bg-slate-100 dark:bg-zinc-800/80"
            />
          );
        }

        const label =
          mi.key === "star" && item.isStarred ? mi.labelActive : mi.label;

        return (
          <button
            key={mi.key}
            data-menu-item
            onClick={() => {
              onAction(mi.key, item);
              onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-[color,background-color,transform] duration-100 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 active:scale-[0.98] ${
              mi.variant === "danger"
                ? "text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/15 focus-visible:ring-rose-500/40"
                : mi.variant === "success"
                  ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/15 focus-visible:ring-emerald-500/40"
                  : "text-slate-700 dark:text-zinc-200 hover:bg-slate-100/80 dark:hover:bg-zinc-800/70 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Icon
              name={mi.key === "star" && item.isStarred ? "starFilled" : mi.icon}
              size={18}
              className={`shrink-0 transition-colors ${
                mi.key === "star" && item.isStarred
                  ? "text-amber-400"
                  : mi.variant === "danger"
                    ? "text-rose-500"
                    : mi.variant === "success"
                      ? "text-emerald-500"
                      : "text-slate-500 dark:text-zinc-400"
              }`}
            />
            {label}
          </button>
        );
      })}
    </div>,
    document.body
  );
}

