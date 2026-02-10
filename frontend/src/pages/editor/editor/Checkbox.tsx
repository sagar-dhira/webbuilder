import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";
import { Label } from "@/components/ui/label";

export default function CheckboxElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { innerText?: string; checked?: boolean };
  const label = content.innerText ?? "Checkbox";
  const checked = content.checked === true;

  return (
    <ElementWrapper element={element} className="!w-fit !h-fit">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={checked}
          readOnly
          className="h-4 w-4 rounded border-input"
          style={element.styles}
        />
        <Label className="text-sm">{label}</Label>
      </div>
    </ElementWrapper>
  );
}
