import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useApp } from "../../context/AppContext";
import { Icon } from "../../components/ui/Icon";
import SafeImage from "../../components/ui/SafeImage";
import { Btn, SectionCard, ConfirmModal } from "../../components/ui/UI";
import { PageBanner } from "../../components/ui/PageBanner";
import TwoFactorModal from "../../components/modals/TwoFactorModal";
import { AvatarModal } from "../../components/modals/AvatarModal";
import { homeAPI } from "../../api/userApi";
import { authAPI } from "../../api/authApi";
import { useOtpContext } from "../../context/OtpContext";
import { oauthAPI } from "../../api/oauthApi";
import { GoogleLogo, GithubLogo, GoogleDriveLogo } from "../../components/auth/OAuthButtons";
import { useNavigate } from "react-router-dom";
import { formatDate, formatSize, getInitials } from "../../utils/fileUtils";

function parseUserAgent (ua) {
  if (!ua || ua === "unknown") {
    return { browser: "Unknown Browser", os: "Unknown OS", icon: "desktop", deviceName: "Desktop" };
  }

  let browser = "Unknown Browser";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("OPR/") || ua.includes("Opera")) browser = "Opera";
  else if (ua.includes("Chrome") && !ua.includes("Edg/")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";

  let os = "Unknown OS";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac OS X") || ua.includes("Macintosh")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  let icon = "desktop";
  let deviceName = "Desktop";
  const lower = ua.toLowerCase();

  if (lower.includes("ipad") || lower.includes("tablet") || (lower.includes("android") && !lower.includes("mobile"))) {
    icon = "tablet";
    deviceName = "Tablet";
  } else if (lower.includes("iphone") || (lower.includes("android") && lower.includes("mobile")) || lower.includes("mobile")) {
    icon = "mobile";
    deviceName = "Smartphone";
  } else if (lower.includes("macbook") || lower.includes("laptop") || lower.includes("chromebook")) {
    icon = "laptop";
    deviceName = "Laptop";
  } else {
    icon = "desktop";
    deviceName = os !== "Unknown OS" ? `${os} Desktop` : "Desktop";
  }

  return { browser, os, icon, deviceName };
}

