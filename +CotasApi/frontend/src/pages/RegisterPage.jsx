import { useId, useState } from "react";
import { Link, Navigate, useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import { register as registerRequest } from "../api/authApi";

export default function RegisterPage() {
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const errorId = useId();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, onAuthSuccess } = useOutletContext();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = currentUser?.token ?? currentUser?.Token;
  const from = searchParams.get("from") || "/";

  if (token) {
    return <Navigate to={from.startsWith("/register") ? "/" : from} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFieldError("");
    const n = name.trim();
    const em = email.trim();
    if (password.length < 6) {
      setFieldError("Password must be at least 6 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await registerRequest(n, em, password);
      onAuthSuccess(data);
      const target = from.startsWith("/register") ? "/" : from;
      navigate(target, { replace: true });
    } catch (error) {
      setFieldError(error?.message?.replace(/^"|"$/g, "") || "Could not create account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page section-reveal">
      <section className="panel auth-page-panel" aria-labelledby="register-heading">
        <h1 id="register-heading">Create an account</h1>
        <p className="muted auth-page-lead">
          Join +cotas to post listings, contact owners, save adoption posts you love, and join the conversation.
        </p>

        <form className="auth-page-form" onSubmit={handleSubmit} noValidate>
          <label className="field">
            <span>Your name</span>
            <input
              id={nameId}
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFieldError("");
              }}
              required
              maxLength={100}
            />
          </label>
          <label className="field">
            <span>Email</span>
            <input
              id={emailId}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldError("");
              }}
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              id={passwordId}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldError("");
              }}
              required
              minLength={6}
            />
          </label>
          {fieldError ? (
            <p id={errorId} className="field-error-inline" role="alert">
              {fieldError}
            </p>
          ) : null}
          <button type="submit" className="btn btn-primary auth-page-submit" disabled={submitting}>
            {submitting ? "Creating account…" : "Register"}
          </button>
        </form>

        <p className="muted auth-page-switch">
          Already have an account?{" "}
          <Link to={`/login?from=${encodeURIComponent(from)}`}>Sign in</Link>
        </p>
      </section>
    </div>
  );
}
