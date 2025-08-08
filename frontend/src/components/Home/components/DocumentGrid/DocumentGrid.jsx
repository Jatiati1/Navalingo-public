// src/components/Home/components/DocumentGrid/DocumentGrid.jsx
import { useNavigate } from "react-router-dom";
import DocumentCard from "../DocumentCard/DocumentCard";
import styles from "./DocumentGrid.module.css";

/**
 * Responsive grid of document cards with open/delete handlers.
 */
function DocumentGrid({ documents, onDocumentDelete, isOnline }) {
  const navigate = useNavigate();

  const handleOpenDocument = (docId) => {
    navigate(`/dashboard/${docId}`);
  };

  const handleDeleteDocument = (docId) => {
    onDocumentDelete?.(docId);
  };

  if (!documents.length) {
    return (
      <div className={styles.noResults}>
        <p>No documents match your search</p>
      </div>
    );
  }

  return (
    <div className={styles.documentsGrid}>
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onOpen={handleOpenDocument}
          onDelete={handleDeleteDocument}
          isOnline={isOnline}
        />
      ))}
    </div>
  );
}

export default DocumentGrid;
