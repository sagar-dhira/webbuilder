import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export default function EmbedElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { embedUrl?: string };
  const url = content.embedUrl?.trim();

  return (
    <ElementWrapper element={element} className="!w-full !max-w-full">
      <div className="w-full max-w-full overflow-hidden rounded-lg">
        <AspectRatio ratio={16 / 9} className="bg-muted">
          {url ? (
            <iframe
              src={url}
              title="Embed"
              className="w-full h-full border-0"
              allowFullScreen
              style={element.styles}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm p-2">
              Add embed URL in settings (e.g. YouTube, maps)
            </div>
          )}
        </AspectRatio>
      </div>
    </ElementWrapper>
  );
}
