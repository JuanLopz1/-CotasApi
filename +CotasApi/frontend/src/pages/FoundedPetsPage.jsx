import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import PetPostCard from "../components/PetPostCard";
import { getPetPosts } from "../api/petPostsApi";
import { useToast } from "../context/ToastContext";

export default function FoundedPetsPage() {
  const { currentUser, clientId, isAdmin } = useOutletContext();
  const { showToast } = useToast();
  const token = currentUser?.token ?? currentUser?.Token;
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!isAdmin) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        if (!token) {
          showToast("Admin session missing. Sign in again to view founded pets.", "info");
          setPosts([]);
          return;
        }
        const data = await getPetPosts({ clientId, includeReunited: true }, token);
        if (!cancelled) {
          setPosts(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        if (!cancelled) {
          const message = (error?.message || "").toLowerCase();
          if (message.includes("403") || message.includes("forbid")) {
            showToast("You do not have staff permission for founded pets.", "error");
          } else {
            showToast("Could not load founded pets.", "error");
          }
          setPosts([]);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [clientId, isAdmin, showToast, token]);

  if (!isAdmin) {
    return (
      <section className="panel empty-state empty-state--warm empty-state--soft-icon" role="status">
        <span className="empty-state-icon" aria-hidden="true">
          🔒
        </span>
        <p className="empty-state-title">Admin access only</p>
        <p className="empty-state-text">This section is visible only to staff admins.</p>
      </section>
    );
  }

  return (
    <section className="panel home-listings-panel section-reveal" aria-labelledby="founded-pets-heading">
      <div className="section-head">
        <h1 id="founded-pets-heading">Founded pets (reunited)</h1>
        <span className="muted">{isLoading ? "Loading..." : `${posts.length} total`}</span>
      </div>
      <p className="muted">
        These posts were marked as reunited by the post owner or staff. They are hidden from the public browse page.
      </p>

      {isLoading ? (
        <div className="card-grid" aria-busy="true" aria-label="Loading founded pets">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state empty-state--warm empty-state--soft-icon" role="status">
          <span className="empty-state-icon" aria-hidden="true">
            🎉
          </span>
          <p className="empty-state-title">No founded pets yet</p>
          <p className="empty-state-text">When a post gets reunited, it will appear here with its reunion details.</p>
          <Link className="btn btn-primary empty-state-cta" to="/">
            Back to browse
          </Link>
        </div>
      ) : (
        <div className="card-grid">
          {posts.map((post, index) => (
            <PetPostCard
              key={post.petPostId}
              post={post}
              onModerate={() => {}}
              onLike={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              isUpdating={false}
              canModerate={false}
              animationDelayMs={Math.min(index * 80, 520)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
