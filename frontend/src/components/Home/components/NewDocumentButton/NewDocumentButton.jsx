// src/components/Home/components/NewDocumentButton/NewDocumentButton.jsx
// Creates a new document and navigates to its editor. Minimal UI state via `loading`.

import { useNavigate } from "react-router-dom";
import { createDocument } from "../../../../api/documentService";
import styles from "./NewDocumentButton.module.css";

function NewDocumentButton({ loading }) {
  const navigate = useNavigate();

  const handleCreateNewDoc = async () => {
    try {
      const result = await createDocument();
      if (result?.id) navigate(`/dashboard/${result.id}`);
    } catch {
      /* intentionally silent */
    }
  };

  return (
    <button
      type="button"
      className={styles.newDocBtn}
      onClick={handleCreateNewDoc}
      disabled={loading}
      aria-label="Create new document"
    >
      <div className={styles.circlePlus}>
        <img
          src="https://img.icons8.com/ios-filled/50/FFFFFF/plus.png"
          alt=""
          aria-hidden="true"
          className={styles.plusIcon}
        />
      </div>
      <span>{loading ? "Creating..." : "New document"}</span>
    </button>
  );
}

export default NewDocumentButton;
