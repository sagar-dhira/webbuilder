import { useState } from "react";
import { useEditor } from "@/contexts/EditorContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import TypographySettings from "./settings/TypographySettings";
import AppearanceSettings from "./settings/AppearanceSettings";
import TransformSettings from "./settings/TransformSettings";
import StrokeSettings from "./settings/StrokeSettings";
import { categoriesWithCustomSettings } from "@/lib/constants";
import { toast } from "sonner";

function getContent(sel: { content: unknown }) {
  return typeof sel.content === "object" && sel.content !== null && !Array.isArray(sel.content) ? (sel.content as Record<string, unknown>) : {};
}

export default function SettingsTab() {
  const { state, dispatch } = useEditor();
  const sel = state.editor.selectedElement;
  const c = getContent(sel);

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const key = e.target.id;
    const value = e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value;
    dispatch({
      type: "UPDATE_ELEMENT",
      payload: {
        elementDetails: {
          ...sel,
          content: { ...(typeof sel.content === "object" && !Array.isArray(sel.content) ? { ...sel.content } : {}), [key]: value },
        },
      },
    });
  };

  const setContent = (key: string, value: string | boolean) => {
    dispatch({
      type: "UPDATE_ELEMENT",
      payload: {
        elementDetails: {
          ...sel,
          content: { ...(typeof sel.content === "object" && !Array.isArray(sel.content) ? { ...sel.content } : {}), [key]: value },
        },
      },
    });
  };

  const handleStyleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const key = e.target.id;
    const value = e.target.value;
    dispatch({
      type: "UPDATE_ELEMENT",
      payload: {
        elementDetails: { ...sel, styles: { ...sel.styles, [key]: value } },
      },
    });
  };

  const handleStyleKeyValue = (key: string, value: string) => {
    dispatch({
      type: "UPDATE_ELEMENT",
      payload: {
        elementDetails: { ...sel, styles: { ...sel.styles, [key]: value } },
      },
    });
  };

  const handleSelectChange = (property: string, value: string) => {
    dispatch({
      type: "UPDATE_ELEMENT",
      payload: {
        elementDetails: { ...sel, styles: { ...sel.styles, [property]: value } },
      },
    });
  };

  const showCustom = categoriesWithCustomSettings.includes(sel.category);
  const isEtl = sel.type === "etl";
  const [executing, setExecuting] = useState(false);

  const handleEtlConfigChange = (field: "apiEndpoint" | "token" | "tenantName" | "request" | "body", value: string) => {
    dispatch({
      type: "UPDATE_ELEMENT",
      payload: {
        elementDetails: { ...sel, [field]: value },
      },
    });
  };

  const handleEtlExecute = async () => {
    const endpoint = sel.apiEndpoint?.trim();
    const token = sel.token?.trim();
    const tenantName = sel.tenantName?.trim();
    const method = (sel.request?.trim().toUpperCase() || "GET") as RequestInit["method"];
    const body = sel.body?.trim() || undefined;
    if (!endpoint) {
      toast.error("Enter an API endpoint");
      return;
    }
    setExecuting(true);
    try {
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      if (tenantName) headers["X-Tenant-Name"] = tenantName;
      if (body && (method === "POST" || method === "PUT" || method === "PATCH")) headers["Content-Type"] = "application/json";
      const res = await fetch(endpoint, {
        method: method || "GET",
        headers,
        ...(body && (method === "POST" || method === "PUT" || method === "PATCH") ? { body } : {}),
      });
      const ok = res.ok;
      const data = await res.json().catch(() => ({}));
      if (ok) {
        toast.success(data.message || "Execute succeeded");
      } else {
        toast.error(data.message || data.msg || `Request failed (${res.status})`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Accordion
      type="multiple"
      defaultValue={["Custom", "Transform", "Appearance", "Typography", "Stroke", ...(isEtl ? ["ETL"] : [])]}
      className="w-full"
    >
      {isEtl && (
        <AccordionItem value="ETL" className="px-2 py-0">
          <AccordionTrigger className="!no-underline">Quick Style</AccordionTrigger>
          <AccordionContent className="px-1 space-y-4">
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground">API endpoint</Label>
              <Input
                placeholder="https://api.example.com/run"
                value={sel.apiEndpoint ?? ""}
                onChange={(e) => handleEtlConfigChange("apiEndpoint", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground">Tenant name</Label>
              <Input
                placeholder="Tenant name"
                value={sel.tenantName ?? ""}
                onChange={(e) => handleEtlConfigChange("tenantName", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground">Token</Label>
              <Input
                type="password"
                placeholder="Bearer token"
                value={sel.token ?? ""}
                onChange={(e) => handleEtlConfigChange("token", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground">Request</Label>
              <Input
                placeholder="e.g. GET, POST"
                value={sel.request ?? ""}
                onChange={(e) => handleEtlConfigChange("request", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-muted-foreground">Body</Label>
              <Textarea
                placeholder='e.g. {"key": "value"}'
                value={sel.body ?? ""}
                onChange={(e) => handleEtlConfigChange("body", e.target.value)}
                className="min-h-[80px]"
                rows={4}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleEtlExecute}
              disabled={executing}
            >
              {executing ? "Executing…" : "Execute"}
            </Button>
          </AccordionContent>
        </AccordionItem>
      )}
      {showCustom && (
        <AccordionItem value="Custom" className="px-2 py-0">
          <AccordionTrigger className="!no-underline capitalize">
            {sel.category === "Text" ? "Text" : String(sel.type)}
          </AccordionTrigger>
          <AccordionContent className="px-1 space-y-4">
            {/* Link */}
            {(sel.type === "link" || sel.category === "Link") && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Link path</Label>
                  <Input id="href" placeholder="https://example.com" onChange={handleCustomChange} value={String(c.href ?? "")} />
                </div>
                {sel.type === "link" && (
                  <div className="flex flex-col gap-2">
                    <Label className="text-muted-foreground">Text</Label>
                    <Input id="innerText" placeholder="Link text" onChange={handleCustomChange} value={String(c.innerText ?? "")} />
                  </div>
                )}
              </>
            )}
            {/* Text */}
            {sel.category === "Text" && sel.type !== "link" && (
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground">Content</Label>
                <Textarea id="innerText" placeholder="Enter text..." onChange={handleCustomChange} value={String(c.innerText ?? "")} />
              </div>
            )}
            {/* Image */}
            {sel.type === "image" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Image URL</Label>
                  <Input id="imageUrl" placeholder="Enter URL..." onChange={handleCustomChange} value={String(c.imageUrl ?? "")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Alt text</Label>
                  <Input id="altText" placeholder="Alt text" onChange={handleCustomChange} value={String(c.altText ?? "")} />
                </div>
              </>
            )}
            {/* Media */}
            {sel.type === "video" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Video URL</Label>
                  <Input id="videoUrl" placeholder="https://..." onChange={handleCustomChange} value={String(c.videoUrl ?? "")} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="controls" checked={!!c.controls} onCheckedChange={(v) => setContent("controls", v)} />
                  <Label>Show controls</Label>
                </div>
              </>
            )}
            {sel.type === "audio" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Audio URL</Label>
                  <Input id="audioUrl" placeholder="https://..." onChange={handleCustomChange} value={String(c.audioUrl ?? "")} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="controls" checked={!!c.controls} onCheckedChange={(v) => setContent("controls", v)} />
                  <Label>Show controls</Label>
                </div>
              </>
            )}
            {sel.type === "marquee" && (
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground">Marquee text</Label>
                <Input id="marqueeText" placeholder="Scrolling text..." onChange={handleCustomChange} value={String(c.marqueeText ?? "")} />
              </div>
            )}
            {sel.type === "icon" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Icon name</Label>
                  <Input id="iconName" placeholder="Star, Heart, Mail, ..." onChange={handleCustomChange} value={String(c.iconName ?? "")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Link (optional)</Label>
                  <Input id="href" placeholder="https://..." onChange={handleCustomChange} value={String(c.href ?? "")} />
                </div>
              </>
            )}
            {sel.type === "embed" && (
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground">Embed URL</Label>
                <Input id="embedUrl" placeholder="https://..." onChange={handleCustomChange} value={String(c.embedUrl ?? "")} />
              </div>
            )}
            {/* Button */}
            {sel.type === "button" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Label</Label>
                  <Input id="buttonLabel" placeholder="Button" onChange={handleCustomChange} value={String(c.buttonLabel ?? "")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Link (optional)</Label>
                  <Input id="href" placeholder="https://..." onChange={handleCustomChange} value={String(c.href ?? "")} />
                </div>
              </>
            )}
            {/* Form */}
            {sel.type === "form" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Action</Label>
                  <Input
                    id="formAction"
                    placeholder="/submit"
                    onChange={(e) => dispatch({ type: "UPDATE_ELEMENT", payload: { elementDetails: { ...sel, formAction: e.target.value } } })}
                    value={sel.formAction ?? ""}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Method</Label>
                  <Input
                    id="formMethod"
                    placeholder="post"
                    onChange={(e) => dispatch({ type: "UPDATE_ELEMENT", payload: { elementDetails: { ...sel, formMethod: e.target.value } } })}
                    value={sel.formMethod ?? ""}
                  />
                </div>
              </>
            )}
            {sel.type === "input" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Type</Label>
                  <Input id="inputType" placeholder="text, email, number..." onChange={handleCustomChange} value={String(c.inputType ?? "text")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Placeholder</Label>
                  <Input id="placeholder" placeholder="Placeholder" onChange={handleCustomChange} value={String(c.placeholder ?? "")} />
                </div>
              </>
            )}
            {sel.type === "textarea" && (
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground">Placeholder</Label>
                <Input id="placeholder" placeholder="Enter text..." onChange={handleCustomChange} value={String(c.placeholder ?? "")} />
              </div>
            )}
            {sel.type === "select" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Options (one per line)</Label>
                  <Textarea id="options" placeholder="Option 1\nOption 2" onChange={handleCustomChange} value={String(c.options ?? "")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Placeholder</Label>
                  <Input id="placeholder" placeholder="Select..." onChange={handleCustomChange} value={String(c.placeholder ?? "")} />
                </div>
              </>
            )}
            {sel.type === "checkbox" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Label</Label>
                  <Input id="innerText" placeholder="Checkbox" onChange={handleCustomChange} value={String(c.innerText ?? "")} />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={!!c.checked} onCheckedChange={(v) => setContent("checked", v)} />
                  <Label>Checked</Label>
                </div>
              </>
            )}
            {sel.type === "radio" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Label</Label>
                  <Input id="innerText" placeholder="Radio" onChange={handleCustomChange} value={String(c.innerText ?? "")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Name</Label>
                  <Input id="name" placeholder="radio" onChange={handleCustomChange} value={String(c.name ?? "")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Value</Label>
                  <Input id="value" placeholder="option1" onChange={handleCustomChange} value={String(c.value ?? "")} />
                </div>
              </>
            )}
            {sel.type === "submitButton" && (
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground">Label</Label>
                <Input id="buttonLabel" placeholder="Submit" onChange={handleCustomChange} value={String(c.buttonLabel ?? "")} />
              </div>
            )}
            {/* Content */}
            {(sel.type === "ol" || sel.type === "ul") && (
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground">Items (one per line)</Label>
                <Textarea id="listItems" placeholder="Item 1\nItem 2" onChange={handleCustomChange} value={String(c.listItems ?? "")} />
              </div>
            )}
            {sel.type === "blockquote" && (
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground">Quote text</Label>
                <Textarea id="innerText" placeholder="Quote..." onChange={handleCustomChange} value={String(c.innerText ?? "")} />
              </div>
            )}
            {sel.type === "code" && (
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground">Code</Label>
                <Textarea id="codeText" placeholder="Code..." onChange={handleCustomChange} value={String(c.codeText ?? "")} className="font-mono text-sm" />
              </div>
            )}
            {sel.type === "badge" && (
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground">Badge text</Label>
                <Input id="badgeText" placeholder="Badge" onChange={handleCustomChange} value={String(c.badgeText ?? "")} />
              </div>
            )}
            {sel.type === "spacer" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Height</Label>
                  <Input id="spacerHeight" placeholder="24px" onChange={handleCustomChange} value={String(c.spacerHeight ?? "")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Width</Label>
                  <Input id="spacerWidth" placeholder="100%" onChange={handleCustomChange} value={String(c.spacerWidth ?? "")} />
                </div>
              </>
            )}
            {sel.type === "table" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Headers (comma-separated)</Label>
                  <Input id="tableHeaders" placeholder="Col1, Col2" onChange={handleCustomChange} value={String(c.tableHeaders ?? "")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Rows (one per line, comma-separated cells)</Label>
                  <Textarea id="tableRows" placeholder="A1, A2\nB1, B2" onChange={handleCustomChange} value={String(c.tableRows ?? "")} />
                </div>
              </>
            )}
            {sel.type === "accordion" && (
              <div className="flex flex-col gap-2">
                <Label className="text-muted-foreground">Items (one per line: Title|Content)</Label>
                <Textarea id="accordionItems" placeholder="Item 1|Content 1\nItem 2|Content 2" onChange={handleCustomChange} value={String(c.accordionItems ?? "")} />
              </div>
            )}
            {sel.type === "tabs" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Tab labels (comma-separated)</Label>
                  <Input id="tabLabels" placeholder="Tab 1, Tab 2" onChange={handleCustomChange} value={String(c.tabLabels ?? "")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Tab contents (one per line)</Label>
                  <Textarea id="tabContents" placeholder="Content 1\nContent 2" onChange={handleCustomChange} value={String(c.tabContents ?? "")} />
                </div>
              </>
            )}
            {sel.type === "card" && (
              <>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Title</Label>
                  <Input id="cardTitle" placeholder="Card Title" onChange={handleCustomChange} value={String(c.cardTitle ?? "")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Body</Label>
                  <Textarea id="cardBody" placeholder="Body text" onChange={handleCustomChange} value={String(c.cardBody ?? "")} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-muted-foreground">Image URL (optional)</Label>
                  <Input id="cardImageUrl" placeholder="https://..." onChange={handleCustomChange} value={String(c.cardImageUrl ?? "")} />
                </div>
              </>
            )}
          </AccordionContent>
        </AccordionItem>
      )}
      <TransformSettings handleOnChange={handleStyleChange} handleSelectChange={handleSelectChange} />
      <AppearanceSettings handleOnChange={handleStyleKeyValue} />
      <TypographySettings handleOnChange={handleStyleChange} handleSelectChange={handleSelectChange} />
      <StrokeSettings handleOnChange={handleStyleChange} handleKeyValue={handleStyleKeyValue} />
    </Accordion>
  );
}
