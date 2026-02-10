import { useEditor } from "@/contexts/EditorContext";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";

interface Props {
  handleOnChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (property: string, value: string) => void;
}

export default function TransformSettings({ handleOnChange }: Props) {
  const { state } = useEditor();
  const s = state.editor.selectedElement.styles;

  return (
    <AccordionItem value="Transform" className="px-2 py-0 border-y border-border">
      <AccordionTrigger className="!no-underline">Transform</AccordionTrigger>
      <AccordionContent className="flex flex-col gap-4 px-1">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-2 text-muted-foreground text-sm">Width</p>
            <Input id="width" placeholder="100%" value={s.width ?? ""} onChange={handleOnChange} />
          </div>
          <div>
            <p className="mb-2 text-muted-foreground text-sm">Height</p>
            <Input id="height" placeholder="auto" value={s.height ?? ""} onChange={handleOnChange} />
          </div>
        </div>
        <div>
          <p className="mb-2 text-muted-foreground text-sm">Margin</p>
          <div className="grid grid-cols-2 gap-2">
            <Input id="marginTop" placeholder="Top" value={s.marginTop ?? ""} onChange={handleOnChange} />
            <Input id="marginBottom" placeholder="Bottom" value={s.marginBottom ?? ""} onChange={handleOnChange} />
            <Input id="marginLeft" placeholder="Left" value={s.marginLeft ?? ""} onChange={handleOnChange} />
            <Input id="marginRight" placeholder="Right" value={s.marginRight ?? ""} onChange={handleOnChange} />
          </div>
        </div>
        <div>
          <p className="mb-2 text-muted-foreground text-sm">Padding</p>
          <div className="grid grid-cols-2 gap-2">
            <Input id="paddingTop" placeholder="Top" value={s.paddingTop ?? ""} onChange={handleOnChange} />
            <Input id="paddingBottom" placeholder="Bottom" value={s.paddingBottom ?? ""} onChange={handleOnChange} />
            <Input id="paddingLeft" placeholder="Left" value={s.paddingLeft ?? ""} onChange={handleOnChange} />
            <Input id="paddingRight" placeholder="Right" value={s.paddingRight ?? ""} onChange={handleOnChange} />
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
