import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import ElementPlaceholder from "./ElementPlaceholder";
import { elements } from "./elements";
import { Database } from "lucide-react";

const layoutElements = elements.filter((el) => el.group === "layout");
const elementElements = elements.filter((el) => el.group === "element");
const layoutCategories = [...new Set(layoutElements.map((el) => el.category))];
const elementCategories = [...new Set(elementElements.map((el) => el.category))];

export default function ComponentsTab() {
  return (
    <Tabs defaultValue="layout" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-2">
        <TabsTrigger value="layout">Layout</TabsTrigger>
        <TabsTrigger value="widget">Widget</TabsTrigger>
      </TabsList>
      <TabsContent value="layout" className="mt-0">
        <Accordion type="multiple" defaultValue={["Layout", "Elements"]} className="w-full">
          <AccordionItem value="Layout" className="px-2 py-0">
            <AccordionTrigger className="!no-underline">Layout</AccordionTrigger>
            <AccordionContent>
              {layoutCategories.map((cat) => (
                <div key={cat} className="mb-4">
                  <h4 className="mb-2 text-xs font-medium text-muted-foreground">{cat}</h4>
                  {layoutElements
                    .filter((el) => el.category === cat)
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
                  {elementElements
                    .filter((el) => el.category === cat)
                    .map((el) => (
                      <ElementPlaceholder key={el.id} type={el.id} Icon={el.icon} title={el.label} />
                    ))}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </TabsContent>
      <TabsContent value="widget" className="mt-0">
        <div className="mb-4">
          <h4 className="mb-2 text-xs font-medium text-muted-foreground">Data</h4>
          <Card
            className="cursor-grab active:cursor-grabbing rounded-lg border bg-card shadow-sm hover:bg-muted/50 transition-colors"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("componentType", "etl");
            }}
          >
            <CardContent className="flex flex-col items-center justify-center gap-2 p-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
                <Database className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="text-center text-sm font-medium text-foreground">
                Extract Load and Transform (ETL)
              </span>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
