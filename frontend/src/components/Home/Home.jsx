// frontend/src/components/Home/Home.jsx
// Home dashboard: lists documents with search, create, and grid UI.

import React, { useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { useDocuments } from "./useDocuments";
import { useNetworkStatus } from "../../hooks/useNetworkStatus";

import DocumentGrid from "./components/DocumentGrid/DocumentGrid";
import DocumentControls from "./components/DocumentControls/DocumentControls";
import Header from "../UI/Header/Header";
import LoadingSpinner from "../UI/LoadingSpinner/LoadingSpinner";
import Button from "../UI/Button/Button";

import "../../styles/variables.css";
import "../../styles/base.css";
import "../../styles/mixins.css";
import styles from "./Home.module.css";

function Home() {
  const { currentUser } = useAuth();
  const {
    documents,
    isLoading,
    errorScreen,
    handleCreate,
    handleMoveToTrash,
    fetchDocuments,
  } = useDocuments();

  const [searchTerm, setSearchTerm] = useState("");
  const isOnline = useNetworkStatus();

  // Client-side filter by title
  const filteredDocuments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) =>
      (d.title || "Untitled Document").toLowerCase().includes(q)
    );
  }, [documents, searchTerm]);

  // Main content state
  const content = (() => {
    if (isLoading) {
      return (
        <div className={styles.contentLoading}>
          <LoadingSpinner />
        </div>
      );
    }

    if (errorScreen) {
      return (
        <div className={styles.contentError}>
          <p className={styles.errorMessageFullPage}>{errorScreen}</p>
          <Button
            variant="secondary"
            onClick={fetchDocuments}
            disabled={!isOnline}
          >
            Try Again
          </Button>
        </div>
      );
    }

    if (filteredDocuments.length === 0) {
      return (
        <p className={styles.noDocumentsMessage}>
          {searchTerm
            ? "No documents match your search."
            : "No documents yet. Click New document to start!"}
        </p>
      );
    }

    return (
      <DocumentGrid
        documents={filteredDocuments}
        onDocumentDelete={handleMoveToTrash}
        isOnline={isOnline}
      />
    );
  })();

  return (
    <div className={styles.app}>
      <Header showMenu={Boolean(currentUser)} className="home-header" />
      <main className={`container ${styles.homeContainer}`}>
        <div className={styles.headerActions}>
          <h2 className={styles.documentsHeading}>My Documents</h2>
          <DocumentControls
            onCreate={handleCreate}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            isOnline={isOnline}
          />
        </div>
        {content}
      </main>
    </div>
  );
}

export default Home;
