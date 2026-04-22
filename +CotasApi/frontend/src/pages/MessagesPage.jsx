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

/** API uses camelCase; tolerate PascalCase. Treat empty string as missing. */
function inboxLastPreview(row) {
  const raw = row.lastMessagePreview ?? row.LastMessagePreview ?? "";
  return typeof raw === "string" ? raw.trim() : "";
}

function inboxLastAt(row) {
  return row.lastMessageAt ?? row.LastMessageAt ?? null;
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
      conversationId: row.conversationId ?? row.ConversationId,
      petPostId: row.petPostId ?? row.PetPostId,
      petName: row.petName ?? row.PetName ?? "Pet"
    });
  }

  function closeModal() {
    setModal((m) => ({ ...m, open: false }));
    load();
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
            {rows.map((row, index) => {
              const preview = inboxLastPreview(row);
              const lastAt = inboxLastAt(row);
              const hasMessage = Boolean(lastAt);
              return (
              <li
                key={row.conversationId ?? row.ConversationId}
                className="messages-inbox-card panel messages-inbox-card--enter"
                style={{ animationDelay: `${Math.min(index * 55, 440)}ms` }}
              >
                <div className="messages-inbox-main">
                  <p className="messages-inbox-pet">{row.petName ?? row.PetName ?? "Pet"}</p>
                  {(row.listingTitle ?? row.ListingTitle) ? (
                    <p className="messages-inbox-title muted">{row.listingTitle ?? row.ListingTitle}</p>
                  ) : null}
                  <p className="messages-inbox-with muted">
                    {isAdmin ? "Participants: " : "With: "}
                    <span>{row.otherPartyName ?? row.OtherPartyName}</span>
                  </p>
                  {hasMessage ? (
                    preview ? (
                      <p className="messages-inbox-preview">{preview}</p>
                    ) : (
                      <p className="muted messages-inbox-preview messages-inbox-preview--fallback">
                        (Preview unavailable — open thread to read the latest message.)
                      </p>
                    )
                  ) : (
                    <p className="muted messages-inbox-preview">No messages yet — open the thread to say hello.</p>
                  )}
                  <p className="messages-inbox-meta muted">
                    {lastAt ? (
                      <>
                        Last message <time dateTime={lastAt}>{formatWhen(lastAt)}</time>
                      </>
                    ) : (
                      <>
                        Started <time dateTime={row.createdAt ?? row.CreatedAt}>{formatWhen(row.createdAt ?? row.CreatedAt)}</time>
                      </>
                    )}
                  </p>
                </div>
                <div className="messages-inbox-actions">
                  <button type="button" className="btn btn-primary" onClick={() => openThread(row)}>
                    Open thread
                  </button>
                  <Link className="btn btn-secondary" to={`/post/${row.petPostId ?? row.PetPostId}`}>
                    View listing
                  </Link>
                </div>
              </li>
            );
            })}
          </ul>
        )}
      </div>
    </>
  );
}
