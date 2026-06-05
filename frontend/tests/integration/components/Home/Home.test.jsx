import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import Home from "@/components/Home/Home";
import { useAuth } from "@/context/AuthContext";
import { useDocuments } from "@/components/Home/useDocuments";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

// Mock dependencies
jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/components/Home/useDocuments", () => ({
  useDocuments: jest.fn(),
}));

jest.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(),
}));

// Mock DocumentControls to avoid complex input setups
jest.mock("@/components/Home/components/DocumentControls/DocumentControls", () => {
  return function MockDocumentControls(props) {
    return (
      <div data-testid="document-controls">
        <button onClick={props.onCreate}>Create Document</button>
        <input 
          data-testid="search-input" 
          value={props.searchTerm} 
          onChange={(e) => props.onSearchChange(e.target.value)} 
        />
      </div>
    );
  };
});

// Mock DocumentGrid
jest.mock("@/components/Home/components/DocumentGrid/DocumentGrid", () => {
  return function MockDocumentGrid({ documents }) {
    return (
      <div data-testid="document-grid">
        {documents.map(doc => <div key={doc.id}>{doc.title}</div>)}
      </div>
    );
  };
});

const renderHome = () => {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );
};

describe("<Home />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({ currentUser: { uid: "123", username: "TestUser" } });
    useNetworkStatus.mockReturnValue(true);
  });

  it("renders loading state", () => {
    useDocuments.mockReturnValue({
      documents: [],
      isLoading: true,
      errorScreen: null,
      handleCreate: jest.fn(),
      handleMoveToTrash: jest.fn(),
      fetchDocuments: jest.fn(),
    });

    const { container } = renderHome();
    expect(container.querySelector(".loading-spinner")).toBeInTheDocument();
  });

  it("renders error state", () => {
    useDocuments.mockReturnValue({
      documents: [],
      isLoading: false,
      errorScreen: "Failed to load documents",
      handleCreate: jest.fn(),
      handleMoveToTrash: jest.fn(),
      fetchDocuments: jest.fn(),
    });

    renderHome();
    expect(screen.getByText("Failed to load documents")).toBeInTheDocument();
  });

  it("renders empty state", () => {
    useDocuments.mockReturnValue({
      documents: [],
      isLoading: false,
      errorScreen: null,
      handleCreate: jest.fn(),
      handleMoveToTrash: jest.fn(),
      fetchDocuments: jest.fn(),
    });

    renderHome();
    expect(screen.getByText("No documents yet. Click New document to start!")).toBeInTheDocument();
  });

  it("renders documents and handles search filtering", async () => {
    const user = userEvent.setup();
    useDocuments.mockReturnValue({
      documents: [
        { id: "1", title: "First Document" },
        { id: "2", title: "Second Document" }
      ],
      isLoading: false,
      errorScreen: null,
      handleCreate: jest.fn(),
      handleMoveToTrash: jest.fn(),
      fetchDocuments: jest.fn(),
    });

    renderHome();
    
    // Grid renders
    expect(screen.getByTestId("document-grid")).toBeInTheDocument();
    expect(screen.getByText("First Document")).toBeInTheDocument();
    expect(screen.getByText("Second Document")).toBeInTheDocument();

    // Type in search
    const searchInput = screen.getByTestId("search-input");
    await user.type(searchInput, "First");

    expect(screen.getByText("First Document")).toBeInTheDocument();
    expect(screen.queryByText("Second Document")).not.toBeInTheDocument();
  });
});
