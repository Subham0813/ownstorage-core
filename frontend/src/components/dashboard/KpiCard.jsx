import { memo } from "react";
import { Icon } from "../ui/Icon";

export default memo(function KpiCard({
  icon,
  iconClass,
  glow,
  blobClass,
  label,
  pill,
  pillClass,
  body,
  footer,
}) {
  return (
    <div className="relative p-4 sm:p-5 rounded-xl bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-[box-shadow,border-color] duration-300 overflow-hidden group select-none flex flex-col justify-between">
      <div
        className={`absolute top-0 right-0 w-20 h-20 ${blobClass} rounded-full blur-xl group-hover:scale-125 transition-transform duration-500 pointer-events-none`}
      />
      <div>
        <div className="flex items-center gap-2 mb-3 min-w-0">
          <div
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl ${iconClass} flex items-center justify-center text-white ${glow} shrink-0`}
          >
            <Icon name={icon} size={17} />
          </div>
          <div className="flex flex-col md:flex-row lg:flex-col items-start md:items-center  lg:items-start gap-2 min-w-0 flex-1">
            <span className="text-xs sm:text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-200 truncate min-w-0 flex-1">
              {label}
            </span>
            <span
              className={`px-2 sm:px-2.5 py-0.5 text-xs font-bold rounded-full ${pillClass} shrink-0 whitespace-nowrap w-fit`}
            >
              {pill}
            </span>
          </div>
        </div>
        {body}
        {footer}
      </div>
    </div>
  );
});
