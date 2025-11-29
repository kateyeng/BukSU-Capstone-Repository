import jwt from "jsonwebtoken";

export const generateToken = (user, res) => {
<<<<<<< HEAD
  // Sign a payload with a consistent key: "id"
  const token = jwt.sign(
    { id: user._id, role: user.role },
=======
  // Accept a full user object (has _id and role)
  const token = jwt.sign(
    { id: user._id.toString(), role: user.role },
>>>>>>> major-changes
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

<<<<<<< HEAD
  // ✅ Set HttpOnly cookie so the browser sends it with /api/auth/me
=======
>>>>>>> major-changes
  res.cookie("jwt", token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
<<<<<<< HEAD
=======
    // path: "/",           // default
    // domain: ".yourdomain.com", // set in prod if using subdomains
>>>>>>> major-changes
  });

  return token;
};
<<<<<<< HEAD
=======

export const clearToken = (res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
    // path: "/",
  });
};
>>>>>>> major-changes
