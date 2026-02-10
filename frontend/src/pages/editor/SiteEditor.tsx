import { useEffect } from "react";
import { useEditor } from "@/contexts/EditorContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Recursive from "./editor/Recursive";
import styles from "./SiteEditor.module.scss";
import { cn } from "@/lib/utils";

export default function SiteEditor({ siteId, liveMode, initialContent }: { siteId: string; liveMode?: boolean; initialContent?: string | null }) {
  const { state, dispatch } = useEditor();

  useEffect(() => {
    if (initialContent !== undefined) {
      dispatch({
        type: "LOAD_DATA",
        payload: {
          elements: initialContent ? JSON.parse(initialContent) : undefined,
          withLive: !!liveMode,
        },
      });
      if (liveMode) {
        dispatch({ type: "TOGGLE_LIVE_MODE", payload: { value: true } });
      }
      return;
    }
    api<{ content?: string }>(`/sites/${siteId}`).then((res) => {
      if (!res.success) {
        toast.error(res.msg || "Failed to load site");
        return;
      }
      const content = (res as { content?: string }).content;
      dispatch({
        type: "LOAD_DATA",
        payload: {
          elements: content ? JSON.parse(content) : undefined,
          withLive: false,
        },
      });
    });
  }, [siteId, dispatch, liveMode, initialContent]);

  const handleClick = () => dispatch({ type: "CHANGE_SELECTED_ELEMENT", payload: {} });
  const handleExitPreview = () => {
    dispatch({ type: "TOGGLE_PREVIEW_MODE" });
    dispatch({ type: "TOGGLE_LIVE_MODE" });
  };

  const isLive = state.editor.previewMode || state.editor.liveMode;

  return (
    <div
      className={cn(
        styles.wrapper,
        !state.editor.previewMode && !state.editor.liveMode && "max-h-[calc(100vh-65px)]"
      )}
    >
      <div
        className={cn(styles.canvas, isLive && styles.canvasLive)}
        onClick={handleClick}
      >
        <Button
          variant="default"
          size="icon"
          onClick={handleExitPreview}
          className={cn(
            styles.exitPreview,
            "w-12 h-12 rounded-lg shadow-lg",
            state.editor.previewMode ? "" : styles.exitPreviewHidden
          )}
        >
          Exit Preview
        </Button>
        {Array.isArray(state.editor.elements) &&
          state.editor.elements.map((el) => <Recursive key={el.id} element={el} />)}
      </div>
    </div>
  );
}
