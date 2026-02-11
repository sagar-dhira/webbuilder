import { useState, useCallback } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [etlResponse, setEtlResponse] = useState<Record<string, unknown>[] | null>(null);
  const [etlError, setEtlError] = useState<string | null>(null);
  const [etlResponseModalOpen, setEtlResponseModalOpen] = useState(false);
  const [etlSelectedRows, setEtlSelectedRows] = useState<Set<number>>(new Set());
  const [etlCurrentPage, setEtlCurrentPage] = useState(1);
  const [etlTotalPages, setEtlTotalPages] = useState<number | null>(null);

  const fetchListById = useCallback(
    async (selectedIndices: Set<number>) => {
      if (!etlResponse || selectedIndices.size === 0) return;
      const token = sel.useToken
        ? localStorage.getItem("access_token") || localStorage.getItem("token")
        : null;
      const tenantName = sel.tenantName?.trim();
      const baseUrl = sel.apiEndpoint?.trim().replace(/\/list\/?$/, "") || "";
      const listByIdUrl = baseUrl ? `${baseUrl.replace(/\/$/, "")}/listById` : "https://api-dev.akashic.dhira.io/application/data_flow/listById";
      const selectedIds = Array.from(selectedIndices).map((i) => etlResponse[i]?.data_flow_id ?? etlResponse[i]?.entity_id).filter((v) => v != null);
      if (selectedIds.length === 0) return;
      const body = {
        where_key: ["data_flow_id"],
        where_value: selectedIds.length === 1 ? [selectedIds[0]] : selectedIds,
        select_keys: Object.keys(etlResponse[0]).filter((k) => k !== "value"),
      };
      try {
        const headers: Record<string, string> = { accept: "*/*", "Content-Type": "application/json" };
        if (token?.trim()) headers["Authorization"] = `Bearer ${token.trim()}`;
        if (tenantName) headers["tenantname"] = tenantName;
        const res = await fetch(listByIdUrl, { method: "POST", headers, body: JSON.stringify(body) });
        const data = await res.json().catch(() => ({}));
        console.log("ETL listById response:", data);
        const rows = Array.isArray(data.Response) ? data.Response : (Array.isArray(data.response) ? data.response : []);
        if (rows.length > 0) {
          dispatch({ type: "UPDATE_ELEMENT", payload: { elementDetails: { ...sel, etlDetailData: rows } } });
        }
      } catch (err) {
        console.error("ETL listById error:", err);
      }
    },
    [sel, dispatch, etlResponse]
  );

  function normalizeToRows(data: unknown): Record<string, unknown>[] {
    if (Array.isArray(data)) {
      const ok = data.every((x) => typeof x === "object" && x !== null && !Array.isArray(x));
      if (ok) return data as Record<string, unknown>[];
      return [{ value: data }];
    }
    if (typeof data === "object" && data !== null) {
      const o = data as Record<string, unknown>;
      if (Array.isArray(o.result)) return o.result as Record<string, unknown>[];
      if (Array.isArray(o.data)) return o.data as Record<string, unknown>[];
      if (Array.isArray(o.rows)) return o.rows as Record<string, unknown>[];
      if (Array.isArray(o.items)) return o.items as Record<string, unknown>[];
      if (typeof o.data === "object" && o.data !== null) {
        const nested = o.data as Record<string, unknown>;
        if (Array.isArray(nested.result)) return nested.result as Record<string, unknown>[];
      }
      return [o];
    }
    return [{ value: data }];
  }

  const handleEtlConfigChange = (field: "apiEndpoint" | "tenantName" | "request" | "body", value: string) => {
    dispatch({
      type: "UPDATE_ELEMENT",
      payload: {
        elementDetails: { ...sel, [field]: value },
      },
    });
  };

  const handleEtlExecute = async (pageNumber?: number) => {
    const endpoint = sel.apiEndpoint?.trim();
    const token = sel.useToken
      ? localStorage.getItem("access_token") || localStorage.getItem("token")
      : null;
    const tenantName = sel.tenantName?.trim();
    const method = (sel.request?.trim().toUpperCase() || "GET") as RequestInit["method"];
    let bodyStr = sel.body?.trim() || undefined;
    const page = pageNumber ?? 1;
    if (bodyStr && (method === "POST" || method === "PUT" || method === "PATCH")) {
      try {
        const parsed = JSON.parse(bodyStr) as Record<string, unknown>;
        bodyStr = JSON.stringify({ ...parsed, page_number: page });
      } catch {
        // keep original body if not valid JSON
      }
    }
    if (!endpoint) {
      toast.error("Enter an API endpoint");
      return;
    }
    setExecuting(true);
    if (pageNumber === undefined) {
      setEtlResponse(null);
    }
    setEtlError(null);
    try {
      const headers: Record<string, string> = {
        "accept": "*/*",
      };
      if (token?.trim()) headers["Authorization"] = `Bearer ${token.trim()}`;
      if (tenantName) headers["tenantname"] = tenantName;
      if (bodyStr && (method === "POST" || method === "PUT" || method === "PATCH")) headers["Content-Type"] = "application/json";
      const res = await fetch(endpoint, {
        method: method || "GET",
        headers,
        ...(bodyStr && (method === "POST" || method === "PUT" || method === "PATCH") ? { body: bodyStr } : {}),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        toast.success((data as { message?: string }).message || "Execute succeeded");
        setEtlResponse(normalizeToRows(data));
        setEtlSelectedRows(new Set());
        setEtlCurrentPage(page);
        const raw = data as Record<string, unknown>;
        const pagination = raw.pagination as Record<string, unknown> | undefined;
        const total =
          raw.total_pages ??
          raw.totalPages ??
          raw.total_pages_count ??
          pagination?.total_pages ??
          pagination?.totalPages;
        setEtlTotalPages(typeof total === "number" ? total : null);
        setEtlResponseModalOpen(true);
      } else {
        const msg = (data as { message?: string; msg?: string }).message || (data as { msg?: string }).msg || `Request failed (${res.status})`;
        toast.error(msg);
        setEtlError(msg);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Request failed";
      toast.error(msg);
      setEtlError(msg);
    } finally {
      setExecuting(false);
    }
  };

  const handleEtlPageChange = (nextPage: number) => {
    if (nextPage < 1) return;
    if (etlTotalPages != null && nextPage > etlTotalPages) return;
    handleEtlExecute(nextPage);
  };

  return (
    <>
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
            <div className="flex items-center justify-between gap-2">
              <Label className="text-muted-foreground">Use session token</Label>
              <Switch
                checked={!!sel.useToken}
                onCheckedChange={(checked) =>
                  dispatch({
                    type: "UPDATE_ELEMENT",
                    payload: { elementDetails: { ...sel, useToken: checked } },
                  })
                }
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
              onClick={() => handleEtlExecute()}
              disabled={executing}
            >
              {executing ? "Executing…" : "Execute"}
            </Button>
            {etlError && (
              <div className="text-sm text-destructive rounded border border-destructive/30 bg-destructive/10 px-3 py-2">
                {etlError}
              </div>
            )}
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
    <Dialog open={etlResponseModalOpen} onOpenChange={setEtlResponseModalOpen}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>ETL Response</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-auto">
          {etlResponse && etlResponse.length > 0 ? (
            <div className="border rounded-lg overflow-hidden bg-background">
              <div className="overflow-x-auto max-h-[70vh]">
                <table className="w-full text-sm border-collapse">
                  <thead className="sticky top-0 bg-muted/90 z-10">
                    <tr>
                      <th className="text-left font-semibold px-3 py-3 border-b border-r border-border w-10">
                        <input
                          type="checkbox"
                          checked={etlResponse.length > 0 && etlSelectedRows.size === etlResponse.length}
                          onChange={(e) => {
                            const next = e.target.checked ? new Set(etlResponse.map((_, i) => i)) : new Set<number>();
                            setEtlSelectedRows(next);
                            if (next.size > 0) fetchListById(next);
                          }}
                          className="h-4 w-4 rounded cursor-pointer"
                        />
                      </th>
                      {Object.keys(etlResponse[0]).map((k) => (
                        <th key={k} className="text-left font-semibold px-4 py-3 border-b border-r border-border last:border-r-0 whitespace-nowrap">
                          {k.replace(/_/g, " ")}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {etlResponse.map((row, i) => (
                      <tr key={i} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                        <td className="px-3 py-2.5 border-r border-border">
                          <input
                            type="checkbox"
                            checked={etlSelectedRows.has(i)}
                            onChange={(e) => {
                              e.stopPropagation();
                              const next = new Set(etlSelectedRows);
                              if (next.has(i)) next.delete(i);
                              else next.add(i);
                              setEtlSelectedRows(next);
                              if (next.size > 0) fetchListById(next);
                            }}
                            className="h-4 w-4 rounded cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        {Object.keys(etlResponse[0]).map((k) => (
                          <td key={k} className="px-4 py-2.5 border-r border-border last:border-r-0">
                            {row[k] !== null && row[k] !== undefined
                              ? typeof row[k] === "object"
                                ? JSON.stringify(row[k])
                                : String(row[k])
                              : "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No data to display</p>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEtlPageChange(etlCurrentPage - 1)}
              disabled={etlCurrentPage <= 1 || executing}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Page {etlCurrentPage}
              {etlTotalPages != null ? ` of ${etlTotalPages}` : ""}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleEtlPageChange(etlCurrentPage + 1)}
              disabled={(etlTotalPages != null && etlCurrentPage >= etlTotalPages) || executing}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" onClick={() => setEtlResponseModalOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
