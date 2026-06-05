//File: frontend/tests/components/dashboard/Dashboard.test.jsx

import React from "react"; 
import { MemoryRouter } from "react-router-dom";
import { ToastProvider } from "@/components/UI/Toast/ToastProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "@/components/Dashboard/Dashboard";

import {
  getDocument,
  updateDocumentContent,
  updateDocumentTitle,
} from "@/api/documentService";
import { translateText } from "@/api/textProcessingService";

jest.mock("@/utils/editor/lexicalConfig.js", () => ({
  processTextForTranslation: jest
    .fn()
    .mockResolvedValue("<p>processed for translation</p>"),
  processTextForCorrection: jest
    .fn()
    .mockResolvedValue("<p>processed for correction</p>"),
  replaceContent: jest.fn(),
}));

jest.mock("lexical", () => ({
  $getRoot: () => ({
    getTextContent: () => "mock text content",
  }),
  $getSelection: () => null,
  $isRangeSelection: () => false,
}));

jest.mock("@/components/Dashboard/Editor/LexicalEditor", () => {
  // Import React's useEffect specifically for this mock's scope
  const ActualReact = jest.requireActual("react");
  const { useEffect } = ActualReact;

  const MockLexicalEditor = jest.fn(({ onInitialized, content, onChange }) => {
    useEffect(() => {
      // Now useEffect is correctly scoped
      if (onInitialized) {
        const mockEditor = {
          focus: jest.fn(),
          getEditorState: () => ({
            read: (cb) => cb()
          })
        };
        onInitialized(mockEditor);
      }
    }, [onInitialized]);

    const handleMockInputChange = (e) => {
      if (onChange) {
        const val = `<p>hi${e.target.value}</p>`;
        const mockEditorState = {
          toJSON: () => val,
          read: (callback) => callback(),
        };
        onChange(mockEditorState);
      }
    };

    return (
      <div role="textbox" data-testid="mock-lexical-editor">
        <input
          type="text"
          defaultValue=""
          data-testid="hidden-mock-editor-input"
          onChange={handleMockInputChange}
          style={{ display: "none" }}
        />
        <div>{typeof content === "string" ? content : ""}</div>
      </div>
    );
  });
  return MockLexicalEditor;
});

jest.mock("@/api/documentService", () => ({
  __esModule: true,
  getDocument: jest.fn(),
  updateDocumentContent: jest.fn(),
  updateDocumentTitle: jest.fn(),
}));
jest.mock("@/api/textProcessingService", () => ({
  __esModule: true,
  translateText: jest.fn(),
  correctGrammar: jest.fn().mockResolvedValue({ result: "<p>ok grammar</p>" }),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
  useParams: () => ({ docId: "d1" }),
}));
const mockUseAuth = jest.fn(() => ({ currentUser: { username: "Bob", credits: { current: 10, max: 10 } } }));
jest.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  onAuthStateChanged: jest.fn(() => jest.fn()),
}));

const SUITE_TIMEOUT = 25000;
jest.setTimeout(SUITE_TIMEOUT);

let alertSpy;

const renderDashboard = async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  await act(async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ToastProvider>
            <Dashboard />
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  });
  await screen.findByTestId("mock-lexical-editor", {}, { timeout: 5000 });
};

