import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";
import { Button } from "@/components/ui/button";

export default function ButtonElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { buttonLabel?: string; href?: string };
  const label = content.buttonLabel ?? "Button";
  const href = content.href?.trim();

  return (
    <ElementWrapper element={element} className="!w-fit !h-fit">
      {href ? (
        <Button asChild style={element.styles}>
          <a href={href}>{label}</a>
        </Button>
      ) : (
        <Button style={element.styles} type="button">
          {label}
        </Button>
      )}
    </ElementWrapper>
  );
}
