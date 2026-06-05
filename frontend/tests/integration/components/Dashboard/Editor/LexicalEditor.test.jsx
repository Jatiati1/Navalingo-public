import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LexicalEditor from "@/components/Dashboard/Editor/LexicalEditor";
import { $getRoot, $createParagraphNode, $createTextNode } from "lexical";
import * as lexicalHtml from "@lexical/html";

jest.mock("firebase/auth", () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  onAuthStateChanged: jest.fn(() => jest.fn()),
}));

describe("<LexicalEditor />", () => {
  let editor; // This will hold the Lexical editor instance

  const mountEditorWithProps = (props = {}) => {
    // Ensure onInitialized captures the editor instance from the component
    return render(
      <LexicalEditor
        initialHtmlContent={props.content !== undefined ? props.content : ""} // Use initialHtmlContent
        onChange={props.onChange || (() => {})}
        onInitialized={(e) => {
          editor = e;
          if (props.onInitialized) props.onInitialized(e);
        }}
        WordCapManager={() => null}
        WordLimitEnforcer={() => null}
        {...props} // Spread any other props
      />,
    );
  };

  beforeEach(() => {
    editor = null; // Reset editor instance before each test
    jest.restoreAllMocks(); // Good for cleaning spies
    jest.useRealTimers(); // Default to real timers

    // Mock console.error for expected errors, let others through
    const originalConsoleError = console.error;
    jest.spyOn(console, "error").mockImplementation((message, ...args) => {
      if (
        (typeof message === "string" && message.includes("simulate failure")) ||
        (typeof message === "string" && message.includes("Lexical Error:")) ||
        (typeof message === "string" &&
          message.includes("Could not find node with key")) // Another common Lexical dev warning
      ) {
        // Suppress expected errors/warnings
      } else {
        originalConsoleError(message, ...args); // Log unexpected errors
      }
    });
  });

  afterEach(() => {
    // Restore console.error if it was spied on, though beforeEach handles it now
    // jest.restoreAllMocks(); // Already in beforeEach
  });

  it("debounces onChange for programmatic update", async () => {
    jest.useFakeTimers();
    const onChange = jest.fn();

    // Use the helper that correctly captures the editor instance via onInitialized
    mountEditorWithProps({ onChange: onChange });

    // Wait for the editor instance to be set by onInitialized
    await waitFor(() => expect(editor).toBeDefined(), { timeout: 1000 });
    if (!editor) throw new Error("Editor not initialized");

    act(() => {
      editor.update(() => {
        $getRoot()
          .clear()
          .append(
            $createParagraphNode().append($createTextNode("Hello world")),
          );
      });
    });

    // Wait for React state updates and then advance timers
    await act(async () => {
      jest.advanceTimersByTime(350); // 300ms debounce + buffer
    });

    expect(onChange).toHaveBeenCalled();
    jest.useRealTimers();
  });

  it("falls back when $generateNodesFromDOM throws", async () => {
    jest.useFakeTimers();
    const generateNodesSpy = jest
      .spyOn(lexicalHtml, "$generateNodesFromDOM")
      .mockImplementation(() => {
        throw new Error("simulate failure");
      });

    const onChange = jest.fn();
    const initialBadContent = "<div>bad html to trigger parse</div>";

    mountEditorWithProps({ content: initialBadContent, onChange: onChange }); // Pass content as initialHtmlContent

    await waitFor(() => expect(editor).toBeDefined(), { timeout: 1000 });
    if (!editor) throw new Error("Editor not initialized");

    // InitializeContentPlugin runs on mount. Its update should trigger ChangeHandlerPlugin.
    await act(async () => {
      jest.advanceTimersByTime(400); // Debounce time for ChangeHandlerPlugin
    });

    expect(onChange).toHaveBeenCalled();
    // To be more precise, check what it was called with.
    // The fallback logic in InitializeContentPlugin wraps the bad HTML in a paragraph.
    // So, $generateHtmlFromNodes would likely produce: <p>&lt;div&gt;bad html to trigger parse&lt;/div&gt;</p>
    // or similar, depending on how $createTextNode handles HTML strings.
    // For now, just checking if it's called is a good step.
    // If Lexical's fallback in your InitializeContentPlugin creates a text node with the raw bad HTML:
    // expect(onChange).toHaveBeenCalledWith(expect.stringContaining(initialBadContent));
    // Or more specifically if it's wrapped in <p>:
    // expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^<p>.*bad html to trigger parse.*<\/p>$/));

    generateNodesSpy.mockRestore();
    jest.useRealTimers();
  });
});