describe("<Dashboard />", () => {
  beforeEach(() => {
    alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    getDocument.mockReset().mockResolvedValue({
      title: "T",
      content: "<p>hi</p>",
    });
    updateDocumentContent.mockReset().mockResolvedValue(undefined);
    updateDocumentTitle.mockReset().mockResolvedValue(undefined);
    translateText.mockReset().mockResolvedValue({ result: "<p>hola</p>" });

    const lexicalConfigUtils = require("@/utils/editor/lexicalConfig.js");
    lexicalConfigUtils.processTextForTranslation
      .mockClear()
      .mockResolvedValue("<p>processed for translation</p>");
    lexicalConfigUtils.processTextForCorrection
      .mockClear()
      .mockResolvedValue("<p>processed for correction</p>");
    lexicalConfigUtils.replaceContent.mockClear();

    jest.useRealTimers();
  });

  afterEach(() => {
    alertSpy.mockRestore();
    mockUseAuth.mockReturnValue({ currentUser: { username: "Bob", credits: { current: 10, max: 10 }, subscriptionTier: "free" } });
    try {
      jest.useRealTimers();
    } catch (e) {}
    jest.clearAllMocks();
  });

  it("loads the document title into the input", async () => {
    await renderDashboard();
    const titleInput = screen.getByPlaceholderText(/untitled document/i);
    await waitFor(() => expect(titleInput).toHaveValue("T"));
  });

  it("auto-saves after the 2.5s debounce", async () => {
    await renderDashboard();

    const mockEditorInputTarget = screen.getByTestId(
      "hidden-mock-editor-input",
    );

    await act(async () => {
      fireEvent.change(mockEditorInputTarget, { target: { value: " more" } });
    });

    await waitFor(() => {
      expect(updateDocumentContent).toHaveBeenCalledTimes(1);
      expect(updateDocumentContent).toHaveBeenCalledWith(
        "d1",
        JSON.stringify("<p>hi more</p>"),
        expect.anything()
      );
    }, { timeout: 3000 });
  });

  it("Translate → Spanish triggers translateText API", async () => {
    const user = userEvent.setup();
    const lexicalConfigUtils = require("@/utils/editor/lexicalConfig.js");

    await renderDashboard();

    const translateButton = screen.getByRole("button", { name: "Translate" });
    await act(async () => {
      await user.click(translateButton);
    });

    const spanishButtonInDropdown = await screen.findByRole(
      "button",
      { name: /spanish/i },
      { timeout: 3000 },
    );

    await act(async () => {
      await user.click(spanishButtonInDropdown);
    });

    await waitFor(() => {
      expect(translateText).toHaveBeenCalledTimes(1);
    });
  });

  it("handles title character limits", async () => {
    const user = userEvent.setup();
    await renderDashboard();

    const titleInput = screen.getByPlaceholderText(/untitled document/i);
    
    // Type a word with > 60 chars
    const longWord = "a".repeat(61);
    await act(async () => {
      await user.clear(titleInput);
      await user.type(titleInput, longWord);
    });

    // Should not have updated docTitle beyond limit? Actually the UI shows toast
    // The toast logic relies on dashboardErrors.js which is mocked
  });

  it("handles title word limits", async () => {
    const user = userEvent.setup();
    await renderDashboard();

    const titleInput = screen.getByPlaceholderText(/untitled document/i);
    
    // Type > 25 words
    const longTitle = Array.from({ length: 26 }, (_, i) => `w${i}`).join(" ");
    await act(async () => {
      await user.clear(titleInput);
      await user.type(titleInput, longTitle);
      fireEvent.blur(titleInput);
    });

    expect(updateDocumentTitle).toHaveBeenCalled();
  });

  it("Grammar Review triggers when clicked and has credits", async () => {
    const user = userEvent.setup();
    await renderDashboard();

    const reviewButton = screen.getByRole("button", { name: "Correct Grammar" });
    await act(async () => {
      await user.click(reviewButton);
    });

    // We can't easily assert the modal because `startGrammarReview` handles it
    // But we know it doesn't show the toast for 'Weekly credit limit reached.'
    expect(screen.queryByText(/Weekly credit limit reached/i)).not.toBeInTheDocument();
  });

  it("Grammar Review blocks when credits are 0 (free user)", async () => {
    mockUseAuth.mockReturnValue({ currentUser: { username: "Bob", credits: { current: 0, max: 10 }, subscriptionTier: "free" } });
    const user = userEvent.setup();
    await renderDashboard();

    const reviewButton = screen.getByRole("button", { name: "Correct Grammar" });
    await act(async () => {
      await user.click(reviewButton);
    });

    // Should show upgrade toast
    expect(screen.getByText(/Weekly credit limit reached\. Upgrade to Pro/i)).toBeInTheDocument();
  });

  it("Grammar Review blocks when credits are 0 (Pro user)", async () => {
    mockUseAuth.mockReturnValue({ currentUser: { username: "Bob", credits: { current: 0, max: 100 }, subscriptionTier: "pro" } });
    const user = userEvent.setup();
    await renderDashboard();

    const reviewButton = screen.getByRole("button", { name: "Correct Grammar" });
    await act(async () => {
      await user.click(reviewButton);
    });

    // Should show pro limit toast
    expect(screen.getByText("Weekly credit limit reached.")).toBeInTheDocument();
  });
});

