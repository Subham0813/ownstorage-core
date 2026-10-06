import { Icon } from "./Icon";

export function PageBanner({
  icon,
  iconNode,
  title,
  subtitle,
  subtittleBottom,
  right,
  accent = "blue",
  containerClassName = "",
  titleClassName = "",
}) {
  const ACCENTS = {
    blue: {
      wrap: "border-blue-500/20 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 dark:from-blue-900/40 dark:via-indigo-950/20 dark:to-purple-950/40",
      icon: "from-blue-600 to-indigo-600 ring-blue-500/20",
    },
    purple: {
      wrap: "border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-indigo-500/5 to-purple-500/10 dark:from-purple-900/40 dark:via-indigo-950/20 dark:to-purple-950/40",
      icon: "from-purple-600 to-indigo-600 ring-purple-500/20",
    },
    rose: {
      wrap: "border-rose-500/20 bg-gradient-to-r from-rose-500/10 via-red-500/5 to-rose-500/10 dark:from-rose-950/40 dark:via-red-950/20 dark:to-rose-950/40",
      icon: "from-rose-600 to-red-600 ring-rose-500/20",
    },
  };

  const theme = ACCENTS[accent] || ACCENTS.blue;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border shadow-sm backdrop-blur-xl p-3 sm:p-4 shrink-0 select-none ${theme.wrap} ${containerClassName}`}
    >
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {iconNode ? (
            <div className="shrink-0">{iconNode}</div>
          ) : (
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-tr flex items-center justify-center shrink-0 text-white shadow-md ring-4 ${theme.icon}`}
            >
              <Icon name={icon} size={18} />
            </div>
          )}
          <div className="min-w-0">
            <h1
              className={`text-sm sm:text-base font-black font-display tracking-tight text-slate-900 dark:text-zinc-100 ${typeof title === "string" ? "break-words sm:truncate" : ""} ${titleClassName}`}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 break-words leading-snug ">
                {subtitle}
              </p>
            )}
            {subtittleBottom && <>{subtittleBottom}</>}
          </div>
        </div>
        {right && (
          <div className="flex flex-wrap items-center sm:justify-end gap-2 w-full sm:w-auto sm:shrink-0">
            {right}
          </div>
        )}
        
      </div>
    </div>
  );
}
