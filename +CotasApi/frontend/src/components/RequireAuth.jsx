import { Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";

/**
 * Redirects guests to /login with return path. Forwards MainLayout outlet context to child routes
 * (required so Profile, Messages, CreatePost still receive currentUser, onLogout, etc.).
 */
export default function RequireAuth() {
  const ctx = useOutletContext();
  const location = useLocation();
  const token = ctx?.currentUser?.token ?? ctx?.currentUser?.Token;

  if (!token) {
    const from = `${location.pathname}${location.search}`;
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />;
  }

  return <Outlet context={ctx} />;
}
