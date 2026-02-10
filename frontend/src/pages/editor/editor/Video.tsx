import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export default function VideoElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { videoUrl?: string; controls?: boolean };
  const url = content.videoUrl?.trim();
  const showControls = content.controls !== false;

  return (
    <ElementWrapper element={element} className="!w-full !max-w-full">
      <div className="w-full max-w-full overflow-hidden rounded-lg">
        <AspectRatio ratio={16 / 9} className="bg-muted">
          {url ? (
            <video
              src={url}
              controls={showControls}
              className="w-full h-full object-contain"
              style={element.styles}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm p-2">
              Add video URL in settings
            </div>
          )}
        </AspectRatio>
      </div>
    </ElementWrapper>
  );
}
