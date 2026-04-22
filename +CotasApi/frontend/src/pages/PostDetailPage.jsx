import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
  deletePetPost,
  getPetPost,
  likeErrorMessage,
  petCategoryLabel,
  postTypeOptions,
  preferredContactLabel,
  statusPresentation,
  togglePetLike,
  updatePetPost,
  updatePetPostStatus
} from "../api/petPostsApi";
import ContactInquiryModal from "../components/ContactInquiryModal";
import ConversationModal from "../components/ConversationModal";
import PetPostEditModal from "../components/PetPostEditModal";
import PostCommentsSection from "../components/PostCommentsSection";
import { useToast } from "../context/ToastContext";

function getOptionLabel(options, value) {
  const option = options.find((item) => item.value === value);
  return option ? option.label : "Unknown";
}

function formatDate(dateText) {
  const date = new Date(dateText);
  return Number.isNaN(date.getTime())
    ? "Unknown date"
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
}

const NO_PHOTO_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='900' height='560' viewBox='0 0 900 560'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#f4ebe4'/><stop offset='100%' stop-color='#e8ddd4'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><text x='50%' y='52%' text-anchor='middle' fill='#7d6a5c' font-family='Segoe UI,system-ui,sans-serif' font-size='24' font-weight='600'>No photo</text></svg>`
  );

function ctaForPostType(postType) {
  if (postType === 1) {
    return {
      messageLabel: "I've seen this pet",
      messageHint: "Send a private message to the person who posted this lost pet."
    };
  }
  if (postType === 2) {
    return {
      messageLabel: "This might be my pet",
      messageHint: "Message the finder to compare details safely."
    };
  }
  return {
    messageLabel: "Contact owner",
    messageHint: "Introduce yourself and ask how to move forward with adoption."
  };
}

