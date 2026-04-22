import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import { useToast } from "../context/ToastContext";

export default function ContactInquiryModal({ open, onClose, petName, leadHint }) {
  const titleId = useId();
  const nameId = useId();
  const emailId = useId();
  const messageId = useId();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setEmail("");
      setMessage("");
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  function backdropClick(event) {
    if (event.target === event.currentTarget) onClose();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const n = name.trim();
    const em = email.trim();
    const msg = message.trim();
    if (!n || !em || !msg || submitting) return;
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 450));
      showToast("Thanks — your message was sent to the listing team.", "success");
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div className="modal-overlay modal-overlay--conversation" role="presentation" onClick={backdropClick}>
      <div
        className="modal-panel-wrap modal-panel-wrap--conversation"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <section className="modal-panel contact-inquiry-panel">
          <header className="modal-head">
            <h2 id={titleId}>Contact about {petName}</h2>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </header>
          {leadHint ? <p className="muted contact-inquiry-lead">{leadHint}</p> : null}
          <form className="contact-inquiry-form form-grid" onSubmit={handleSubmit}>
            <label className="field" htmlFor={nameId}>
              <span>Your name</span>
              <input
                id={nameId}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                autoComplete="name"
              />
            </label>
            <label className="field" htmlFor={emailId}>
              <span>Email</span>
              <input
                id={emailId}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={120}
                autoComplete="email"
              />
            </label>
            <label className="field field-full" htmlFor={messageId}>
              <span>Message</span>
              <textarea
                id={messageId}
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={800}
                placeholder="Describe what you saw, how to reach you, or questions for the poster."
              />
            </label>
            <div className="contact-inquiry-actions">
              <button type="button" className="btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Sending…" : "Send message"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>,
    document.body
  );
}
