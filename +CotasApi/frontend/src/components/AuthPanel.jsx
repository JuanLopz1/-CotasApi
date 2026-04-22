import { Link } from "react-router-dom";

function AuthPanel({ currentUser, onLogout }) {
  if (currentUser) {
    const name = currentUser.name ?? currentUser.Name ?? "Account";
    const role = currentUser.role ?? currentUser.Role ?? "";
    return (
      <div className="auth-panel auth-panel-logged">
        <div className="auth-panel-user">
          <p className="auth-name">{name}</p>
          <p className="auth-role">{role}</p>
        </div>
        <button type="button" className="btn auth-logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="auth-panel auth-panel-compact" role="navigation" aria-label="Account">
      <Link to="/login" className="btn btn-secondary auth-nav-btn">
        Sign in
      </Link>
      <Link to="/register" className="btn btn-primary auth-nav-btn">
        Register
      </Link>
    </div>
  );
}

export default AuthPanel;
