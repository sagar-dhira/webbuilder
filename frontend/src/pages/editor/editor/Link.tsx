import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";

export default function LinkElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { innerText?: string; href?: string };
  const text = content.innerText ?? "Link";
  const href = content.href?.trim() || "#";

  return (
    <ElementWrapper element={element} className="!w-fit !h-fit inline-flex">
      <a href={href} target="_blank" rel="noopener noreferrer" style={element.styles} className="inline">
        {text}
      </a>
    </ElementWrapper>
  );
}
