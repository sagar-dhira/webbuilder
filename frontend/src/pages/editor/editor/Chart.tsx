import { EditorElement, useEditor } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";
import { BarChart3 } from "lucide-react";

export default function ChartElement({ element }: { element: EditorElement }) {
  const { state } = useEditor();
  const isEditMode = !state.editor.liveMode;

  if (Array.isArray(element.content)) return null;
  const content = element.content as { chartId?: number; baseUrl?: string; height?: number };
  const chartId = content.chartId;
  const baseUrl = (content.baseUrl || "").replace(/\/$/, "");
  const height = content.height ?? 400;

  const embedUrl =
    chartId && baseUrl
      ? `${baseUrl}/explore/?slice_id=${chartId}&standalone=1&height=${height}`
      : "";

  return (
    <ElementWrapper element={element} className="!w-full !max-w-full">
      <div className="w-full max-w-full overflow-hidden rounded-lg border bg-muted/30">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={element.name || "Superset Chart"}
            className="w-full border-0 rounded-lg"
            style={{
              height: `${height}px`,
              ...element.styles,
              ...(isEditMode && { pointerEvents: "none" as const }),
            }}
          />
        ) : (
          <div
            className="flex flex-col items-center justify-center text-muted-foreground text-sm p-6 gap-2"
            style={{ minHeight: `${height}px` }}
          >
            <BarChart3 className="w-10 h-10 opacity-50" />
            <span>Configure chart in settings (chart ID + Superset URL)</span>
          </div>
        )}
      </div>
    </ElementWrapper>
  );
}
