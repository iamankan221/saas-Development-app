// Re-export all slices for easier imports
export { default as customersReducer } from "./customersSlice";
export { default as billsReducer } from "./billsSlice";
export { default as inventoryReducer } from "./inventorySlice";
export { default as suppliersReducer } from "./suppliersSlice";
export { default as uiReducer } from "./uiSlice";
export { default as authReducer } from "./authSlice";

// Re-export all actions
export * from "./customersSlice";
export * from "./billsSlice";
export * from "./inventorySlice";
export * from "./suppliersSlice";
export * from "./uiSlice";
export * from "./authSlice";
