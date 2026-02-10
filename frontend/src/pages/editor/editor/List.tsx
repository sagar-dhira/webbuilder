import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";

export default function ListElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { listItems?: string };
  const text = content.listItems ?? "Item 1\nItem 2\nItem 3";
  const items = text.split("\n").map((s) => s.trim()).filter(Boolean);
  const isOl = element.type === "ol";

  return (
    <ElementWrapper element={element} className="!w-full !max-w-full">
      {isOl ? (
        <ol className="list-decimal list-inside space-y-1" style={element.styles}>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ol>
      ) : (
        <ul className="list-disc list-inside space-y-1" style={element.styles}>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )}
    </ElementWrapper>
  );
}
