import { useRef } from "react";
import { useOtpContext } from "../../context/OtpContext";

export default function OTPBoxes({ onComplete }) {
  const { otp, setOtp, otpError } = useOtpContext();
  const inputsRef = useRef([]);

  const handleChange = (i, e) => {
    const val = e.target.value.replace(/\D/g, "");
    if (val) {
      const next = otp.split("");
      next[i] = val[0];
      const final = next.join("");
      setOtp(final);
      if (i < 5) inputsRef.current[i + 1]?.focus();
      if (final.length === 6) {
        onComplete?.(final);
      }
    }
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const next = otp.split("");
      if (next[i]) {
        next[i] = "";
        setOtp(next.join(""));
        return;
      }
      if (i > 0) {
        inputsRef.current[i - 1]?.focus();
        next[i - 1] = "";
        setOtp(next.join(""));
      }
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (otp.length === 6) {
        onComplete?.(otp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const p = e.clipboardData.getData("text").replace(/\D/g, "");
    if (p.length !== 6) return;
    setOtp(p);
    inputsRef.current[5]?.focus();
    onComplete?.(p);
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-semibold text-slate-700 dark:text-zinc-300 uppercase tracking-widest mb-3 text-center">
        Enter 6-digit code
      </label>
      <div className={`flex justify-center gap-2 ${otpError ? "shake" : ""}`}>
        {[...Array(6)].map((_, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            value={otp[i] || ""}
            maxLength={1}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={`w-12 h-14 text-center text-2xl font-bold rounded-xl transition-[border-color,box-shadow,background-color] duration-200 focus:outline-none focus:ring-4 shadow-sm ${otpError ? "bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-800 text-red-600 focus:border-red-500 focus:ring-red-500/20" : "bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-900 dark:text-white focus:border-blue-500 focus:ring-blue-500/20 dark:focus:border-blue-500/80"}`}
          />
        ))}
      </div>
    </div>
  );
}

