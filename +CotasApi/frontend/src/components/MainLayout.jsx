import { useCallback, useMemo, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import BrandLogo from "./BrandLogo";
import AuthPanel from "./AuthPanel";
import Toast from "./Toast";
import { clearAuthUser, loadAuthUser, login, saveAuthUser } from "../api/authApi";
import { useToast } from "../context/ToastContext";

/** Admin JWT/API uses string "Admin"; tolerate legacy storage or numeric enum (1). */
function isUserAdmin(user) {
  if (!user) return false;
  const role = user.role ?? user.Role;
  if (role === undefined || role === null) return false;
  if (typeof role === "number") return role === 1;
  return String(role).trim().toLowerCase() === "admin";
}

export default function MainLayout({ clientId, bumpHomeList }) {
  const location = useLocation();
  const { toast, showToast, dismissToast } = useToast();
  const [currentUser, setCurrentUser] = useState(() => loadAuthUser());
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const isAdmin = isUserAdmin(currentUser);

  const handleLogin = useCallback(
    async (email, password) => {
      setIsLoggingIn(true);
      try {
        const authUser = await login(email, password);
        saveAuthUser(authUser);
        setCurrentUser(authUser);
        showToast(`Welcome, ${authUser.name}.`, "success");
        bumpHomeList?.();
      } catch (error) {
        showToast(error?.message || "Login failed.", "error");
        throw error;
      } finally {
        setIsLoggingIn(false);
      }
    },
    [showToast, bumpHomeList]
  );

  const handleLogout = useCallback(() => {
    clearAuthUser();
    setCurrentUser(null);
    showToast("You are logged out.", "success");
    bumpHomeList?.();
  }, [showToast, bumpHomeList]);

  const outletContext = useMemo(
    () => ({
      clientId,
      currentUser,
      isLoggingIn,
      isAdmin,
      onLogin: handleLogin,
      onLogout: handleLogout,
      bumpHomeList
    }),
    [clientId, currentUser, isLoggingIn, isAdmin, handleLogin, handleLogout, bumpHomeList]
  );

  const mainClassName =
    location.pathname === "/" ? "page-shell page-shell--home" : "page-shell page-shell--inner";

  return (
    <>
      <Toast toast={toast} onClose={dismissToast} />

      <main className={mainClassName} id="main-content" tabIndex={-1} aria-label="Main content">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <header className="top-nav panel" role="banner">
          <Link to="/" className="brand" aria-label="+cotas home">
            <BrandLogo className="brand-logo" alt="+cotas logo" />
          </Link>
          <nav className="nav-links" aria-label="Primary">
            <NavLink to="/" className={({ isActive }) => (isActive ? "nav-link-active" : undefined)} end>
              Browse pets
            </NavLink>
            <NavLink
              to="/create"
              className={({ isActive }) => (isActive ? "nav-link-active" : undefined)}
            >
              New post
            </NavLink>
            {currentUser ? (
              <NavLink
                to="/messages"
                className={({ isActive }) => (isActive ? "nav-link-active" : undefined)}
              >
                Messages
              </NavLink>
            ) : null}
            <Link
              to="/#about"
              className={
                location.pathname === "/" && location.hash === "#about" ? "nav-link-active" : undefined
              }
            >
              About
            </Link>
          </nav>
          <div className="nav-right">
            <Link className="btn btn-primary nav-cta" to="/create">
              + Create listing
            </Link>
            <AuthPanel
              currentUser={currentUser}
              isLoggingIn={isLoggingIn}
              onLogin={handleLogin}
              onLogout={handleLogout}
            />
          </div>
        </header>

        <div id="page-body" className="page-body">
          <Outlet context={outletContext} />
        </div>
      </main>
    </>
  );
}