function currentUserId(user) {
  if (!user) return null;
  const raw = user.userId ?? user.UserId;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export default function PostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { clientId, currentUser, isAdmin } = useOutletContext();
  const { showToast } = useToast();

  const [post, setPost] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [imageBroken, setImageBroken] = useState(false);
  const [conversationOpen, setConversationOpen] = useState(false);
  const [contactInquiryOpen, setContactInquiryOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [isManagingPosts, setIsManagingPosts] = useState(false);

  const postId = Number(id);
  const token = currentUser?.token ?? currentUser?.Token;
  const uid = useMemo(() => currentUserId(currentUser), [currentUser]);

  const loadPost = useCallback(async () => {
    if (!Number.isFinite(postId) || postId <= 0) {
      setLoadState("missing");
      return;
    }
    setLoadState("loading");
    try {
      const data = await getPetPost(postId, clientId, token);
      setPost(data);
      setImageBroken(false);
      setLoadState("ready");
    } catch {
      setPost(null);
      setLoadState("missing");
    }
  }, [postId, clientId, token]);

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  const closeEditor = useCallback(() => {
    setEditingPost(null);
  }, []);

  async function handleSaveEdit(payload) {
    if (!editingPost || !token) {
      return;
    }
    setIsManagingPosts(true);
    try {
      await updatePetPost(editingPost.petPostId, payload, token);
      await loadPost();
      showToast("Post updated successfully.", "success");
      setEditingPost(null);
    } catch (error) {
      showToast(error?.message || "Could not update post.", "error");
    } finally {
      setIsManagingPosts(false);
    }
  }

  async function handleModerate(status) {
    if (!isAdmin || !post) {
      showToast("Admin access required to moderate posts.", "error");
      return;
    }
    setIsManagingPosts(true);
    try {
      await updatePetPostStatus(post.petPostId, status, token);
      await loadPost();
      showToast("Moderation status updated.", "success");
    } catch {
      showToast("You do not have permission for this action.", "error");
    } finally {
      setIsManagingPosts(false);
    }
  }

  async function handleDelete() {
    if (!isAdmin || !post) {
      return;
    }
    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) return;
    setIsManagingPosts(true);
    try {
      await deletePetPost(post.petPostId, token);
      showToast("Post deleted successfully.", "success");
      navigate("/");
    } catch (error) {
      showToast(error?.message || "Could not delete post.", "error");
    } finally {
      setIsManagingPosts(false);
    }
  }

  async function handleToggleLike() {
    if (!post) return;
    if (!token) {
      showToast("Sign in to like adoption posts.", "info");
      navigate(`/login?from=${encodeURIComponent(`/post/${post.petPostId}`)}`);
      return;
    }
    try {
      const result = await togglePetLike(post.petPostId, clientId);
      setPost((previous) =>
        previous
          ? {
              ...previous,
              likesCount: result.likesCount,
              isLikedByCurrentUser: result.isLiked
            }
          : previous
      );
    } catch (error) {
      showToast(likeErrorMessage(error), "error");
    }
  }

  const mailtoHref = useMemo(() => {
    if (!post?.contactEmail) return null;
    const subject = encodeURIComponent(`+cotas: ${post.petName}`);
    return `mailto:${encodeURIComponent(post.contactEmail)}?subject=${subject}`;
  }, [post]);

  const telHref = useMemo(() => {
    const raw = post?.contactPhone?.trim();
    if (!raw) return null;
    const digits = raw.replace(/[^\d+]/g, "");
    return digits ? `tel:${digits}` : `tel:${raw}`;
  }, [post]);

  async function handleCopyListingLink() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      showToast("Listing link copied.", "success");
    } catch {
      showToast("Could not copy automatically — copy from the address bar.", "error");
    }
  }

  if (loadState === "loading") {
    return (
      <div className="post-detail post-detail--loading section-reveal" aria-busy="true">
        <h1 className="sr-only">Loading listing</h1>
        <div className="panel post-detail-skeleton">
          <div className="post-detail-skeleton-media" />
          <div className="post-detail-skeleton-lines" />
        </div>
      </div>
    );
  }

  if (loadState === "missing" || !post) {
    return (
      <div className="panel empty-state empty-state--warm section-reveal" role="status">
        <h1 className="empty-state-title">This listing is not available.</h1>
        <p className="empty-state-text">It may have been removed, or the link could be incorrect.</p>
        <Link className="btn btn-primary empty-state-cta" to="/">
          Back to browse
        </Link>
      </div>
    );
  }

  const status = statusPresentation(post);
  const postTypeLabel = getOptionLabel(postTypeOptions, post.postType);
  const categoryLine = petCategoryLabel(post);
  const cta = ctaForPostType(post.postType);
  const hasImageUrl = Boolean(post.imageUrl && String(post.imageUrl).trim());
  const showPhoto = hasImageUrl && !imageBroken;
  const imageSrc = hasImageUrl ? post.imageUrl : NO_PHOTO_SVG;
  const isAdoption = post.postType === 0;
  const isOwnListing = uid !== null && uid === post.userId;
  const canMessage = Boolean(token) && !isOwnListing;
  const showContactInquiry = !isOwnListing;
  const isPendingReview = post.status === 0;

  return (
    <>
      {editingPost ? (
        <PetPostEditModal
          key={editingPost.petPostId}
          post={editingPost}
          isSaving={isManagingPosts}
          onClose={closeEditor}
          onSave={handleSaveEdit}
        />
      ) : null}

      <ContactInquiryModal
        open={contactInquiryOpen}
        petName={post.petName}
        leadHint={cta.messageHint}
        onClose={() => setContactInquiryOpen(false)}
      />

      <ConversationModal
        open={conversationOpen}
        petPostId={post.petPostId}
        token={token}
        petName={post.petName}
        onClose={() => setConversationOpen(false)}
      />

      <article className="post-detail section-reveal" aria-labelledby="detail-pet-name">
        <nav className="detail-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Browse pets</Link>
          <span aria-hidden="true" className="detail-breadcrumb-sep">
            /
          </span>
          <span className="muted">{post.petName}</span>
        </nav>

        {isOwnListing && isPendingReview ? (
          <div className="detail-owner-review-banner panel-soft section-reveal" role="status">
            <p className="detail-owner-review-title">Your listing is in review</p>
            <p className="detail-owner-review-text muted">
              It is not visible on the public board until approved. You will get an update soon. If we need more
              information, staff may contact you using the email or phone on this listing.
            </p>
          </div>
        ) : null}

        <div className="detail-share-row">
          <button type="button" className="btn ghost-btn detail-copy-link-btn" onClick={handleCopyListingLink}>
            Copy listing link
          </button>
        </div>

        <div className="panel post-detail-hero">
          <div className="post-detail-media-wrap">
            {showPhoto ? (
              <img
                className="post-detail-media"
                src={imageSrc}
                alt={`Photo of ${post.petName}`}
                width={900}
                height={560}
                loading="lazy"
                decoding="async"
                onError={() => setImageBroken(true)}
              />
            ) : (
              <div className="post-detail-media post-detail-media-placeholder" role="img" aria-label="No photo">
                <img src={NO_PHOTO_SVG} alt="" className="post-detail-fallback-img" />
              </div>
            )}
            <span className={`status-pill detail-status-pill ${status.className}`}>{status.label}</span>
            {isAdoption ? (
              <button
                type="button"
                className={`fav-btn detail-fav-btn ${post.isLikedByCurrentUser ? "fav-btn-active" : ""}`}
                aria-pressed={post.isLikedByCurrentUser}
                aria-label={post.isLikedByCurrentUser ? "Unlike this adoption post" : "Like this adoption post"}
                onClick={handleToggleLike}
              >
                <span aria-hidden="true">{post.isLikedByCurrentUser ? "♥" : "♡"}</span>{" "}
                <span>{post.likesCount ?? 0}</span>
              </button>
            ) : null}
          </div>

          <div className="post-detail-body">
            <p className="detail-kicker muted">{postTypeLabel}</p>
            <h1 id="detail-pet-name">{post.petName}</h1>
            <p className="detail-meta muted">
              <span>{categoryLine}</span>
              <span aria-hidden="true"> · </span>
              <time dateTime={post.datePosted}>{formatDate(post.datePosted)}</time>
            </p>
            {post.title ? <p className="detail-title-line">{post.title}</p> : null}

            <dl className="detail-facts">
              <div>
                <dt>Location</dt>
                <dd>{post.location || "—"}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{categoryLine}</dd>
              </div>
              {isAdoption ? (
                <div>
                  <dt>Hearts</dt>
                  <dd>{post.likesCount ?? 0}</dd>
                </div>
              ) : null}
            </dl>

            <section className="detail-contact panel-soft section-reveal" aria-labelledby="contact-heading">
              <h2 id="contact-heading" className="detail-contact-title">
                Contact
              </h2>
              <p className="muted detail-contact-pref">
                Preferred: {preferredContactLabel(post.preferredContact)}
              </p>
              <ul className="detail-contact-list">
                <li>
                  <span className="muted">Email</span>{" "}
                  {mailtoHref ? (
                    <a className="detail-contact-link" href={mailtoHref}>
                      {post.contactEmail}
                    </a>
                  ) : (
                    <span>{post.contactEmail || "—"}</span>
                  )}
                </li>
                <li>
                  <span className="muted">Phone</span>{" "}
                  {telHref ? (
                    <a className="detail-contact-link" href={telHref}>
                      {post.contactPhone}
                    </a>
                  ) : (
                    <span>{post.contactPhone?.trim() || "—"}</span>
                  )}
                </li>
              </ul>
            </section>

            <div className="detail-description">
              <h2 className="sr-only">Description</h2>
              <p>{post.description}</p>
            </div>

            {post.petKindLabel?.trim() ? (
              <section className="detail-notes panel-soft section-reveal" aria-labelledby="notes-heading">
                <h2 id="notes-heading" className="detail-notes-heading">
                  Breed &amp; notes
                </h2>
                <p className="detail-notes-text">{post.petKindLabel.trim()}</p>
              </section>
            ) : null}

            <section className="detail-cta-block panel-soft section-reveal" aria-labelledby="cta-heading">
              <h2 id="cta-heading" className="sr-only">
                Next steps
              </h2>
              <div className="detail-cta-row">
                {mailtoHref ? (
                  <a className="btn btn-primary detail-cta-mail" href={mailtoHref}>
                    Send email
                  </a>
                ) : null}
                {telHref ? (
                  <a className="btn btn-secondary detail-cta-phone" href={telHref}>
                    Call
                  </a>
                ) : null}
                {showContactInquiry ? (
                  <button
                    type="button"
                    className="btn btn-primary detail-cta-message"
                    onClick={() => setContactInquiryOpen(true)}
                  >
                    {cta.messageLabel}
                  </button>
                ) : null}
                {canMessage ? (
                  <button
                    type="button"
                    className="btn btn-accent detail-cta-private-chat"
                    onClick={() => setConversationOpen(true)}
                  >
                    Private chat
                  </button>
                ) : null}
              </div>
              {!token && showContactInquiry ? (
                <p className="detail-cta-hint muted">
                  Use <strong>{cta.messageLabel}</strong> to reach out by email (simulated). <strong>Sign in</strong> for
                  private in-app chat with the poster.
                </p>
              ) : null}
              {token && isOwnListing ? (
                <p className="detail-cta-hint muted">
                  {isPendingReview
                    ? "When your listing is approved, visitors can reach you from this page. Keep an eye on your email and phone for messages from staff if anything is unclear."
                    : "This is your listing — watchers can contact you from here."}
                </p>
              ) : null}
              {token && showContactInquiry && !isOwnListing ? (
                <p className="detail-cta-hint muted">{cta.messageHint} Use private chat for back-and-forth messages.</p>
              ) : null}
            </section>

            {isAdmin ? (
              <div className="detail-admin card-actions" role="group" aria-label="Moderation actions">
                <button type="button" className="btn btn-success" disabled={isManagingPosts} onClick={() => handleModerate(1)}>
                  Approve
                </button>
                <button type="button" className="btn btn-danger" disabled={isManagingPosts} onClick={() => handleModerate(2)}>
                  Reject
                </button>
                <button type="button" className="btn" disabled={isManagingPosts} onClick={() => setEditingPost(post)}>
                  Edit
                </button>
                <button type="button" className="btn btn-danger" disabled={isManagingPosts} onClick={handleDelete}>
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <PostCommentsSection
          petPostId={post.petPostId}
          token={token}
          isAdmin={isAdmin}
          authorNameDefault={currentUser?.name ?? currentUser?.Name ?? ""}
        />
      </article>
    </>
  );
}
