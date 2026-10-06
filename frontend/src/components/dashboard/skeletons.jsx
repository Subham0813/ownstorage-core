import { Skeleton } from "../ui/UI";

/* ── Folder Grid Skeleton ──────────────────────────────────────────── */
export function FolderGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3.5 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-2.5 sm:p-3 h-24 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="w-4 h-4 rounded-md" />
            <Skeleton className="w-4 h-4 rounded-md" />
          </div>
          <div className="flex items-center gap-2.5 my-0.5">
            <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
            <div className="flex-1 min-w-0 space-y-1">
              <Skeleton className="h-3 w-3/4 rounded" />
              <Skeleton className="h-2 w-1/2 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── File Grid Skeleton ────────────────────────────────────────────── */
export function FileGridSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3.5 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-48 sm:h-52 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-100 dark:bg-zinc-900 flex flex-col justify-between p-3.5 overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="w-5 h-5 rounded-md" />
            <div className="flex items-center gap-1.5">
              <Skeleton className="w-10 h-4 rounded-md" />
              <Skeleton className="w-5 h-5 rounded-md" />
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
            <Skeleton className="w-6 h-6 rounded-lg shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Shared Grid Skeleton (card tiles matching quick-access cards) ──── */
export function SharedGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 sm:px-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
        >
          <Skeleton className="w-5 h-5 shrink-0 rounded-lg" />
          <Skeleton className="w-10 h-10 shrink-0 rounded-xl" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4 rounded" />
            <Skeleton className="h-2.5 w-1/2 rounded" />
          </div>
          <Skeleton className="w-8 h-8 shrink-0 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

/* ── Inline skeleton appended after existing items during load-more ── */
export function FolderGridSkeletonInline({ count = 4 }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2.5 sm:gap-3 mt-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 animate-pulse"
        >
          <Skeleton className="w-5 h-5 shrink-0 rounded-md" />
          <Skeleton className="w-8 h-8 shrink-0 rounded-lg" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <Skeleton className="h-3.5 w-3/4 rounded" />
            <Skeleton className="h-2.5 w-1/2 rounded" />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Skeleton className="w-5 h-5 rounded-md" />
            <Skeleton className="w-5 h-5 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Combined Grid Skeleton (folders + files, for search results etc.) ── */
export function GridSkeleton({ folderCount = 2, fileCount = 6 }) {
  return (
    <div className="space-y-6">
      <FolderGridSkeleton count={folderCount} />
      <FileGridSkeleton count={fileCount} />
    </div>
  );
}
