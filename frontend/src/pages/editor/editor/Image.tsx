import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export default function ImageElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;

  const content = element.content as { imageUrl?: string; altText?: string };
  const width = element.styles?.width ? parseInt(String(element.styles.width)) : 250;
  const height = element.styles?.height ? parseInt(String(element.styles.height)) : 140;

  return (
    <ElementWrapper element={element} className="!w-fit !h-fit">
      <div style={{ width, height }} className="min-w-[250px]">
        <AspectRatio ratio={16 / 9} className="bg-muted rounded-lg relative transition-all">
          {content.imageUrl?.trim() ? (
            <img
              src={content.imageUrl}
              alt={content.altText || "Image"}
              className="object-cover w-full h-full"
              style={element.styles}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              Add image URL in settings
            </div>
          )}
        </AspectRatio>
      </div>
    </ElementWrapper>
  );
}
