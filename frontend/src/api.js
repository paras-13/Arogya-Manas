// src/api.js
import axios from "axios";
import { toast } from "react-toastify";

let logoutFn = null;
export const registerLogout = (fn) => {
  logoutFn = fn;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle expired token globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      error.response.data?.error?.toLowerCase().includes("token")
    ) {
      toast.error("Session expired. Please log in again.");

      // Trigger global logout (context + storage)
      if (logoutFn) logoutFn();

      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
