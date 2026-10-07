import { createContext, useContext, useEffect, useRef, useState } from "react";
import { authAPI } from "../api/authApi";
import { useApp } from "./AppContext";

const OtpContext = createContext(null);

export function OtpProvider({ children }) {
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const timerRef = useRef(null);
  const { setLoading, showMessage, setUser } = useApp();

  const startTimer = (expiresAt) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const tick = () => {
      const rem = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
      setOtpTimer(rem);
      if (rem === 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
  };

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  const sendOtp = async ({ email, purpose }) => {
    setLoading(true);
    try {
      const res = await authAPI.requestOTP({ email, purpose });
      const expiresAt = res.data?.data?.otpExpiresAt;
      if (expiresAt) startTimer(new Date(expiresAt).getTime());
      setOtpSent(true);
      showMessage("success", "OTP sent to your email");
      return null;
    } catch (err) {
      const message = err.response?.data?.message || "Failed to send OTP";
      showMessage("error", message);
      return message;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async ({ email, purpose, otp: customOtp }, onSuccess, options = {}) => {
    setLoading(true);
    try {
      const codeToUse = customOtp || otp;
      const payload = { email, otp: codeToUse };
      const cleanOptions =
        typeof options === "object" &&
        !options._reactName &&
        !options.nativeEvent
          ? options
          : {};
      if (cleanOptions.logoutLastSession) payload.logoutLastSession = true;
      const res = await authAPI.verifyOTP(payload);
      const verifiedUser = res?.data?.data?.user;
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setOtp("");
      setOtpSent(false);
      setOtpTimer(0);
      try {
        onSuccess?.();
      } catch (e) {
        console.error("Post-OTP callback error:", e);
      }
      if (verifiedUser && purpose !== "forgot-password") setUser(verifiedUser);
      return null;
    } catch (err) {
      if (err.response?.status === 413) {
        return "maxSessionLimit";
      }
      setOtpError(true);
      setTimeout(() => setOtpError(false), 400);
      showMessage("error", err.response?.data?.message || "Invalid OTP");
      return err.response?.data?.message || "Invalid OTP";
    } finally {
      setLoading(false);
    }
  };

  return (
    <OtpContext.Provider
      value={{ otp, setOtp, otpSent, setOtpSent, otpError, otpTimer, sendOtp, verifyOtp }}
    >
      {children}
    </OtpContext.Provider>
  );
}

export const useOtpContext = () => useContext(OtpContext);
