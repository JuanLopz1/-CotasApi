import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  categorySlugForPost,
  deletePetPost,
  getPetPosts,
  likeErrorMessage,
  togglePetLike,
  updatePetPost,
  updatePetPostStatus
} from "../api/petPostsApi";
import FilterBar from "../components/FilterBar";
import PetPostCard from "../components/PetPostCard";
import PetPostEditModal from "../components/PetPostEditModal";
import { useToast } from "../context/ToastContext";

const initialFilters = {
  status: "",
  postType: "",
  category: "all",
  search: ""
};

function getApiFilters(filters) {
  return {
    status: filters.status,
    postType: filters.postType
  };
}

export default function HomePage({ initialPosts, listSeededRef, homeRefreshKey }) {
  const navigate = useNavigate();
  const { clientId, currentUser, isAdmin } = useOutletContext();
  const { showToast } = useToast();

  const [posts, setPosts] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isManagingPosts, setIsManagingPosts] = useState(false);
  const [editingPost, setEditingPost] = useState(null);

  const hasFilters = useMemo(
    () =>
      filters.status !== "" ||
      filters.postType !== "" ||
      filters.category !== "all" ||
      filters.search.trim() !== "",
    [filters]
  );

  const pendingModerationCount = useMemo(
    () => (isAdmin ? posts.filter((p) => p.status === 0).length : 0),
    [posts, isAdmin]
  );

  const visiblePosts = useMemo(() => {
    const searchValue = filters.search.trim().toLowerCase();

    return posts.filter((post) => {
      const categoryMatch =
        filters.category === "all" || categorySlugForPost(post) === filters.category;

      if (!categoryMatch) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      const searchable = `${post.title} ${post.petName} ${post.description} ${post.location} ${post.petKindLabel ?? ""} ${post.contactEmail ?? ""}`.toLowerCase();
      return searchable.includes(searchValue);
    });
  }, [posts, filters.category, filters.search]);

  useEffect(() => {
    let cancelled = false;
    const token = currentUser?.token;

    async function run() {
      const coldStart = !listSeededRef.current && homeRefreshKey === 0;

      if (coldStart) {
        listSeededRef.current = true;
        if (!cancelled) {
          setPosts(initialPosts ?? []);
        }
      }

      if (!listSeededRef.current) {
        listSeededRef.current = true;
      }

      if (!cancelled && !coldStart) {
        setIsLoading(true);
      }
      try {
        const data = await getPetPosts({ ...getApiFilters(filters), clientId }, token);
        if (!cancelled) {
          setPosts(data);
        }
      } catch {
        if (!cancelled) {
          showToast("Something went wrong. Try again.", "error");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [
    filters.status,
    filters.postType,
    clientId,
    currentUser?.token,
    homeRefreshKey,
    initialPosts,
    listSeededRef,
    showToast
  ]);

  async function handleModeratePost(id, status) {
    if (!isAdmin) {
      showToast("Admin access required to moderate posts.", "error");
      return;
    }

    setIsManagingPosts(true);

    try {
      await updatePetPostStatus(id, status, currentUser?.token);
      const data = await getPetPosts({ ...getApiFilters(filters), clientId }, currentUser?.token);
      setPosts(data);
      showToast("Moderation status updated.", "success");
    } catch {
      showToast("You do not have permission for this action.", "error");
    } finally {
      setIsManagingPosts(false);
    }
  }

  const closeEditor = useCallback(() => {
    setEditingPost(null);
  }, []);

  async function handleSaveEdit(payload) {
    if (!editingPost || !currentUser?.token) {
      return;
    }

    setIsManagingPosts(true);
    try {
      await updatePetPost(editingPost.petPostId, payload, currentUser.token);
      const data = await getPetPosts({ ...getApiFilters(filters), clientId }, currentUser.token);
      setPosts(data);
      showToast("Post updated successfully.", "success");
      setEditingPost(null);
    } catch (error) {
      showToast(error?.message || "Could not update post.", "error");
    } finally {
      setIsManagingPosts(false);
    }
  }

  async function handleDeletePost(id) {
    if (!isAdmin) {
      showToast("Admin access required to delete posts.", "error");
      return;
    }

    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) return;

    setIsManagingPosts(true);
    try {
      await deletePetPost(id, currentUser?.token);
      const data = await getPetPosts({ ...getApiFilters(filters), clientId }, currentUser?.token);
      setPosts(data);
      showToast("Post deleted successfully.", "success");
    } catch (error) {
      showToast(error?.message || "Could not delete post.", "error");
    } finally {
      setIsManagingPosts(false);
    }
  }

  async function handleToggleLike(id) {
    const token = currentUser?.token ?? currentUser?.Token;
    if (!token) {
      showToast("Sign in to save hearts on adoption posts.", "info");
      navigate("/login?from=/");
      return;
    }
    try {
      const result = await togglePetLike(id, clientId);
      setPosts((previous) =>
        previous.map((post) =>
          post.petPostId === id
            ? { ...post, likesCount: result.likesCount, isLikedByCurrentUser: result.isLiked }
            : { ...post }
        )
      );
    } catch (error) {
      showToast(likeErrorMessage(error), "error");
    }
  }

  function handleFilterChange(field, value) {
    setFilters((previous) => ({
      ...previous,
      [field]: value
    }));
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

      <section className="hero" aria-labelledby="hero-heading">
        <p className="hero-kicker">Find your new best friend</p>
        <h1 id="hero-heading">
          Every pet deserves
          <br />
          <span>a loving home</span>
        </h1>
        <p id="home-intro">
          Browse pets looking for adoption, report lost animals, and help reunite found pets with their families.
        </p>
        <p className="hero-about-teaser">
          <Link className="hero-about-link" to="/about">
            Learn what +cotas is about
          </Link>
        </p>
      </section>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={() => setFilters(initialFilters)}
        showStatusFilters={isAdmin}
      />

      {isAdmin && pendingModerationCount > 0 ? (
        <div className="admin-pending-banner panel-soft section-reveal" role="status">
          <div className="admin-pending-banner-text">
            <strong>{pendingModerationCount}</strong>{" "}
            {pendingModerationCount === 1 ? "listing is" : "listings are"} waiting for review.
          </div>
          <button type="button" className="btn btn-secondary admin-pending-banner-cta" onClick={() => handleFilterChange("status", "0")}>
            Show only in review
          </button>
        </div>
      ) : null}

      <section className="panel home-listings-panel" id="browse-posts" aria-labelledby="posts-heading">
        <div className="section-head">
          <h2 id="posts-heading">Pet posts</h2>
          <span className="muted">{visiblePosts.length} shown</span>
        </div>

        {isLoading ? (
          <div className="card-grid" aria-busy="true" aria-label="Loading posts">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        ) : visiblePosts.length === 0 ? (
          <div className="empty-state empty-state--warm empty-state--soft-icon" role="status">
            <span className="empty-state-icon" aria-hidden="true">
              🐾
            </span>
            <p className="empty-state-title">No pets match what you are looking for yet.</p>
            <p className="empty-state-text">
              Try widening your filters or searching with a different word — or add a new listing so someone can
              help.
            </p>
            <Link className="btn btn-primary empty-state-cta" to="/create">
              Create a post
            </Link>
          </div>
        ) : (
          <div
            key={`${filters.status}-${filters.postType}-${filters.category}`}
            className="card-grid card-grid--filter-sweep"
          >
            {visiblePosts.map((post, index) => (
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

        {!isLoading && !hasFilters && visiblePosts.length > 0 ? (
          <p className="muted helper-copy">
            {isAdmin
              ? "You see every listing, including drafts and posts without a photo. Visitors only see approved posts that include an image."
              : "Showing approved listings with a photo."}
          </p>
        ) : null}
      </section>
    </>
  );
}
