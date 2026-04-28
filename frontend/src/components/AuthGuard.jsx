import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Redirect } from "wouter";
import { fetchCurrentUser } from "../redux/slices/authSlice";
import { getAccessToken } from "../lib/api";
import { UniqueLoader } from "./UniqueLoader";

/**
 * AuthGuard — protects routes that require authentication.
 *
 * Behavior:
 * - If authenticated in Redux → render children
 * - If tokens exist in localStorage but user is null → rehydrate via /api/auth/me
 * - If not authenticated and no tokens → redirect to /login
 * - Shows a loading spinner during auth check
 */
export function AuthGuard({ children }) {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getAccessToken();

    if (isAuthenticated && user) {
      // Already authenticated with user data
      setChecking(false);
    } else if (token && !user) {
      // Token exists but no user — rehydrate
      dispatch(fetchCurrentUser()).finally(() => setChecking(false));
    } else {
      // No token — not authenticated
      setChecking(false);
    }
  }, [dispatch, isAuthenticated, user]);

  if (checking || loading) {
    return <UniqueLoader message="Verifying session..." />;
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return children;
}
