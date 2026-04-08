import { postTypeOptions, statusLabelMap } from "../api/petPostsApi";

function getOptionLabel(options, value) {
  const option = options.find((item) => item.value === value);
  return option ? option.label : "Unknown";
}

function formatDate(dateText) {
  const date = new Date(dateText);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleDateString();
}

function getCardImage(post) {
  return (
    post.imageUrl ??
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='700' height='450'><rect width='100%' height='100%' fill='%23f1e7de'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%2385776c' font-family='Arial' font-size='26'>No image yet</text></svg>"
  );
}

function getStatusClass(status) {
  if (status === 1) return "badge-available";
  if (status === 2) return "badge-rejected";
  return "badge-pending";
}

function PetPostCard({
  post,
  onModerate,
  onLike,
  onEdit,
  onDelete,
  isUpdating,
  canModerate,
  animationDelayMs
}) {
  const postTypeLabel = getOptionLabel(postTypeOptions, post.postType);
  const statusLabel = statusLabelMap[post.status] ?? "Unknown";
  const isAdoption = post.postType === 0;

  return (
    <article className="post-card" style={{ animationDelay: `${animationDelayMs ?? 0}ms` }}>
      <div className="card-media-wrap">
        <img className="card-media" src={getCardImage(post)} alt={post.petName} loading="lazy" />
        <span className={`status-pill ${getStatusClass(post.status)}`}>{statusLabel}</span>
        {isAdoption && (
          <button
            type="button"
            className={`fav-btn ${post.isLikedByCurrentUser ? "fav-btn-active" : ""}`}
            aria-label="Toggle like"
            onClick={() => onLike(post.petPostId)}
          >
            {post.isLikedByCurrentUser ? "♥" : "♡"} {post.likesCount ?? 0}
          </button>
        )}
      </div>

      <div className="card-content">
        <h3>{post.petName}</h3>
        <p className="card-subtitle">{postTypeLabel} · Posted {formatDate(post.datePosted)}</p>
        <p className="card-description">{post.description}</p>

        <div className="post-card-bottom">
          <span>{post.location}</span>
          <span className="card-tag">{post.title}</span>
        </div>

        {canModerate ? (
          <div className="card-actions">
            <button
              type="button"
              className="btn btn-success"
              disabled={isUpdating}
              onClick={() => onModerate(post.petPostId, 1)}
            >
              Approve
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={isUpdating}
              onClick={() => onModerate(post.petPostId, 2)}
            >
              Reject
            </button>
            <button
              type="button"
              className="btn"
              disabled={isUpdating}
              onClick={() => onEdit(post)}
            >
              Edit
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={isUpdating}
              onClick={() => onDelete(post.petPostId)}
            >
              Delete
            </button>
          </div>
        ) : (
          <p className="moderation-note">Admin moderation only</p>
        )}
      </div>
    </article>
  );
}

export default PetPostCard;
