import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const { config, response } = err || {};
    // Your existing special case for auth/me
    if (config?.url?.includes("/api/auth/me") && response?.status === 401) {
      return Promise.resolve({ status: 401, data: null, config });
    }
    return Promise.reject(err);
  }
);

export default api;
