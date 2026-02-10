import { EditorElement } from "@/contexts/EditorContext";
import ElementWrapper from "./ElementWrapper";
import { Tabs as TabsPrimitive, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TabsElement({ element }: { element: EditorElement }) {
  if (Array.isArray(element.content)) return null;
  const content = element.content as { tabLabels?: string; tabContents?: string };
  const labelsText = content.tabLabels ?? "Tab 1, Tab 2";
  const contentsText = content.tabContents ?? "Content 1\nContent 2";
  const labels = labelsText.split(",").map((s) => s.trim()).filter(Boolean);
  const contents = contentsText.split("\n").map((s) => s.trim());

  return (
    <ElementWrapper element={element} className="!w-full !max-w-full">
      <TabsPrimitive defaultValue="0" className="w-full">
        <TabsList className="w-full">
          {labels.map((label, i) => (
            <TabsTrigger key={i} value={String(i)}>
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {contents.map((body, i) => (
          <TabsContent key={i} value={String(i)}>
            {body}
          </TabsContent>
        ))}
      </TabsPrimitive>
    </ElementWrapper>
  );
}
