import { useId, useState } from "react";
import { Link, Navigate, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";

export default function LoginPage() {
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, isLoggingIn, onLogin } = useOutletContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState("");

  const token = currentUser?.token ?? currentUser?.Token;
  const from = searchParams.get("from") || "/";

  if (token) {
    return <Navigate to={from.startsWith("/login") ? "/" : from} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFieldError("");
    try {
      await onLogin(email.trim(), password);
      const target = from.startsWith("/login") ? "/" : from;
      navigate(target, { replace: true });
    } catch (error) {
      setFieldError(error?.message || "Login failed.");
    }
  }

  return (
    <div className="auth-page section-reveal">
      <section className="panel auth-page-panel" aria-labelledby="login-heading">
        <h1 id="login-heading">Sign in</h1>
        <p className="muted auth-page-lead">
          Use your +cotas account to create listings, message posters, save hearts, and comment.
        </p>

        <form className="auth-page-form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Email</span>
            <input
              id={emailId}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldError("");
              }}
              required
              aria-invalid={fieldError ? "true" : undefined}
              aria-describedby={fieldError ? errorId : undefined}
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              id={passwordId}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldError("");
              }}
              required
              aria-invalid={fieldError ? "true" : undefined}
              aria-describedby={fieldError ? errorId : undefined}
            />
          </label>
          {fieldError ? (
            <p id={errorId} className="field-error-inline" role="alert">
              {fieldError}
            </p>
          ) : null}
          <button type="submit" className="btn btn-primary auth-page-submit" disabled={isLoggingIn}>
            {isLoggingIn ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="muted auth-page-switch">
          New here?{" "}
          <Link to={`/register?from=${encodeURIComponent(from)}`}>Create an account</Link>
        </p>
        <p className="auth-page-demo muted">
          Demo: staff <code>admin@example.com</code> / <code>admin123</code> · user{" "}
          <code>juan@example.com</code> / <code>123456</code>
        </p>
      </section>
    </div>
  );
}
