import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import { authAPI } from "../../api/authApi";
import {
  isStrongPassword,
  getPasswordStrength,
} from "../../utils/validationHelpers";
import { Icon } from "../../components/ui/Icon";
import { Btn, Input, Label } from "../../components/ui/UI";

export default function ChangePassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, setLoading, showMessage, clearUser } = useApp();
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [ec, setEc] = useState(0);
  const email = location.state?.email;
  const ps = getPasswordStrength(newPw);
  const validPassword = isStrongPassword(newPw);
  const passwordsMatch = newPw === confirmPw;
  const valid = validPassword && passwordsMatch;

  useEffect(() => {
    if (!email) navigate("/forgot-password", { replace: true });
  }, [email, navigate]);

  const handle = async () => {
    if (loading) return;
    setEc((c) => c + 1);
    if (!validPassword) {
      showMessage(
        "error",
        "Please ensure password meets all security criteria",
      );
      return;
    }
    if (!passwordsMatch) {
      showMessage("error", "Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword({ newPassword: newPw });
      clearUser();
      showMessage("success", "Password reset successfully");
      setTimeout(() => navigate("/signin"), 1000);
    } catch (err) {
      showMessage("error", err.response?.data?.message || "Reset failed");
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
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 border mb-4">
            <Icon name="shield" size={22} color="currentColor" />
          </div>
          <h1 className="font-display text-xl font-extrabold text-slate-900 dark:text-zinc-100 mb-1">
            New password
          </h1>
          <p className="text-sm text-slate-700 dark:text-zinc-300">
            Choose a strong new password
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label>New password</Label>
            <Input
              type="password"
              placeholder="Create a strong password"
              value={newPw}
              error={ec > 0 && !validPassword}
              onChange={(e) => setNewPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handle()}
            />
            {newPw && (
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

          <div>
            <Label>Confirm new password</Label>
            <Input
              type="password"
              placeholder="• • • • • • •"
              value={confirmPw}
              error={ec > 0 && (!passwordsMatch || !confirmPw)}
              onChange={(e) => setConfirmPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handle()}
            />
          </div>
        </div>

        <Btn
          variant="primary"
          className="w-full justify-center py-2.5 text-sm mt-6 relative"
          onClick={handle}
          disabled={loading}
        >
          {loading && <span className="spinner" />}
          <span className={loading ? "invisible" : ""}>Reset password</span>
        </Btn>
      </div>
    </div>
  );
}
