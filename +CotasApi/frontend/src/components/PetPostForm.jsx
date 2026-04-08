import { useState } from "react";
import { postTypeOptions } from "../api/petPostsApi";

const initialForm = {
  title: "",
  petName: "",
  postType: "0",
  description: "",
  location: "",
  imageUrl: ""
};

function PetPostForm({ onSubmit, isSubmitting, currentUser }) {
  const [formData, setFormData] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);

  function handleChange(field, value) {
    setFormData((previous) => ({
      ...previous,
      [field]: value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const created = await onSubmit({
      title: formData.title.trim(),
      petName: formData.petName.trim(),
      postType: Number(formData.postType),
      description: formData.description.trim(),
      location: formData.location.trim(),
      imageUrl: formData.imageUrl.trim(),
      imageFile
    });

    if (created) {
      setFormData(initialForm);
      setImageFile(null);
    }
  }

  return (
    <section className="panel create-panel" id="create-post">
      <div className="section-head">
        <h2>Create New Post</h2>
        <span className="muted">
          {currentUser ? `Posting as ${currentUser.name}` : "Posting as Guest User"}
        </span>
      </div>

      <form className="form-grid" onSubmit={handleSubmit}>
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
          <span>Location</span>
          <input
            required
            value={formData.location}
            onChange={(event) => handleChange("location", event.target.value)}
          />
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
            placeholder="https://... or /img/dog1.jpg"
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
          {isSubmitting ? "Creating..." : "Create post"}
        </button>
      </form>
    </section>
  );
}

export default PetPostForm;
