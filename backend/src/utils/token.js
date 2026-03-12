// utils/token.js
import jwt from "jsonwebtoken";

export const generateToken = (user, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: false,     // ✅ localhost http
    sameSite: "lax",   // ✅ allows localhost:5173 -> localhost:3000
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

export const clearToken = (res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    expires: new Date(0),
  });
};