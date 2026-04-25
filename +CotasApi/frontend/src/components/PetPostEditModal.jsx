import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import {
  petCategoryOptions,
  postTypeOptions,
  preferredContactOptions,
  resolvePetImageSrc,
  statusOptions
} from "../api/petPostsApi";

function PetPostEditModal({ post, isSaving, onClose, onSave }) {
  const titleId = useId();
  const errPetKindId = useId();
  const errContactId = useId();
  const [editError, setEditError] = useState(null);
  const [form, setForm] = useState(() => ({
    title: post.title ?? "",
    petName: post.petName ?? "",
    postType: String(post.postType),
    petCategory: String(post.petCategory ?? 3),
    petKindLabel: post.petKindLabel ?? "",
    description: post.description ?? "",
    location: post.location ?? "",
    contactEmail: post.contactEmail ?? "",
    contactPhone: post.contactPhone ?? "",
    preferredContact:
      post.preferredContact !== undefined && post.preferredContact !== null
        ? String(post.preferredContact)
        : "",
    status: String(post.status),
    imageFile: null,
    clearImage: false
  }));

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  function handleChange(field, value) {
    setEditError(null);
    setForm((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    setEditError(null);
    const petCategory = Number(form.petCategory);
    if (petCategory === 3 && !form.petKindLabel.trim()) {
      setEditError({ key: "petKind", message: 'Describe the animal when you choose "Other".' });
      return;
    }

    if (!form.contactEmail.trim()) {
      setEditError({ key: "contact", message: "Contact email is required." });
      return;
    }

    onSave({
      title: form.title.trim(),
      petName: form.petName.trim(),
      postType: Number(form.postType),
      petCategory,
      petKindLabel: petCategory === 3 ? form.petKindLabel.trim() : form.petKindLabel.trim() || undefined,
      description: form.description.trim(),
      location: form.location.trim(),
      contactEmail: form.contactEmail.trim(),
      contactPhone: form.contactPhone.trim() || undefined,
      preferredContact: form.preferredContact === "" ? undefined : Number(form.preferredContact),
      imageFile: form.imageFile,
      clearImage: form.clearImage,
      status: Number(form.status)
    });
  }

  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }

  return createPortal(
    <div className="modal-overlay" role="presentation" onClick={handleBackdropClick}>
      <div
        className="modal-panel-wrap"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <form className="modal-panel" onSubmit={handleSubmit}>
          <div className="modal-head">
            <h2 id={titleId}>Edit post</h2>
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close editor">
              ×
            </button>
          </div>

          <div className="modal-body form-grid">
            <label className="field">
              <span>Title</span>
              <input
                required
                value={form.title}
                onChange={(event) => handleChange("title", event.target.value)}
              />
            </label>

            <label className="field">
              <span>Pet name</span>
              <input
                required
                value={form.petName}
                onChange={(event) => handleChange("petName", event.target.value)}
              />
            </label>

            <label className="field">
              <span>Post type</span>
              <select
                value={form.postType}
                onChange={(event) => handleChange("postType", event.target.value)}
              >
                {postTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Pet category</span>
              <select
                value={form.petCategory}
                onChange={(event) => handleChange("petCategory", event.target.value)}
              >
                {petCategoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            {Number(form.petCategory) === 3 ? (
              <label className="field field-full">
                <span>Describe the animal (required for “Other”)</span>
                <input
                  required
                  value={form.petKindLabel}
                  onChange={(event) => handleChange("petKindLabel", event.target.value)}
                  placeholder="e.g. Rabbit, turtle, hamster…"
                  aria-invalid={editError?.key === "petKind" ? "true" : undefined}
                  aria-describedby={editError?.key === "petKind" ? errPetKindId : undefined}
                />
                {editError?.key === "petKind" ? (
                  <span id={errPetKindId} className="form-error field-error-inline" role="alert">
                    {editError.message}
                  </span>
                ) : null}
              </label>
            ) : (
              <label className="field field-full">
                <span>Extra detail (optional)</span>
                <input
                  value={form.petKindLabel}
                  onChange={(event) => handleChange("petKindLabel", event.target.value)}
                  placeholder="Breed or notes (optional)"
                />
              </label>
            )}

            <label className="field">
              <span>Location</span>
              <input
                required
                value={form.location}
                onChange={(event) => handleChange("location", event.target.value)}
              />
            </label>

            <label className="field">
              <span>Contact email</span>
              <input
                required
                type="email"
                value={form.contactEmail}
                onChange={(event) => handleChange("contactEmail", event.target.value)}
                aria-invalid={editError?.key === "contact" ? "true" : undefined}
                aria-describedby={editError?.key === "contact" ? errContactId : undefined}
              />
              {editError?.key === "contact" ? (
                <span id={errContactId} className="form-error field-error-inline" role="alert">
                  {editError.message}
                </span>
              ) : null}
            </label>

            <label className="field">
              <span>Contact phone</span>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(event) => handleChange("contactPhone", event.target.value)}
              />
            </label>

            <label className="field field-full">
              <span>Preferred contact</span>
              <select
                value={form.preferredContact}
                onChange={(event) => handleChange("preferredContact", event.target.value)}
              >
                {preferredContactOptions.map((option) => (
                  <option
                    key={`${option.label}-${String(option.value)}`}
                    value={option.value === "" ? "" : String(option.value)}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Moderation status</span>
              <select value={form.status} onChange={(event) => handleChange("status", event.target.value)}>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field-full">
              <span>Description</span>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(event) => handleChange("description", event.target.value)}
              />
            </label>

            {post.imageUrl && !form.clearImage ? (
              <div className="field field-full">
                <span>Current photo</span>
                <div className="edit-modal-photo-preview">
                  <img
                    src={resolvePetImageSrc(post.imageUrl) ?? ""}
                    alt=""
                    width={200}
                    height={120}
                    style={{ objectFit: "cover", borderRadius: 8, maxWidth: "100%" }}
                  />
                </div>
              </div>
            ) : null}

            <label className="field field-full">
              <span>Replace image (upload a file)</span>
              <input
                type="file"
                accept="image/*,.jpg,.jpeg,.png,.webp,.gif,.avif,.bmp,.heic"
                disabled={form.clearImage}
                onChange={(event) => handleChange("imageFile", event.target.files?.[0] ?? null)}
              />
            </label>

            <label className="field field-full checkbox-field">
              <input
                type="checkbox"
                checked={form.clearImage}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    clearImage: event.target.checked,
                    imageFile: event.target.checked ? null : previous.imageFile
                  }))
                }
              />
              <span>Remove image (post will stay hidden from the public until a new photo is added)</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn" onClick={onClose} disabled={isSaving}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export default PetPostEditModal;
