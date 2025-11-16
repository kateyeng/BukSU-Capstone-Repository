export const toPublicUser = (u) => ({
  _id: u._id,
  fullName: u.fullName,
  email: u.email,
  role: u.role,
  profilePic: u.profilePic,
  isEmailVerified: u.isEmailVerified,
});