import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ElementPlaceholder from "./ElementPlaceholder";
import { elements } from "./elements";

export default function ComponentsTab() {
  const layoutCategories = [...new Set(elements.filter((el) => el.group === "layout").map((el) => el.category))];
  const elementCategories = [...new Set(elements.filter((el) => el.group === "element").map((el) => el.category))];

  return (
    <Accordion type="multiple" defaultValue={["Layout", "Elements"]} className="w-full">
      <AccordionItem value="Layout" className="px-2 py-0">
        <AccordionTrigger className="!no-underline">Layout</AccordionTrigger>
        <AccordionContent>
          {layoutCategories.map((cat) => (
            <div key={cat} className="mb-4">
              <h4 className="mb-2 text-xs font-medium text-muted-foreground">{cat}</h4>
              {elements
                .filter((el) => el.group === "layout" && el.category === cat)
                .map((el) => (
                  <ElementPlaceholder key={el.id} type={el.id} Icon={el.icon} title={el.label} />
                ))}
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="Elements" className="px-2 py-0">
        <AccordionTrigger className="!no-underline">Elements</AccordionTrigger>
        <AccordionContent>
          {elementCategories.map((cat) => (
            <div key={cat} className="mb-4">
              <h4 className="mb-2 text-xs font-medium text-muted-foreground">{cat}</h4>
              {elements
                .filter((el) => el.group === "element" && el.category === cat)
                .map((el) => (
                  <ElementPlaceholder key={el.id} type={el.id} Icon={el.icon} title={el.label} />
                ))}
            </div>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
