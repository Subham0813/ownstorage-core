import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
import { useApp } from "../../context/AppContext";

export function Btn({
  children,
  variant = "ghost",
  size = "md",
  className = "",
  disabled,
  onClick,
  type = "button",
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-[background-color,border-color,color,transform,box-shadow] duration-200 whitespace-nowrap cursor-pointer disabled:opacity-40 disabled:pointer-events-none select-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50";
  const sizes = {
    sm: "px-3 py-1.5 text-xs sm:text-sm",
    md: "px-4 py-2 text-xs sm:text-sm",
    lg: "px-5 py-2.5 text-sm sm:text-base",
  };
  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold shadow-md shadow-blue-500/20 active:scale-[.98]",
    ghost:
      "bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-200 border border-slate-200/90 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800/80 hover:text-slate-900 dark:hover:text-zinc-100 hover:border-slate-300 dark:hover:border-zinc-700 shadow-2xs active:scale-[.98]",
    danger:
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/30 active:scale-[.98]",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 hover:border-blue-500/30 active:scale-[.98]",
    icon: "bg-transparent text-slate-600 dark:text-zinc-400 p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 hover:text-slate-900 dark:hover:text-zinc-100 rounded-xl transition-colors",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Badge({ children, color = "green", className = "" }) {
  const variants = {
    green:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    purple:
      "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
    red: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20",
    yellow:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
    grey: "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700",
    teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${variants[color] ?? variants.grey} ${className}`}
    >
      {children}
    </span>
  );
}

export function Input({ className = "", type, error = false, ...props }) {
  const isPassword = type === "password";
  const [show, setShow] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <input
        className={[
          "w-full bg-white dark:bg-zinc-900 border rounded-xl px-4 py-2.5",
          "text-slate-900 dark:text-zinc-100 text-sm font-sans placeholder-slate-400 dark:placeholder-zinc-500",
          "outline-none transition-[border-color,box-shadow,background-color] duration-200 shadow-2xs",
          "focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20",
          error
            ? "border-rose-500/80 focus:border-rose-500 focus:ring-rose-500/20"
            : "border-slate-200/90 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700",
          isPassword ? "pr-10" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        type={show ? "text" : type}
        {...props}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors p-1 cursor-pointer"
        >
          <Icon name={show ? "eyeClosed" : "eye"} size={16} />
        </button>
      )}
    </div>
  );
}

export function Label({ children }) {
  return (
    <label className="block text-xs font-bold text-slate-600 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}

export function ModalOverlay({ onClose, children, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && onClose) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-[2000] p-4 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-xl p-6 sm:p-7 w-full ${maxWidth} shadow-2xl shadow-slate-950/40 transform transition-[transform,opacity] animate-in zoom-in-95 duration-200 flex flex-col max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)] overflow-y-auto overscroll-contain`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

export function Banner({ type, message, onClose }) {
  if (!message) return null;
  const isError = type === "error" || type === "danger";
  const bgClass = isError
    ? "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-300"
    : "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300";

  return (
    <div
      className={`w-full px-4 py-3 mb-5 rounded-2xl flex items-start sm:items-center justify-between gap-3 text-sm font-medium border ${bgClass} animate-in fade-in zoom-in-95 duration-200 shadow-2xs`}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <Icon
          name={isError ? "alertTriangle" : "checkCircle"}
          size={18}
          className="shrink-0"
        />
        <span className="min-w-0 break-words leading-relaxed">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss message"
          className="hover:opacity-70 transition-opacity shrink-0 p-1 cursor-pointer"
        >
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
}

export function ModalHeader({ title, sub, onClose }) {
  return (
    <div className="flex flex-col mb-2">
      <div className="flex justify-between items-start mb-5">
        <div className="pr-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
            {title}
          </h3>
          {sub && (
            <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
              {sub}
            </p>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition-colors p-2 -mr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 focus:outline-none cursor-pointer"
          >
            <Icon name="x" size={18} />
          </button>
        )}
      </div>
      <ModalBannerRenderer />
    </div>
  );
}

function ModalBannerRenderer() {
  const { banner, clearBanner } = useApp();
  if (!banner) return null;
  return (
    <Banner type={banner.type} message={banner.msg} onClose={clearBanner} />
  );
}

export function ModalFooter({ children }) {
  return (
    <div className="flex gap-2 justify-end mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800/80">
      {children}
    </div>
  );
}

export function ConfirmModal({
  isOpen = false,
  title,
  message,
  children,
  dangerLabel,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  onClose,
  danger = false,
  variant,
  loading = false,
}) {
  if (!isOpen) return null;

  const handleCancel = onCancel || onClose;
  const label = confirmLabel || dangerLabel || "Delete";
  const isDanger = danger || variant === "danger";

  return (
    <ModalOverlay onClose={handleCancel} maxWidth="max-w-sm">
      <ModalHeader title={title} onClose={handleCancel} />
      {message && (
        <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed -mt-2 mb-6">
          {message}
        </p>
      )}
      {children && <div className="mb-6">{children}</div>}
      <div className="flex gap-2.5 justify-end">
        <Btn variant="ghost" onClick={handleCancel} disabled={loading}>
          {cancelLabel}
        </Btn>
        <Btn
          variant={isDanger ? "danger" : "primary"}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Please wait…" : label}
        </Btn>
      </div>
    </ModalOverlay>
  );
}

export function Divider({ className = "" }) {
  return (
    <hr
      className={`border-0 border-b border-slate-100 dark:border-zinc-800/80 ${className}`}
    />
  );
}

export function EmptyState({
  icon,
  title,
  desc,
  iconColor,
  iconBg,
  className = "",
}) {
  const defaultColors = {
    trash: {
      color: "text-rose-500 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-500/15 border-rose-200/60 dark:border-rose-500/30",
    },
    share: {
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-500/15 border-blue-200/60 dark:border-blue-500/30",
    },
    users: {
      color: "text-blue-500 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-500/15 border-blue-200/60 dark:border-blue-500/30",
    },
    folder: {
      color: "text-amber-500 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-500/15 border-amber-200/60 dark:border-amber-500/30",
    },
    search: {
      color: "text-indigo-500 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-500/15 border-indigo-200/60 dark:border-indigo-500/30",
    },
  };

  const style = defaultColors[icon] || {
    color: iconColor || "text-slate-400 dark:text-zinc-400",
    bg:
      iconBg ||
      "bg-slate-100 dark:bg-zinc-800/60 border-slate-200/80 dark:border-zinc-700/60",
  };

  return (
    <div
      className={`flex flex-col items-center justify-center py-12 sm:py-16 px-5 text-center gap-4 animate-in fade-in duration-500 ${className}`}
    >
      <div
        className={`w-16 h-16 rounded-2xl border flex items-center justify-center shadow-xs transition-transform hover:scale-105 ${style.bg}`}
      >
        <Icon name={icon} size={30} className={style.color} />
      </div>
      <div>
        <p className="text-base font-extrabold text-slate-800 dark:text-zinc-100">
          {title}
        </p>
        {desc && (
          <p className="text-sm font-medium text-slate-500 dark:text-zinc-400 mt-1 max-w-sm">
            {desc}
          </p>
        )}
      </div>
    </div>
  );
}

export function SectionCard({ title, children, className = "" }) {
  return (
    <div
      className={`bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-2xs ${className}`}
    >
      {title && (
        <div className="text-sm font-bold text-slate-900 dark:text-zinc-100 mb-4 flex items-center gap-2">
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

export function Skeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/70 dark:bg-zinc-800/80 rounded-2xl ${className}`}
    />
  );
}

export function TabGroup({ tabs, active, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-zinc-700/60">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => {
            sessionStorage.setItem("tab", JSON.stringify(t.key));
            onChange(t.key);
          }}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-[background-color,border-color,color] duration-200 focus:outline-none
            ${
              active === t.key
                ? "bg-white dark:bg-zinc-700 text-slate-900 dark:text-zinc-100 shadow-xs border border-slate-200/80 dark:border-zinc-600/50"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
            }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
