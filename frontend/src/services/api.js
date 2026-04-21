import axios from "axios";

const resolveBaseURL = () => {
  const envBaseURL = import.meta.env.VITE_API_BASE_URL?.trim();
  const apiPort = import.meta.env.VITE_API_PORT || "8000";

  if (envBaseURL && !envBaseURL.includes("0.0.0.0") && envBaseURL !== "") {
    return envBaseURL;
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    // FIXED: Added backticks and corrected the ternary operator
    return `${protocol}//${hostname}${apiPort ? `:${apiPort}` : ""}/api`;
  }

  // FIXED: Added backticks
  return `http://localhost:${apiPort}/api`;
};

const api = axios.create({
  baseURL: resolveBaseURL(),
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      // FIXED: Added backticks
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const method = error?.config?.method?.toUpperCase();
    // FIXED: Added backticks and corrected extraction
    const fullUrl = `${error?.config?.baseURL || ""}${error?.config?.url || ""}`;

    console.error("API request failed:", {
      method,
      url: fullUrl,
      status,
      data,
      message: error?.message || "Unknown API error",
    });

    return Promise.reject(error);
  },
);

export default api;
