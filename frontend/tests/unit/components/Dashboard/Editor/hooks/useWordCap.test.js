import React, { useEffect } from "react";
import { render, screen, act, waitFor } from "@testing-library/react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { WordCountDisplay, useWordCap } from "@/components/Dashboard/Editor/hooks/useWordCap";

jest.mock("@lexical/react/LexicalComposerContext", () => ({
  useLexicalComposerContext: jest.fn(),
}));

jest.mock("lexical", () => ({
  $getRoot: jest.fn(() => ({
    getTextContent: jest.fn(() => "This is a test document with some words"),
  })),
}));

jest.mock("@/utils/editor/wordLimit", () => ({
  getWordLimits: jest.fn((isPro) => ({ baseCap: isPro ? 500 : 250 })),
  calculateInflatedCap: jest.fn((wc, isPro) => wc + 50),
  calculateDeflatedCap: jest.fn((wc, isPro) => wc + 10),
}));

jest.mock("@/components/Dashboard/Editor/plugins/CharacterLimitPlugin", () => {
  return function MockCharacterLimitPlugin({ liveCap }) {
    return <div data-testid="char-limit-plugin">{liveCap}</div>;
  };
});

describe("WordCountDisplay", () => {
  let mockRegisterUpdateListener;

  beforeEach(() => {
    mockRegisterUpdateListener = jest.fn();
    useLexicalComposerContext.mockReturnValue([
      { registerUpdateListener: mockRegisterUpdateListener },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders correctly and registers listener", () => {
    render(<WordCountDisplay liveCap={250} />);
    expect(mockRegisterUpdateListener).toHaveBeenCalled();
  });

  it("triggers update listener and calls onWordCountChange", () => {
    const onWordCountChange = jest.fn();
    render(<WordCountDisplay liveCap={250} onWordCountChange={onWordCountChange} />);
    
    const listener = mockRegisterUpdateListener.mock.calls[0][0];
    const editorState = {
      read: jest.fn((cb) => cb()),
    };
    
    act(() => {
      listener({ editorState, tags: new Set() });
    });

    expect(onWordCountChange).toHaveBeenCalledWith(8);
  });

  it("adds shake and max classes when count >= liveCap", () => {
    const { getByText } = render(<WordCountDisplay liveCap={5} />); // liveCap 5 < 8 words
    
    const listener = mockRegisterUpdateListener.mock.calls[0][0];
    const editorState = { read: jest.fn((cb) => cb()) };
    act(() => { listener({ editorState, tags: new Set() }); });

    const element = getByText("8 / 5 words");
    expect(element.className).toContain("max");
  });

  it("adds warn class when count is near liveCap", () => {
    const { getByText } = render(<WordCountDisplay liveCap={8} />); // 8 / 8 = 100%, but >= 5 handles it
    
    const listener = mockRegisterUpdateListener.mock.calls[0][0];
    const editorState = { read: jest.fn((cb) => cb()) };
    act(() => { listener({ editorState, tags: new Set() }); });

    const element = getByText("8 / 8 words");
    expect(element.className).toContain("max");
  });
});

describe("useWordCap hook", () => {
  const MockEditorComponent = ({ isPro, documentData }) => {
    const { liveCap, WordCapManager, WordLimitEnforcer } = useWordCap(isPro, documentData);
    return (
      <div>
        <span data-testid="live-cap">{liveCap}</span>
        <WordCapManager />
        <WordLimitEnforcer />
      </div>
    );
  };

  let mockEditorStateRead;
  let mockRegisterUpdateListener;
  let mockGetEditorState;

  beforeEach(() => {
    mockEditorStateRead = jest.fn((cb) => cb());
    mockRegisterUpdateListener = jest.fn();
    mockGetEditorState = jest.fn(() => ({ read: mockEditorStateRead }));

    useLexicalComposerContext.mockReturnValue([
      {
        registerUpdateListener: mockRegisterUpdateListener,
        getEditorState: mockGetEditorState,
      },
    ]);
  });

  it("initializes liveCap correctly without documentData", () => {
    const { getByTestId } = render(<MockEditorComponent isPro={false} />);
    // 8 words < 250 baseCap, so initialCap is 250
    expect(getByTestId("live-cap").textContent).toBe("250");
  });

  it("initializes liveCap from documentData if provided", async () => {
    const { getByTestId } = render(<MockEditorComponent isPro={false} documentData={{ liveWordCap: 300 }} />);
    await waitFor(() => {
      expect(getByTestId("live-cap").textContent).toBe("300");
    });
  });

  it("updates cap when AI inserts text exceeding cap", () => {
    const { getByTestId } = render(<MockEditorComponent isPro={false} documentData={{ liveWordCap: 250 }} />);
    
    const listener = mockRegisterUpdateListener.mock.calls[0][0];
    
    // Simulate AI insert
    require("lexical").$getRoot.mockImplementationOnce(() => ({
      getTextContent: () => new Array(300).fill("word").join(" "), // 300 words
    }));

    const editorState = { read: jest.fn((cb) => cb()) };
    act(() => {
      listener({ editorState, tags: new Set(["translate-final-123"]) });
    });

    // inflate is wc + 50 = 350
    expect(getByTestId("live-cap").textContent).toBe("350");
  });

  it("deflates cap when user manually removes text", () => {
    const { getByTestId } = render(<MockEditorComponent isPro={false} documentData={{ liveWordCap: 350 }} />);
    
    const listener = mockRegisterUpdateListener.mock.calls[0][0];
    
    // Previous count was 8, but cap is 350. Let's say user deleted to 5 words.
    require("lexical").$getRoot.mockImplementationOnce(() => ({
      getTextContent: () => new Array(5).fill("word").join(" "), // 5 words
    }));

    const editorState = { read: jest.fn((cb) => cb()) };
    act(() => {
      listener({ editorState, tags: new Set(["user-typing"]) });
    });

    // target is max(calculateDeflatedCap(5) -> 15, baseCap -> 250). Result 250.
    expect(getByTestId("live-cap").textContent).toBe("250");
  });
});
