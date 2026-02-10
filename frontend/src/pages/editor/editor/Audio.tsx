import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";

export default function AudioElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { audioUrl?: string; controls?: boolean };
  const url = content.audioUrl?.trim();
  const showControls = content.controls !== false;

  return (
    <ElementWrapper element={element} className="!w-full !max-w-full">
      <div className="w-full max-w-full py-2">
        {url ? (
          <audio src={url} controls={showControls} className="w-full" style={element.styles} />
        ) : (
          <div className="flex items-center justify-center text-muted-foreground text-sm py-6 border border-dashed rounded-lg">
            Add audio URL in settings
          </div>
        )}
      </div>
    </ElementWrapper>
  );
}
