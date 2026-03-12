// src/api/axios.js
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API,
  withCredentials: true, // ✅ send cookies to backend
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;