import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  res => res,
  err => {
    const { config, response } = err || {};
    if (config?.url?.includes("/api/auth/me") && response?.status === 401) {
      // Treat "no session" as a resolved response with minimal shape
      return Promise.resolve({ status: 401, data: null, config });
    }
    return Promise.reject(err);
  }
);
export default api;