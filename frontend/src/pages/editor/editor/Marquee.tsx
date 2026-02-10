import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";

export default function MarqueeElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { marqueeText?: string };
  const text = content.marqueeText ?? "Scrolling text...";

  return (
    <ElementWrapper element={element} className="!w-full !max-w-full overflow-hidden">
      <div className="block py-2 w-full overflow-hidden" style={element.styles}>
        <div
          className="flex whitespace-nowrap w-max"
          style={{ animation: "marquee-scroll 15s linear infinite" }}
        >
          <span className="pr-8">{text}</span>
          <span className="pr-8">{text}</span>
        </div>
      </div>
    </ElementWrapper>
  );
}
