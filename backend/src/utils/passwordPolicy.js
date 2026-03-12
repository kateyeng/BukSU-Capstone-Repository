const PASSWORD_POLICY_MESSAGE =
  "Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 symbol.";

export function validateStrongPassword(password) {
  const value = String(password || "");
  const hasMinLen = value.length >= 8;
  const hasUpper = /[A-Z]/.test(value);
  const hasNumber = /\d/.test(value);
  const hasSymbol = /[^A-Za-z0-9]/.test(value);

  return {
    ok: hasMinLen && hasUpper && hasNumber && hasSymbol,
    message: PASSWORD_POLICY_MESSAGE,
  };
}

export { PASSWORD_POLICY_MESSAGE };
