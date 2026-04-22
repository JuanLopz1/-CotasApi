import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  deletePetPost,
  getMyPetPosts,
  getPetPosts,
  likeErrorMessage,
  togglePetLike,
  updatePetPost,
  updatePetPostStatus
} from "../api/petPostsApi";
import { getMyConversations } from "../api/conversationsApi";
import PetPostCard from "../components/PetPostCard";
import PetPostEditModal from "../components/PetPostEditModal";
import { useToast } from "../context/ToastContext";

function formatRoleLabel(role) {
  const r = String(role ?? "").trim().toLowerCase();
  if (r === "admin") return "Admin / Staff";
  return "Regular user";
}

function formatWhen(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function userInitials(name) {
  const s = String(name ?? "").trim();
  if (!s) return "?";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return s.slice(0, 2).toUpperCase();
}

export default function ProfilePage() {
  const navigate = useNavigate();
  const { clientId, currentUser, isAdmin, bumpHomeList, onLogout } = useOutletContext();
  const { showToast } = useToast();
  const token = currentUser?.token ?? currentUser?.Token;

  const [myPosts, setMyPosts] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [loadingMine, setLoadingMine] = useState(true);
  const [loadingSaved, setLoadingSaved] = useState(true);
  const [loadingConvos, setLoadingConvos] = useState(true);
  const [isManagingPosts, setIsManagingPosts] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const displayName = useMemo(() => {
    if (!currentUser) return "";
    return currentUser.name ?? currentUser.Name ?? currentUser.email ?? currentUser.Email ?? "You";
  }, [currentUser]);

  const email = useMemo(
    () => currentUser?.email ?? currentUser?.Email ?? "",
    [currentUser]
  );

  const roleLabel = useMemo(
    () => formatRoleLabel(currentUser?.role ?? currentUser?.Role),
    [currentUser]
  );

  const loadMine = useCallback(async () => {
    if (!token) {
      setMyPosts([]);
      setLoadingMine(false);
      return;
    }
    setLoadingMine(true);
    try {
      const data = await getMyPetPosts(clientId, token);
      setMyPosts(Array.isArray(data) ? data : []);
    } catch (e) {
      showToast(e?.message || "Could not load your listings.", "error");
      setMyPosts([]);
    } finally {
      setLoadingMine(false);
    }
  }, [token, clientId, showToast]);

  const loadSaved = useCallback(async () => {
    setLoadingSaved(true);
    try {
      const data = await getPetPosts({ status: "", postType: "", clientId }, token);
      const list = Array.isArray(data) ? data : [];
      setSavedPosts(list.filter((p) => p.postType === 0 && p.isLikedByCurrentUser));
    } catch (e) {
      showToast(e?.message || "Could not load saved posts.", "error");
      setSavedPosts([]);
    } finally {
      setLoadingSaved(false);
    }
  }, [clientId, token, showToast]);

  const loadConversations = useCallback(async () => {
    if (!token) {
      setConversations([]);
      setLoadingConvos(false);
      return;
    }
    setLoadingConvos(true);
    try {
      const data = await getMyConversations(token);
      setConversations(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch {
      setConversations([]);
    } finally {
      setLoadingConvos(false);
    }
  }, [token]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

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
      await loadMine();
      bumpHomeList?.();
      showToast("Post updated successfully.", "success");
      setEditingPost(null);
    } catch (error) {
      showToast(error?.message || "Could not update post.", "error");
    } finally {
      setIsManagingPosts(false);
    }
  }

  async function handleModeratePost(id, status) {
    if (!isAdmin || !token) {
      showToast("Admin access required to moderate posts.", "error");
      return;
    }
    setIsManagingPosts(true);
    try {
      await updatePetPostStatus(id, status, token);
      await loadMine();
      await loadSaved();
      bumpHomeList?.();
      showToast("Moderation status updated.", "success");
    } catch {
      showToast("You do not have permission for this action.", "error");
    } finally {
      setIsManagingPosts(false);
    }
  }

  async function handleDeletePost(id) {
    if (!isAdmin || !token) {
      showToast("Admin access required to delete posts.", "error");
      return;
    }
    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) return;
    setIsManagingPosts(true);
    try {
      await deletePetPost(id, token);
      await loadMine();
      await loadSaved();
      bumpHomeList?.();
      showToast("Post deleted successfully.", "success");
    } catch (error) {
      showToast(error?.message || "Could not delete post.", "error");
    } finally {
      setIsManagingPosts(false);
    }
  }

  async function handleToggleLike(id) {
    try {
      const result = await togglePetLike(id, clientId);
      setMyPosts((previous) =>
        previous.map((post) =>
          post.petPostId === id
            ? { ...post, likesCount: result.likesCount, isLikedByCurrentUser: result.isLiked }
            : post
        )
      );
      await loadSaved();
    } catch (error) {
      showToast(likeErrorMessage(error), "error");
    }
  }

  function handleLogoutClick() {
    onLogout();
    navigate("/", { replace: true });
  }

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

      <div className="profile-page section-reveal">
        <header className="panel profile-hero" aria-labelledby="profile-heading">
          <div className="profile-hero-main">
            <div className="profile-avatar" aria-hidden="true">
              {userInitials(displayName)}
            </div>
            <div className="profile-hero-copy">
              <p className="profile-hero-kicker muted">Your +cotas space</p>
              <h1 id="profile-heading">{displayName}</h1>
              <p className="profile-hero-email muted">{email || "No email on file"}</p>
              <p className="profile-role-pill">{roleLabel}</p>
            </div>
          </div>
          <div className="profile-hero-actions">
            <Link className="btn btn-primary profile-hero-cta" to="/create">
              Create a post
            </Link>
            <Link className="btn btn-secondary profile-hero-cta" to="/messages">
              Messages
            </Link>
            <button type="button" className="btn ghost-btn profile-hero-logout" onClick={handleLogoutClick}>
              Log out
            </button>
          </div>
        </header>

        <section className="panel home-listings-panel profile-section" aria-labelledby="my-posts-heading">
          <div className="section-head">
            <h2 id="my-posts-heading">My listings</h2>
            <span className="muted">{loadingMine ? "…" : `${myPosts.length} total`}</span>
          </div>
          {!loadingMine && myPosts.some((p) => p.status === 0) ? (
            <p className="muted profile-review-note" role="status">
              Listings marked <strong>In review</strong> are not public yet. You will get an update when they are
              approved. Staff may use your contact details if they need more information.
            </p>
          ) : null}
          {loadingMine ? (
            <div className="card-grid" aria-busy="true" aria-label="Loading your posts">
              <div className="skeleton-card" />
              <div className="skeleton-card" />
            </div>
          ) : myPosts.length === 0 ? (
            <div className="empty-state empty-state--warm empty-state--soft-icon" role="status">
              <span className="empty-state-icon" aria-hidden="true">
                ✦
              </span>
              <p className="empty-state-title">No listings yet</p>
              <p className="empty-state-text">Create a post so others can see your pet on the board.</p>
              <Link className="btn btn-primary empty-state-cta" to="/create">
                Create a post
              </Link>
            </div>
          ) : (
            <div className="card-grid">
              {myPosts.map((post, index) => (
                <PetPostCard
                  key={post.petPostId}
                  post={post}
                  onModerate={handleModeratePost}
                  onLike={handleToggleLike}
                  onEdit={setEditingPost}
                  onDelete={handleDeletePost}
                  isUpdating={isManagingPosts}
                  canModerate={isAdmin}
                  animationDelayMs={Math.min(index * 80, 520)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="panel home-listings-panel profile-section" aria-labelledby="saved-heading">
          <div className="section-head">
            <h2 id="saved-heading">Liked posts</h2>
            <span className="muted">{loadingSaved ? "…" : `${savedPosts.length} saved`}</span>
          </div>
          <p className="muted profile-saved-lead">Adoption listings where you tapped the heart (saved to this account).</p>
          {loadingSaved ? (
            <div className="card-grid" aria-busy="true" aria-label="Loading saved posts">
              <div className="skeleton-card" />
            </div>
          ) : savedPosts.length === 0 ? (
            <div className="empty-state empty-state--warm empty-state--soft-icon" role="status">
              <span className="empty-state-icon" aria-hidden="true">
                ♡
              </span>
              <p className="empty-state-title">No liked posts yet</p>
              <p className="empty-state-text">Tap the heart on an adoption listing to keep it here for later.</p>
              <Link className="btn btn-primary empty-state-cta" to="/">
                Browse pets
              </Link>
            </div>
          ) : (
            <div className="card-grid">
              {savedPosts.map((post, index) => (
                <PetPostCard
                  key={post.petPostId}
                  post={post}
                  onModerate={handleModeratePost}
                  onLike={handleToggleLike}
                  onEdit={setEditingPost}
                  onDelete={handleDeletePost}
                  isUpdating={isManagingPosts}
                  canModerate={isAdmin}
                  animationDelayMs={Math.min(index * 80, 520)}
                />
              ))}
            </div>
          )}
        </section>

        <section className="panel home-listings-panel profile-section" aria-labelledby="convos-heading">
          <div className="section-head">
            <h2 id="convos-heading">Recent conversations</h2>
            <Link className="muted profile-section-link" to="/messages">
              Open inbox
            </Link>
          </div>
          {loadingConvos ? (
            <div className="profile-inline-loading" aria-busy="true" aria-label="Loading conversations">
              <span className="loading-shimmer" />
              <span className="loading-shimmer loading-shimmer--short" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="empty-state empty-state--warm empty-state--compact empty-state--soft-icon" role="status">
              <span className="empty-state-icon" aria-hidden="true">
                💬
              </span>
              <p className="empty-state-title">No messages yet</p>
              <p className="empty-state-text">
                Open a listing and use <strong>Private chat</strong> to start a thread with the poster.
              </p>
            </div>
          ) : (
            <ul className="profile-convo-preview-list">
              {conversations.map((row) => (
                <li key={row.conversationId} className="profile-convo-preview-item">
                  <div>
                    <p className="profile-convo-preview-pet">{row.petName}</p>
                    {row.lastMessagePreview ? (
                      <p className="muted profile-convo-preview-preview">{row.lastMessagePreview}</p>
                    ) : null}
                    <p className="muted profile-convo-preview-meta">
                      {row.lastMessageAt ? (
                        <time dateTime={row.lastMessageAt}>{formatWhen(row.lastMessageAt)}</time>
                      ) : (
                        <time dateTime={row.createdAt}>{formatWhen(row.createdAt)}</time>
                      )}
                    </p>
                  </div>
                  <Link className="btn btn-secondary profile-convo-preview-btn" to={`/post/${row.petPostId}`}>
                    View listing
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
