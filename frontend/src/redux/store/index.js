import { configureStore } from "@reduxjs/toolkit";
import customersReducer from "../slices/customersSlice";
import billsReducer from "../slices/billsSlice";
import inventoryReducer from "../slices/inventorySlice";
import suppliersReducer from "../slices/suppliersSlice";
import uiReducer from "../slices/uiSlice";
import authReducer from "../slices/authSlice";

export const store = configureStore({
  reducer: {
    customers: customersReducer,
    bills: billsReducer,
    inventory: inventoryReducer,
    suppliers: suppliersReducer,
    ui: uiReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["customers/fetchCustomers/fulfilled"],
        ignoredPaths: ["customers.lastUpdated"],
      },
    }),
});

export default store;
