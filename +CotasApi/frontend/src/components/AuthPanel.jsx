import { useId, useState } from "react";

function AuthPanel({ currentUser, isLoggingIn, onLogin, onLogout }) {
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState("");

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
    setFieldError("");
    try {
      await onLogin(email.trim(), password);
    } catch (error) {
      setFieldError(error?.message || "Login failed.");
    }
  }

  return (
    <form className="auth-panel" onSubmit={handleSubmit} noValidate>
      <div className="auth-field">
        <label className="auth-field-label" htmlFor={emailId}>
          Email
        </label>
        <input
          id={emailId}
          type="email"
          className="auth-input"
          placeholder="you@school.edu"
          autoComplete="username"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setFieldError("");
          }}
          required
          aria-invalid={fieldError ? "true" : undefined}
          aria-describedby={fieldError ? errorId : undefined}
        />
      </div>
      <div className="auth-field">
        <label className="auth-field-label" htmlFor={passwordId}>
          Password
        </label>
        <input
          id={passwordId}
          type="password"
          className="auth-input"
          placeholder="••••••••"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
            setFieldError("");
          }}
          required
          aria-invalid={fieldError ? "true" : undefined}
          aria-describedby={fieldError ? errorId : undefined}
        />
      </div>
      {fieldError ? (
        <p id={errorId} className="auth-field-error" role="alert">
          {fieldError}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary auth-login-btn" disabled={isLoggingIn}>
        {isLoggingIn ? "Logging in…" : "Admin sign in"}
      </button>
    </form>
  );
}

export default AuthPanel;
