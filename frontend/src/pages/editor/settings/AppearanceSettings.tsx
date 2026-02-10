import { useEditor } from "@/contexts/EditorContext";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";

interface Props {
  handleOnChange: (key: string, value: string) => void;
}

export default function AppearanceSettings({ handleOnChange }: Props) {
  const { state } = useEditor();
  const bg = state.editor.selectedElement.styles.backgroundColor ?? "#ffff";

  return (
    <AccordionItem value="Appearance" className="px-2 py-0 border-y border-border">
      <AccordionTrigger className="!no-underline">Appearance</AccordionTrigger>
      <AccordionContent className="flex flex-col gap-4 px-1">
        <div>
          <p className="mb-2 text-muted-foreground text-sm">Fill Color</p>
          <div className="flex gap-2">
            <ColorPicker value={bg} onChange={(c) => handleOnChange("backgroundColor", c)} />
            <Input
              value={bg}
              onChange={(e) => handleOnChange("backgroundColor", e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
