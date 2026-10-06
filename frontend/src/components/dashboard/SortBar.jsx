import { Icon } from "../ui/Icon";
import { OptionSelect } from "../ui/OptionSelect";

const DEFAULT_SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "date", label: "Modified" },
  { value: "size", label: "Size" },
];

export function SortBar({
  sortBy,
  sortOrder,
  onSortChange,
  leftContent,
  viewMode,
  onViewModeChange,
  rightContent,
  options = DEFAULT_SORT_OPTIONS,
}) {
  const orderFooter = (close) => (
    <>
      <div className="px-3 pt-1.5 pb-1 text-xs font-bold tracking-wider uppercase text-slate-400 dark:text-zinc-400">
        Order
      </div>
      {[
        { value: "asc", label: "Ascending", icon: "arrowUp" },
        { value: "desc", label: "Descending", icon: "arrowDown" },
      ].map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => {
            onSortChange(sortBy, o.value);
            close();
          }}
          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between rounded-xl transition-colors cursor-pointer ${
            sortOrder === o.value
              ? "text-blue-600 dark:text-blue-400 bg-blue-50/70 dark:bg-blue-500/15 font-semibold"
              : "text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/60"
          }`}
        >
          <span className="flex items-center gap-2">
            <Icon name={o.icon} size={13} className="shrink-0" />
            <span>{o.label}</span>
          </span>
          {sortOrder === o.value && (
            <Icon name="check" size={14} className="text-blue-500" />
          )}
        </button>
      ))}
    </>
  );

  return (
    <div className="flex flex-row items-center justify-between gap-2 py-1 px-0.5 pr-1 min-w-0">
      {/* Left — Breadcrumbs / Section Title / Left Content */}
      {leftContent && (
        <div className="min-w-0 flex-1 overflow-x-auto no-scrollbar">
          {leftContent}
        </div>
      )}

      {/* Right — Sort controls + View Mode + Extra Utility Actions */}
      <div
        className={`flex items-center justify-end gap-2 shrink-0 ${!leftContent ? "ml-auto" : ""}`}
      >
        <div className="flex justify-end items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
          <OptionSelect
            label="Sort By"
            value={sortBy}
            options={options}
            onChange={(v) => onSortChange(v)}
            footer={orderFooter}
          />
        </div>

        {/* View Mode Toggle (Grid vs List) */}
        {viewMode && onViewModeChange && (
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800/80 p-0.5 rounded-xl border border-slate-200/60 dark:border-zinc-700/60 shrink-0">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`p-1.5 rounded-lg transition-[color,background-color,box-shadow] cursor-pointer ${viewMode === "grid" ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs" : "text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"}`}
              title="Grid View"
            >
              <Icon name="grid" size={15} />
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`p-1.5 rounded-lg transition-[color,background-color,box-shadow] cursor-pointer ${viewMode === "list" ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs" : "text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200"}`}
              title="List View"
            >
              <Icon name="list" size={15} />
            </button>
          </div>
        )}

        {/* Optional Extra Right Actions (e.g. Empty Bin button) */}
        {rightContent}
      </div>
    </div>
  );
}
