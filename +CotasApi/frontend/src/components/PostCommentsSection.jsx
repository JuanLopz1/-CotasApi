import { useCallback, useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import { deleteComment, getComments, postComment } from "../api/commentsApi";
import { useToast } from "../context/ToastContext";

function formatCommentTime(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function PostCommentsSection({
  petPostId,
  token,
  isAdmin = false,
  authorNameDefault = ""
}) {
  const headingId = useId();
  const { showToast } = useToast();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loginReturn = `/post/${petPostId}`;

  useEffect(() => {
    if (authorNameDefault) {
      setAuthorName((prev) => (prev ? prev : authorNameDefault));
    }
  }, [authorNameDefault]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getComments(petPostId, token);
      setComments(Array.isArray(data) ? data : []);
    } catch {
      showToast("Could not load comments.", "error");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [petPostId, token, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!token) {
      showToast("Sign in to post a comment.", "info");
      return;
    }
    const name = authorName.trim();
    const text = content.trim();
    if (!name || !text) return;
    setSubmitting(true);
    try {
      const created = await postComment(petPostId, { authorName: name, content: text }, token);
      setComments((previous) => [...previous, created]);
      setContent("");
      showToast("Comment posted.", "success");
    } catch {
      showToast("Could not post comment. Make sure you are signed in.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId) {
    if (!token || !isAdmin) return;
    const ok = window.confirm("Remove this comment?");
    if (!ok) return;
    setDeletingId(commentId);
    try {
      await deleteComment(petPostId, commentId, token);
      setComments((previous) => previous.filter((c) => c.petPostCommentId !== commentId));
      showToast("Comment removed.", "success");
    } catch {
      showToast("Could not delete comment.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="panel-soft comments-section section-reveal" aria-labelledby={headingId}>
      <h2 id={headingId} className="comments-heading">
        Public notes &amp; questions
      </h2>
      <p className="muted comments-lead">
        Everyone can read these threads. Sign in to add a note, ask a question, or share a sighting.
      </p>

      {loading ? (
        <p className="muted" aria-busy="true">
          Loading comments…
        </p>
      ) : comments.length === 0 ? (
        <p className="muted comments-empty">
          {token
            ? "No comments yet — be the first to add one."
            : "No comments yet — sign in to start the conversation."}
        </p>
      ) : (
        <ul className="comments-list">
          {comments.map((c) => (
            <li key={c.petPostCommentId} className="comments-item">
              <div className="comments-item-head">
                <span className="comments-author">{c.authorName}</span>
                <div className="comments-item-head-right">
                  <time className="muted comments-time" dateTime={c.createdAt}>
                    {formatCommentTime(c.createdAt)}
                  </time>
                  {isAdmin && token ? (
                    <button
                      type="button"
                      className="btn btn-danger comments-delete-btn"
                      disabled={deletingId === c.petPostCommentId}
                      onClick={() => handleDelete(c.petPostCommentId)}
                    >
                      {deletingId === c.petPostCommentId ? "Removing…" : "Delete"}
                    </button>
                  ) : null}
                </div>
              </div>
              <p className="comments-body">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      {token ? (
        <form className="comments-form form-grid" onSubmit={handleSubmit}>
          <label className="field">
            <span>Your name</span>
            <input
              required
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              maxLength={80}
              autoComplete="name"
            />
          </label>
          <label className="field field-full">
            <span>Comment</span>
            <textarea
              required
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
              placeholder="e.g. I saw this pet near the park yesterday evening."
            />
          </label>
          <button type="submit" className="btn btn-secondary comments-submit" disabled={submitting}>
            {submitting ? "Posting…" : "Post comment"}
          </button>
        </form>
      ) : (
        <div className="comments-sign-in-hint panel-soft">
          <p className="muted comments-sign-in-text">Sign in to add a public comment on this listing.</p>
          <Link
            className="btn btn-primary comments-sign-in-btn"
            to={`/login?from=${encodeURIComponent(loginReturn)}`}
          >
            Sign in to comment
          </Link>
        </div>
      )}
    </section>
  );
}
