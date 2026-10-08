import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "../../components/ui/Icon";
import {
  Btn,
  ConfirmModal,
  Skeleton,
  ModalOverlay,
  ModalHeader,
  ModalFooter,
  Badge,
  Input,
  Label,
} from "../../components/ui/UI";
import { adminAPI } from "../../api/adminApi";
import { useApp } from "../../context/AppContext";
import {
  formatDate as formatAbsDate,
  getInitials,
  formatSize,
} from "../../utils/fileUtils";
import { formatDate as formatRelDate } from "../../utils/formatHelpers";
import {
  LoggedBadge,
  BannedBadge,
} from "../../components/dashboard/UserStatusBadges";

function QuotaBar({ used, max }) {
  const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0;
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
        <span className="text-slate-500 uppercase tracking-wider">
          Storage Usage
        </span>
        <span className="text-sm text-slate-800 dark:text-zinc-200 font-mono">
          {formatSize(used)} / {formatSize(max)} ({Math.round(pct)}%)
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 dark:bg-zinc-800 overflow-hidden ring-1 ring-inset ring-slate-200/60 dark:ring-zinc-700/60">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            pct >= 90
              ? "bg-rose-500"
              : pct >= 70
                ? "bg-amber-500"
                : "bg-gradient-to-r from-blue-600 to-indigo-500"
          }`}
          style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }}
        />
      </div>
    </div>
  );
}

function roleLabel(role) {
  if (role === "super_admin") return "Super Admin";
  if (role === "admin") return "Admin";
  return "User";
}

function Chips({ raw }) {
  const list = (raw || "")
    .split("&")
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0)
    return <span className="text-xs font-bold text-slate-400">None</span>;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {list.map((c) => (
        <span
          key={c}
          className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 capitalize"
        >
          {c.replace(/_/g, " ")}
        </span>
      ))}
    </div>
  );
}

const TABS = ["Overview", "Storage Analytics"];

function MetaCard({ label, children }) {
  return (
    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800">
      <label className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-widest">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showMessage, isSuperAdmin, user: currentUser } = useApp();
  const isOwnProfile = !!id && currentUser?.id === id;
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("Overview");
  const [editingRole, setEditingRole] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [banReason, setBanReason] = useState("");
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["adminUser", id],
    queryFn: () => adminAPI.getUser(id),
    enabled: !!id,
  });
  const user = userData?.data?.data?.user;

  const { data: storageData, isLoading: storageLoading } = useQuery({
    queryKey: ["adminUserStorage", id],
    queryFn: () => adminAPI.getUserStorage(id),
    enabled: !!id && activeTab === "Storage Analytics",
  });
  const storage = storageData?.data?.data;

  const roleMutation = useMutation({
    mutationFn: ({ id: uid, role }) => adminAPI.changeRole(uid, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUser", id] });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      showMessage("success", "User role updated successfully");
      setEditingRole(null);
    },
    onError: (err) =>
      showMessage(
        "error",
        err?.response?.data?.message || "Failed to update role",
      ),
  });

  const logoutMutation = useMutation({
    mutationFn: () => adminAPI.logoutUser(id),
    onSuccess: () =>
      showMessage("success", "User logged out from all active sessions"),
    onError: () => showMessage("error", "Failed to logout user"),
  });

  const removeMutation = useMutation({
    mutationFn: (reason) => adminAPI.removeUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      showMessage("success", "User account banned");
      navigate("/admin/users");
    },
    onError: () => showMessage("error", "Failed to ban user"),
  });

  const recoverMutation = useMutation({
    mutationFn: () => adminAPI.recoverUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUser", id] });
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      showMessage("success", "User account unbanned & recovered");
    },
    onError: () => showMessage("error", "Failed to recover user"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminAPI.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      showMessage("success", "User permanently deleted");
      navigate("/admin/users");
    },
    onError: () => showMessage("error", "Failed to delete user"),
  });

  const sendEmailMutation = useMutation({
    mutationFn: ({ subject, message }) =>
      adminAPI.sendEmail(id, { subject, message }),
    onSuccess: () => {
      showMessage("success", "Email sent to the user");
      setEmailOpen(false);
      setEmailSubject("");
      setEmailMessage("");
    },
    onError: (err) =>
      showMessage(
        "error",
        err?.response?.data?.message || "Failed to send email",
      ),
  });

  if (userLoading) {
    return (
      <div className="py-4 sm:py-6 px-4 sm:px-6 max-w-5xl mx-auto space-y-6 select-none">
        <Skeleton className="h-6 w-36 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-10 w-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-4 sm:py-6 px-4 sm:px-6 max-w-5xl mx-auto select-none">
        <div className="text-center py-16">
          <Icon
            name="alertTriangle"
            size={40}
            className="text-rose-500 mx-auto mb-3"
          />
          <h3 className="text-lg font-bold text-slate-900 dark:text-zinc-100 mb-1">
            User account not found
          </h3>
          <p className="text-xs sm:text-sm font-semibold text-slate-400 mb-6">
            This user account does not exist or has been removed.
          </p>
          <Btn
            variant="secondary"
            onClick={() => navigate("/admin/users")}
            className="font-extrabold cursor-pointer"
          >
            Back to Users Directory
          </Btn>
        </div>
      </div>
    );
  }

  const initials = getInitials(user.name);
  const limits = user.limits || {};

  return (
    <div className="p-0.5 sm:p-2 max-w-6xl mx-auto space-y-6 select-none pb-20 lg:pb-0">
      <button
        onClick={() => navigate("/admin/users")}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold transition-all cursor-pointer shadow-2xs"
      >
        <Icon name="chevronLeft" size={14} />
        Back to Users Directory
      </button>

      <div className="relative overflow-hidden rounded-xl border border-blue-500/25 bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-purple-500/15 dark:from-blue-900/60 dark:via-indigo-950/40 dark:to-purple-950/60 px-5 sm:px-6 py-4 text-slate-900 dark:text-white shadow-md">
        <div className="relative z-10 flex flex-wrap items-center gap-3 sm:gap-4">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover border-2 border-white dark:border-zinc-800 shadow-md shrink-0"
            />
          ) : (
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 ring-2 ring-blue-200 dark:ring-blue-900/60 text-white font-black text-base sm:text-lg flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black font-display text-slate-900 dark:text-zinc-100 truncate min-w-0">
                {user.name}
              </h1>
              {user.isDeleted ? (
                <BannedBadge />
              ) : (
                <LoggedBadge logged={user.isLogged} />
              )}
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-400 dark:text-zinc-400 truncate font-mono">
              {user.email}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              {roleLabel(user.role)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-1.5 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-2xl w-fit border border-slate-200/60 dark:border-zinc-700/60 shadow-2xs flex-wrap">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === t
                ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-2xs border border-slate-200/60 dark:border-zinc-700/60"
                : "text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-6 shadow-sm backdrop-blur-xl">
            <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-5">
              Account Metadata & Role
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800">
                <label className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-widest">
                  System Role
                </label>
                <div className="flex items-center gap-2 mt-2">
                  {editingRole !== null ? (
                    <>
                      <select
                        value={editingRole}
                        onChange={(e) => setEditingRole(e.target.value)}
                        className="px-3 py-1 text-xs font-bold rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-200 outline-none"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        {isSuperAdmin && (
                          <option value="super_admin">Super Admin</option>
                        )}
                      </select>
                      <Btn
                        size="sm"
                        variant="primary"
                        disabled={
                          roleMutation.isPending || editingRole === user.role
                        }
                        onClick={() => {
                          roleMutation.mutate({ id, role: editingRole });
                        }}
                      >
                        Save
                      </Btn>
                      <Btn
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingRole(null)}
                      >
                        Cancel
                      </Btn>
                    </>
                  ) : user.role === "super_admin" ? (
                    <>
                      <span className="text-sm font-extrabold text-purple-600 dark:text-purple-400">
                        {roleLabel(user.role)}
                      </span>
                      {/* <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-purple-500/15 text-purple-600 border border-purple-500/30">
                        <Icon name="shield" size={10} /> Protected
                      </span> */}
                    </>
                  ) : !user.isDeleted &&
                    (isSuperAdmin || user.role === "user") ? (
                    <>
                      <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">
                        {roleLabel(user.role)}
                      </span>
                      <button
                        onClick={() => setEditingRole(user.role)}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline ml-2 cursor-pointer"
                      >
                        Edit Role
                      </button>
                    </>
                  ) : (
                    <span className="text-sm font-extrabold text-slate-800 dark:text-zinc-200">
                      {roleLabel(user.role)}
                    </span>
                  )}
                </div>
              </div>

              <MetaCard label="Joined Date">
                <p className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 mt-1 font-mono">
                  {formatAbsDate(user.createdAt)}
                </p>
              </MetaCard>

              <MetaCard label="Last Login">
                <p className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 mt-1 font-mono">
                  {user.lastLogin
                    ? formatRelDate(user.lastLogin)
                    : "Never logged in"}
                </p>
              </MetaCard>

              <MetaCard label="Current Session">
                <div className="mt-2">
                  <LoggedBadge logged={user.isLogged} />
                </div>
              </MetaCard>

              <MetaCard label="Last Active">
                <p className="text-xs font-extrabold text-slate-700 dark:text-zinc-300 mt-1 font-mono">
                  {user.lastActiveAt
                    ? formatRelDate(user.lastActiveAt)
                    : "Never recorded"}
                </p>
              </MetaCard>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-6 shadow-sm backdrop-blur-xl">
            <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-5">
              Security & Integrations
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <MetaCard label="Auth Providers">
                <Chips raw={user.authProviders} />
              </MetaCard>

              <MetaCard label="Two-Factor Auth">
                <div className="mt-2">
                  {user.isTwoFactorEnabled ? (
                    <Badge color="green">Enabled</Badge>
                  ) : (
                    <Badge color="grey">Disabled</Badge>
                  )}
                </div>
              </MetaCard>

              <MetaCard label="Connected Integrations">
                <Chips raw={user.integrations} />
              </MetaCard>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-6 shadow-sm backdrop-blur-xl">
            <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-4">
              Admin Governance Controls
            </h3>

            <div className="flex flex-wrap items-center gap-3">
              <Btn
                variant="secondary"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="font-extrabold active:scale-95 cursor-pointer"
              >
                <Icon name="logout" size={14} />
                Force Logout All Devices
              </Btn>

              <Btn
                variant="info"
                size="sm"
                onClick={() => setEmailOpen(true)}
                disabled={isOwnProfile}
                title={isOwnProfile ? "You cannot email yourself" : undefined}
                className="font-extrabold active:scale-95 cursor-pointer"
              >
                <Icon name="mail" size={14} />
                Send Email
              </Btn>

              {user.isDeleted ? (
                <Btn
                  variant="primary"
                  size="sm"
                  onClick={() => recoverMutation.mutate()}
                  disabled={recoverMutation.isPending}
                  className="font-extrabold active:scale-95 cursor-pointer bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Icon name="restore" size={14} />
                  {recoverMutation.isPending
                    ? "Recovering..."
                    : "Unban & Recover User"}
                </Btn>
              ) : (
                <Btn
                  variant="danger"
                  size="sm"
                  onClick={() => setConfirmAction("remove")}
                  className="font-extrabold active:scale-95 cursor-pointer"
                >
                  <Icon name="trash" size={14} />
                  Ban Account
                </Btn>
              )}

              <Btn
                variant="danger"
                size="sm"
                onClick={() => setConfirmAction("delete")}
                className="font-extrabold active:scale-95 cursor-pointer"
              >
                <Icon name="trash" size={14} />
                Delete Permanently
              </Btn>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-6 shadow-sm backdrop-blur-xl">
            <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-5">
              Account Limits
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <MetaCard label="Storage Quota">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 font-mono">
                  {formatSize(limits.quotaBytes ?? user.maxQuota ?? 0)}
                </p>
              </MetaCard>

              <MetaCard label="Monthly Bandwidth">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 font-mono">
                  {formatSize(
                    limits.monthlyBandwidthLimit ?? user.maxBandwidthQuota ?? 0,
                  )}
                </p>
              </MetaCard>

              <MetaCard label="Max File Size">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 font-mono">
                  {formatSize(limits.maxFileSize ?? 0)}
                </p>
              </MetaCard>

              <MetaCard label="Used Quota">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 font-mono">
                  {user.usedQuota ? formatSize(user.usedQuota) : "—"}
                </p>
              </MetaCard>

              <MetaCard label="Upload Concurrency">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 font-mono">
                  {limits.maxUploadConcurrency ?? "—"}
                </p>
              </MetaCard>

              <MetaCard label="Max Devices">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 font-mono">
                  {limits.maxDevices ?? "—"}
                </p>
              </MetaCard>

              <MetaCard label="Public Links">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1">
                  {limits.canCreatePublicLinks ? "Allowed" : "Not allowed"}
                </p>
              </MetaCard>

              <MetaCard label="Trash Retention">
                <p className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1 font-mono">
                  {limits.trashRetentionDays
                    ? `${limits.trashRetentionDays} days`
                    : "—"}
                </p>
              </MetaCard>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Storage Analytics" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 p-6 shadow-sm backdrop-blur-xl">
            <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">
              Storage & Bandwidth Metrics
            </h3>

            {storageLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full rounded-xl" />
                <Skeleton className="h-3 w-3/4 rounded-xl" />
                <Skeleton className="h-3 w-1/2 rounded-xl" />
              </div>
            ) : storage ? (
              <>
                <QuotaBar
                  used={storage.usedQuota || storage.totalSize || 0}
                  max={storage.maxQuota || user.maxQuota || 1}
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800">
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      Total Files
                    </p>
                    <p className="text-lg font-black text-slate-900 dark:text-zinc-100 font-mono mt-0.5">
                      {storage.totalFiles ?? "0"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800">
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      Total Folders
                    </p>
                    <p className="text-lg font-black text-slate-900 dark:text-zinc-100 font-mono mt-0.5">
                      {storage.totalDirs ?? "0"}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800">
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      Bandwidth Used
                    </p>
                    <p className="text-lg font-black text-slate-900 dark:text-zinc-100 font-mono mt-0.5">
                      {formatSize(user.usedBandwidthQuota || 0)}
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800">
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      Quota Limit
                    </p>
                    <p className="text-lg font-black text-slate-900 dark:text-zinc-100 font-mono mt-0.5">
                      {formatSize(storage.maxQuota || user.maxQuota || 0)}
                    </p>
                  </div>
                </div>

                {storage.breakdown && (
                  <div className="mt-6 pt-5 border-t border-slate-100 dark:border-zinc-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                      File Type Breakdown
                    </p>
                    <div className="space-y-2">
                      {Object.entries(storage.breakdown).map(
                        ([key, val]) =>
                          val && (
                            <div
                              key={key}
                              className="flex items-center justify-between text-xs font-bold p-3 rounded-xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800"
                            >
                              <span className="text-slate-800 dark:text-zinc-200 capitalize">
                                {key}
                              </span>
                              <span className="text-slate-500 font-mono">
                                {val.count} file{val.count !== 1 ? "s" : ""} ·{" "}
                                {formatSize(val.size)}
                              </span>
                            </div>
                          ),
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-xs font-bold text-slate-400 py-6 text-center">
                No storage metrics recorded for this user.
              </p>
            )}
          </div>
        </div>
      )}

      {emailOpen && (
        <ModalOverlay onClose={() => setEmailOpen(false)}>
          <ModalHeader
            title={`Email ${user.name}`}
            sub={`Send a direct message to ${user.email}`}
            onClose={() => setEmailOpen(false)}
          />
          <div className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Subject line"
              />
            </div>
            <div>
              <Label>Message</Label>
              <textarea
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={6}
                placeholder="Write your message..."
                className="w-full px-4 py-2.5 text-sm font-sans rounded-xl bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-2xs transition-all resize-none"
              />
              <p className="text-xs font-semibold text-slate-400 mt-1.5">
                Message must be at least 10 characters.
              </p>
            </div>
          </div>
          <ModalFooter>
            <Btn variant="ghost" onClick={() => setEmailOpen(false)}>
              Cancel
            </Btn>
            <Btn
              variant="primary"
              disabled={
                sendEmailMutation.isPending ||
                emailSubject.trim().length < 3 ||
                emailMessage.trim().length < 10
              }
              onClick={() =>
                sendEmailMutation.mutate({
                  subject: emailSubject,
                  message: emailMessage,
                })
              }
            >
              {sendEmailMutation.isPending ? "Sending…" : "Send Email"}
            </Btn>
          </ModalFooter>
        </ModalOverlay>
      )}

      <ConfirmModal
        isOpen={confirmAction === "remove"}
        title="Ban User Account"
        confirmLabel="Ban Account"
        onConfirm={() => {
          if (!banReason || banReason.length < 10) {
            showMessage(
              "error",
              "Ban reason must be at least 10 characters long",
            );
            return;
          }
          removeMutation.mutate(banReason);
          setConfirmAction(null);
          setBanReason("");
        }}
        onCancel={() => {
          setConfirmAction(null);
          setBanReason("");
        }}
        variant="danger"
        loading={removeMutation.isPending}
      >
        <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-zinc-400 mb-3">
          Are you sure you want to ban{" "}
          <span className="font-extrabold text-slate-900 dark:text-zinc-100">
            {user.name}
          </span>
          ?
        </p>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
            Ban Reason (min 10 chars):
          </label>
          <textarea
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
            placeholder="Reason for suspension..."
            rows={3}
            className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-zinc-100 outline-none focus:border-rose-500 transition-all resize-none"
          />
        </div>
      </ConfirmModal>

      <ConfirmModal
        isOpen={confirmAction === "delete"}
        title="Delete Account Permanently"
        confirmLabel="Delete Permanently"
        onConfirm={() => {
          deleteMutation.mutate();
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
        variant="danger"
        loading={deleteMutation.isPending}
      >
        <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-zinc-400">
          Permanently delete{" "}
          <span className="font-extrabold text-slate-900 dark:text-zinc-100">
            {user.name}&apos;s
          </span>{" "}
          account? This action cannot be undone.
        </p>
      </ConfirmModal>
    </div>
  );
}
