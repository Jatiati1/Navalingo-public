// frontend/src/components/Dashboard/Editor/themes/EditorTheme.js
// Maps Lexical node/types to CSS class names defined in EditorTheme.css.

import "./EditorTheme.css";

const editorTheme = {
  // Block elements
  paragraph: "editor-paragraph horizontal-text",
  quote: "editor-quote horizontal-text",
  heading: {
    h1: "editor-heading-h1 horizontal-text",
    h2: "editor-heading-h2 horizontal-text",
    h3: "editor-heading-h3 horizontal-text",
    h4: "editor-heading-h4 horizontal-text",
    h5: "editor-heading-h5 horizontal-text",
  },

  // Inline text formatting
  text: {
    bold: "editor-text-bold",
    italic: "editor-text-italic",
    underline: "editor-text-underline",
    strikethrough: "editor-text-strikethrough",
    underlineStrikethrough: "editor-text-underlineStrikethrough",
    code: "editor-text-code",
  },

  // Lists
  list: {
    nested: {
      listitem: "editor-nested-listitem horizontal-text",
    },
    ol: "editor-list-ol horizontal-text",
    ul: "editor-list-ul horizontal-text",
    listitem: "editor-listitem horizontal-text",
  },

  // Code blocks and token highlighting
  code: "editor-code horizontal-text",
  codeHighlight: {
    atrule: "editor-tokenAttr",
    attr: "editor-tokenAttr",
    boolean: "editor-tokenProperty",
    builtin: "editor-tokenSelector",
    comment: "editor-tokenComment",
    punctuation: "editor-tokenPunctuation",
    function: "editor-tokenFunction",
    operator: "editor-tokenOperator",
    keyword: "editor-tokenKeyword",
  },
};

export default editorTheme;
