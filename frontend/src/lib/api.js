import axios from "axios";

const api = axios.create({ baseURL: "/api" });

export const apiClient = {
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

  // Analytics
  getSalesAnalytics:         () => api.get("/analytics/sales").then(r => r.data),
  getProfitLossAnalytics:    () => api.get("/analytics/profit-loss").then(r => r.data),
  getTopSellingItems:        () => api.get("/analytics/top-items").then(r => r.data),

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
