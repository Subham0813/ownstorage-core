import { Skeleton } from "../../components/ui/UI";

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="p-5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800"
        >
          <Skeleton className="w-8 h-8 rounded-xl mb-3" />
          <Skeleton className="w-32 h-6 mb-2" />
          <Skeleton className="w-full h-2 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function QuickAccessSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/50"
        >
          <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
          <div className="flex-1 min-w-0">
            <Skeleton className="w-3/4 h-3.5 mb-1.5" />
            <Skeleton className="w-1/2 h-2.5" />
          </div>
        </div>
      ))}
    </div>
  );
}
