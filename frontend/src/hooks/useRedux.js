import { useDispatch, useSelector } from "react-redux";
import { useCallback } from "react";

// Custom hook for typed useDispatch
export const useAppDispatch = () => useDispatch();

// Custom hook for typed useSelector
export const useAppSelector = useSelector;

// Customers Hooks
export const useCustomers = () => {
  const customers = useAppSelector((state) => state.customers.data);
  const loading = useAppSelector((state) => state.customers.loading);
  const error = useAppSelector((state) => state.customers.error);
  return { customers, loading, error };
};

// Bills Hooks
export const useBills = () => {
  const bills = useAppSelector((state) => state.bills.data);
  const loading = useAppSelector((state) => state.bills.loading);
  const error = useAppSelector((state) => state.bills.error);
  return { bills, loading, error };
};

// Inventory Hooks
export const useInventory = () => {
  const inventory = useAppSelector((state) => state.inventory.data);
  const loading = useAppSelector((state) => state.inventory.loading);
  const error = useAppSelector((state) => state.inventory.error);
  return { inventory, loading, error };
};

// Suppliers Hooks
export const useSuppliers = () => {
  const suppliers = useAppSelector((state) => state.suppliers.data);
  const loading = useAppSelector((state) => state.suppliers.loading);
  const error = useAppSelector((state) => state.suppliers.error);
  return { suppliers, loading, error };
};

// UI Hooks
export const useUI = () => {
  const sidebarOpen = useAppSelector((state) => state.ui.sidebarOpen);
  const theme = useAppSelector((state) => state.ui.theme);
  const notifications = useAppSelector((state) => state.ui.notifications);
  const loading = useAppSelector((state) => state.ui.loading);
  return { sidebarOpen, theme, notifications, loading };
};

// Auth Hooks
export const useAuth = () => {
  const user = useAppSelector((state) => state.auth.user);
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  const loading = useAppSelector((state) => state.auth.loading);
  const error = useAppSelector((state) => state.auth.error);
  return { user, isAuthenticated, loading, error };
};

// Generic loading hook
export const useLoading = () => {
  return useAppSelector((state) => state.ui.loading);
};

// Generic error hook
export const useErrors = () => {
  const customersError = useAppSelector((state) => state.customers.error);
  const billsError = useAppSelector((state) => state.bills.error);
  const inventoryError = useAppSelector((state) => state.inventory.error);
  const suppliersError = useAppSelector((state) => state.suppliers.error);
  const authError = useAppSelector((state) => state.auth.error);

  return {
    customersError,
    billsError,
    inventoryError,
    suppliersError,
    authError,
  };
};
