import { useEditor } from "@/contexts/EditorContext";
import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlignCenter, AlignJustify, AlignLeft, AlignRight } from "lucide-react";

interface Props {
  handleOnChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (property: string, value: string) => void;
}

export default function TypographySettings({ handleOnChange, handleSelectChange }: Props) {
  const { state } = useEditor();
  const s = state.editor.selectedElement.styles;
  const color = s.color ?? "#000000";

  return (
    <AccordionItem value="Typography" className="px-2 py-0 border-y border-border">
      <AccordionTrigger className="!no-underline">Typography</AccordionTrigger>
      <AccordionContent>
        <div className="flex flex-col gap-4 px-1">
          <div>
            <p className="mb-2 text-muted-foreground text-sm">Color</p>
            <div className="flex gap-2">
              <ColorPicker
                value={color}
                onChange={(c) => handleSelectChange("color", c)}
              />
              <Input id="color" type="text" maxLength={7} value={color} onChange={(e) => handleSelectChange("color", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="mb-1 text-muted-foreground text-sm">Font</p>
              <Select value={s.fontFamily ?? ""} onValueChange={(v) => handleSelectChange("fontFamily", v)}>
                <SelectTrigger><SelectValue placeholder="Select font" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Inter">Inter</SelectItem>
                  <SelectItem value="Roboto">Roboto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1 text-muted-foreground text-sm">Weight</p>
              <Select value={String(s.fontWeight ?? "")} onValueChange={(v) => handleSelectChange("fontWeight", v)}>
                <SelectTrigger><SelectValue placeholder="Weight" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="300">Light</SelectItem>
                  <SelectItem value="400">Regular</SelectItem>
                  <SelectItem value="600">Semi Bold</SelectItem>
                  <SelectItem value="700">Bold</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <p className="mb-1 text-muted-foreground text-sm">Font Size</p>
            <Input id="fontSize" placeholder="16px" value={s.fontSize ?? ""} onChange={handleOnChange} />
          </div>
          <div>
            <p className="mb-1 text-muted-foreground text-sm">Text Alignment</p>
            <Tabs value={s.textAlign ?? "left"} onValueChange={(v) => handleSelectChange("textAlign", v)}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="left"><AlignLeft className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="center"><AlignCenter className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="right"><AlignRight className="h-4 w-4" /></TabsTrigger>
                <TabsTrigger value="justify"><AlignJustify className="h-4 w-4" /></TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