export default function Settings () {
  const { user, refreshUser, showMessage, logout } = useApp();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [show2FA, setShow2FA] = useState(false);
  const [showAvatar, setShowAvatar] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeAll, setRevokeAll] = useState(false);
  const [isRevokingDrive, setIsRevokingDrive] = useState(false);

  const sessionsQuery = useQuery({
    queryKey: ["activeSessions"],
    queryFn: async () => {
      const { data } = await homeAPI.getActiveSessions();
      return data?.data?.sessions || [];
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId) => homeAPI.revokeSession(sessionId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
      if (res?.data?.data?.isCurrentSession) {
        logout();
        navigate("/signin");
      } else {
        showMessage("success", "Session revoked successfully");
      }
    },
    onError: () => showMessage("error", "Failed to revoke session"),
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => homeAPI.logoutAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activeSessions"] });
      logout();
      navigate("/signin");
    },
    onError: () => showMessage("error", "Failed to logout all sessions"),
  });

  const [name, setName] = useState(user?.name || "");
  const nameInputRef = useRef(null);
  const updateNameMutation = useMutation({
    mutationFn: () => homeAPI.updateName({ name: name.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      refreshUser?.();
      showMessage("success", "Display name updated");
    },
    onError: () => showMessage("error", "Failed to update display name"),
  });

  const { sendOtp } = useOtpContext();
  const [resettingPw, setResettingPw] = useState(false);

  const handlePasswordChange = async () => {
    if (resettingPw) return;
    setResettingPw(true);
    try {
      await authAPI.forgotPasswordInit({ email: user?.email });
      const otpError = await sendOtp({
        email: user?.email,
        purpose: "forgot-password",
      });
      if (otpError) return;
      navigate("/verify-otp", {
        state: {
          email: user?.email,
          purpose: "forgot-password",
          from: "/settings",
        },
      });
    } catch (err) {
      showMessage("error", err.response?.data?.message || "Failed to start password reset");
    } finally {
      setResettingPw(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: () => homeAPI.deleteProfile(),
    onSuccess: () => {
      showMessage("success", "Account deleted");
      logout();
      navigate("/signin");
    },
    onError: () => showMessage("error", "Failed to delete account"),
  });

  const inputClass =
    "w-full px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-900 text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-zinc-900 transition-all shadow-2xs";

  return (
    <div className="p-0.5 sm:p-2 max-w-5xl mx-auto space-y-6 select-none pb-20 sm:pb-0">

      <PageBanner
        accent="blue"
        iconNode={
          <div
            className="relative group shrink-0 cursor-pointer"
            onClick={() => setShowAvatar(true)}
          >
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 ring-2 ring-blue-200 dark:ring-blue-900/60 flex items-center justify-center text-white text-lg font-black overflow-hidden shadow-md shadow-blue-500/20 border-2 border-white dark:border-zinc-800">
              <SafeImage
                src={user?.avatarUrl}
                alt={user?.name}
                className="w-full h-full object-cover"
                fallback={getInitials(user?.name)}
              />
            </div>
            {/* <div className="absolute inset-0 bg-black/60 backdrop-blur-xs rounded-xl flex flex-col items-center justify-center gap-0.5 text-white opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer z-20">
              <Icon
                name="camera"
                size={14}
                className="scale-90 group-hover:scale-100 transition-transform duration-200"
              />
              <span className="text-xs font-extrabold tracking-wider uppercase">
                Edit
              </span>
            </div> */}
            <div className="absolute -bottom-1 -right-1 z-30 w-5 h-5 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Icon name="edit" size={11} />
            </div>
          </div>
        }
        title={
          <span className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1.5 min-w-0">
              <span className="truncate">{user?.name}</span>
              <button
                type="button"
                title="Edit name"
                onClick={() => {
                  nameInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                  nameInputRef.current?.focus();
                }}
                className="shrink-0 p-1 rounded-lg text-slate-400 dark:text-zinc-500 hover:text-blue-500 hover:bg-blue-500/10 transition-colors cursor-pointer"
              >
                <Icon name="edit" size={13} />
              </button>
            </span>
            
          </span>
        }
        subtitle={
          <span className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono">{user?.email}</span>
            <span className="font-mono">-</span>
            {/* <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/80 dark:bg-white/10 text-slate-700 dark:text-white border border-slate-200/80 dark:border-white/15 backdrop-blur-md shrink-0">
              {userPlanLabel} User
            </span> */}
            <span className="text-slate-500 dark:text-zinc-400">Member since {formatDate(user?.createdAt)}</span>
          </span>
        }
      />

      <AvatarModal isOpen={showAvatar} onClose={() => setShowAvatar(false)} />

      {/* ─── Profile Information ─── */}
      <SectionCard className="bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Icon name="user" size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Personal Information</h2>
              <p className="text-xs font-semibold text-slate-400">Update your account display details and avatar picture</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
              Display Name
            </label>
            <div className="flex items-center gap-3">
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Enter your name"
              />
              <Btn
                variant="primary"
                size="sm"
                onClick={() => updateNameMutation.mutate()}
                disabled={!name.trim() || name.trim() === user?.name || updateNameMutation.isPending}
                className="shadow-xs active:scale-95 shrink-0 font-extrabold cursor-pointer"
              >
                {updateNameMutation.isPending ? "Saving..." : "Save Name"}
              </Btn>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-widest mb-1.5">
              Email Address
            </label>
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800">
              <span className="text-xs sm:text-sm font-bold font-mono text-slate-800 dark:text-zinc-200">{user?.email}</span>
              {user?.isEmailVerified ? (
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  <Icon name="checkCircle" size={10} /> Verified
                </span>
              ) : (
                <span className="text-xs font-bold text-amber-500 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  Unverified
                </span>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ─── Security & Authentication ─── */}
      <SectionCard className="bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Icon name="shield" size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Security & Authentication</h2>
              <p className="text-xs font-semibold text-slate-400">Configure Two-Factor Authentication (2FA) and update your password</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100">Two-Factor Authentication (2FA)</p>
              <span className={`px-2 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider border ${user?.isTwoFactorEnabled
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                : "bg-slate-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400 border-slate-300 dark:border-zinc-600"
                }`}>
                {user?.isTwoFactorEnabled ? "Active" : "Disabled"}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">Require an authenticator code when signing into your account</p>
          </div>
          <Btn variant="ghost" size="sm" onClick={() => setShow2FA(true)} className="font-extrabold cursor-pointer border border-gray-300 hover:border-gray-800 dark:hover:border-slate-200">
            {user?.isTwoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
          </Btn>
        </div>

        {show2FA && (
          <TwoFactorModal
            mode={user?.isTwoFactorEnabled ? "disable" : "enable"}
            onClose={() => {
              setShow2FA(false);
              refreshUser();
            }}
          />
        )}

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-zinc-100 mb-1">Change Account Password</p>
              <p className="text-xs font-semibold text-slate-400">
                We'll email you a verification code to reset your password
              </p>
            </div>
            <Btn
              variant="primary"
              size="sm"
              onClick={handlePasswordChange}
              disabled={resettingPw}
              className="mt-2 shadow-xs active:scale-95 font-extrabold cursor-pointer shrink-0"
            >
              {resettingPw ? "Sending..." : "Reset Password"}
            </Btn>
          </div>
        </div>
      </SectionCard>

      {/* ─── Active Devices & Sessions ─── */}
      <SectionCard className="bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800">
        <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Icon name="desktop" size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Active Devices & Sessions</h2>
              <p className="text-xs font-semibold text-slate-400">View logged-in devices and revoke unrecognized sessions</p>
            </div>
          </div>
          {sessionsQuery.data && sessionsQuery.data.length > 1 && (
            <Btn
              variant="danger"
              size="sm"
              onClick={() => setRevokeAll(true)}
              className="font-extrabold active:scale-95 cursor-pointer shrink-0"
            >
              Logout All Other Devices
            </Btn>
          )}
        </div>

        {sessionsQuery.isLoading && (
          <div className="flex items-center justify-center py-8">
            <Icon name="spinner" size={20} className="animate-spin text-blue-500" />
          </div>
        )}

        {sessionsQuery.data && (
          <div className="space-y-3">
            {sessionsQuery.data.map((session) => {
              const { browser, os, icon, deviceName } = parseUserAgent(session.userAgent);
              return (
                <div
                  key={session.id}
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800 transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center shrink-0 shadow-2xs">
                    <Icon name={icon} size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100">
                        {browser} on {os}
                      </p>
                      {session.isCurrent && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 rounded-full border border-emerald-500/30">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          This Device
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-400 font-mono mt-0.5">
                      {deviceName} · {session.isCurrent ? "Active now" : session.createdAt ? `Logged in ${new Date(session.createdAt).toLocaleDateString()}` : "Active session"}
                    </p>
                  </div>
                  {!session.isCurrent && (
                    <Btn
                      variant="ghost"
                      size="sm"
                      onClick={() => setRevokeTarget(session.id)}
                      className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 cursor-pointer"
                    >
                      Revoke Access
                    </Btn>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <ConfirmModal
          isOpen={!!revokeTarget}
          onClose={() => setRevokeTarget(null)}
          onConfirm={() => {
            const target = revokeTarget;
            setRevokeTarget(null);
            revokeMutation.mutate(target);
          }}
          title="Revoke Session"
          message="Are you sure? This device will be immediately signed out of your account."
          confirmLabel="Revoke Session"
          variant="danger"
          loading={revokeMutation.isPending}
        />

        <ConfirmModal
          isOpen={revokeAll}
          onClose={() => setRevokeAll(false)}
          onConfirm={() => {
            setRevokeAll(false);
            revokeAllMutation.mutate();
          }}
          title="Logout All Devices"
          message="This will sign you out from all active sessions across all devices."
          confirmLabel="Logout All Devices"
          variant="danger"
          loading={revokeAllMutation.isPending}
        />
      </SectionCard>

      {/* ─── Connected Accounts & OAuth ─── */}
      <SectionCard className="bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800">
        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100 dark:border-zinc-800">
          <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Icon name="globe" size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100">Connected Accounts & OAuth Integrations</h2>
            <p className="text-xs font-semibold text-slate-400">Manage third-party login providers and storage sync options</p>
          </div>
        </div>

        <div className="space-y-3">
          {(() => {
            const isGoogleConnected = Boolean(
              user?.googleId ||
              user?.authProviders?.includes("google") ||
              user?.provider === "google"
            );
            return (
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <GoogleLogo />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100">Google Account</p>
                    {isGoogleConnected ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 rounded-full border border-emerald-500/30">
                        <Icon name="checkCircle" size={10} /> Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold text-slate-400 dark:text-zinc-500 bg-slate-200 dark:bg-zinc-700 rounded-full">
                        Not connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    {isGoogleConnected ? "Google account linked for single sign-on" : "Connect Google account for one-click authentication"}
                  </p>
                </div>
                {isGoogleConnected ? (
                  <span className="text-xs font-bold text-slate-400 px-3 py-1">Active</span>
                ) : (
                  <Btn variant="primary" size="sm" onClick={() => oauthAPI.googleConnect()} className="font-extrabold shadow-2xs active:scale-95 cursor-pointer">
                    Link Google
                  </Btn>
                )}
              </div>
            );
          })()}

          {(() => {
            const isGithubConnected = Boolean(
              user?.githubId ||
              user?.integrations?.includes("github") ||
              user?.authProviders?.includes("github") ||
              user?.provider === "github"
            );
            return (
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-2xs border border-slate-800">
                  <GithubLogo />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100">GitHub Account</p>
                    {isGithubConnected ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 rounded-full border border-emerald-500/30">
                        <Icon name="checkCircle" size={10} /> Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold text-slate-400 dark:text-zinc-500 bg-slate-200 dark:bg-zinc-700 rounded-full">
                        Not connected
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    {isGithubConnected ? "GitHub account linked for sign-in" : "Connect GitHub for developer authentication"}
                  </p>
                </div>
                {isGithubConnected ? (
                  <span className="text-xs font-bold text-slate-400 px-3 py-1">Active</span>
                ) : (
                  <Btn variant="secondary" size="sm" onClick={() => oauthAPI.githubConnect()} className="font-extrabold shadow-2xs active:scale-95 cursor-pointer">
                    Link GitHub
                  </Btn>
                )}
              </div>
            );
          })()}

          {(() => {
            const isDriveConnected = Boolean(
              user?.isDriveConnected ||
              user?.integrations
                ?.split("&")
                ?.includes("googleDrive")
            );
            return (
              <div className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700 flex items-center justify-center shrink-0 shadow-2xs">
                  <GoogleDriveLogo size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-zinc-100">Google Drive Storage Import</p>
                    {isDriveConnected && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 rounded-full border border-emerald-500/30">
                        <Icon name="checkCircle" size={10} /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-400 mt-0.5">
                    Import files and sync directly from your external Google Drive storage
                  </p>
                </div>
                {isDriveConnected ? (
                  <Btn
                    variant="danger"
                    size="sm"
                    disabled={isRevokingDrive}
                    onClick={async () => {
                      if (isRevokingDrive) return;
                      setIsRevokingDrive(true);
                      try {
                        await homeAPI.revokeDriveIntegration();
                        await refreshUser?.();
                        showMessage("success", "Google Drive integration disconnected");
                      } catch {
                        showMessage("error", "Failed to disconnect Google Drive");
                      } finally {
                        setIsRevokingDrive(false);
                      }
                    }}
                    className="font-extrabold active:scale-95 cursor-pointer"
                  >
                    {isRevokingDrive ? "Disconnecting..." : "Disconnect"}
                  </Btn>
                ) : (
                  <Btn
                    variant="secondary"
                    size="sm"
                    onClick={() => oauthAPI.googleDriveConnect()}
                    className="font-extrabold active:scale-95 cursor-pointer text-blue-600 dark:text-blue-400"
                  >
                    Connect Drive
                  </Btn>
                )}
              </div>
            );
          })()}
        </div>
      </SectionCard>

      {/* ─── Danger Zone ─── */}
      <SectionCard className="border-rose-200/80 dark:border-rose-500/25 bg-rose-50/40 dark:bg-rose-500/5">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="alertTriangle" size={18} className="text-rose-500" />
          <h2 className="text-sm font-bold text-rose-600 dark:text-rose-400">Danger Zone</h2>
        </div>
        <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-zinc-400 mb-4 max-w-xl">
          Permanently delete your user profile and files. This action is irreversible.
        </p>
        <Btn variant="danger" size="sm" onClick={() => setConfirmDelete(true)} className="font-extrabold shadow-xs active:scale-95 cursor-pointer">
          <Icon name="trash" size={14} />
          Delete My Account
        </Btn>

        <ConfirmModal
          isOpen={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          onConfirm={() => deleteMutation.mutate()}
          title="Delete Account"
          message="This will permanently delete your profile and files. This action cannot be undone."
          confirmLabel="Delete Account"
          variant="danger"
        />
      </SectionCard>
    </div>
  );
}
