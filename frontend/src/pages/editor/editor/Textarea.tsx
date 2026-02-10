import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";
import { Textarea } from "@/components/ui/textarea";

export default function TextareaElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { placeholder?: string };
  const placeholder = content.placeholder ?? "Enter text...";

  return (
    <ElementWrapper element={element} className="!w-full !max-w-full">
      <Textarea placeholder={placeholder} style={element.styles} className="w-full min-h-[80px]" readOnly={false} />
    </ElementWrapper>
  );
}
