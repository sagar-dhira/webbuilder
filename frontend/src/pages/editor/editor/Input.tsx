import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";
import { Input } from "@/components/ui/input";

export default function InputElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { inputType?: string; placeholder?: string };
  const type = content.inputType || "text";
  const placeholder = content.placeholder ?? "";

  return (
    <ElementWrapper element={element} className="!w-full !max-w-full">
      <Input type={type} placeholder={placeholder} style={element.styles} className="w-full" readOnly={false} />
    </ElementWrapper>
  );
}
