import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Redirect } from "wouter";
import { fetchCurrentUser } from "../redux/slices/authSlice";
import { getAccessToken } from "../lib/api";
import { UniqueLoader } from "./UniqueLoader";

/**
 * UnauthGuard — protects public-only routes (login, register).
 *
 * Behavior:
 * - If NOT authenticated → render children (login/register page)
 * - If authenticated → redirect to / (dashboard)
 * - If tokens exist, verify them first before deciding
 * - Shows a loading spinner during auth check
 */
export function UnauthGuard({ children }) {
  const dispatch = useDispatch();
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const token = getAccessToken();

    if (isAuthenticated && user) {
      // Already authenticated — will redirect
      setChecking(false);
    } else if (token && !user) {
      // Token exists but no user — check if it's valid
      dispatch(fetchCurrentUser()).finally(() => setChecking(false));
    } else {
      // No token — not authenticated
      setChecking(false);
    }
  }, [dispatch, isAuthenticated, user]);

  if (checking || loading) {
    return <UniqueLoader message="Syncing workspace..." />;
  }

  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  return children;
}
