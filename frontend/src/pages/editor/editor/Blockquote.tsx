import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";

export default function BlockquoteElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { innerText?: string };
  const text = content.innerText ?? "Quote text";

  return (
    <ElementWrapper element={element} className="!w-full !max-w-full">
      <blockquote style={element.styles} className="my-2">
        {text}
      </blockquote>
    </ElementWrapper>
  );
}
