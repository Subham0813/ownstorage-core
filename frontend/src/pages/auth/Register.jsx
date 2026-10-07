import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useOtpContext } from "../../context/OtpContext";
import { useRegisterForm } from "../../hooks/useSignUpForm";
import OAuthButtons from "../../components/auth/OAuthButtons";
import { Icon } from "../../components/ui/Icon";
import { Btn, Input, Label } from "../../components/ui/UI";
import { getPasswordStrength } from "../../utils/validationHelpers";
import OTPBoxes from "../../components/auth/OTPBoxes";
import { formatTimer } from "../../utils/formatHelpers";

export default function Register() {
  const navigate = useNavigate();
  const { loading, setLoading } = useApp();
  const {
    form,
    setForm,
    nameValid,
    emailValid,
    passwordValid,
    submitRegister,
  } = useRegisterForm();
  const { otp, otpTimer, verifyOtp, sendOtp, otpSent, setOtpSent, setOtp } =
    useOtpContext();
  const [ec, setEc] = useState(0);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const ps = getPasswordStrength(form.password);

  useEffect(() => {
    setOtpSent(false);
    setOtp("");
  }, [setOtpSent, setOtp]);

  const submit = async () => {
    if (loading) return;
    setEc((c) => c + 1);
    if (!termsAgreed) return;
    setLoading(true);
    const ok = await submitRegister();
    if (!ok) {
      setLoading(false);
      return;
    }
    const otpError = await sendOtp({ email: form.email, purpose: "register" });
    if (otpError) {
      setLoading(false);
      return;
    }
    setOtpSent(true);
    setLoading(false);
  };

  const handleVerifyOtp = async (codeOrOptions) => {
    const code = typeof codeOrOptions === "string" ? codeOrOptions : otp;
    if (!code || code.length !== 6) return;
    setLoading(true);
    await verifyOtp(
      { email: form.email, purpose: "register", otp: code },
      () => {
        setOtpSent(false);
        setOtp("");
        navigate("/auth-success", {
          state: { message: "Account created successfully" },
        });
      },
    );
    setLoading(false);
  };

  return (
    <div className="w-full max-w-md relative animate-fadeUp">
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-zinc-800/50 rounded-xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="text-center mb-7">
          <div className="hidden sm:inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 mb-4">
            <Icon name="user" size={22} color="currentColor" />
          </div>
          <h1 className="font-display text-xl font-extrabold text-slate-900 dark:text-zinc-100 mb-1">
            Create account
          </h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            {otpSent ? "Verify email to register" : "Join OwnStorage today"}
          </p>
        </div>

        {!otpSent && <OAuthButtons label="Sign up with Google" />}

        {!otpSent && (
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
            <Label>Full Name</Label>
            <Input
              placeholder="Alex Morgan"
              value={form.fullname}
              disabled={otpSent}
              error={ec > 0 && !nameValid}
              onChange={(e) => setForm({ ...form, fullname: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          <div>
            <Label>Email address</Label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              disabled={otpSent}
              error={ec > 0 && !emailValid}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
          {!otpSent && (
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                placeholder="Create a strong password"
                value={form.password}
                error={ec > 0 && !passwordValid}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              {form.password && (
                <div className="mt-2 space-y-2">
                  <div className={`pw-strength pw-${ps.label}`} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-2 text-xs mt-2">
                    {[
                      { key: "length", label: "8+ characters" },
                      { key: "uppercase", label: "Uppercase letter" },
                      { key: "lowercase", label: "Lowercase letter" },
                      { key: "number", label: "Number" },
                      { key: "special", label: "Special symbol" },
                    ].map((req) => (
                      <div key={req.key} className="flex items-center gap-1.5">
                        {ps.checks[req.key] ? (
                          <svg
                            className="w-3.5 h-3.5 text-green-500"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <svg
                            className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-400"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        )}
                        <span
                          className={
                            ps.checks[req.key]
                              ? "text-slate-700 dark:text-zinc-300"
                              : "text-slate-400 dark:text-zinc-400"
                          }
                        >
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!otpSent && (
            <div className="pt-2">
              <label className="flex items-start gap-2.5 cursor-pointer group">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                  />
                  <div className="w-4 h-4 rounded border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-colors" />
                  <svg
                    className="absolute w-3 h-3 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <span
                  className={`text-sm leading-snug ${ec > 0 && !termsAgreed ? "text-danger font-medium" : "text-slate-600 dark:text-zinc-400"}`}
                >
                  I am at least 18 years old and agree to the{" "}
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
                </span>
              </label>
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
                      sendOtp({ email: form.email, purpose: "register" })
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
          onClick={otpSent ? handleVerifyOtp : submit}
          disabled={
            loading ||
            (!otpSent && !termsAgreed) ||
            (otpSent && otp.length !== 6)
          }
        >
          {loading && <span className="spinner" />}
          <span className={loading ? "invisible" : ""}>
            {otpSent ? "Confirm & Register" : "Create account"}
          </span>
        </Btn>
        <p className="text-center text-sm text-slate-600 dark:text-zinc-400 mt-5">
          Already have an account?{" "}
          <span
            onClick={() => {
              if (otpSent) setOtpSent(false);
              navigate("/signin");
            }}
            className="text-blue-600 dark:text-blue-400 cursor-pointer font-semibold hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            Sign in here
          </span>
        </p>
      </div>
    </div>
  );
}
