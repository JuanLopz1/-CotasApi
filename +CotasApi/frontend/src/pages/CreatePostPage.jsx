import { useOutletContext } from "react-router-dom";
import { createPetPost } from "../api/petPostsApi";
import PetPostForm from "../components/PetPostForm";
import { useToast } from "../context/ToastContext";

export default function CreatePostPage() {
  const { currentUser, bumpHomeList } = useOutletContext();
  const { showToast } = useToast();

  async function handleCreatePost(postData) {
    try {
      await createPetPost(postData, currentUser?.token);
      showToast("Post created successfully.", "success");
      bumpHomeList?.();
      return true;
    } catch {
      showToast("Something went wrong. Try again.", "error");
      return false;
    }
  }

  return (
    <div className="create-page section-reveal">
      <section className="panel create-page-intro" aria-labelledby="create-page-heading">
        <div className="section-head">
          <h1 id="create-page-heading">Create a listing</h1>
          <p className="muted create-page-lead">
            Share adoption, lost, or found information. Your listing helps people take clear next steps.
          </p>
        </div>
      </section>
      <PetPostForm onSubmit={handleCreatePost} currentUser={currentUser} navigateAfterSuccess="/" />
    </div>
  );
}
