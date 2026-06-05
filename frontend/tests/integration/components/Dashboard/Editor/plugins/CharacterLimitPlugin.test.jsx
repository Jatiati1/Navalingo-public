import React from "react";
import { render } from "@testing-library/react";
import CharacterLimitPlugin from "@/components/Dashboard/Editor/plugins/CharacterLimitPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import * as lexical from "lexical";

jest.mock("@lexical/react/LexicalComposerContext", () => ({
  useLexicalComposerContext: jest.fn()
}));

jest.mock("lexical", () => ({
  $getSelection: jest.fn(),
  $isRangeSelection: jest.fn(),
  $getRoot: jest.fn(),
  COMMAND_PRIORITY_CRITICAL: 4,
  PASTE_COMMAND: "PASTE_COMMAND",
  CONTROLLED_TEXT_INSERTION_COMMAND: "CONTROLLED_TEXT_INSERTION_COMMAND"
}));

describe("CharacterLimitPlugin", () => {
  let mockEditor;
  let mockRootElement;
  let mockRegisterRootListener;
  let mockRegisterCommand;
  let mockUpdate;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRegisterRootListener = jest.fn(() => () => {});
    mockRegisterCommand = jest.fn(() => () => {});
    mockUpdate = jest.fn((cb) => cb());

    mockEditor = {
      registerRootListener: mockRegisterRootListener,
      registerCommand: mockRegisterCommand,
      getEditorState: jest.fn().mockReturnValue({
        read: jest.fn((cb) => cb())
      }),
      update: mockUpdate,
      isComposing: jest.fn().mockReturnValue(false),
      isEditable: jest.fn().mockReturnValue(true)
    };

    useLexicalComposerContext.mockReturnValue([mockEditor]);
    mockRootElement = document.createElement("div");
  });

  it("registers event listeners and commands on mount", () => {
    render(<CharacterLimitPlugin liveCap={10} />);

    expect(mockRegisterRootListener).toHaveBeenCalled();
    expect(mockRegisterCommand).toHaveBeenCalledTimes(2); // insert and paste
  });

  it("handles beforeinput event to block text over limit", () => {
    render(<CharacterLimitPlugin liveCap={5} />);

    // Get the root listener callback
    const rootListenerCb = mockRegisterRootListener.mock.calls[0][0];
    rootListenerCb(mockRootElement, null); // Mount root

    // Mock words in editor: "One Two Three Four" (4 words)
    lexical.$getRoot.mockReturnValue({ getTextContent: () => "One Two Three Four" });
    lexical.$isRangeSelection.mockReturnValue(false);

    // Create a mock beforeinput event trying to type " Five Six" (2 words)
    const mockEvent = new Event("beforeinput");
    mockEvent.data = " Five Six";
    mockEvent.preventDefault = jest.fn();

    const dispatchSpy = jest.spyOn(window, "dispatchEvent").mockImplementation(() => {});

    mockRootElement.dispatchEvent(mockEvent);

    // 4 current + 2 incoming = 6 > 5 (limit). Should block!
    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalled();
    
    dispatchSpy.mockRestore();
  });

  it("handles paste command by truncating text", () => {
    render(<CharacterLimitPlugin liveCap={5} />);

    // Get the paste command callback
    const pasteCall = mockRegisterCommand.mock.calls.find(call => call[0] === "PASTE_COMMAND");
    const pasteHandler = pasteCall[1];

    lexical.$getRoot.mockReturnValue({ getTextContent: () => "One Two Three" });
    lexical.$isRangeSelection.mockReturnValue(false);

    const mockEvent = {
      clipboardData: {
        getData: () => " Four Five Six"
      }
    };

    const dispatchSpy = jest.spyOn(window, "dispatchEvent").mockImplementation(() => {});

    const mockSelection = { insertText: jest.fn(), getTextContent: () => "" };
    lexical.$getSelection.mockReturnValue(mockSelection);
    lexical.$isRangeSelection.mockReturnValue(true);

    const handled = pasteHandler(mockEvent);

    expect(handled).toBe(true);
    // Limit is 5. We have 3 words. Remaining is 2.
    // Pasted 3 words ("Four", "Five", "Six"). Truncates to "Four Five".
    expect(mockSelection.insertText).toHaveBeenCalledWith("Four Five");
    
    dispatchSpy.mockRestore();
  });
  
  it("allows insert command if within limits", () => {
    render(<CharacterLimitPlugin liveCap={10} />);

    // Get the insert command callback
    const insertCall = mockRegisterCommand.mock.calls.find(call => call[0] === "CONTROLLED_TEXT_INSERTION_COMMAND");
    const insertHandler = insertCall[1];

    lexical.$getRoot.mockReturnValue({ getTextContent: () => "One Two Three" });
    lexical.$isRangeSelection.mockReturnValue(false);

    const handled = insertHandler(" Four Five");

    expect(handled).toBe(false); // Does not block
  });
});
