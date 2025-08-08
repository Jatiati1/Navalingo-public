// src/context/EditorContext.jsx
import React, { createContext, useContext } from "react";

/**
 * Context that exposes an editor instance to descendants.
 * Supports render-prop children: children({ editor }).
 */
const EditorContext = createContext({ editor: null });
export const useEditor = () => useContext(EditorContext);

export function EditorProvider({ editor, children }) {
  const value = { editor };
  const content = typeof children === "function" ? children(value) : children;

  return (
    <EditorContext.Provider value={value}>{content}</EditorContext.Provider>
  );
}
