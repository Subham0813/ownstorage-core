import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { homeAPI } from "../../api/userApi";
import { Icon } from "../ui/Icon";
import { timeAgo } from "../../utils/fileUtils";

const TYPE_ICONS = {
  share: "share",
  system: "info",
  storage_warning: "alertTriangle",
};

const TYPE_COLORS = {
  share: "text-blue-500",
  system: "text-slate-500 dark:text-zinc-400",
  storage_warning: "text-amber-500",
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Poll the unread badge. React Query pauses the interval automatically when
  // the tab is hidden (refetchIntervalInBackground defaults to false) and
  // dedupes across observers — unlike a raw setInterval that runs forever.
  const { data: unreadRes } = useQuery({
    queryKey: ["notifications-unread"],
    queryFn: async () =>
      (await homeAPI.getUnreadCount())?.data?.data?.count ?? 0,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });

  const { data: notifRes, isLoading } = useQuery({
    queryKey: ["notifications", { limit: 15 }],
    queryFn: async () =>
      (await homeAPI.getNotifications({ limit: 15 }))?.data?.data?.items ?? [],
    enabled: open,
    staleTime: 30_000,
  });

  const unreadCount = unreadRes ?? 0;
  const notifications = notifRes ?? [];
  const hasRead = notifications.some((n) => n.read);

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [queryClient]);

  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleMarkRead = useCallback(
    async (id) => {
      try {
        await homeAPI.markAsRead(id);
        invalidate();
      } catch {}
    },
    [invalidate],
  );

  const handleMarkAll = useCallback(async () => {
    try {
      await homeAPI.markAllRead();
      invalidate();
    } catch {}
  }, [invalidate]);

  const handleClearRead = useCallback(async () => {
    try {
      await homeAPI.clearRead();
      invalidate();
    } catch {}
  }, [invalidate]);

  const handleNotificationClick = useCallback(
    (notif) => {
      if (!notif.read) handleMarkRead(notif._id);
      if (notif.link && notif.link.startsWith("/") && !notif.link.startsWith("//")) {
        navigate(notif.link);
      }
      setOpen(false);
    },
    [navigate, handleMarkRead],
  );

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        aria-label={open ? "Close notifications" : "Open notifications"}
        aria-expanded={open}
        className="relative p-2 rounded-xl text-slate-600 hover:text-slate-800 dark:text-zinc-300 dark:hover:text-zinc-100 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
      >
        <Icon name="bell" size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-xs font-bold text-white bg-red-500 rounded-full leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-0 mx-auto top-[calc(4rem+0.5rem)] w-[calc(100%-1.5rem)] max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-[1500] animate-in fade-in zoom-in-95 duration-150 overflow-hidden md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:w-96 md:max-w-none">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-zinc-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Notifications
            </h3>
            <div className="flex items-center gap-3">
              {hasRead && (
                <button
                  onClick={handleClearRead}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:underline disabled:opacity-50"
                  title="Delete all read notifications"
                >
                  <Icon name="trash" size={12} />
                  Clear read
                </button>
              )}
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                >
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50 dark:divide-zinc-800/50">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Icon
                  name="spinner"
                  size={20}
                  className="text-slate-500 dark:text-zinc-400"
                />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-zinc-400">
                <Icon name="bell" size={32} className="mb-2 opacity-40" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50 ${
                    !notif.read ? "bg-blue-50/50 dark:bg-blue-500/5" : ""
                  }`}
                >
                  <div
                    className={`mt-0.5 shrink-0 ${TYPE_COLORS[notif.type] || "text-slate-400"}`}
                  >
                    <Icon name={TYPE_ICONS[notif.type] || "info"} size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`text-sm truncate ${
                          !notif.read
                            ? "font-semibold text-slate-900 dark:text-zinc-100"
                            : "text-slate-700 dark:text-zinc-300"
                        }`}
                      >
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-0.5">
                      {notif.message}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-zinc-400 mt-1">
                      {timeAgo(notif.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
