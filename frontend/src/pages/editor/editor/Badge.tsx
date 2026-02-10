import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";
import { Badge } from "@/components/ui/badge";

export default function BadgeElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { badgeText?: string };
  const text = content.badgeText ?? "Badge";

  return (
    <ElementWrapper element={element} className="!w-fit !h-fit inline-flex">
      <Badge style={element.styles}>{text}</Badge>
    </ElementWrapper>
  );
}
