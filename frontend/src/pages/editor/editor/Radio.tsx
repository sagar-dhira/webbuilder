import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";
import { Label } from "@/components/ui/label";

export default function RadioElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { innerText?: string; name?: string; value?: string };
  const label = content.innerText ?? "Radio";
  const name = content.name ?? "radio";
  const value = content.value ?? "option1";

  return (
    <ElementWrapper element={element} className="!w-fit !h-fit">
      <div className="flex items-center gap-2">
        <input type="radio" name={name} value={value} readOnly className="h-4 w-4" style={element.styles} />
        <Label className="text-sm">{label}</Label>
      </div>
    </ElementWrapper>
  );
}
