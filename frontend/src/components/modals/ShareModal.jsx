import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fileAPI } from "../../api/fileApi";
import { directoryAPI } from "../../api/directoryApi";
import { ModalOverlay, ModalHeader, ModalFooter, Btn, Input } from "../ui/UI";
import { OptionSelect } from "../ui/OptionSelect";
import { Icon } from "../ui/Icon";
import { useApp } from "../../context/AppContext";
import { formatDate, formatSize } from "../../utils/fileUtils";

const ROLE_OPTIONS = [
  { value: "view", label: "Viewer" },
  { value: "edit", label: "Editor" },
];

const EXPIRY_PRESETS = [
  { value: "", label: "No expiry", ms: 0 },
  { value: "1h", label: "1 hour", ms: 3600_000 },
  { value: "24h", label: "1 day", ms: 86_400_000 },
  { value: "168h", label: "7 days", ms: 604_800_000 },
  { value: "720h", label: "30 days", ms: 2_592_000_000 },
  { value: "custom", label: "Custom date & time", ms: null },
];

const toLocalInputValue = (dateStr) => {
  const d = new Date(dateStr);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const presetFor = (expiresAt) => {
  if (!expiresAt) return "";
  const msLeft = new Date(expiresAt).getTime() - Date.now();
  const matched = EXPIRY_PRESETS.filter((p) => p.ms && msLeft >= p.ms);
  if (matched.length === 0) return "custom";
  const best = matched[matched.length - 1];
  const tol = Math.max(5 * 60 * 1000, best.ms * 0.05);
  return Math.abs(msLeft - best.ms) <= tol ? best.value : "custom";
};

export function ShareModal({ item, isOpen, onClose, onChanged }) {
  const queryClient = useQueryClient();
  const { showMessage, user } = useApp();
  const isDir = item?.type === "directory";
  const api = isDir ? directoryAPI : fileAPI;

  const refreshRelated = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["shareInfo", item?.id] });
    queryClient.invalidateQueries({ queryKey: ["shared"] });
    queryClient.invalidateQueries({ queryKey: ["itemInfo", item?.id, isDir] });
    queryClient.invalidateQueries({ queryKey: ["directoryInfo", item?.id] });
    queryClient.invalidateQueries({ queryKey: ["dirChildren", item?.id] });
    onChanged?.(item);
  }, [queryClient, item, onChanged]);

  const [emailInput, setEmailInput] = useState("");
  const [roleInput, setRoleInput] = useState("view");
  const [sharing, setSharing] = useState(false);
  const [revoking, setRevoking] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(null);
  const [expiryOption, setExpiryOption] = useState("");
  const [customDate, setCustomDate] = useState("");
  const [updatingExpiry, setUpdatingExpiry] = useState(false);
  const [activeTab, setActiveTab] = useState("people");

  const { data: shareInfo, isLoading: infoLoading } = useQuery({
    queryKey: ["shareInfo", item?.id, isDir],
    queryFn: async () => {
      if (!item?.id) return null;
      const res = await api.getShareInfo(item.id, { public: 1, limit: 100 });
      return res.data?.data;
    },
    enabled: isOpen && !!item?.id,
    staleTime: 30_000,
  });

  const permissions = shareInfo?.permissions || [];
  const publicPerm = shareInfo?.publicPermission || {};
  const isPublic = publicPerm?.permission && publicPerm.permission !== "none";
  const isExpired = Boolean(
    publicPerm?.expiresAt &&
      new Date(publicPerm.expiresAt).getTime() <= Date.now(),
  );

  useEffect(() => {
    if (isOpen) {
      setEmailInput("");
      setRoleInput("view");
      setExpiryOption("");
      setCustomDate("");
      setActiveTab("people");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && shareInfo && publicPerm.expiresAt) {
      const preset = presetFor(publicPerm.expiresAt);
      setExpiryOption(preset);
      if (preset === "custom") setCustomDate(toLocalInputValue(publicPerm.expiresAt));
    }
  }, [isOpen, shareInfo, publicPerm.expiresAt]);

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const resolveExpiryMs = (option = expiryOption, date = customDate) => {
    const preset = EXPIRY_PRESETS.find((p) => p.value === option);
    if (!preset || preset.ms === 0) return undefined;
    if (preset.ms) return preset.ms;
    if (!date) return null;
    const ms = new Date(date).getTime() - Date.now();
    return ms > 0 ? ms : null;
  };

  const handleInvite = useCallback(async () => {
    const emails = emailInput
      .split(/[,;\s]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (emails.length === 0) {
      showMessage("error", "Enter at least one email address.");
      return;
    }

    const invalid = emails.filter((e) => !isValidEmail(e));
    if (invalid.length > 0) {
      showMessage("error", `Invalid email(s): ${invalid.join(", ")}`);
      return;
    }

    setSharing(true);
    try {
      await api.share(item.id, {
        emailsWithRole: emails.map((email) => ({ email, role: roleInput })),
        notify: true,
      });
      showMessage("success", "Shared successfully");
      setEmailInput("");
      refreshRelated();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to share.";
      showMessage("error", msg);
    } finally {
      setSharing(false);
    }
  }, [emailInput, roleInput, api, refreshRelated, showMessage]);

  const handleRevoke = useCallback(
    async (email) => {
      setRevoking(email);
      try {
        await api.revokeAccess(item.id, { emails: [email], notify: false });
        showMessage("success", `Access revoked for ${email}`);
        refreshRelated();
      } catch (err) {
        showMessage("error", "Failed to revoke access.");
      } finally {
        setRevoking(null);
      }
    },
    [api, refreshRelated, showMessage],
  );

  const handleRoleChange = useCallback(
    async (perm, newRole) => {
      if (perm.permission === newRole) return;
      const email = perm.userId?.email;
      if (!email) return;
      setUpdatingRole(email);
      try {
        await api.revokeAccess(item.id, { emails: [email], notify: false });
        await api.share(item.id, {
          emailsWithRole: [{ email, role: newRole }],
          notify: false,
        });
        showMessage(
          "success",
          `${email} changed to ${newRole === "edit" ? "Editor" : "Viewer"}`,
        );
        refreshRelated();
      } catch (err) {
        showMessage("error", "Failed to update access level.");
        refreshRelated();
      } finally {
        setUpdatingRole(null);
      }
    },
    [api, refreshRelated, showMessage],
  );

  const handleTogglePublic = useCallback(async () => {
    if (!isPublic) {
      const ms = resolveExpiryMs();
      if (ms === null) {
        showMessage("error", "Set a valid expiry date in the future.");
        return;
      }

      const limits = user?.limits || {};
      const perFileCap = limits.maxPublicShareFileBytes;
      if (Number.isFinite(perFileCap) && (item?.size || 0) > perFileCap) {
        showMessage(
          "error",
          `This ${isDir ? "folder" : "file"} exceeds the ${(
            perFileCap / 1e6
          ).toFixed(0)} MB per-file public link limit on your plan. Please upgrade to share larger items publicly.`,
        );
        return;
      }
    }
    setSharing(true);
    try {
      if (isPublic) {
        await api.revokeAccess(item.id, { publicRole: "none", notify: false });
        showMessage("success", "Public link disabled");
      } else {
        const ms = resolveExpiryMs();
        const body = { publicRole: "view" };
        if (ms !== undefined) body.expiresIn = ms;
        await api.share(item.id, body);
        showMessage(
          "success",
          ms
            ? "Public link created with expiry"
            : "Public link created",
        );
      }
      refreshRelated();
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Failed to update public link.";
      showMessage("error", msg);
    } finally {
      setSharing(false);
    }
  }, [isPublic, api, refreshRelated, showMessage, expiryOption, customDate, user, item, isDir]);

  const handleUpdateExpiry = useCallback(
    async (option, date) => {
      const ms = resolveExpiryMs(option, date);
      if (ms === null) {
        showMessage("error", "Set a valid expiry date in the future.");
        return;
      }
      setUpdatingExpiry(true);
      try {
        await api.share(item.id, {
          publicRole: "view",
          expiresIn: ms === undefined ? null : ms,
        });
        showMessage(
          "success",
          ms === undefined
            ? "Public link expiry removed"
            : "Public link expiry updated",
        );
        refreshRelated();
      } catch (err) {
        const msg =
          err?.response?.data?.message || "Failed to update link expiry.";
        showMessage("error", msg);
      } finally {
        setUpdatingExpiry(false);
      }
    },
    [api, refreshRelated, showMessage],
  );

  const handleExpiryChange = (value) => {
    setExpiryOption(value);
  };

  const handleCopyLink = useCallback(() => {
    const shareToken = publicPerm?.token;
    if (!shareToken) return;
    const link = `${window.location.origin}/share/${shareToken}`;
    navigator.clipboard?.writeText(link).then(
      () => showMessage("success", "Link copied to clipboard"),
      () => showMessage("error", "Failed to copy link"),
    );
  }, [publicPerm, showMessage]);

  if (!isOpen || !item) return null;

  return (
    <ModalOverlay onClose={onClose} maxWidth="max-w-lg">
      <ModalHeader
        title={`Share "${item.name}"`}
        sub="Invite collaborators or generate a shareable link"
        onClose={onClose}
      />

      {/* Tab switcher */}
      <div className="flex items-center gap-1 bg-slate-100 dark:bg-zinc-800/80 p-1 rounded-2xl mb-5">
        <button
          type="button"
          onClick={() => setActiveTab("people")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-[color,background-color,border-color] cursor-pointer ${
            activeTab === "people"
              ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"
          }`}
        >
          <Icon name="users" size={16} />
          People
          {permissions.length > 0 && (
            <span
              className={`text-xs font-extrabold px-1.5 py-0.5 rounded-full leading-none ${
                activeTab === "people"
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                  : "bg-slate-200/70 text-slate-500 dark:bg-zinc-700 dark:text-zinc-300"
              }`}
            >
              {permissions.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("public")}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-bold transition-[color,background-color,border-color] cursor-pointer ${
            activeTab === "public"
              ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-500 dark:text-zinc-400 hover:text-slate-700 dark:hover:text-zinc-200"
          }`}
        >
          <Icon name="link" size={16} />
          Public
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isPublic && !isExpired
                ? "bg-emerald-500"
                : isPublic
                  ? "bg-rose-500"
                  : "bg-slate-300 dark:bg-zinc-600"
            }`}
          />
        </button>
      </div>

      {activeTab === "people" ? (
        <>
      {/* Share with People */}
      <div className="mb-5">
        <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider mb-2.5">
          Share with People
        </h4>

        <div className="flex gap-2 items-center">
          <div className="flex-1">
            <Input
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter email address..."
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
            />
          </div>
          <OptionSelect
            label="Role"
            value={roleInput}
            options={ROLE_OPTIONS}
            onChange={setRoleInput}
            className="shrink-0"
            buttonClassName="h-[42px]"
          />
          <Btn
            variant="primary"
            onClick={handleInvite}
            disabled={sharing || !emailInput.trim()}
            className="shrink-0"
          >
            {sharing ? "..." : "Invite"}
          </Btn>
        </div>
      </div>

      {/* People with access */}
      {infoLoading ? (
        <div className="text-xs text-slate-400 dark:text-zinc-400 py-3 flex items-center gap-2">
          <Icon
            name="spinner"
            size={14}
            className="animate-spin text-blue-500"
          />
          <span>Loading permission list...</span>
        </div>
      ) : permissions.length > 0 ? (
        <div className="mb-5 max-h-[190px] overflow-y-auto no-scrollbar">
          <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-400 uppercase tracking-wider mb-2">
            People with access ({permissions.length})
          </h4>
          <div className="space-y-2">
            {permissions.map((perm) => {
              const name = perm.userId?.name || "Unknown";
              const initials = name
                .split(" ")
                .map((w) => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              const isUpdating = updatingRole === perm.userId?.email;
              const isRevoking = revoking === perm.userId?.email;
              return (
                <div
                  key={perm.id}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0 shadow-xs">
                    <span className="text-xs font-bold text-white leading-none">
                      {initials}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-zinc-200 truncate">
                      {name}
                    </p>
                    {perm.userId?.email && (
                      <p className="text-xs text-slate-400 truncate">
                        {perm.userId.email}
                      </p>
                    )}
                  </div>
                  <div className="relative shrink-0">
                    <select
                      value={perm.permission}
                      onChange={(e) => handleRoleChange(perm, e.target.value)}
                      disabled={isUpdating || isRevoking}
                      className="text-xs font-semibold rounded-xl border border-slate-200/80 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 px-2 py-1 pr-6 appearance-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500/30 disabled:opacity-50 transition-colors shadow-2xs"
                    >
                      <option value="view">Can view</option>
                      <option value="edit">Can edit</option>
                    </select>
                    <Icon
                      name="chevronDown"
                      size={10}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
                    />
                  </div>
                  <button
                    onClick={() => handleRevoke(perm.userId?.email)}
                    disabled={isUpdating || isRevoking}
                    aria-label={`Remove ${name}`}
                    className="shrink-0 p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                    title={`Remove ${name}`}
                  >
                    {isRevoking ? (
                      <Icon
                        name="loader"
                        size={14}
                        className="animate-spin text-rose-500"
                      />
                    ) : (
                      <Icon name="x" size={14} />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400 dark:text-zinc-400 mb-5">
          No external collaborators added yet. Enter an email above to share.
        </p>
      )}

        </>
      ) : (
        <>
      {/* Public Link Card */}
      <div
        className={`rounded-2xl p-4 border transition-colors ${
          isPublic
            ? "bg-blue-50/60 dark:bg-blue-500/[0.06] border-blue-200/80 dark:border-blue-500/20"
            : "bg-slate-50/70 dark:bg-zinc-800/30 border-slate-200/80 dark:border-zinc-800"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex lg:flex-col items-center gap-2">
            <h4 className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Public Link Sharing
            </h4>
            {isPublic && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                  isExpired
                    ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/25"
                    : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25"
                }`}
              >
                {isExpired ? "Expired" : "Active"}
              </span>
            )}
          </div>
          <div className="flex lg:flex-col items-center gap-2">
            {isPublic && publicPerm.token && !isExpired && (
              <Btn
                variant="ghost"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold"
              >
                <Icon name="link" size={14} />
                Copy Link
              </Btn>
            )}
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={handleTogglePublic}
                disabled={sharing}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 dark:bg-zinc-700 rounded-full peer peer-checked:bg-blue-600 peer-disabled:opacity-50 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-transform peer-checked:after:translate-x-4 shadow-2xs" />
            </label>
          </div>
        </div>

        {isExpired ? (
          <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200/80 dark:border-rose-500/25">
            <Icon
              name="alertTriangle"
              size={16}
              className="shrink-0 text-rose-500 mt-0.5"
            />
            <p className="text-xs font-medium text-rose-700 dark:text-rose-300">
              This link expired on {formatDate(publicPerm.expiresAt)}. Choose a
              new expiry below and press{" "}
              <span className="font-bold">Reactivate Link</span> to bring it
              back, or toggle the switch off to disable sharing.
            </p>
          </div>
        ) : isPublic && publicPerm.token ? (
          <>
            <div className="flex gap-2">
              <div className="flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-zinc-900 text-xs text-slate-600 dark:text-zinc-300 truncate border border-slate-200/90 dark:border-zinc-700/80 shadow-2xs">
                <Icon
                  name="link"
                  size={14}
                  className="shrink-0 text-blue-500"
                />
                <span className="truncate font-mono">
                  {window.location.origin}/share/{publicPerm.token}
                </span>
              </div>
              <Btn
                variant="ghost"
                onClick={handleCopyLink}
                title="Copy link"
                className="shrink-0 bg-white dark:bg-zinc-900"
              >
                <Icon name="copy" size={16} />
              </Btn>
            </div>
            <div className="flex gap-3 mt-2.5 text-xs text-slate-500 dark:text-zinc-400">
              {publicPerm.expiresAt ? (
                <span className="flex items-center gap-1 font-medium">
                  <Icon name="clock" size={12} className="text-blue-500" />
                  Expires {formatDate(publicPerm.expiresAt)}
                </span>
              ) : (
                <span className="flex items-center gap-1 font-medium">
                  <Icon name="clock" size={12} className="text-blue-500" />
                  No expiry
                </span>
              )}
              <span className="font-medium">
                Anyone with the link can {publicPerm.permission}
              </span>
            </div>
          </>
        ) : (
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Enable public access to generate a viewable share link for this{" "}
            {isDir ? "folder" : "file"}.
          </p>
        )}

        {(() => {
          const limits = user?.limits || {};
          const perFileCap = limits.maxPublicShareFileBytes;
          const totalCap = limits.maxPublicShareBytes;
          if (!Number.isFinite(perFileCap)) return null;
          return (
            <p className="mt-3 flex items-start gap-2 px-3.5 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/70 dark:border-amber-500/20">
              <Icon
                name="info"
                size={14}
                className="shrink-0 text-amber-500 mt-0.5"
              />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                FREE public links are capped at{" "}
                {formatSize(totalCap)} total and {formatSize(perFileCap)} per{" "}
                {isDir ? "folder" : "file"}.
              </span>
            </p>
          );
        })()}

        {/* Link expiry selector */}
        <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-zinc-800/80">
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Link expiry
            </label>
            {updatingExpiry && (
              <span className="text-xs font-semibold text-blue-500">
                Updating...
              </span>
            )}
          </div>
          <OptionSelect
            label="Expiry"
            value={expiryOption}
            options={EXPIRY_PRESETS}
            onChange={handleExpiryChange}
            disabled={sharing || updatingExpiry}
            fullWidth
            buttonClassName="h-[42px]"
          />

          {expiryOption === "custom" && (
            <div className="mt-2">
              <input
                type="datetime-local"
                value={customDate}
                min={toLocalInputValue(Date.now())}
                onChange={(e) => setCustomDate(e.target.value)}
                disabled={sharing || updatingExpiry}
                className="w-full h-[42px] rounded-xl border border-slate-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-slate-700 dark:text-zinc-300 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-2xs disabled:opacity-50"
              />
            </div>
          )}

          {isPublic && (
            <Btn
              variant={isExpired ? "danger" : "info"}
              onClick={() => handleUpdateExpiry(expiryOption, customDate)}
              disabled={updatingExpiry || sharing}
              className="w-full mt-3"
            >
              {updatingExpiry ? (
                "Updating..."
              ) : isExpired ? (
                <>
                  <Icon name="refresh" size={14} />
                  Reactivate Link
                </>
              ) : (
                "Change Expiry"
              )}
            </Btn>
          )}

          <p className="mt-2 text-xs text-slate-400 dark:text-zinc-500">
            {isPublic
              ? expiryOption === "custom"
                ? "Set a custom date & time, then press the button to apply."
                : expiryOption === ""
                  ? "Choosing “No expiry” removes the link expiry. The button updates the link."
                  : "The link will auto-disable at the chosen time."
              : "Expiry applies when you enable the public link."}
          </p>
        </div>
      </div>

        </>
      )}

      <ModalFooter>
        <Btn variant="ghost" onClick={onClose}>
          Done
        </Btn>
      </ModalFooter>
    </ModalOverlay>
  );
}
