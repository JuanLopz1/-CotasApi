import { useCallback, useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { getMyConversations } from "../api/conversationsApi";
import ConversationModal from "../components/ConversationModal";
import { useToast } from "../context/ToastContext";

function formatWhen(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function MessagesPage() {
  const { currentUser, isAdmin } = useOutletContext();
  const { showToast } = useToast();
  const token = currentUser?.token ?? currentUser?.Token;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(Boolean(token));
  const [modal, setModal] = useState({
    open: false,
    conversationId: null,
    petPostId: null,
    petName: ""
  });

  const load = useCallback(async () => {
    if (!token) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getMyConversations(token);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast(e?.message || "Could not load conversations.", "error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  function openThread(row) {
    setModal({
      open: true,
      conversationId: row.conversationId,
      petPostId: row.petPostId,
      petName: row.petName
    });
  }

  function closeModal() {
    setModal((m) => ({ ...m, open: false }));
    load();
  }

  if (!token) {
    return (
      <div className="panel empty-state empty-state--warm section-reveal" role="status">
        <h1 className="empty-state-title">Messages</h1>
        <p className="empty-state-text">Sign in to see your conversations about listings.</p>
        <p className="muted messages-guest-hint">
          Use <strong>Admin sign in</strong> in the top bar, then open this page again.
        </p>
      </div>
    );
  }

  return (
    <>
      <ConversationModal
        open={modal.open}
        petPostId={modal.petPostId}
        initialConversationId={modal.conversationId}
        token={token}
        petName={modal.petName}
        onClose={closeModal}
      />

      <div className="messages-page section-reveal">
        <header className="messages-page-head">
          <h1 id="messages-page-heading">Messages</h1>
          <p className="muted messages-page-lead">
            {isAdmin
              ? "All listing threads (staff view). Open a row to read or reply."
              : "Private threads you started or received about a pet listing."}
          </p>
        </header>

        {loading ? (
          <p className="muted" aria-busy="true">
            Loading conversations…
          </p>
        ) : rows.length === 0 ? (
          <div className="panel empty-state empty-state--warm" role="status">
            <p className="empty-state-title">No conversations yet</p>
            <p className="empty-state-text">
              Open a listing and use the action button to message the poster. Threads you start will show up here.
            </p>
            <Link className="btn btn-primary empty-state-cta" to="/">
              Browse pets
            </Link>
          </div>
        ) : (
          <ul className="messages-inbox-list" aria-labelledby="messages-page-heading">
            {rows.map((row) => (
              <li key={row.conversationId} className="messages-inbox-card panel">
                <div className="messages-inbox-main">
                  <p className="messages-inbox-pet">{row.petName}</p>
                  {row.listingTitle ? <p className="messages-inbox-title muted">{row.listingTitle}</p> : null}
                  <p className="messages-inbox-with muted">
                    {isAdmin ? "Participants: " : "With: "}
                    <span>{row.otherPartyName}</span>
                  </p>
                  {row.lastMessagePreview ? (
                    <p className="messages-inbox-preview">{row.lastMessagePreview}</p>
                  ) : (
                    <p className="muted messages-inbox-preview">No messages yet — open to say hello.</p>
                  )}
                  <p className="messages-inbox-meta muted">
                    {row.lastMessageAt ? (
                      <>
                        Last message <time dateTime={row.lastMessageAt}>{formatWhen(row.lastMessageAt)}</time>
                      </>
                    ) : (
                      <>Started <time dateTime={row.createdAt}>{formatWhen(row.createdAt)}</time></>
                    )}
                  </p>
                </div>
                <div className="messages-inbox-actions">
                  <button type="button" className="btn btn-primary" onClick={() => openThread(row)}>
                    Open thread
                  </button>
                  <Link className="btn btn-secondary" to={`/post/${row.petPostId}`}>
                    View listing
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
