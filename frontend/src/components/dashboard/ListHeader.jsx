import { memo } from "react";
import { Icon } from "../ui/Icon";

export const ListHeader = memo(function ListHeader({
  sortBy,
  sortOrder,
  onSortChange,
}) {
  const Sortable = ({ value, label, align = "left", className = "" }) => {
    const active = sortBy === value;
    const interactive = !!onSortChange;
    const nextOrder = active ? (sortOrder === "asc" ? "desc" : "asc") : "asc";
    return (
      <button
        type="button"
        onClick={() => interactive && onSortChange(value, nextOrder)}
        disabled={!interactive}
        aria-sort={
          active
            ? sortOrder === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
        className={`flex items-center text-[11px] font-bold uppercase tracking-wider transition-colors select-none shrink-0 ${
          align === "right" ? "justify-end text-right" : ""
        } ${
          active
            ? "text-slate-700 dark:text-zinc-200"
            : "text-slate-400 dark:text-zinc-500"
        } ${
          interactive
            ? "cursor-pointer hover:text-slate-600 dark:hover:text-zinc-300"
            : "cursor-default"
        } ${className}`}
      >
        {label}
        {active && (
          <Icon
            name={sortOrder === "asc" ? "arrowUp" : "arrowDown"}
            size={11}
            className="ml-1 text-blue-500"
          />
        )}
      </button>
    );
  };

  return (
    <div className="px-2 sm:px-3.5 py-2 flex items-center gap-2.5 sm:gap-3 border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-900/60 select-none">
      <span className="w-[18px] shrink-0" aria-hidden="true" />
      <span className="w-9 shrink-0" aria-hidden="true" />
      <Sortable value="name" label="Name" className="flex-1 min-w-0" />
      <Sortable
        value="size"
        label="Size"
        align="right"
        className="hidden sm:flex w-20"
      />
      <Sortable
        value="date"
        label="Modified"
        align="right"
        className="hidden sm:flex w-28"
      />
      <span className="flex w-6 justify-center shrink-0" aria-hidden="true" />
      <span className="w-9 shrink-0" aria-hidden="true" />
    </div>
  );
});