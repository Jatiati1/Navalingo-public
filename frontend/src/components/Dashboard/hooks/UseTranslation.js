// frontend/src/components/Dashboard/hooks/useTranslation.js
// Translates the current editor content to a target language and replaces the document (respects liveCap).

import axiosInstance from "../../../api/axios";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../UI/Toast";
import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot } from "lexical";
import { getEditorToastFromError } from "../../../utils/editor/dashboardErrors.js";

export function useTranslation(editorRef, liveCap) {
  const { csrfToken } = useAuth();
  const { showToast } = useToast();

  const translate = async (targetLang) => {
    const editor = editorRef.current;
    if (!editor) return;

    const text = editor
      .getEditorState()
      .read(() => $getRoot().getTextContent());

    try {
      const {
        data: { result: translatedHtml },
      } = await axiosInstance.post(
        "/process-text",
        { text, action: "translate", targetLang, maxWords: liveCap },
        { headers: { "X-CSRF-Token": csrfToken } }
      );

      const TAG = `translate-final-${Date.now()}`;

      editor.update(
        () => {
          const rootNode = $getRoot();
          rootNode.clear();

          const dom = new DOMParser().parseFromString(
            translatedHtml,
            "text/html"
          );
          const nodes = $generateNodesFromDOM(editor, dom);
          rootNode.append(...nodes);
        },
        { tag: TAG }
      );
    } catch (error) {
      const { message, severity } = getEditorToastFromError(error, {
        action: "translate",
      });
      showToast(message, { severity });
    }
  };

  return { translate };
}
