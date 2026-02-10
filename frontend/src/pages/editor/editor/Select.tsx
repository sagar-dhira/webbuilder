import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";
import {
  Select as SelectPrimitive,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SelectElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { options?: string; placeholder?: string };
  const optionsText = content.options ?? "Option 1\nOption 2\nOption 3";
  const placeholder = content.placeholder ?? "Select...";
  const options = optionsText.split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <ElementWrapper element={element} className="!w-full !max-w-full">
      <SelectPrimitive>
        <SelectTrigger style={element.styles} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt, i) => (
            <SelectItem key={i} value={opt}>
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectPrimitive>
    </ElementWrapper>
  );
}
