import { useState } from "react";
import { authAPI } from "../api/authApi";
import { isValidEmail, hasMinLength } from "../utils/validationHelpers";
import { useApp } from "../context/AppContext";

// Maps server error messages (from docs/errors/authErrors.md) to user-friendly text
function mapLoginError(serverMsg) {
  if (!serverMsg) return "Sign in failed. Please try again.";
  if (serverMsg.includes("Incorrect email or password"))
    return "Incorrect email or password.";
  if (serverMsg.includes("Invalid cookies"))
    return "Your session has expired. Please try again.";
  if (serverMsg.includes("User not found"))
    return "No account found with that email.";
  return serverMsg;
}

export function useSignInForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showSessionModal, setShowSessionModal] = useState(false);
  const { showMessage } = useApp();

  const emailValid = isValidEmail(form.email);
  const passwordValid = hasMinLength(form.password, 8);

  const submitCredentials = async (logoutLastSession = false) => {
    if (!emailValid || !passwordValid) {
      showMessage("error", "Please enter a valid email and password.");
      return false;
    }
    try {
      const res = await authAPI.login({ ...form, logoutLastSession });
      if (res?.data?.maxLoginWindowReached) {
        setShowSessionModal(true);
        return "maxLoginWindowReached";
      }
      setShowSessionModal(false);
      return res?.data;
    } catch (err) {
      const msg = err.response?.data?.message;
      showMessage("error", mapLoginError(msg));
      return false;
    }
  };

  const handleCancelSession = () => setShowSessionModal(false);

  return {
    form,
    setForm,
    emailValid,
    passwordValid,
    submitCredentials,
    showSessionModal,
    setShowSessionModal,
    handleCancelSession,
  };
}
