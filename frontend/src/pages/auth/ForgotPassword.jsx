import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { useOtpContext } from "../../context/OtpContext";
import { authAPI } from "../../api/authApi";
import { isValidEmail } from "../../utils/validationHelpers";
import { Icon } from "../../components/ui/Icon";
import { Btn, Input, Label } from "../../components/ui/UI";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const { loading, setLoading, showMessage } = useApp();
  const { sendOtp } = useOtpContext();
  const [email, setEmail] = useState("");
  const [ec, setEc] = useState(0);
  const valid = isValidEmail(email);

  const handle = async () => {
    if (loading) return;
    setEc((c) => c + 1);
    if (!valid) return;
    setLoading(true);
    try {
      await authAPI.forgotPasswordInit({ email });
      const otpError = await sendOtp({ email, purpose: "forgot-password" });
      if (otpError) return;
      navigate("/verify-otp", {
        state: { email, purpose: "forgot-password", from: "/forgot-password" },
      });
    } catch (err) {
      showMessage("error", err.response?.data?.message || "Email not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative animate-fadeUp">
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="bg-white/80 dark:bg-zinc-900/60 backdrop-blur-xl border border-slate-200/50 dark:border-zinc-800/50 rounded-xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 mb-4">
            <Icon name="shield" size={22} color="currentColor" />
          </div>
          <h1 className="font-display text-xl font-extrabold text-slate-900 dark:text-zinc-100 mb-1">
            Reset password
          </h1>
          <p className="text-sm text-slate-700 dark:text-zinc-300">
            Enter your email to receive a reset code
          </p>
        </div>
        <Label>Email address</Label>
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          error={ec > 0 && !valid}
          className="mb-5"
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handle()}
        />
        <Btn
          variant="primary"
          className="w-full justify-center py-2.5 text-sm relative"
          onClick={handle}
          disabled={loading}
        >
          {loading && <span className="spinner" />}
          <span className={loading ? "invisible" : ""}>Send reset code</span>
        </Btn>
        <div className="text-center mt-5">
          <span
            onClick={() => navigate("/signin")}
            className="text-sm text-blue-600 dark:text-blue-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-300 font-semibold transition-colors"
          >
            ← Back to sign in
          </span>
        </div>
      </div>
    </div>
  );
}
