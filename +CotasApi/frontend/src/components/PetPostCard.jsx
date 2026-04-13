import { useState } from "react";
import { Link } from "react-router-dom";
import { petCategoryLabel, postTypeOptions, statusPresentation } from "../api/petPostsApi";

function getOptionLabel(options, value) {
  const option = options.find((item) => item.value === value);
  return option ? option.label : "Unknown";
}

function formatDate(dateText) {
  const date = new Date(dateText);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleDateString();
}

const NO_PHOTO_SVG =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='700' height='450' viewBox='0 0 700 450'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0%' stop-color='#f4ebe4'/><stop offset='100%' stop-color='#e8ddd4'/></linearGradient></defs><rect width='100%' height='100%' fill='url(#g)'/><path d='M220 310c24-80 88-130 160-130s136 50 160 130' fill='none' stroke='#c4a994' stroke-width='3' stroke-linecap='round'/><circle cx='280' cy='175' r='22' fill='#d9c4b6'/><circle cx='420' cy='175' r='22' fill='#d9c4b6'/><text x='50%' y='58%' text-anchor='middle' fill='#7d6a5c' font-family='Segoe UI,system-ui,sans-serif' font-size='22' font-weight='600'>No photo</text><text x='50%' y='66%' text-anchor='middle' fill='#9a8b7e' font-family='Segoe UI,system-ui,sans-serif' font-size='14'>Image needed for public listing</text></svg>`
  );

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
  const [imageBroken, setImageBroken] = useState(false);
  const postTypeLabel = getOptionLabel(postTypeOptions, post.postType);
  const status = statusPresentation(post);
  const isAdoption = post.postType === 0;
  const hasImageUrl = Boolean(post.imageUrl && String(post.imageUrl).trim());
  const categoryLine = petCategoryLabel(post);

  const showPhotoArea = hasImageUrl && !imageBroken;
  const imageSrc = hasImageUrl ? post.imageUrl : NO_PHOTO_SVG;

  function stopCardNavigation(event) {
    event.stopPropagation();
  }

  const detailPath = `/post/${post.petPostId}`;
  const photoAlt = `Photo of ${post.petName}`;
  const listingLinkLabel = `View full listing for ${post.petName}`;

  return (
    <article
      className="post-card post-card--clickable"
      style={{ animationDelay: `${animationDelayMs ?? 0}ms` }}
      aria-labelledby={`post-title-${post.petPostId}`}
    >
      <div className="card-media-wrap">
        {showPhotoArea ? (
          <Link to={detailPath} className="card-media-link" tabIndex={-1}>
            <img
              className="card-media"
              src={imageSrc}
              alt={photoAlt}
              width={700}
              height={450}
              loading="lazy"
              decoding="async"
              onError={() => setImageBroken(true)}
            />
          </Link>
        ) : (
          <Link to={detailPath} className="card-media-link" tabIndex={-1} aria-label={listingLinkLabel}>
            <div className="card-media card-media-placeholder">
              <img src={NO_PHOTO_SVG} alt="" className="card-media-fallback-img" aria-hidden="true" />
              {!hasImageUrl && canModerate ? (
                <p className="card-media-admin-note">Add a photo so this post can appear to the public.</p>
              ) : null}
              {hasImageUrl && imageBroken && canModerate ? (
                <p className="card-media-admin-note">This image URL failed to load — edit the post to fix it.</p>
              ) : null}
            </div>
          </Link>
        )}
        <span className={`status-pill ${status.className}`}>{status.label}</span>
        {isAdoption ? (
          <button
            type="button"
            className={`fav-btn ${post.isLikedByCurrentUser ? "fav-btn-active" : ""}`}
            aria-pressed={post.isLikedByCurrentUser}
            aria-label={post.isLikedByCurrentUser ? "Unlike this adoption post" : "Like this adoption post"}
            onClick={(event) => {
              stopCardNavigation(event);
              onLike(post.petPostId);
            }}
          >
            <span aria-hidden="true">{post.isLikedByCurrentUser ? "♥" : "♡"}</span>{" "}
            <span>{post.likesCount ?? 0}</span>
          </button>
        ) : null}
      </div>

      <div className="card-content">
        <Link
          to={detailPath}
          className="card-content-link"
          aria-labelledby={`post-title-${post.petPostId}`}
          aria-describedby={`post-meta-${post.petPostId}`}
        >
          <h3 id={`post-title-${post.petPostId}`}>{post.petName}</h3>
          <p className="card-subtitle" id={`post-meta-${post.petPostId}`}>
            {postTypeLabel} · {categoryLine} · Posted {formatDate(post.datePosted)}
          </p>
          <p className="card-description">{post.description}</p>

          <div className="post-card-bottom">
            <span>
              <span className="visually-hidden">Location: </span>
              {post.location}
            </span>
            <span className="card-tag">
              <span className="visually-hidden">Title: </span>
              {post.title}
            </span>
          </div>

          <p className="card-open-hint">
            <span className="card-open-hint-icon" aria-hidden="true">
              ↗
            </span>
            <span>View details</span>
          </p>
        </Link>

        {canModerate ? (
          <div className="card-actions" role="group" aria-label="Moderation actions" onClick={stopCardNavigation}>
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
            <button type="button" className="btn" disabled={isUpdating} onClick={() => onEdit(post)}>
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
        ) : null}
      </div>
    </article>
  );
}

export default PetPostCard;
