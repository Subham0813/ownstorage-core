import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Icon } from "../../components/ui/Icon";
import { Btn, ConfirmModal, Skeleton } from "../../components/ui/UI";
import { OptionSelect } from "../../components/ui/OptionSelect";
import { ContextMenu } from "../../components/dashboard/ContextMenu";
import { SortBar } from "../../components/dashboard/SortBar";
import { adminAPI } from "../../api/adminApi";
import { useApp } from "../../context/AppContext";
import { formatDate, getInitials } from "../../utils/fileUtils";
import { getTierStyles, planDisplayName } from "../../utils/tierStyles";

const USER_SORT_OPTIONS = [
  { value: "date", label: "Joined" },
  { value: "name", label: "Name" },
  { value: "plan", label: "Plan" },
  { value: "role", label: "Role" },
];

export default function AdminUsers() {
  const { showMessage, isSuperAdmin, user: currentUser } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [ctxMenu, setCtxMenu] = useState({
    isOpen: false,
    user: null,
    position: { x: 0, y: 0 },
  });
  const [confirmAction, setConfirmAction] = useState({
    isOpen: false,
    user: null,
    action: null,
  });
  const [banReason, setBanReason] = useState("");
  const [targetRole, setTargetRole] = useState("user");

  const { data: usersData, isLoading } = useQuery({
    queryKey: [
      "adminUsers",
      page,
      search,
      roleFilter,
      statusFilter,
      sortBy,
      sortOrder,
    ],
    queryFn: () =>
      adminAPI.getUsers({
        page,
        limit: 20,
        search: search || undefined,
        role: roleFilter,
        status: statusFilter,
        sortBy: sortBy !== "date" ? sortBy : undefined,
        sortOrder: sortOrder !== "desc" ? sortOrder : undefined,
      }),
    staleTime: 15_000,
  });

  const users = usersData?.data?.data?.users || [];
  const totalPages = usersData?.data?.data?.totalPages || 1;
  const totalUsersCount = usersData?.data?.data?.totalUsers || users.length;

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => adminAPI.changeRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      showMessage("success", "User role updated successfully");
    },
    onError: (err) =>
      showMessage(
        "error",
        err?.response?.data?.message || "Failed to update role",
      ),
  });

  const removeMutation = useMutation({
    mutationFn: ({ id, reason }) => adminAPI.removeUser(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      showMessage("success", "User account banned");
    },
    onError: () => showMessage("error", "Failed to ban user"),
  });

  const recoverMutation = useMutation({
    mutationFn: (id) => adminAPI.recoverUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      showMessage("success", "User account unbanned");
    },
    onError: () => showMessage("error", "Failed to recover user"),
  });

  const logoutMutation = useMutation({
    mutationFn: (id) => adminAPI.logoutUser(id),
    onSuccess: () => showMessage("success", "User sessions terminated"),
    onError: () => showMessage("error", "Failed to logout user"),
  });

  const canChangeRole = (u) =>
    !!u &&
    !u.isDeleted &&
    u.role !== "super_admin" &&
    (isSuperAdmin || u.role === "user");

  const handleCtxMenu = (e, targetUser) => {
    e.preventDefault();
    e.stopPropagation();

    let pos;
    if (e.clientX && e.clientY && e.type === "contextmenu") {
      pos = { x: e.clientX, y: e.clientY };
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      pos = { x: rect.right - 200, y: rect.bottom + 4 };
    }

    setCtxMenu({
      isOpen: true,
      user: targetUser,
      position: pos,
    });
  };

  const closeCtxMenu = () => setCtxMenu((prev) => ({ ...prev, isOpen: false }));

  const buildMenuItems = (u) => {
    const items = [{ key: "view", icon: "eye", label: "Inspect User Details" }];
    if (canChangeRole(u)) {
      items.push({
        key: "changeRole",
        icon: "refresh",
        label: `Switch Role to ${u.role === "admin" ? "User" : "Admin"}`,
      });
    }
    items.push({
      key: "logout",
      icon: "logout",
      label: "Force Logout All Devices",
    });
    items.push({ key: "divider1" });
    items.push(
      u?.isDeleted
        ? {
            key: "recover",
            icon: "restore",
            label: "Unban & Recover User",
            variant: "success",
          }
        : {
            key: "remove",
            icon: "trash",
            label: "Ban Account",
            variant: "danger",
          },
    );
    return items;
  };

  const handleAction = (action, u) => {
    setCtxMenu({ isOpen: false, user: null, position: { x: 0, y: 0 } });

    switch (action) {
      case "view":
        navigate(`/admin/users/${u._id || u.id}`);
        break;
      case "changeRole":
        setTargetRole(u?.role === "admin" ? "user" : "admin");
        setConfirmAction({ isOpen: true, user: u, action: "changeRole" });
        break;
      case "logout":
        logoutMutation.mutate(u._id || u.id);
        break;
      case "remove":
        setBanReason("");
        setConfirmAction({ isOpen: true, user: u, action: "remove" });
        break;
      case "recover":
        recoverMutation.mutate(u._id || u.id);
        break;
      default:
        break;
    }
  };

  const executeConfirmAction = () => {
    const { user: targetUser, action } = confirmAction;
    if (action === "changeRole") {
      roleMutation.mutate({
        id: targetUser._id || targetUser.id,
        role: targetRole,
      });
    } else if (action === "remove") {
      if (!banReason || banReason.length < 10) {
        showMessage("error", "Ban reason must be at least 10 characters long");
        return;
      }
      removeMutation.mutate({
        id: targetUser._id || targetUser.id,
        reason: banReason,
      });
    }
    setConfirmAction({ isOpen: false, user: null, action: null });
    setBanReason("");
  };

  return (
    <div className="p-0.5 sm:p-2 max-w-7xl mx-auto space-y-6 select-none pb-20 lg:pb-0">
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => navigate("/admin")}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold transition-all shadow-2xs cursor-pointer"
        >
          <Icon name="chevronLeft" size={14} />
          Back to Admin Console
        </button>
        <p className="text-xs sm:text-sm text-gray-700 dark:text-zinc-400">
          Manage registered user accounts, assign admin privileges, force
          sign-outs, or audit suspensions
        </p>
      </div>

      <div className="relative z-20 shrink-0 flex flex-wrap items-center gap-3 bg-white/95 dark:bg-zinc-900/95 p-1.5 rounded-2xl border-b border-slate-200/90 dark:border-zinc-800 shadow-sm backdrop-blur-xl">
        <div className="relative flex-1 min-w-[220px]">
          <Icon
            name="search"
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Search by user name or email address..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/60 text-slate-900 dark:text-zinc-100 placeholder-slate-400 outline-none focus:border-blue-500 transition-all shadow-2xs"
          />
        </div>

        <OptionSelect
          label="Role"
          value={roleFilter}
          onChange={(v) => {
            setRoleFilter(v);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All Roles" },
            { value: "user", label: "User Role" },
            { value: "admin", label: "Admin Role" },
            { value: "super_admin", label: "Super Admin Role" },
          ]}
        />

        <OptionSelect
          label="Status"
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          options={[
            { value: "all", label: "All Statuses" },
            { value: "active", label: "Active Accounts" },
            { value: "banned", label: "Banned Accounts" },
          ]}
        />

        <SortBar
          options={USER_SORT_OPTIONS}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(field, order) => {
            setSortBy(field);
            if (order) setSortOrder(order);
            setPage(1);
          }}
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 shadow-sm backdrop-blur-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="sticky top-0 z-10 border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800 text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider">
                  <th className="px-3 py-2.5 sm:px-6 sm:py-3.5">
                    User Identity{" "}
                    <span className="w-fit px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-mono whitespace-nowrap">
                      {totalUsersCount} Total
                    </span>
                  </th>
                  <th className="px-3 py-2.5 sm:px-6 sm:py-3.5">Role</th>
                  <th className="px-3 py-2.5 sm:px-6 sm:py-3.5">Plan Plan</th>
                  <th className="px-3 py-2.5 sm:px-6 sm:py-3.5 hidden md:table-cell">
                    Joined
                  </th>
                  <th className="px-3 py-2.5 sm:px-6 sm:py-3.5">Sessions</th>
                  <th className="px-3 py-2.5 sm:px-6 sm:py-3.5 text-right w-12">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/60">
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-slate-400 font-semibold text-xs"
                    >
                      No accounts matched your search criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const basePlan = (u.plan || "FREE").split("_")[0];
                    const planStyle = getTierStyles(u.plan);
                    const isSelf = currentUser?.email === u.email;
                    return (
                      <tr
                        key={u._id || u.id}
                        onClick={() =>
                          navigate(`/admin/users/${u._id || u.id}`)
                        }
                        onContextMenu={(e) => handleCtxMenu(e, u)}
                        className="hover:bg-slate-50/80 dark:hover:bg-zinc-800/30 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-2xl bg-gradient-to-tr ${planStyle.gradient} text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs`}
                            >
                              {getInitials(u.name)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-extrabold text-slate-900 dark:text-zinc-100 text-xs truncate flex items-center gap-1.5">
                                {u.name}
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-xs font-bold uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-xs font-semibold text-slate-400 dark:text-zinc-400 truncate font-mono">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border whitespace-nowrap ${
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
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border whitespace-nowrap ${planStyle.badgeBg}`}
                          >
                            {planDisplayName(basePlan)}
                          </span>
                        </td>

                        <td className="px-6 py-3.5 text-slate-500 dark:text-zinc-400 text-xs font-mono font-medium hidden md:table-cell">
                          {formatDate(u.createdAt)}
                        </td>

                        <td className="px-6 py-3.5">
                          {u.isDeleted ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />{" "}
                              Banned
                            </span>
                          ) : u.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />{" "}
                              Online
                            </span>
                          ) : u.isLogged ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{" "}
                              Signed in
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30 whitespace-nowrap">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />{" "}
                              Offline
                            </span>
                          )}
                        </td>

                        <td
                          className="px-6 py-3.5 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => handleCtxMenu(e, u)}
                            className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                            title="Actions"
                          >
                            <Icon name="moreHorizontal" size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-3.5 border-t border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Btn
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  className="font-bold text-xs"
                >
                  Previous
                </Btn>
                <Btn
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  className="font-bold text-xs"
                >
                  Next
                </Btn>
              </div>
            </div>
          )}
        </div>
      )}

      <ContextMenu
        isOpen={ctxMenu.isOpen}
        position={ctxMenu.position}
        item={ctxMenu.user}
        onClose={closeCtxMenu}
        onAction={(action) => handleAction(action, ctxMenu.user)}
        menuItems={ctxMenu.user ? buildMenuItems(ctxMenu.user) : []}
      />

      <ConfirmModal
        isOpen={confirmAction.isOpen}
        onClose={() =>
          setConfirmAction({ isOpen: false, user: null, action: null })
        }
        onConfirm={executeConfirmAction}
        title={
          confirmAction.action === "changeRole" ? "Change Role" : "Ban User"
        }
        message={
          confirmAction.action === "changeRole"
            ? `Change role for ${confirmAction.user?.name} to "${targetRole.toUpperCase()}"?`
            : `Are you sure you want to ban ${confirmAction.user?.name}? They will lose access immediately.`
        }
        confirmLabel={
          confirmAction.action === "changeRole" ? "Change Role" : "Ban User"
        }
        variant={confirmAction.action === "changeRole" ? "warning" : "danger"}
      >
        {confirmAction.action === "remove" && (
          <div className="mt-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1">
              Reason for ban (min 10 characters):
            </label>
            <input
              type="text"
              placeholder="e.g. Terms of Service violation"
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 outline-none focus:border-rose-500"
            />
          </div>
        )}
      </ConfirmModal>
    </div>
  );
}
