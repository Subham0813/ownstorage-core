import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOtpContext } from "../../context/OtpContext";
import { useApp } from "../../context/AppContext";
import OTPBoxes from "../../components/auth/OTPBoxes";
import { Icon } from "../../components/ui/Icon";
import { Btn } from "../../components/ui/UI";
import { formatTimer } from "../../utils/formatHelpers";

export default function VerifyOtp() {
  const { otp, otpTimer, verifyOtp, sendOtp } = useOtpContext();
  const { loading } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const email =
    location.state?.email ||
    sessionStorage.getItem("otpEmail") ||
    params.get("email") ||
    "";
  const purpose =
    location.state?.purpose ||
    sessionStorage.getItem("otpPurpose") ||
    params.get("purpose") ||
    "login";

  useEffect(() => {
    if (!email) {
      navigate("/signin", { replace: true });
      return;
    }
    sessionStorage.setItem("otpEmail", email);
    sessionStorage.setItem("otpPurpose", purpose);
    const from = location.state?.from;
    if (from) sessionStorage.setItem("otpSource", from);
    else sessionStorage.removeItem("otpSource");
  }, [email, purpose, location.state, navigate]);

  const sourceByPurpose = {
    login: "/signin",
    register: "/register",
    "forgot-password": "/forgot-password",
  };

  const goBackToSource = () => {
    const from = sessionStorage.getItem("otpSource");
    navigate(from || sourceByPurpose[purpose] || "/signin", { replace: true });
  };

  const handleResend = async () => {
    const errorMessage = await sendOtp({ email, purpose });
    if (errorMessage && /cookie/i.test(errorMessage)) goBackToSource();
  };

  const handle = async (codeOrOptions) => {
    const code = typeof codeOrOptions === "string" ? codeOrOptions : otp;
    if (!code || code.length !== 6) return;
    const errorMessage = await verifyOtp({ email, purpose, otp: code }, () => {
      sessionStorage.removeItem("otpEmail");
      sessionStorage.removeItem("otpPurpose");
      sessionStorage.removeItem("otpSource");
      if (purpose === "forgot-password")
        navigate("/change-password", { state: { email } });
      else
        navigate("/auth-success", {
          state: {
            message:
              purpose === "register"
                ? "Account created successfully"
                : "Successfully signed in",
          },
        });
    });
    if (errorMessage && /cookie/i.test(errorMessage)) goBackToSource();
  };

  return (
    <div className="w-full max-w-md relative animate-fadeUp">
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-zinc-800/50 rounded-xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 border mb-4">
            <Icon name="mail" size={22} color="currentColor" />
          </div>
          <h1 className="font-display text-xl font-extrabold text-slate-900 dark:text-zinc-100 mb-1">
            Check your email
          </h1>
          <p className="text-sm text-slate-700 dark:text-zinc-300">
            We sent a code to{" "}
            <strong className="text-slate-900 dark:text-zinc-100">
              {email}
            </strong>
          </p>
        </div>
        <OTPBoxes onComplete={handle} />
        <p className="text-center text-sm text-slate-700 dark:text-zinc-300 mb-5">
          {otpTimer > 0 ? (
            <>
              Expires in{" "}
              <strong className="text-slate-900 dark:text-zinc-100">
                {formatTimer(otpTimer)}
              </strong>
            </>
          ) : (
            <span className="text-danger font-medium">
              Code expired — request a new one
            </span>
          )}
        </p>
        <Btn
          variant="primary"
          className="w-full justify-center py-2.5 text-sm relative"
          onClick={otpTimer === 0 ? handleResend : handle}
          disabled={otp.length !== 6 && otpTimer > 0}
          loading={loading}
        >
          {otpTimer === 0 ? "Resend code" : "Verify code"}
        </Btn>
      </div>
    </div>
  );
}
