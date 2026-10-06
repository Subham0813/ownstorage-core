import { useState, useRef, useEffect } from "react";
import { Icon } from "./Icon";

export function OptionSelect({
  label,
  value,
  options,
  onChange,
  placeholder = "",
  disabled = false,
  fullWidth = false,
  className = "",
  buttonClassName = "",
  panelClassName = "",
  footer,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const matched = options.find((o) => o.value === value);
  const hasValue = !!matched;
  const currentLabel = matched?.label || placeholder || label;

  return (
    <div className={`relative ${fullWidth ? "w-full" : ""} ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-extrabold rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/60 text-slate-700 dark:text-zinc-300 hover:border-blue-500/60 hover:text-blue-600 dark:hover:text-blue-400 transition-[color,border-color,background-color,transform] active:scale-95 cursor-pointer ${fullWidth ? "w-full justify-between" : ""} ${hasValue ? "" : "text-slate-400 dark:text-zinc-500"} ${disabled ? "opacity-50 cursor-not-allowed hover:border-slate-200/80 dark:hover:border-zinc-700/60 hover:text-slate-700 dark:hover:text-zinc-300" : ""} ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
      >
        <span>{currentLabel}</span>
        <Icon
          name="chevronDown"
          size={12}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? "rotate-180 text-blue-500" : ""}`}
        />
      </button>

      {open && (
        <div className={`absolute top-full mt-1.5 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl shadow-xl z-[1800] p-1 animate-in fade-in slide-in-from-top-1 duration-150 ${fullWidth ? "left-0 right-0" : "right-0 w-44"} ${panelClassName}`}>
          <div className="px-3 py-1 text-xs font-bold tracking-wider uppercase text-slate-400 dark:text-zinc-400">
            {label}
          </div>
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between rounded-xl transition-colors cursor-pointer ${
                value === opt.value
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-500/15 font-semibold"
                  : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
              }`}
            >
              <span>{opt.label}</span>
              {value === opt.value && (
                <Icon name="check" size={14} className="text-blue-500" />
              )}
            </button>
          ))}
          {footer && (
            <div className="mt-1 pt-1.5 border-t border-slate-200/80 dark:border-zinc-800">
              {typeof footer === "function"
                ? footer(() => setOpen(false))
                : footer}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
