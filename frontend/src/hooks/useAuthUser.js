import api from "../api/axios";

export async function fetchMe() {
  // Your interceptor returns { status: 401, data: null } for /api/auth/me
  const res = await api.get("/api/auth/me");
  return res.data; // null when 401 (no session)
}
