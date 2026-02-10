import { useEditor } from "@/contexts/EditorContext";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";

interface Props {
  handleOnChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyValue?: (key: string, value: string) => void;
}

export default function StrokeSettings({ handleOnChange, handleKeyValue }: Props) {
  const { state } = useEditor();
  const s = state.editor.selectedElement.styles;

  return (
    <AccordionItem value="Stroke" className="px-2 py-0 border-y border-border">
      <AccordionTrigger className="!no-underline">Stroke</AccordionTrigger>
      <AccordionContent className="flex flex-col gap-4 px-1">
        <div>
          <p className="mb-2 text-muted-foreground text-sm">Border Width</p>
          <Input id="borderWidth" placeholder="0px" value={s.borderWidth ?? ""} onChange={handleOnChange} />
        </div>
        <div>
          <p className="mb-2 text-muted-foreground text-sm">Border Color</p>
          <ColorPicker
            value={s.borderColor ?? "#000"}
            onChange={(c) =>
              handleKeyValue
                ? handleKeyValue("borderColor", c)
                : handleOnChange({ target: { id: "borderColor", value: c } } as React.ChangeEvent<HTMLInputElement>)
            }
          />
        </div>
        <div>
          <p className="mb-2 text-muted-foreground text-sm">Border Radius</p>
          <Input id="borderRadius" placeholder="0px" value={s.borderRadius ?? ""} onChange={handleOnChange} />
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
