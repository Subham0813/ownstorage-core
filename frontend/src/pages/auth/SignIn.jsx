import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useOtpContext } from "../../context/OtpContext";
import { useSignInForm } from "../../hooks/useSignInForm";
import OAuthButtons from "../../components/auth/OAuthButtons";
import { Icon } from "../../components/ui/Icon";
import OTPBoxes from "../../components/auth/OTPBoxes";
import { formatTimer } from "../../utils/formatHelpers";
import { authAPI } from "../../api/authApi";
import {
  Btn,
  Input,
  Label,
  ModalOverlay,
  ModalHeader,
  ConfirmModal,
} from "../../components/ui/UI";

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, setLoading, setUser, showMessage } = useApp();
  const {
    form,
    setForm,
    emailValid,
    passwordValid,
    submitCredentials,
    showSessionModal,
    setShowSessionModal,
    handleCancelSession,
  } = useSignInForm();
  const { otp, otpTimer, verifyOtp, sendOtp, otpSent, setOtpSent, setOtp } =
    useOtpContext();
  const [ec, setEc] = useState(0);
  const [showMaxSessionModal, setShowMaxSessionModal] = useState(false);
  const [totpRequired, setTotpRequired] = useState(
    location.state?.totpOnly === true,
  );

  // Clear OTP state on mount to prevent stale values
  useEffect(() => {
    setOtpSent(false);
    setOtp("");
  }, [setOtpSent, setOtp]);

  const submit = async () => {
    if (loading) return;
    setEc((c) => c + 1);
    setLoading(true);
    const result = await submitCredentials();
    setLoading(false);
    if (result === "maxLoginWindowReached") return;
    if (!result) return;
    if (result?.data?.isTwoFactorEnabled) {
      setOtp("");
      setTotpRequired(true);
      return;
    }
    const otpError = await sendOtp({ email: form.email, purpose: "login" });
    if (otpError) return;
    setOtpSent(true);
  };

  const handleVerifyTotp = async (codeOrOptions = {}) => {
    const code = typeof codeOrOptions === "string" ? codeOrOptions : otp;
    if (!code || code.length !== 6) return;
    const options =
      typeof codeOrOptions === "object" &&
      !codeOrOptions._reactName &&
      !codeOrOptions.nativeEvent
        ? codeOrOptions
        : {};
    setLoading(true);
    try {
      const res = await authAPI.verifyTotp({ token: code, ...options });
      setOtp("");
      setTotpRequired(false);
      setUser(res.data?.data?.user);
      navigate("/auth-success", {
        state: { message: "Successfully signed in" },
      });
    } catch (err) {
      if (err.response?.status === 413) {
        setShowMaxSessionModal(true);
      } else {
        showMessage(
          "error",
          err.response?.data?.message || "Invalid code. Try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (codeOrOptions = {}) => {
    const code = typeof codeOrOptions === "string" ? codeOrOptions : otp;
    if (!code || code.length !== 6) return;
    const options =
      typeof codeOrOptions === "object" &&
      !codeOrOptions._reactName &&
      !codeOrOptions.nativeEvent
        ? codeOrOptions
        : {};
    setLoading(true);
    const result = await verifyOtp(
      { email: form.email, purpose: "login", otp: code },
      () => {
        setOtpSent(false);
        setOtp("");
        navigate("/auth-success", {
          state: { message: "Successfully signed in" },
        });
      },
      options,
    );
    setLoading(false);
    if (result === "maxSessionLimit") {
      setShowMaxSessionModal(true);
    }
  };

  return (
    <>
      {showSessionModal && (
        <ModalOverlay
          onClose={() => {
            handleCancelSession();
          }}
          maxWidth="max-w-sm"
        >
          <ModalHeader
            title="Session Limit Reached"
            onClose={() => handleCancelSession()}
          />
          <p className="text-sm text-slate-300 leading-relaxed mb-5">
            You've reached the max active sessions. Log out of your last session
            and continue here?
          </p>
          <div className="flex gap-2 justify-end">
            <Btn
              variant="ghost"
              onClick={() => {
                handleCancelSession();
              }}
            >
              Cancel
            </Btn>
            <Btn
              variant="primary"
              onClick={async () => {
                setLoading(true);
                setShowSessionModal(false);
                const otpError = await sendOtp({
                  email: form.email,
                  purpose: "login",
                });
                setLoading(false);
                if (otpError) return;
                setOtpSent(true);
              }}
            >
              Login Here
            </Btn>
          </div>
        </ModalOverlay>
      )}

      <ConfirmModal
        isOpen={showMaxSessionModal}
        onClose={() => setShowMaxSessionModal(false)}
        onConfirm={() => {
          setShowMaxSessionModal(false);
          if (totpRequired) handleVerifyTotp({ logoutLastSession: true });
          else handleVerifyOtp({ logoutLastSession: true });
        }}
        title="Session Limit Reached"
        message="You've reached the max active sessions. Logout the oldest session and continue?"
        confirmLabel="Continue"
        variant="primary"
        loading={loading}
      />

      <div className="w-full max-w-md relative">
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-zinc-800/50 rounded-xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="text-center mb-7">
            <div className="hidden sm:inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 mb-4">
              <Icon name="shield" size={22} color="currentColor" />
            </div>
            <h1 className="font-display text-xl font-extrabold text-slate-900 dark:text-zinc-100 mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-slate-600 dark:text-zinc-400">
              {otpSent
                ? "Verification code sent"
                : totpRequired
                  ? "Enter your authenticator code"
                  : "Sign in to your workspace"}
            </p>
          </div>

          {!otpSent && !totpRequired && <OAuthButtons />}

          {!otpSent && !totpRequired && (
            <div className="flex gap-2 items-center my-4">
              <div className="flex-1 h-px bg-slate-200 dark:bg-zinc-800" />
              <span className="text-sm text-slate-500 font-medium uppercase tracking-wider">
                or email
              </span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-zinc-800" />
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label>Email address</Label>
              <Input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                disabled={otpSent || totpRequired}
                error={ec > 0 && !emailValid}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onKeyDown={(e) =>
                  e.key === "Enter" && !otpSent && !totpRequired && submit()
                }
              />
            </div>
            {!otpSent && !totpRequired && (
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <Label>Password</Label>
                  <span
                    onClick={() => navigate("/forgot-password")}
                    className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </span>
                </div>
                <Input
                  type="password"
                  placeholder="• • • • • • •"
                  value={form.password}
                  disabled={otpSent || totpRequired}
                  error={ec > 0 && !passwordValid}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" && !otpSent && !totpRequired && submit()
                  }
                />
              </div>
            )}

            {totpRequired && (
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-4 animate-slideDown">
                <div className="text-center">
                  <span className="inline-block text-xs font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full mb-2">
                    Two-Factor Authentication
                  </span>
                  <p className="text-sm text-slate-600 dark:text-zinc-400">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>

                <div className="flex justify-center my-3">
                  <OTPBoxes onComplete={handleVerifyTotp} />
                </div>
              </div>
            )}

            {otpSent && (
              <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-4 animate-slideDown">
                <div className="text-center">
                  <span className="inline-block text-xs font-bold tracking-wider text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full mb-2">
                    Code sent — verify to continue
                  </span>
                  <p className="text-sm text-slate-600 dark:text-zinc-400">
                    Enter the 6-Digit OTP code sent to your email
                  </p>
                </div>

                <div className="flex justify-center my-3">
                  <OTPBoxes onComplete={handleVerifyOtp} />
                </div>

                <p className="text-center text-xs text-slate-500 dark:text-zinc-400">
                  {otpTimer > 0 ? (
                    <>Resend Code ({formatTimer(otpTimer)})</>
                  ) : (
                    <button
                      onClick={() =>
                        sendOtp({ email: form.email, purpose: "login" })
                      }
                      className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                    >
                      Resend Code
                    </button>
                  )}
                </p>
              </div>
            )}
          </div>

          <Btn
            variant="primary"
            className="w-full justify-center py-2.5 text-sm mt-6 relative"
            onClick={
              otpSent
                ? handleVerifyOtp
                : totpRequired
                  ? handleVerifyTotp
                  : submit
            }
            disabled={
              loading || ((otpSent || totpRequired) && otp.length !== 6)
            }
          >
            {loading && <span className="spinner" />}
            <span className={loading ? "invisible" : ""}>
              {otpSent || totpRequired ? "Verify & Login" : "Sign In"}
            </span>
          </Btn>

          <p className="text-center text-xs text-slate-500 dark:text-zinc-400 mt-4 leading-relaxed">
            By continuing, you acknowledge that you have read and agree to our{" "}
            <Link
              to="/terms"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Terms and Conditions
            </Link>
            ,{" "}
            <Link
              to="/agreement"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              User Agreement
            </Link>{" "}
            and{" "}
            <Link
              to="/privacy"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </p>

          <p className="text-center text-sm text-slate-600 dark:text-zinc-400 mt-5 pt-5 border-t border-slate-200 dark:border-zinc-800">
            Not have an account?{" "}
            <span
              onClick={() => {
                if (otpSent) setOtpSent(false);
                if (totpRequired) setTotpRequired(false);
                navigate("/register");
              }}
              className="text-blue-600 dark:text-blue-400 cursor-pointer font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            >
              Register Today
            </span>
          </p>
        </div>
      </div>
    </>
  );
}
