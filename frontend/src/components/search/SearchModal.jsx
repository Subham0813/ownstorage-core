import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Icon } from "../ui/Icon";

export default function SearchModal({ open, onClose }) {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  const goSearch = (q) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    onClose();
    navigate(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return createPortal(
    <div className="fixed inset-0 z-[1500]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800 shadow-2xl rounded-b-3xl px-4 py-4 animate-in slide-in-from-top-3 duration-300">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            goSearch(inputRef.current?.value || "");
          }}
          className="flex items-center gap-2.5"
        >
          <Icon name="search" size={20} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search files & folders..."
            defaultValue=""
            onChange={(e) => {
              if (timerRef.current) clearTimeout(timerRef.current);
              const q = e.target.value;
              timerRef.current = setTimeout(() => goSearch(q), 400);
            }}
            className="flex-1 min-w-0 bg-transparent outline-none text-base text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="p-2 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors shrink-0"
          >
            <Icon name="x" size={18} />
          </button>
        </form>
      </div>
    </div>,
    document.body,
  );
}
