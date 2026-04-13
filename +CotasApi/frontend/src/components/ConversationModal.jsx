import { useCallback, useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  getConversationMessages,
  sendConversationMessage,
  startConversation
} from "../api/conversationsApi";
import { useToast } from "../context/ToastContext";

export default function ConversationModal({
  open,
  petPostId,
  initialConversationId = null,
  token,
  onClose,
  petName
}) {
  const titleId = useId();
  const { showToast } = useToast();
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [phase, setPhase] = useState("idle");
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(
    async (cid) => {
      const rows = await getConversationMessages(cid, token);
      setMessages(Array.isArray(rows) ? rows : []);
    },
    [token]
  );

  useEffect(() => {
    if (!open || !token) {
      return undefined;
    }

    const existingId =
      initialConversationId != null && Number(initialConversationId) > 0
        ? Number(initialConversationId)
        : null;

    if (existingId == null && !petPostId) {
      return undefined;
    }

    let cancelled = false;

    async function boot() {
      setPhase("loading");
      setConversationId(null);
      setMessages([]);
      try {
        if (existingId != null) {
          if (cancelled) return;
          setConversationId(existingId);
          await loadMessages(existingId);
          if (cancelled) return;
          setPhase("ready");
          return;
        }

        const summary = await startConversation(petPostId, token);
        if (cancelled) return;
        setConversationId(summary.conversationId);
        await loadMessages(summary.conversationId);
        if (cancelled) return;
        setPhase("ready");
      } catch (error) {
        if (cancelled) return;
        showToast(error?.message || "Could not open conversation.", "error");
        setPhase("error");
      }
    }

    boot();
    return () => {
      cancelled = true;
    };
  }, [open, petPostId, initialConversationId, token, loadMessages, showToast]);

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

  async function handleSend(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || !conversationId || sending) return;
    setSending(true);
    try {
      const msg = await sendConversationMessage(conversationId, text, token);
      setMessages((previous) => [...previous, msg]);
      setDraft("");
    } catch (error) {
      showToast(error?.message || "Could not send message.", "error");
    } finally {
      setSending(false);
    }
  }

  if (!open) {
    return null;
  }

  function backdropClick(event) {
    if (event.target === event.currentTarget) onClose();
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
        <section className="modal-panel conversation-panel">
          <header className="modal-head">
            <h2 id={titleId}>Messages · {petName}</h2>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
              ×
            </button>
          </header>

          {phase === "loading" ? (
            <p className="conversation-loading muted">Opening thread…</p>
          ) : null}
          {phase === "error" ? (
            <p className="conversation-error muted">Something went wrong. Close and try again.</p>
          ) : null}

          {phase === "ready" ? (
            <>
              <div className="conversation-thread" role="log" aria-live="polite">
                {messages.length === 0 ? (
                  <p className="muted conversation-empty">Say hello — your first message opens the thread.</p>
                ) : (
                  messages.map((m) => (
                    <article key={m.messageId} className="conversation-bubble">
                      <p className="conversation-meta muted">
                        <strong>{m.senderName}</strong>
                        <span aria-hidden="true"> · </span>
                        <time dateTime={m.sentAt}>
                          {new Date(m.sentAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </time>
                      </p>
                      <p className="conversation-text">{m.content}</p>
                    </article>
                  ))
                )}
              </div>
              <form className="conversation-compose" onSubmit={handleSend}>
                <label className="sr-only" htmlFor="conversation-input">
                  Message
                </label>
                <textarea
                  id="conversation-input"
                  rows={3}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  maxLength={500}
                  placeholder="Write a message to the listing contact…"
                />
                <div className="conversation-compose-actions">
                  <button type="button" className="btn" onClick={onClose}>
                    Close
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={sending || !draft.trim()}>
                    {sending ? "Sending…" : "Send"}
                  </button>
                </div>
              </form>
            </>
          ) : null}
        </section>
      </div>
    </div>,
    document.body
  );
}
