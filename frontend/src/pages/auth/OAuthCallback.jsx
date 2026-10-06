import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { homeAPI } from "../../api/userApi";
import { oauthAPI } from "../../api/oauthApi";
import { authAPI } from "../../api/authApi";
import { useApp } from "../../context/AppContext";
import { ConfirmModal } from "../../components/ui/UI";
import {
  GoogleLogo,
  GithubLogo,
  GoogleDriveLogo,
} from "../../components/auth/OAuthButtons";
import { Icon } from "../../components/ui/Icon";

const ERROR_MESSAGES = {
  cookies_may_have_compromised:
    "Security check failed — the request did not match. This can happen if you used the back button or the link expired. Please try again.",
  no_token_found:
    "Google did not return an authentication token. Please try again.",
  no_valid_email_found:
    "Your account does not have an email associated with it.",
  user_not_found:
    "Could not find your account. Please try again or sign in manually.",
  account_banned: "Your account has been banned. Contact support for help.",
  access_denied:
    "You denied the authorization request. No problem — you can try again whenever you want.",
  invalid_code: "GitHub rejected the authorization code. Please try again.",
  no_access_token: "GitHub did not return an access token. Please try again.",
  no_payload: "Could not fetch your GitHub profile. Please try again.",
  no_refresh_token:
    "Google did not return a refresh token. When granting access, please make sure to click 'Select all' to allow offline access.",
  email_not_verified:
    "Your account email is not verified. Please verify your email before continuing.",
  server_error: "Something went wrong during sign-in. Please try again.",
  "unable_to_create_integration:user_not_found":
    "Failed to save Google Drive integration to your account. Please try again.",
};

const PROVIDER_META = {
  github: {
    name: "GitHub",
    icon: <GithubLogo />,
    color: "bg-slate-900 text-white",
  },
  "google-drive": {
    name: "Google Drive",
    icon: <GoogleDriveLogo size={24} />,
    color: "bg-white dark:bg-zinc-800",
  },
  google: {
    name: "Google",
    icon: <GoogleLogo />,
    color: "bg-white dark:bg-zinc-800",
  },
};

const PROVIDER_CONNECT = {
  google: oauthAPI.googleConnect,
  github: oauthAPI.githubConnect,
  "google-drive": oauthAPI.googleDriveConnect,
};

const ERROR_CODES = Object.keys(ERROR_MESSAGES);

function detectProvider() {
  const path = window.location.pathname;
  if (path.includes("google-drive")) return "google-drive";
  if (path.includes("github")) return "github";
  if (path.includes("google")) return "google";
  return "google";
}

function getQueryParams() {
  return new URLSearchParams(window.location.search);
}

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { setUser, showMessage } = useApp();
  const [error, setError] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitLoading, setLimitLoading] = useState(false);

  const provider = detectProvider();
  const meta = PROVIDER_META[provider] || PROVIDER_META.google;
  const origin = sessionStorage.getItem("oauthOrigin");

  const goBack = useCallback(() => {
    sessionStorage.removeItem("oauthOrigin");
    navigate(origin && origin !== "/auth/callback" ? origin : "/signin", {
      replace: true,
    });
  }, [navigate, origin]);

  const handleRetry = useCallback(() => {
    setError(null);
    const connect = PROVIDER_CONNECT[provider];
    if (connect) connect();
  }, [provider]);

  const handleConfirmLimit = async () => {
    setLimitLoading(true);
    try {
      const res = await authAPI.completeOauthLogin({ logoutLastSession: true });
      setUser(res.data?.data?.user);
      showMessage("success", `Successfully connected with ${meta.name}!`);
      sessionStorage.removeItem("oauthOrigin");
      navigate(origin && origin !== "/auth/callback" ? origin : "/myfiles", {
        replace: true,
      });
    } catch (err) {
      showMessage(
        "error",
        err.response?.data?.message || "Failed to complete authentication",
      );
      sessionStorage.removeItem("oauthOrigin");
      navigate("/signin", { replace: true });
    } finally {
      setLimitLoading(false);
    }
  };

  useEffect(() => {
    const qs = getQueryParams();

    let errorCode = qs.get("error");
    let isSuccess = qs.get("success") === "true";

    if (!errorCode && !isSuccess) {
      for (const key of ERROR_CODES) {
        if (qs.get(key) !== null || qs.has(key)) {
          errorCode = key;
          break;
        }
      }
    }

    if (errorCode) {
      const friendly = ERROR_MESSAGES[errorCode] || errorCode;
      setError(friendly);
      showMessage("error", friendly);
      sessionStorage.removeItem("oauthOrigin");
      return;
    }

    if (isSuccess) {
      if (qs.get("twoFactor") === "required") {
        sessionStorage.removeItem("oauthOrigin");
        navigate("/signin", { state: { totpOnly: true }, replace: true });
        return;
      }

      if (qs.get("sessionLimit") === "true") {
        setShowLimitModal(true);
        return;
      }

      homeAPI
        .getUserProfile()
        .then((res) => {
          const user = res.data?.data?.user;
          if (!user?._id && !user?.id) throw new Error("Invalid session");
          setUser(user);
          showMessage("success", `Successfully connected with ${meta.name}!`);
          sessionStorage.removeItem("oauthOrigin");
          navigate(
            origin && origin !== "/auth/callback" ? origin : "/myfiles",
            { replace: true },
          );
        })
        .catch((err) => {
          const errMsg =
            err?.response?.data?.message || "Failed to complete authentication";
          setError(errMsg);
          showMessage("error", errMsg);
        });
      return;
    }

    showMessage("error", "Unexpected response from authentication server.");
    setError("Unexpected response from authentication server.");
    sessionStorage.removeItem("oauthOrigin");
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 dark:bg-zinc-950 select-none">
      <div className="w-full max-w-md bg-white/95 dark:bg-zinc-900/95 border border-slate-200/90 dark:border-zinc-800 rounded-xl p-8 text-center shadow-xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
        <div className="relative inline-flex mb-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-xs border border-slate-200/60 dark:border-zinc-800 ${meta.color}`}
          >
            {meta.icon}
          </div>
          {!error && (
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-xs">
              <Icon name="spinner" size={12} className="animate-spin" />
            </div>
          )}
        </div>

        <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-zinc-100 mb-1">
          {error ? "Authentication Failed" : `Connecting ${meta.name}…`}
        </h1>
        <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
          {error ? error : "Finalizing your secure session details..."}
        </p>

        {error && (
          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={handleRetry}
              className="w-full py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={goBack}
              className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 text-sm font-medium transition-colors"
            >
              Go Back
            </button>
          </div>
        )}

        <ConfirmModal
          isOpen={showLimitModal}
          onClose={() => {
            setShowLimitModal(false);
            sessionStorage.removeItem("oauthOrigin");
            navigate("/signin", { replace: true });
          }}
          onConfirm={handleConfirmLimit}
          title="Session Limit Reached"
          message="You've reached the max active sessions. Logout the oldest session and continue?"
          confirmLabel="Continue"
          variant="primary"
          loading={limitLoading}
        />
      </div>
    </div>
  );
}
