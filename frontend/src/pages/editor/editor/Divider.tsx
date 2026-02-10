import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";

export default function DividerElement({ element }: { element: EditorElement }) {
  return (
    <ElementWrapper element={element} className="!w-full !max-w-full">
      <hr style={element.styles} className="w-full" />
    </ElementWrapper>
  );
}
