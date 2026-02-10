import { EditorElement, useEditor } from "@/contexts/EditorContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { ColorPicker } from "@/components/ui/color-picker";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Trash,
  Copy,
  MoreVertical,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Palette,
  Image as ImageIcon,
  Video,
  Music,
  Link as LinkIcon,
  MousePointer,
  FileText,
  ListOrdered,
  Quote,
  Code,
  Tag,
  Table,
  PanelTop,
  Layers,
  CreditCard,
} from "lucide-react";
import { useState, useEffect } from "react";

function getContent(el: EditorElement): Record<string, unknown> {
  return typeof el.content === "object" && el.content !== null && !Array.isArray(el.content) ? (el.content as Record<string, unknown>) : {};
}

interface Props {
  element: EditorElement;
}

export default function ElementOptionsDropdown({ element }: Props) {
  const { dispatch } = useEditor();
  const [colorInput, setColorInput] = useState(element.styles?.color || "#000000");
  const [bgColorInput, setBgColorInput] = useState(element.styles?.backgroundColor || "#ffffff");
  const c = getContent(element);

  useEffect(() => {
    setColorInput(element.styles?.color || "#000000");
    setBgColorInput(element.styles?.backgroundColor || "#ffffff");
  }, [element.styles?.color, element.styles?.backgroundColor]);

  const handleStyleUpdate = (key: string, value: string) => {
    dispatch({
      type: "UPDATE_ELEMENT",
      payload: {
        elementDetails: { ...element, styles: { ...element.styles, [key]: value } },
      },
    });
  };

  const handleContentUpdate = (key: string, value: string | boolean) => {
    dispatch({
      type: "UPDATE_ELEMENT",
      payload: {
        elementDetails: {
          ...element,
          content: { ...(typeof element.content === "object" && !Array.isArray(element.content) ? { ...element.content } : {}), [key]: value },
        },
      },
    });
  };

  const handleFormPropUpdate = (key: "formAction" | "formMethod", value: string) => {
    dispatch({
      type: "UPDATE_ELEMENT",
      payload: { elementDetails: { ...element, [key]: value } },
    });
  };

  const handleDuplicate = () => {
    dispatch({ type: "DUPLICATE_ELEMENT", payload: { elementDetails: element } });
  };

  const handleDelete = () => {
    dispatch({ type: "DELETE_ELEMENT", payload: { elementDetails: element } });
  };

  const isTextElement = element.category === "Text";
  const isContainer = element.category === "Container";
  const isImage = element.type === "image";
  const isMedia = element.category === "Media";
  const isContent = element.category === "Content";
  const isFormEl = element.category === "Form" || element.type === "form";
  const isLink = element.type === "link";
  const isButton = element.type === "button";
  const showQuickStyleForBlock = isMedia || isContent || isLink || isButton;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div
          className="absolute bg-primary px-2.5 py-1 text-xs font-bold -top-7 -right-px rounded-t-lg cursor-pointer hover:bg-primary/90 transition-colors z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="text-primary-foreground" size={16} />
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        side="right"
        sideOffset={20}
        alignOffset={0}
        className="w-80 p-0 max-h-[80vh] overflow-y-auto bg-white dark:bg-popover backdrop-blur-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: 99999 }}
        avoidCollisions={true}
      >
        {/* Text Element Options */}
        {isTextElement && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold flex items-center gap-2">
                <Type className="h-4 w-4" />
                Quick Style
              </DropdownMenuLabel>

              {/* Color */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Text Color</label>
                <div className="flex gap-2">
                  <ColorPicker
                    value={colorInput}
                    onChange={(color) => {
                      setColorInput(color);
                      handleStyleUpdate("color", color);
                    }}
                  />
                  <Input
                    type="text"
                    value={colorInput}
                    onChange={(e) => {
                      const color = e.target.value;
                      setColorInput(color);
                      if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
                        handleStyleUpdate("color", color);
                      }
                    }}
                    className="h-9 text-xs"
                    placeholder="#000000"
                    maxLength={7}
                  />
                </div>
              </div>

              {/* Font Size */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Font Size</label>
                <div className="flex gap-2">
                  <Select
                    value={element.styles?.fontSize || ""}
                    onValueChange={(value) => handleStyleUpdate("fontSize", value)}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.75rem">12px</SelectItem>
                      <SelectItem value="0.875rem">14px</SelectItem>
                      <SelectItem value="1rem">16px</SelectItem>
                      <SelectItem value="1.125rem">18px</SelectItem>
                      <SelectItem value="1.25rem">20px</SelectItem>
                      <SelectItem value="1.5rem">24px</SelectItem>
                      <SelectItem value="1.875rem">30px</SelectItem>
                      <SelectItem value="2.25rem">36px</SelectItem>
                      <SelectItem value="3rem">48px</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    id="fontSize"
                    placeholder="Custom"
                    value={element.styles?.fontSize || ""}
                    onChange={(e) => handleStyleUpdate("fontSize", e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Text Alignment */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Text Alignment</label>
                <Tabs
                  value={element.styles?.textAlign || "left"}
                  onValueChange={(value) => handleStyleUpdate("textAlign", value)}
                >
                  <TabsList className="grid w-full grid-cols-4 h-9">
                    <TabsTrigger value="left" className="h-8">
                      <AlignLeft className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="center" className="h-8">
                      <AlignCenter className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="right" className="h-8">
                      <AlignRight className="h-4 w-4" />
                    </TabsTrigger>
                    <TabsTrigger value="justify" className="h-8">
                      <AlignJustify className="h-4 w-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Font Weight */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Font Weight</label>
                <Select
                  value={String(element.styles?.fontWeight || "")}
                  onValueChange={(value) => handleStyleUpdate("fontWeight", value)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Weight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="300">Light</SelectItem>
                    <SelectItem value="400">Regular</SelectItem>
                    <SelectItem value="500">Medium</SelectItem>
                    <SelectItem value="600">Semi Bold</SelectItem>
                    <SelectItem value="700">Bold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Container Element Options */}
        {isContainer && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Quick Style
              </DropdownMenuLabel>

              {/* Background Color */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Background Color</label>
                <div className="flex gap-2">
                  <ColorPicker
                    value={bgColorInput}
                    onChange={(color) => {
                      setBgColorInput(color);
                      handleStyleUpdate("backgroundColor", color);
                    }}
                  />
                  <Input
                    type="text"
                    value={bgColorInput}
                    onChange={(e) => {
                      const color = e.target.value;
                      setBgColorInput(color);
                      if (color.match(/^#[0-9A-Fa-f]{6}$/)) {
                        handleStyleUpdate("backgroundColor", color);
                      }
                    }}
                    className="h-9 text-xs flex-1"
                    placeholder="#ffffff"
                    maxLength={7}
                  />
                </div>
              </div>

              {/* Padding */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Padding</label>
                <Input
                  id="padding"
                  placeholder="0px"
                  value={element.styles?.padding || ""}
                  onChange={(e) => handleStyleUpdate("padding", e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Border Radius */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Border Radius</label>
                <Input
                  id="borderRadius"
                  placeholder="0px"
                  value={element.styles?.borderRadius || ""}
                  onChange={(e) => handleStyleUpdate("borderRadius", e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Image Element Options */}
        {isImage && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Image Settings
              </DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Image URL</label>
                <Input placeholder="Enter URL..." value={String(c.imageUrl ?? "")} onChange={(e) => handleContentUpdate("imageUrl", e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Alt text</label>
                <Input placeholder="Alt text" value={String(c.altText ?? "")} onChange={(e) => handleContentUpdate("altText", e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Quick Style for Media / Content / Link / Button */}
        {showQuickStyleForBlock && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Quick Style
              </DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Background</label>
                <div className="flex gap-2">
                  <ColorPicker value={bgColorInput} onChange={(color) => { setBgColorInput(color); handleStyleUpdate("backgroundColor", color); }} />
                  <Input type="text" value={bgColorInput} onChange={(e) => { const v = e.target.value; setBgColorInput(v); if (v.match(/^#[0-9A-Fa-f]{6}$/)) handleStyleUpdate("backgroundColor", v); }} className="h-9 text-xs flex-1" placeholder="#ffffff" maxLength={7} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Padding</label>
                <Input placeholder="0px" value={element.styles?.padding || ""} onChange={(e) => handleStyleUpdate("padding", e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Border radius</label>
                <Input placeholder="0px" value={element.styles?.borderRadius || ""} onChange={(e) => handleStyleUpdate("borderRadius", e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Media: Video */}
        {element.type === "video" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold flex items-center gap-2"><Video className="h-4 w-4" /> Video</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Video URL</label>
                <Input placeholder="https://..." value={String(c.videoUrl ?? "")} onChange={(e) => handleContentUpdate("videoUrl", e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="videoControls" checked={!!c.controls} onChange={(e) => handleContentUpdate("controls", e.target.checked)} className="h-4 w-4" />
                <label className="text-xs" htmlFor="videoControls">Show controls</label>
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Media: Audio */}
        {element.type === "audio" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold flex items-center gap-2"><Music className="h-4 w-4" /> Audio</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Audio URL</label>
                <Input placeholder="https://..." value={String(c.audioUrl ?? "")} onChange={(e) => handleContentUpdate("audioUrl", e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="audioControls" checked={!!c.controls} onChange={(e) => handleContentUpdate("controls", e.target.checked)} className="h-4 w-4" />
                <label className="text-xs" htmlFor="audioControls">Show controls</label>
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Media: Marquee */}
        {element.type === "marquee" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold">Marquee</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Text</label>
                <Input placeholder="Scrolling text..." value={String(c.marqueeText ?? "")} onChange={(e) => handleContentUpdate("marqueeText", e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Media: Icon */}
        {element.type === "icon" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold">Icon</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Icon name</label>
                <Input placeholder="Star, Heart, Mail..." value={String(c.iconName ?? "")} onChange={(e) => handleContentUpdate("iconName", e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Link (optional)</label>
                <Input placeholder="https://..." value={String(c.href ?? "")} onChange={(e) => handleContentUpdate("href", e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Media: Embed */}
        {element.type === "embed" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold">Embed</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Embed URL</label>
                <Input placeholder="https://..." value={String(c.embedUrl ?? "")} onChange={(e) => handleContentUpdate("embedUrl", e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Link */}
        {isLink && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold flex items-center gap-2"><LinkIcon className="h-4 w-4" /> Link</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">URL</label>
                <Input placeholder="https://..." value={String(c.href ?? "")} onChange={(e) => handleContentUpdate("href", e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Text</label>
                <Input placeholder="Link text" value={String(c.innerText ?? "")} onChange={(e) => handleContentUpdate("innerText", e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Button */}
        {isButton && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold flex items-center gap-2"><MousePointer className="h-4 w-4" /> Button</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Label</label>
                <Input placeholder="Button" value={String(c.buttonLabel ?? "")} onChange={(e) => handleContentUpdate("buttonLabel", e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Link (optional)</label>
                <Input placeholder="https://..." value={String(c.href ?? "")} onChange={(e) => handleContentUpdate("href", e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Form */}
        {element.type === "form" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold">Form</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Action</label>
                <Input placeholder="/submit" value={element.formAction ?? ""} onChange={(e) => handleFormPropUpdate("formAction", e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Method</label>
                <Input placeholder="post" value={element.formMethod ?? ""} onChange={(e) => handleFormPropUpdate("formMethod", e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Form: Input */}
        {element.type === "input" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold">Input</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Type</label>
                <Input placeholder="text" value={String(c.inputType ?? "text")} onChange={(e) => handleContentUpdate("inputType", e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Placeholder</label>
                <Input placeholder="Placeholder" value={String(c.placeholder ?? "")} onChange={(e) => handleContentUpdate("placeholder", e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Form: Textarea */}
        {element.type === "textarea" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> Textarea</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Placeholder</label>
                <Input placeholder="Enter text..." value={String(c.placeholder ?? "")} onChange={(e) => handleContentUpdate("placeholder", e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Form: Select */}
        {element.type === "select" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold flex items-center gap-2"><ListOrdered className="h-4 w-4" /> Select</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Options (one per line)</label>
                <textarea placeholder="Option 1\nOption 2" value={String(c.options ?? "")} onChange={(e) => handleContentUpdate("options", e.target.value)} className="w-full min-h-[60px] rounded border px-2 py-1.5 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Placeholder</label>
                <Input placeholder="Select..." value={String(c.placeholder ?? "")} onChange={(e) => handleContentUpdate("placeholder", e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Form: Checkbox */}
        {element.type === "checkbox" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold">Checkbox</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Label</label>
                <Input placeholder="Checkbox" value={String(c.innerText ?? "")} onChange={(e) => handleContentUpdate("innerText", e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="cbChecked" checked={!!c.checked} onChange={(e) => handleContentUpdate("checked", e.target.checked)} className="h-4 w-4" />
                <label className="text-xs" htmlFor="cbChecked">Checked</label>
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Form: Radio */}
        {element.type === "radio" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold">Radio</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Label</label>
                <Input placeholder="Radio" value={String(c.innerText ?? "")} onChange={(e) => handleContentUpdate("innerText", e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Name</label>
                <Input placeholder="radio" value={String(c.name ?? "")} onChange={(e) => handleContentUpdate("name", e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Value</label>
                <Input placeholder="option1" value={String(c.value ?? "")} onChange={(e) => handleContentUpdate("value", e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Form: Submit */}
        {element.type === "submitButton" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold">Submit</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Label</label>
                <Input placeholder="Submit" value={String(c.buttonLabel ?? "")} onChange={(e) => handleContentUpdate("buttonLabel", e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Content: List (ol/ul) */}
        {(element.type === "ol" || element.type === "ul") && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold flex items-center gap-2"><ListOrdered className="h-4 w-4" /> List</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Items (one per line)</label>
                <textarea placeholder="Item 1\nItem 2" value={String(c.listItems ?? "")} onChange={(e) => handleContentUpdate("listItems", e.target.value)} className="w-full min-h-[60px] rounded border px-2 py-1.5 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Content: Blockquote */}
        {element.type === "blockquote" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold flex items-center gap-2"><Quote className="h-4 w-4" /> Blockquote</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Quote text</label>
                <Input placeholder="Quote..." value={String(c.innerText ?? "")} onChange={(e) => handleContentUpdate("innerText", e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Content: Code */}
        {element.type === "code" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold flex items-center gap-2"><Code className="h-4 w-4" /> Code</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Code</label>
                <textarea placeholder="Code..." value={String(c.codeText ?? "")} onChange={(e) => handleContentUpdate("codeText", e.target.value)} className="w-full min-h-[60px] font-mono rounded border px-2 py-1.5 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Content: Badge */}
        {element.type === "badge" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold flex items-center gap-2"><Tag className="h-4 w-4" /> Badge</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Text</label>
                <Input placeholder="Badge" value={String(c.badgeText ?? "")} onChange={(e) => handleContentUpdate("badgeText", e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Content: Spacer */}
        {element.type === "spacer" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold">Spacer</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Height</label>
                <Input placeholder="24px" value={String(c.spacerHeight ?? "")} onChange={(e) => handleContentUpdate("spacerHeight", e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Width</label>
                <Input placeholder="100%" value={String(c.spacerWidth ?? "")} onChange={(e) => handleContentUpdate("spacerWidth", e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Content: Table */}
        {element.type === "table" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold flex items-center gap-2"><Table className="h-4 w-4" /> Table</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Headers (comma-separated)</label>
                <Input placeholder="Col1, Col2" value={String(c.tableHeaders ?? "")} onChange={(e) => handleContentUpdate("tableHeaders", e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Rows (one per line, comma-separated)</label>
                <textarea placeholder="A1, A2\nB1, B2" value={String(c.tableRows ?? "")} onChange={(e) => handleContentUpdate("tableRows", e.target.value)} className="w-full min-h-[60px] rounded border px-2 py-1.5 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Content: Accordion */}
        {element.type === "accordion" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold flex items-center gap-2"><PanelTop className="h-4 w-4" /> Accordion</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Items (one per line: Title|Content)</label>
                <textarea placeholder="Item 1|Content 1\nItem 2|Content 2" value={String(c.accordionItems ?? "")} onChange={(e) => handleContentUpdate("accordionItems", e.target.value)} className="w-full min-h-[60px] rounded border px-2 py-1.5 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Content: Tabs */}
        {element.type === "tabs" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold flex items-center gap-2"><Layers className="h-4 w-4" /> Tabs</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Tab labels (comma-separated)</label>
                <Input placeholder="Tab 1, Tab 2" value={String(c.tabLabels ?? "")} onChange={(e) => handleContentUpdate("tabLabels", e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Tab contents (one per line)</label>
                <textarea placeholder="Content 1\nContent 2" value={String(c.tabContents ?? "")} onChange={(e) => handleContentUpdate("tabContents", e.target.value)} className="w-full min-h-[60px] rounded border px-2 py-1.5 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Content: Card */}
        {element.type === "card" && (
          <>
            <div className="p-3 space-y-3">
              <DropdownMenuLabel className="px-0 text-xs font-semibold flex items-center gap-2"><CreditCard className="h-4 w-4" /> Card</DropdownMenuLabel>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Title</label>
                <Input placeholder="Card Title" value={String(c.cardTitle ?? "")} onChange={(e) => handleContentUpdate("cardTitle", e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Body</label>
                <Input placeholder="Body text" value={String(c.cardBody ?? "")} onChange={(e) => handleContentUpdate("cardBody", e.target.value)} className="h-9 text-xs" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Image URL (optional)</label>
                <Input placeholder="https://..." value={String(c.cardImageUrl ?? "")} onChange={(e) => handleContentUpdate("cardImageUrl", e.target.value)} className="h-9 text-xs" />
              </div>
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Common Actions */}
        <div className="p-1">
          <DropdownMenuItem onClick={handleDuplicate} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDelete}
            className="cursor-pointer text-destructive focus:text-destructive"
          >
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
