import { useEffect, useMemo, useState } from "react";
import { clearAuthUser, loadAuthUser, login, saveAuthUser } from "../api/authApi";
import { getOrCreateClientId } from "../api/clientIdentity";
import FilterBar from "../components/FilterBar";
import BrandLogo from "../components/BrandLogo";
import PetPostCard from "../components/PetPostCard";
import PetPostForm from "../components/PetPostForm";
import Toast from "../components/Toast";
import AuthPanel from "../components/AuthPanel";
import {
  createPetPost,
  deletePetPost,
  getPetPosts,
  togglePetLike,
  updatePetPost,
  updatePetPostStatus
} from "../api/petPostsApi";

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

function getCategoryForPost(post) {
  const text = `${post.title} ${post.petName} ${post.description}`.toLowerCase();
  if (text.includes("dog") || text.includes("puppy")) return "dogs";
  if (text.includes("cat") || text.includes("kitten")) return "cats";
  if (text.includes("bird") || text.includes("parrot")) return "birds";
  return "others";
}

function PetPostsPage() {
  const clientId = useMemo(() => getOrCreateClientId(), []);
  const [posts, setPosts] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isManagingPosts, setIsManagingPosts] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [toast, setToast] = useState(null);
  const isAdmin = currentUser?.role === "Admin";

  const hasFilters = useMemo(
    () =>
      filters.status !== "" ||
      filters.postType !== "" ||
      filters.category !== "all" ||
      filters.search.trim() !== "",
    [filters]
  );

  const visiblePosts = useMemo(() => {
    const searchValue = filters.search.trim().toLowerCase();

    return posts.filter((post) => {
      const categoryMatch =
        filters.category === "all" || getCategoryForPost(post) === filters.category;

      if (!categoryMatch) {
        return false;
      }

      if (!searchValue) {
        return true;
      }

      const searchable = `${post.title} ${post.petName} ${post.description} ${post.location}`.toLowerCase();
      return searchable.includes(searchValue);
    });
  }, [posts, filters.category, filters.search]);

  function showToast(message, type) {
    setToast({ message, type });
  }

  async function loadPosts(activeFilters) {
    setIsLoading(true);

    try {
      const data = await getPetPosts(activeFilters);
      setPosts(data);
    } catch (requestError) {
      showToast("Something went wrong. Try again.", "error");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPosts({ ...getApiFilters(filters), clientId });
  }, [filters.status, filters.postType, clientId]);

  useEffect(() => {
    setCurrentUser(loadAuthUser());
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  async function handleLogin(email, password) {
    setIsLoggingIn(true);

    try {
      const authUser = await login(email, password);
      saveAuthUser(authUser);
      setCurrentUser(authUser);
      showToast(`Welcome ${authUser.name}`, "success");
    } catch (error) {
      showToast(error?.message || "Login failed.", "error");
    } finally {
      setIsLoggingIn(false);
    }
  }

  function handleLogout() {
    clearAuthUser();
    setCurrentUser(null);
    showToast("Logged out", "success");
  }

  async function handleCreatePost(postData) {
    setIsSubmitting(true);

    try {
      await createPetPost(postData, currentUser?.token);
      await loadPosts({ ...getApiFilters(filters), clientId });
      showToast("Post created successfully", "success");
      return true;
    } catch (requestError) {
      showToast("Something went wrong. Try again.", "error");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleModeratePost(id, status) {
    if (!isAdmin) {
      showToast("Admin access required to moderate posts.", "error");
      return;
    }

    setIsManagingPosts(true);

    try {
      await updatePetPostStatus(id, status, currentUser?.token);
      await loadPosts({ ...getApiFilters(filters), clientId });
      showToast("Status updated successfully", "success");
    } catch (requestError) {
      showToast("You do not have permission for this action.", "error");
    } finally {
      setIsManagingPosts(false);
    }
  }

  async function handleEditPost(post) {
    if (!isAdmin) {
      showToast("Admin access required to edit posts.", "error");
      return;
    }

    const title = window.prompt("Title", post.title);
    if (title === null) return;
    const petName = window.prompt("Pet name", post.petName);
    if (petName === null) return;
    const description = window.prompt("Description", post.description);
    if (description === null) return;
    const location = window.prompt("Location", post.location);
    if (location === null) return;
    const postTypeRaw = window.prompt("Post type: 0=Adoption, 1=Lost, 2=Found", String(post.postType));
    if (postTypeRaw === null) return;
    const imageUrl = window.prompt("Image URL (optional)", post.imageUrl ?? "");
    if (imageUrl === null) return;

    const postType = Number(postTypeRaw);
    if (![0, 1, 2].includes(postType)) {
      showToast("Post type must be 0, 1, or 2.", "error");
      return;
    }

    setIsManagingPosts(true);
    try {
      await updatePetPost(
        post.petPostId,
        {
          title: title.trim(),
          petName: petName.trim(),
          postType,
          description: description.trim(),
          location: location.trim(),
          imageUrl: imageUrl.trim()
        },
        currentUser?.token
      );
      await loadPosts({ ...getApiFilters(filters), clientId });
      showToast("Post updated successfully", "success");
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
      await loadPosts({ ...getApiFilters(filters), clientId });
      showToast("Post deleted successfully", "success");
    } catch (error) {
      showToast(error?.message || "Could not delete post.", "error");
    } finally {
      setIsManagingPosts(false);
    }
  }

  async function handleToggleLike(id) {
    try {
      const result = await togglePetLike(id, clientId);
      setPosts((previous) =>
        previous.map((post) =>
          post.petPostId === id
            ? { ...post, likesCount: result.likesCount, isLikedByCurrentUser: result.isLiked }
            : post
        )
      );
    } catch {
      showToast("This action is only available for adoption posts.", "error");
    }
  }

  function handleFilterChange(field, value) {
    setFilters((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  return (
    <main className="page-shell">
      <Toast toast={toast} onClose={() => setToast(null)} />

      <header className="top-nav panel">
        <div className="brand">
          <BrandLogo className="brand-logo" alt="+cotas logo" />
        </div>
        <nav className="nav-links">
          <a href="#adopt">Adopt</a>
          <a href="#create-post">Report</a>
          <a href="#about">About</a>
        </nav>
        <div className="nav-right">
          <a className="btn btn-primary nav-cta" href="#create-post">
            + New Post
          </a>
          <AuthPanel
            currentUser={currentUser}
            isLoggingIn={isLoggingIn}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />
        </div>
      </header>

      <header className="hero">
        <p className="hero-kicker">Find your new best friend</p>
        <h1>
          Every pet deserves
          <br />
          <span>a loving home</span>
        </h1>
        <p id="about">
          Browse pets looking for adoption, report lost animals, and help reunite found pets with
          their families.
        </p>
      </header>

      <FilterBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={() => setFilters(initialFilters)}
      />

      <PetPostForm onSubmit={handleCreatePost} isSubmitting={isSubmitting} currentUser={currentUser} />

      <section className="panel" id="adopt">
        <div className="section-head">
          <h2>Pet posts</h2>
          <span className="muted">{visiblePosts.length} shown</span>
        </div>

        {isLoading ? (
          <div className="card-grid">
            <div className="skeleton-card" />
            <div className="skeleton-card" />
            <div className="skeleton-card" />
          </div>
        ) : visiblePosts.length === 0 ? (
          <p className="empty-state">
            No posts found. Try adjusting your filters or create a new one.
          </p>
        ) : (
          <div className="card-grid">
            {visiblePosts.map((post, index) => (
              <PetPostCard
                key={post.petPostId}
                post={post}
                onModerate={handleModeratePost}
                onLike={handleToggleLike}
                onEdit={handleEditPost}
                onDelete={handleDeletePost}
                isUpdating={isManagingPosts}
                canModerate={isAdmin}
                animationDelayMs={Math.min(index * 80, 520)}
              />
            ))}
          </div>
        )}

        {!isLoading && !hasFilters && visiblePosts.length > 0 && (
          <p className="muted helper-copy">
            Showing all posts by default so the page always feels alive.
          </p>
        )}
      </section>
    </main>
  );
}

export default PetPostsPage;
