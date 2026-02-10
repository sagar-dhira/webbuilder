import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";
import { Button } from "@/components/ui/button";

export default function SubmitButtonElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { buttonLabel?: string };
  const label = content.buttonLabel ?? "Submit";

  return (
    <ElementWrapper element={element} className="!w-fit !h-fit">
      <Button type="submit" style={element.styles}>
        {label}
      </Button>
    </ElementWrapper>
  );
}
