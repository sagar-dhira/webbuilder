import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";

export default function SpacerElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { spacerHeight?: string; spacerWidth?: string };
  const height = content.spacerHeight ?? "24px";
  const width = content.spacerWidth ?? "100%";

  return (
    <ElementWrapper element={element} className="!w-full">
      <div style={{ width, height, minHeight: height, ...element.styles }} aria-hidden />
    </ElementWrapper>
  );
}
