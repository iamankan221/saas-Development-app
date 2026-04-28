import axios from "axios";

const api = axios.create({ baseURL: "/api" });

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

const TOKEN_KEYS = {
  access: "vyapar_access_token",
  refresh: "vyapar_refresh_token",
};

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEYS.access);
}

export function getRefreshToken() {
  return localStorage.getItem(TOKEN_KEYS.refresh);
}

export function setTokens(accessToken, refreshToken) {
  localStorage.setItem(TOKEN_KEYS.access, accessToken);
  localStorage.setItem(TOKEN_KEYS.refresh, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEYS.access);
  localStorage.removeItem(TOKEN_KEYS.refresh);
}

// ============================================================================
// AXIOS INTERCEPTORS
// ============================================================================

// Request interceptor — attach access token to every request
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — auto-refresh on 401
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, tokens = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(tokens);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh for 401 errors, not on auth endpoints themselves
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/auth/login") &&
      !originalRequest.url.includes("/auth/register") &&
      !originalRequest.url.includes("/auth/refresh")
    ) {
      if (isRefreshing) {
        // Queue the request while refresh is in progress
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((tokens) => {
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const storedRefreshToken = getRefreshToken();

      if (!storedRefreshToken) {
        isRefreshing = false;
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post("/api/auth/refresh", {
          refreshToken: storedRefreshToken,
        });

        // Store the rotated tokens
        setTokens(data.accessToken, data.refreshToken);

        // Update the authorization header for the original request
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

        // Process queued requests
        processQueue(null, { accessToken: data.accessToken });

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// API CLIENT
// ============================================================================

export const apiClient = {
  // Auth
  login:          (data) => api.post("/auth/login", data).then(r => r.data),
  register:       (data) => api.post("/auth/register", data).then(r => r.data),
  refresh:        (data) => api.post("/auth/refresh", data).then(r => r.data),
  logout:         (data) => api.post("/auth/logout", data).then(r => r.data),
  getMe:          ()     => api.get("/auth/me").then(r => r.data),

  // Dashboard
  getDashboardSummary:       () => api.get("/dashboard/summary").then(r => r.data),
  getDashboardActivity:      () => api.get("/dashboard/recent-activity").then(r => r.data),

  // Customers
  getCustomers:              (params) => api.get("/customers", { params }).then(r => r.data),
  getCustomer:               (id) => api.get(`/customers/${id}`).then(r => r.data),
  createCustomer:            (data) => api.post("/customers", data).then(r => r.data),
  updateCustomer:            (id, data) => api.patch(`/customers/${id}`, data).then(r => r.data),
  deleteCustomer:            (id) => api.delete(`/customers/${id}`),
  getCustomerBalance:        (id) => api.get(`/customers/${id}/balance`).then(r => r.data),
  searchCustomersByPhone:    (phone) => api.get("/customers/search-phone", { params: { phone } }).then(r => r.data),

  // Inventory
  getInventory:              (params) => api.get("/inventory", { params }).then(r => r.data),
  getInventorySummary:       () => api.get("/inventory/summary").then(r => r.data),
  getInventoryItem:          (id) => api.get(`/inventory/${id}`).then(r => r.data),
  createInventoryItem:       (data) => api.post("/inventory", data).then(r => r.data),
  updateInventoryItem:       (id, data) => api.patch(`/inventory/${id}`, data).then(r => r.data),
  deleteInventoryItem:       (id) => api.delete(`/inventory/${id}`),

  // Suppliers
  getSuppliers:              (params) => api.get("/suppliers", { params }).then(r => r.data),
  getSupplier:               (id) => api.get(`/suppliers/${id}`).then(r => r.data),
  createSupplier:            (data) => api.post("/suppliers", data).then(r => r.data),
  updateSupplier:            (id, data) => api.patch(`/suppliers/${id}`, data).then(r => r.data),
  deleteSupplier:            (id) => api.delete(`/suppliers/${id}`),

  // Bills
  getBills:                  (params) => api.get("/bills", { params }).then(r => r.data),
  getBill:                   (id) => api.get(`/bills/${id}`).then(r => r.data),
  getNextBillNumber:         () => api.get("/bills/next-number").then(r => r.data),
  createBill:                (data) => api.post("/bills", data).then(r => r.data),
  updateBill:                (id, data) => api.patch(`/bills/${id}`, data).then(r => r.data),
  deleteBill:                (id) => api.delete(`/bills/${id}`),
  getBillByCode:             (code) => api.get(`/bills/code/${code}`).then(r => r.data),

  // Analytics
  getSalesAnalytics:         (params) => api.get("/analytics/sales", { params }).then(r => r.data),
  getProfitLossAnalytics:    (params) => api.get("/analytics/profit-loss", { params }).then(r => r.data),
  getTopSellingItems:        (params) => api.get("/analytics/top-items", { params }).then(r => r.data),

  // Settings
  getSettings:               () => api.get("/settings").then(r => r.data),
  updateSettings:            (data) => api.patch("/settings", data).then(r => r.data),
};

export const formatINR = (val) => {
  if (val == null) return "₹0";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val);
};

export const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};
