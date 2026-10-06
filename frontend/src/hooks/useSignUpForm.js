import { useState } from "react";
import { authAPI } from "../api/authApi";
import {
  isValidEmail,
  hasMinLength,
  isStrongPassword,
} from "../utils/validationHelpers";
import { useApp } from "../context/AppContext";

// Maps server error messages (from docs/errors/authErrors.md) to user-friendly text
function mapRegisterError(serverMsg) {
  if (!serverMsg) return "Registration failed. Please try again.";
  if (serverMsg.includes("already registered"))
    return "An account with this email already exists.";
  if (serverMsg.includes("Name must be between"))
    return "Name must be between 3 and 100 characters.";
  if (serverMsg.includes("one space between words"))
    return "Name should contain only letters and single spaces.";
  if (serverMsg.includes("valid email"))
    return "Please enter a valid email address.";
  if (
    serverMsg.includes("uppercase") ||
    serverMsg.includes("lowercase") ||
    serverMsg.includes("symbol")
  )
    return "Password must be at least 8 characters with uppercase, lowercase, number and symbol.";
  return serverMsg;
}

export function useRegisterForm() {
  const [form, setForm] = useState({ fullname: "", email: "", password: "" });
  const { showMessage } = useApp();

  const nameValid = form.fullname.trim().length >= 3;
  const emailValid = isValidEmail(form.email);
  const passwordValid =
    hasMinLength(form.password) && isStrongPassword(form.password);

  const submitRegister = async () => {
    if (!nameValid || !emailValid || !passwordValid) {
      showMessage("error", "Please fill all fields correctly.");
      return false;
    }
    try {
      await authAPI.register({
        name: form.fullname,
        email: form.email,
        password: form.password,
        agreedToTerms: true,
      });
      return true;
    } catch (err) {
      const msg = err.response?.data?.message;
      showMessage("error", mapRegisterError(msg));
      return false;
    }
  };

  return {
    form,
    setForm,
    nameValid,
    emailValid,
    passwordValid,
    submitRegister,
  };
}
