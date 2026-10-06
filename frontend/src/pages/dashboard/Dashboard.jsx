import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { homeAPI } from "../../api/userApi";
import { Icon } from "../../components/ui/Icon";
import { SectionCard } from "../../components/ui/UI";
import { StorageCard } from "../../components/dashboard/cards/StorageCard";
import { BandwidthCard } from "../../components/dashboard/cards/BandwidthCard";
import { TotalAssetsCard } from "../../components/dashboard/cards/TotalAssetsCard";
import { QuickAccessItem } from "../../components/dashboard/QuickAccessItem";
import {
  StatsSkeleton,
  QuickAccessSkeleton,
} from "../../components/dashboard/DashboardSkeletons";
import { getGreeting } from "../../utils/dashboardHelpers";

export default function Dashboard() {
  const { user } = useApp();
  const navigate = useNavigate();
  const name = user?.name?.split(" ")[0] ?? "there";

  const { data: statsRes, isLoading: statsLoading } = useQuery({
    queryKey: ["user-stats"],
    queryFn: () => homeAPI.getStats(),
    staleTime: 5 * 60 * 1000,
  });

  // NOTE: usage is NOT queried here — AppLayout's useUserUsage() owns the
  // single ["user-usage"] query and mirrors the result into AppContext.user
  // (kept coherent via invalidateUser on the backend). Reading it from context
  // avoids a second observer + mismatched refetchOnWindowFocus options.
  const usage = user && {
    usedQuota: user.usedQuota,
    maxQuota: user.maxQuota,
    usedBandwidthQuota: user.usedBandwidthQuota,
    maxBandwidthQuota: user.maxBandwidthQuota,
  };

  const { data: starredRes, isLoading: starredLoading } = useQuery({
    queryKey: ["user-starred", { limit: 6 }],
    queryFn: () => homeAPI.getStarred({ limit: 6 }),
    staleTime: 2 * 60 * 1000,
  });

  const { data: recentsRes, isLoading: recentsLoading } = useQuery({
    queryKey: ["user-recents", { limit: 6, days: 7 }],
    queryFn: () => homeAPI.getRecents({ limit: 6, days: 7 }),
    staleTime: 2 * 60 * 1000,
  });

  const stats = statsRes?.data?.data;

  const starredFiles = starredRes?.data?.data?.files ?? [];
  const starredDirs = starredRes?.data?.data?.directories ?? [];
  const recentFiles = recentsRes?.data?.data?.files ?? [];
  const recentDirs = recentsRes?.data?.data?.directories ?? [];

  const quickAccessItems = (() => {
    const map = new Map();
    [...starredDirs, ...starredFiles, ...recentDirs, ...recentFiles].forEach(
      (item) => {
        if (!map.has(item.id)) map.set(item.id, item);
      },
    );
    return Array.from(map.values());
  })();

  const isLoading = statsLoading;

  return (
    <div className="p-0.5 sm:p-2 space-y-6 max-w-7xl mx-auto w-full select-none pb-12">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-purple-500/15 dark:from-blue-900/60 dark:via-indigo-950/40 dark:to-purple-950/60 p-3 sm:p-4 text-slate-900 dark:text-white shadow-md border border-blue-500/25">
        <div className="relative z-10 flex flex-col sm:flex-row gap-1.5 justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-white/80 dark:bg-white/10 border border-slate-200/80 dark:border-white/15 text-slate-700 dark:text-white">
                <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                Active Cloud Workspace
              </span>
            </div>
            <h1 className="text-xl md:text-2xl sm:text-3xl font-black font-display tracking-tight text-slate-900 dark:text-zinc-100">
              {getGreeting()},{" "}
              <strong className="italic pr-2 font-black">{name}</strong> 👋
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-lg font-semibold leading-relaxed">
              Manage your cloud files, track storage utilization, and process
              file imports seamlessly.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <button
              onClick={() =>
                document.dispatchEvent(new CustomEvent("vd:trigger-upload"))
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm active:scale-95 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              <Icon name="upload" size={16} />
              Upload File
            </button>
            <button
              onClick={() =>
                navigate("/myfiles", { state: { triggerNewFolder: true } })
              }
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/80 hover:bg-white text-slate-800 font-extrabold text-xs sm:text-sm border border-slate-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white dark:border-zinc-700 shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Icon name="folderPlus" size={16} />
              New Folder
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-2">
          <StorageCard usage={usage} stats={stats} />
          <BandwidthCard usage={usage} />
          <TotalAssetsCard stats={stats} />
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-2">
            <Icon name="star" size={15} className="text-amber-400" />
            Quick Access
          </h2>
          <button
            onClick={() => navigate("/myfiles")}
            className="text-xs font-extrabold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            View All Files <Icon name="chevronRight" size={13} />
          </button>
        </div>

        {starredLoading || recentsLoading ? (
          <QuickAccessSkeleton />
        ) : quickAccessItems.length === 0 ? (
          <SectionCard className="text-center py-10 h-full flex flex-col items-center justify-center">
            <Icon
              name="star"
              size={28}
              className="text-slate-300 dark:text-zinc-400 mb-2"
            />
            <p className="text-sm font-semibold text-slate-400 dark:text-zinc-400">
              Star files or folders for quick access, or browse your recent
              items.
            </p>
          </SectionCard>
        ) : (
          <div className="flex flex-col gap-2.5">
            {quickAccessItems.map((item) => (
              <QuickAccessItem
                key={item.id}
                item={item}
                onClick={() => {
                  if (item.extension) {
                    navigate("/myfiles");
                  } else {
                    navigate(`/myfiles/folders/${item.id}`);
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
