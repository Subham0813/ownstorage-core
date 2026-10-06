import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Icon } from "../../components/ui/Icon";
import { Skeleton, Btn } from "../../components/ui/UI";
import { PageBanner } from "../../components/ui/PageBanner";
import { adminAPI } from "../../api/adminApi";
import { formatSize, formatDate, getInitials } from "../../utils/fileUtils";
import { useApp } from "../../context/AppContext";
import { getTierStyles, planDisplayName } from "../../utils/tierStyles";

function StatCard({ label, value, icon, gradient, textColor }) {
  return (
    <div className="relative p-5 sm:p-6 rounded-xl bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800 shadow-sm hover:shadow-xl transition-all duration-300 backdrop-blur-xl overflow-hidden group select-none">
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none`}
      />
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${gradient} flex items-center justify-center text-white shadow-md shadow-blue-500/10`}
        >
          <Icon name={icon} size={20} />
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
          Live
        </span>
      </div>
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-zinc-400">
        {label}
      </p>
      <p
        className={`text-2xl sm:text-3xl font-black font-display tracking-tight font-mono mt-1 ${textColor}`}
      >
        {value}
      </p>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showMessage } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    data: dashData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: () => adminAPI.getDashboard(),
    staleTime: 30_000,
  });

  const stats = dashData?.data?.data;

  const handleRefreshSystem = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetch(),
        queryClient.invalidateQueries({ queryKey: ["adminDashboard"] }),
        queryClient.invalidateQueries({ queryKey: ["adminUsers"] }),
        queryClient.invalidateQueries({ queryKey: ["userStats"] }),
        queryClient.invalidateQueries({ queryKey: ["user-stats"] }),
        queryClient.invalidateQueries({ queryKey: ["user-usage"] }),
      ]);
      showMessage("success", "Admin console & system metrics refreshed!");
    } catch {
      showMessage("error", "Failed to refresh system metrics");
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  if (isLoading) {
    return (
      <div className="py-4 sm:py-6 px-4 sm:px-6 max-w-7xl mx-auto space-y-6 select-none">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-48 rounded-xl" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const users = stats?.recentUsers || [];
  const planBreakdown = stats?.planBreakdown || [];

  return (
    <div className="p-0.5 sm:p-2 max-w-7xl mx-auto space-y-6 select-none pb-20 lg:pb-0">
      <PageBanner
        icon="shield"
        accent="blue"
        title="Command Center"
        subtitle="Platform overview, system metrics, subscription breakdown, and user administration"
        right={
          <>
            <Btn
              variant="ghost"
              size="sm"
              disabled={isRefreshing}
              onClick={handleRefreshSystem}
              className="font-extrabold active:scale-95 cursor-pointer"
            >
              <Icon
                name="refresh"
                size={14}
                className={isRefreshing ? "animate-spin text-blue-500" : ""}
              />
              {isRefreshing ? "Refreshing..." : "Refresh System"}
            </Btn>
            <Btn
              variant="primary"
              size="sm"
              onClick={() => navigate("/admin/users")}
              className="font-extrabold shadow-md active:scale-95 cursor-pointer"
            >
              <Icon name="users" size={14} />
              User Directory
            </Btn>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Registered Users"
          value={stats?.totalUsers?.toLocaleString() || "0"}
          icon="users"
          gradient="from-blue-600 to-indigo-600"
          textColor="text-slate-900 dark:text-zinc-100"
        />
        <StatCard
          label="Active Accounts"
          value={stats?.activeUsers?.toLocaleString() || "0"}
          icon="checkCircle"
          gradient="from-emerald-500 to-teal-600"
          textColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Total Storage Consumed"
          value={formatSize(stats?.storageUsedBytes || 0)}
          icon="hardDrive"
          gradient="from-purple-600 to-pink-600"
          textColor="text-purple-600 dark:text-purple-400"
        />
        <StatCard
          label="Monthly MRR"
          value={`₹${(stats?.mrrRupees || 0).toLocaleString()}`}
          icon="crown"
          gradient="from-amber-500 to-orange-600"
          textColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {planBreakdown.length > 0 && (
          <div className="p-6 rounded-xl bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800 shadow-sm backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200/60 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs shrink-0">
                  <Icon name="barChart" size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    Plan Distribution
                  </p>
                  <h3 className="text-base sm:text-lg font-black font-display text-slate-900 dark:text-zinc-100 tracking-tight">
                    Active Subscriptions
                  </h3>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {planBreakdown.map((p) => {
                const style = getTierStyles(p.plan);
                return (
                  <div key={p.plan} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${style.dot}`}
                        />
                        {planDisplayName(p.plan)} Plan
                      </span>
                      <span className="font-mono text-slate-500 dark:text-zinc-400">
                        {p.count.toLocaleString()} user
                        {p.count !== 1 ? "s" : ""} ({p.percentage}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden ring-1 ring-inset ring-slate-200/60 dark:ring-zinc-700/60">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${style.dot}`}
                        style={{ width: `${Math.max(p.percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="p-6 rounded-xl bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800 shadow-sm backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-500/15 border border-blue-200/60 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shadow-xs shrink-0">
                <Icon name="settings" size={20} />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                  Environment
                </p>
                <h3 className="text-base sm:text-lg font-black font-display text-slate-900 dark:text-zinc-100 tracking-tight">
                  System Status & Health
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                  <Icon
                    name="checkCircle"
                    size={15}
                    className="text-emerald-500"
                  />{" "}
                  API Server Status
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Healthy
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-2">
                  <Icon
                    name="hardDrive"
                    size={15}
                    className="text-purple-500"
                  />{" "}
                  Database & Storage Cluster
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  Connected
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800/80 mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-zinc-400">
              Need user administration?
            </span>
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/users")}
              className="font-extrabold"
            >
              Manage Users <Icon name="arrowRight" size={14} />
            </Btn>
          </div>
        </div>
      </div>

      {users.length > 0 && (
        <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl overflow-hidden shadow-sm">
          <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-0.5">
                Recent Signups
              </p>
              <h3 className="text-base sm:text-lg font-black font-display tracking-tight text-slate-900 dark:text-zinc-100">
                Latest Registered Accounts
              </h3>
            </div>
            <Btn
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/users")}
              className="font-extrabold cursor-pointer"
            >
              View All Users <Icon name="arrowRight" size={14} />
            </Btn>
          </div>

          <div className="overflow-x-auto border-t border-slate-100 dark:border-zinc-800/60">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/80 dark:bg-zinc-800/40">
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider hidden sm:table-cell">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {users.map((u) => {
                  const basePlan = (u.plan || "FREE").split("_")[0];
                  const style = getTierStyles(u.plan);
                  return (
                    <tr
                      key={u._id || u.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 transition-colors"
                    >
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-2xl bg-gradient-to-tr ${style.gradient} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                          >
                            {getInitials(u.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 dark:text-zinc-100 text-xs truncate">
                              {u.name}
                            </p>
                            <p className="text-xs font-semibold text-slate-400 dark:text-zinc-400 truncate font-mono">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                            u.role === "super_admin"
                              ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
                              : u.role === "admin"
                                ? "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                                : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-700"
                          }`}
                        >
                          {u.role === "super_admin"
                            ? "Super Admin"
                            : u.role === "admin"
                              ? "Admin"
                              : "User"}
                        </span>
                      </td>

                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${style.badgeBg}`}
                        >
                          {planDisplayName(basePlan)}
                        </span>
                      </td>

                      <td className="px-6 py-3.5 text-slate-500 dark:text-zinc-400 text-xs font-mono font-medium hidden sm:table-cell">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="px-6 py-3.5 text-right">
                        <Btn
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            navigate(`/admin/users/${u._id || u.id}`)
                          }
                          className="font-bold text-xs"
                        >
                          Inspect
                        </Btn>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
