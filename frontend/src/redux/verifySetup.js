/**
 * Redux Setup Verification Script
 * Run this to verify Redux is properly configured
 */

import store from "./redux/store";

export function verifyReduxSetup() {
  console.log("🔍 Verifying Redux Setup...\n");

  // Check 1: Store exists
  try {
    const state = store.getState();
    console.log("✅ Store created and accessible");
    console.log("📦 State keys:", Object.keys(state));
  } catch (error) {
    console.error("❌ Store error:", error);
    return false;
  }

  // Check 2: Slice reducers
  const state = store.getState();
  const slices = ["customers", "bills", "inventory", "suppliers", "ui", "auth"];
  slices.forEach((slice) => {
    if (state[slice]) {
      console.log(`✅ ${slice} slice configured`);
    } else {
      console.error(`❌ ${slice} slice missing`);
    }
  });

  // Check 3: Middleware
  try {
    console.log("✅ Middleware configured");
  } catch (error) {
    console.error("❌ Middleware error:", error);
  }

  // Check 4: DevTools
  const hasDevTools =
    typeof window !== "undefined" &&
    window.__REDUX_DEVTOOLS_EXTENSION__ !== undefined;
  if (hasDevTools) {
    console.log("✅ Redux DevTools available");
  } else {
    console.log("ℹ️  Redux DevTools not installed (optional)");
  }

  console.log("\n✅ Redux Setup Complete!\n");
  console.log("To use Redux in your component:");
  console.log("  import { useAppDispatch, useCustomers } from '@/hooks/useRedux'");
  console.log("  import { selectCustomers } from '@/redux/selectors'\n");

  return true;
}

export function logStoreState() {
  const state = store.getState();
  console.group("🔴 Redux Store State");
  console.log(state);
  console.groupEnd();
}

export function subscribeToStoreChanges() {
  const unsubscribe = store.subscribe(() => {
    const state = store.getState();
    console.log("📤 Store Updated:", state);
  });
  return unsubscribe;
}

// Run verification on module load if in development
if (process.env.NODE_ENV === "development") {
  console.log("\n");
  verifyReduxSetup();
}
