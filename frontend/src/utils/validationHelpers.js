export const isValidEmail = (email = "") =>
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

export const hasMinLength = (value = "", min = 8) => value.length >= min;

export const isStrongPassword = (password = "") => {
  if (password.length < 8) return false;
  
  const checks = {
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };
  
  return Object.values(checks).every(Boolean);
};

export const getPasswordStrength = (password = "") => {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  
  return {
    isValid: score === 5,
    score,
    checks,
    label: score <= 2 ? 'weak' : score <= 4 ? 'medium' : 'strong'
  };
};