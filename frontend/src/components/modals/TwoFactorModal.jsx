import { useState, useEffect, useRef } from "react";
import { ModalOverlay, ModalHeader, Btn } from "../ui/UI";
import { Icon } from "../ui/Icon";
import { authAPI } from "../../api/authApi";

export default function TwoFactorModal({ onClose, mode = "enable" }) {
  const isDisable = mode === "disable";
  const [step, setStep] = useState("generate");
  const [qrCode, setQrCode] = useState(null);
  const [manualSecret, setManualSecret] = useState(null);
  const [token, setToken] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (isDisable) {
      setStep("scan");
      return;
    }
    authAPI
      .generate2FA()
      .then((res) => {
        setQrCode(res.data?.data?.qrCode);
        setManualSecret(res.data?.data?.manualSecret);
        setStep("scan");
      })
      .catch((err) => {
        setError(err?.response?.data?.message || "Failed to generate 2FA setup.");
      });
  }, [isDisable]);

  const handleInput = (i, val) => {
    if (val.length > 1) return;
    const next = [...token];
    next[i] = val;
    setToken(next);
    setError(null);
    if (val && i < 5) {
      inputRefs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace" && !token[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = token.join("");
    if (code.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      if (isDisable) await authAPI.disable2FA({ token: code });
      else await authAPI.enable2FA({ token: code });
      onClose();
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalOverlay onClose={onClose} maxWidth="max-w-md">
      <ModalHeader
        title={
          isDisable
            ? "Disable Two-Factor Authentication"
            : "Enable Two-Factor Authentication"
        }
        onClose={onClose}
      />

      {step === "generate" && (
        <div className="flex items-center justify-center py-10">
          <Icon name="spinner" size={24} className="animate-spin text-slate-400" />
        </div>
      )}

      {step === "scan" && (
        <div className="space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {isDisable && (
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
              Enter the 6-digit code from your authenticator app to confirm that
              you want to disable two-factor authentication.
            </p>
          )}

          {!isDisable && (
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-3">
                Step 1: Scan this QR code with your authenticator app
              </p>
              <div className="flex flex-col items-center gap-3">
                {qrCode && (
                  <img
                    src={qrCode}
                    alt="2FA QR Code"
                    className="w-44 h-44 rounded-xl border border-slate-200 dark:border-zinc-800"
                  />
                )}
                {manualSecret && (
                  <div className="text-center">
                    <p className="text-xs text-slate-500 mb-1">Manual entry key:</p>
                    <code className="text-sm font-mono bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-zinc-300 select-all">
                      {manualSecret}
                    </code>
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-zinc-300 mb-3">
              {isDisable
                ? "Enter the 6-digit code from your app"
                : "Step 2: Enter the 6-digit code from your app"}
            </p>
            <div className="flex justify-center gap-2">
              {token.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (inputRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => handleInput(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg font-bold rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-zinc-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-[border-color,box-shadow,background-color]"
                />
              ))}
            </div>
          </div>

          <Btn
            variant="primary"
            className="w-full justify-center py-2.5"
            onClick={handleVerify}
            disabled={token.join("").length !== 6 || loading}
          >
            {loading ? (
              <Icon name="spinner" size={16} className="animate-spin" />
            ) : null}
            {loading
              ? "Verifying..."
              : isDisable
                ? "Verify & Disable"
                : "Verify & Enable"}
          </Btn>

          {!isDisable && (
            <p className="text-xs text-amber-600 dark:text-amber-400 text-center leading-relaxed">
              Save your backup codes somewhere safe! If you lose access to your authenticator app, you will be locked out of your account.
            </p>
          )}
        </div>
      )}
    </ModalOverlay>
  );
}
