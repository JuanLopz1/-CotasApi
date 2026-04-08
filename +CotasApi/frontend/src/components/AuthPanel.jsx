import { useState } from "react";

function AuthPanel({ currentUser, isLoggingIn, onLogin, onLogout }) {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");

  if (currentUser) {
    return (
      <div className="auth-panel auth-panel-logged">
        <div>
          <p className="auth-name">{currentUser.name}</p>
          <p className="auth-role">{currentUser.role}</p>
        </div>
        <button type="button" className="btn auth-logout-btn" onClick={onLogout}>
          Logout
        </button>
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onLogin(email.trim(), password);
  }

  return (
    <form className="auth-panel" onSubmit={handleSubmit}>
      <input
        type="email"
        className="auth-input"
        placeholder="Admin email (optional)"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        required
      />
      <input
        type="password"
        className="auth-input"
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      <button type="submit" className="btn btn-primary auth-login-btn" disabled={isLoggingIn}>
        {isLoggingIn ? "Logging in..." : "Admin login only"}
      </button>
    </form>
  );
}

export default AuthPanel;
