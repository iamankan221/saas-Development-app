/**
 * Global toast notification system (event-based, framework-agnostic).
 *
 * Usage:
 *   import { toast } from "@/lib/toast";
 *   toast.success("Bill created successfully");
 *   toast.error("Something went wrong");
 *   toast.info("Refreshing data…");
 */

const listeners = new Set();
let idCounter = 0;

function emit(type, message, duration = 4000) {
  const id = ++idCounter;
  const event = { id, type, message, duration };
  listeners.forEach((fn) => fn(event));
  return id;
}

export const toast = {
  success: (msg, duration) => emit("success", msg, duration),
  error:   (msg, duration) => emit("error", msg, duration ?? 5000),
  info:    (msg, duration) => emit("info", msg, duration),
  warning: (msg, duration) => emit("warning", msg, duration),
};

/** Subscribe to toast events. Returns an unsubscribe function. */
export function onToast(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
