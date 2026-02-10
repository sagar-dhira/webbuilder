import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";
import { Card as CardPrimitive, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function CardElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { cardTitle?: string; cardBody?: string; cardImageUrl?: string };
  const title = content.cardTitle ?? "Card Title";
  const body = content.cardBody ?? "Card body text.";
  const imageUrl = content.cardImageUrl?.trim();

  return (
    <ElementWrapper element={element} className="!w-full !max-w-full">
      <CardPrimitive style={element.styles} className="overflow-hidden">
        {imageUrl && (
          <div className="aspect-video w-full overflow-hidden bg-muted">
            <img src={imageUrl} alt="" className="h-full w-full object-cover" />
          </div>
        )}
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base">{body}</CardDescription>
        </CardContent>
      </CardPrimitive>
    </ElementWrapper>
  );
}
