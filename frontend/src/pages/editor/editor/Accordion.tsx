import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";
import {
  Accordion as AccordionPrimitive,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function AccordionElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { accordionItems?: string };
  const text = content.accordionItems ?? "Item 1|Content 1\nItem 2|Content 2";
  const items = text.split("\n").map((line) => {
    const [label, body] = line.split("|").map((s) => s.trim());
    return { label: label || "Item", body: body ?? "" };
  });

  return (
    <ElementWrapper element={element} className="!w-full !max-w-full">
      <AccordionPrimitive type="single" collapsible className="w-full">
        {items.map((item, i) => (
          <AccordionItem key={i} value={`item-${i}`}>
            <AccordionTrigger>{item.label}</AccordionTrigger>
            <AccordionContent>{item.body}</AccordionContent>
          </AccordionItem>
        ))}
      </AccordionPrimitive>
    </ElementWrapper>
  );
}
