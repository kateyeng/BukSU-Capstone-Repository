import crypto from 'crypto';

// Generate a 6-digit reset code
export const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate a secure random token
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Hash the reset token for storage
export const hashResetToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const verifyResetToken = (token, hashedToken) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return tokenHash === hashedToken;
};
