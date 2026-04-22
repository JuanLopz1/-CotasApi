import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { petCategoryOptions, postTypeOptions, preferredContactOptions } from "../api/petPostsApi";

const initialForm = {
  title: "",
  petName: "",
  postType: "0",
  petCategory: "0",
  petKindLabel: "",
  description: "",
  location: "",
  contactEmail: "",
  contactPhone: "",
  preferredContact: "",
  imageUrl: ""
};

const OTHERS_VALUE = 3;

function PetPostForm({ onSubmit, currentUser, navigateAfterSuccess = null }) {
  const navigate = useNavigate();
  const errGeneralId = useId();
  const errPetKindId = useId();
  const errContactId = useId();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [fieldError, setFieldError] = useState(null);

  useEffect(() => {
    const email = currentUser?.email ?? currentUser?.Email;
    if (!email) return;
    setFormData((previous) => {
      if (previous.contactEmail) return previous;
      return { ...previous, contactEmail: email };
    });
  }, [currentUser]);

  function handleChange(field, value) {
    setFormData((previous) => ({
      ...previous,
      [field]: value
    }));
    setFieldError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFieldError(null);

    const petCategory = Number(formData.petCategory);
    if (petCategory === OTHERS_VALUE && !formData.petKindLabel.trim()) {
      setFieldError({ key: "petKind", message: 'Please describe the animal when you choose "Other".' });
      return;
    }

    if (!formData.contactEmail.trim()) {
      setFieldError({
        key: "contact",
        message: "Contact email is required so people can reach you."
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const submitResult = await onSubmit({
        title: formData.title.trim(),
        petName: formData.petName.trim(),
        postType: Number(formData.postType),
        petCategory,
        petKindLabel:
          petCategory === OTHERS_VALUE
            ? formData.petKindLabel.trim()
            : formData.petKindLabel.trim() || undefined,
        description: formData.description.trim(),
        location: formData.location.trim(),
        contactEmail: formData.contactEmail.trim(),
        contactPhone: formData.contactPhone.trim() || undefined,
        preferredContact:
          formData.preferredContact === "" ? undefined : Number(formData.preferredContact),
        imageUrl: formData.imageUrl.trim(),
        imageFile
      });

      const ok = submitResult === true || submitResult?.success === true;
      const newPostId = submitResult?.petPostId ?? submitResult?.PetPostId;

      if (ok) {
        setFormData(initialForm);
        setImageFile(null);
        if (newPostId) {
          navigate(`/post/${newPostId}`, { replace: true });
        } else if (navigateAfterSuccess) {
          navigate(navigateAfterSuccess);
        }
      } else {
        setFieldError({
          key: "general",
          message: "We could not create the post. Check your connection and try again."
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="panel create-panel section-reveal" id="create-post" aria-labelledby="create-heading">
      <div className="section-head">
        <h2 id="create-heading">Details</h2>
        <span className="muted">
          {currentUser ? `Posting as ${currentUser.name}` : "Posting as guest"}
        </span>
      </div>

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        {fieldError?.key === "general" ? (
          <p id={errGeneralId} className="form-error field-full" role="alert">
            {fieldError.message}
          </p>
        ) : null}

        <label className="field">
          <span>Title</span>
          <input
            required
            value={formData.title}
            onChange={(event) => handleChange("title", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Pet name</span>
          <input
            required
            value={formData.petName}
            onChange={(event) => handleChange("petName", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Post type</span>
          <select
            value={formData.postType}
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
            value={formData.petCategory}
            onChange={(event) => handleChange("petCategory", event.target.value)}
          >
            {petCategoryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {Number(formData.petCategory) === OTHERS_VALUE ? (
          <label className="field field-full">
            <span>Describe the animal</span>
            <input
              required
              value={formData.petKindLabel}
              onChange={(event) => handleChange("petKindLabel", event.target.value)}
              placeholder="e.g. Rabbit, turtle, ferret…"
              aria-invalid={fieldError?.key === "petKind" ? "true" : undefined}
              aria-describedby={
                [fieldError?.key === "petKind" ? errPetKindId : null, "pet-kind-hint"]
                  .filter(Boolean)
                  .join(" ") || undefined
              }
            />
            {fieldError?.key === "petKind" ? (
              <span id={errPetKindId} className="form-error field-error-inline" role="alert">
                {fieldError.message}
              </span>
            ) : null}
            <span id="pet-kind-hint" className="field-hint">
              This text is shown on the card and used for the Others filter.
            </span>
          </label>
        ) : (
          <label className="field field-full">
            <span>Breed or extra detail (optional)</span>
            <input
              value={formData.petKindLabel}
              onChange={(event) => handleChange("petKindLabel", event.target.value)}
              placeholder="Optional notes"
            />
          </label>
        )}

        <label className="field">
          <span>Location</span>
          <input
            required
            value={formData.location}
            onChange={(event) => handleChange("location", event.target.value)}
          />
        </label>

        <h3 className="field-full form-section-title">Contact for this listing</h3>
        <p className="field-full muted form-section-lead">
          Shown on the detail page so adopters, finders, or families can reach you.
        </p>

        <label className="field">
          <span>Contact email</span>
          <input
            required
            type="email"
            autoComplete="email"
            value={formData.contactEmail}
            onChange={(event) => handleChange("contactEmail", event.target.value)}
            aria-invalid={fieldError?.key === "contact" ? "true" : undefined}
            aria-describedby={fieldError?.key === "contact" ? errContactId : undefined}
          />
          {fieldError?.key === "contact" ? (
            <span id={errContactId} className="form-error field-error-inline" role="alert">
              {fieldError.message}
            </span>
          ) : null}
        </label>

        <label className="field">
          <span>Phone (optional)</span>
          <input
            type="tel"
            autoComplete="tel"
            value={formData.contactPhone}
            onChange={(event) => handleChange("contactPhone", event.target.value)}
            placeholder="e.g. +1 809 555 0101"
          />
        </label>

        <label className="field field-full">
          <span>Preferred contact method</span>
          <select
            value={formData.preferredContact}
            onChange={(event) => handleChange("preferredContact", event.target.value)}
          >
            {preferredContactOptions.map((option) => (
              <option
                key={option.label}
                value={option.value === "" ? "" : String(option.value)}
              >
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
            value={formData.description}
            onChange={(event) => handleChange("description", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Image URL (optional)</span>
          <input
            placeholder="https://… or /img/dog1.jpg"
            value={formData.imageUrl}
            onChange={(event) => handleChange("imageUrl", event.target.value)}
          />
        </label>

        <label className="field">
          <span>Or upload image (optional)</span>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setImageFile(event.target.files?.[0] ?? null)}
          />
        </label>

        <button className="btn btn-primary form-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating…" : "Create post"}
        </button>
      </form>
    </section>
  );
}

export default PetPostForm;
