import { useOutletContext } from "react-router-dom";
import { createPetPost } from "../api/petPostsApi";
import PetPostForm from "../components/PetPostForm";
import { useToast } from "../context/ToastContext";

export default function CreatePostPage() {
  const { currentUser, bumpHomeList } = useOutletContext();
  const { showToast } = useToast();

  async function handleCreatePost(postData) {
    try {
      const created = await createPetPost(postData, currentUser?.token);
      const petPostId = created?.petPostId ?? created?.PetPostId;
      showToast(
        "Listing submitted. Your post is in review and is not public yet. You will get an update soon. If we need anything, staff may contact you using the email or phone on your listing.",
        "success"
      );
      bumpHomeList?.();
      return { success: true, petPostId };
    } catch {
      showToast("Something went wrong. Try again.", "error");
      return { success: false };
    }
  }

  return (
    <div className="create-page section-reveal">
      <section className="panel create-page-intro" aria-labelledby="create-page-heading">
        <div className="section-head">
          <h1 id="create-page-heading">Create a listing</h1>
          <p className="muted create-page-lead">
            Share adoption, lost, or found information. New listings are reviewed before they appear on the public board.
          </p>
        </div>
      </section>
      <PetPostForm onSubmit={handleCreatePost} currentUser={currentUser} />
    </div>
  );
}
