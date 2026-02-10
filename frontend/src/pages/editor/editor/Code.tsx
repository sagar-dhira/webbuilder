import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";

export default function CodeElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { codeText?: string };
  const text = content.codeText ?? "const x = 1;";

  return (
    <ElementWrapper element={element} className="!w-full !max-w-full">
      <pre style={element.styles} className="overflow-x-auto rounded p-2 my-1">
        <code>{text}</code>
      </pre>
    </ElementWrapper>
  );
}
