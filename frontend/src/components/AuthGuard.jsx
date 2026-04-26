import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Redirect } from "wouter";
import { fetchCurrentUser } from "../redux/slices/authSlice";
import { getAccessToken } from "../lib/api";

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return children;
}
