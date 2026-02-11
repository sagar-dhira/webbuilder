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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

function getContent(el: EditorElement): Record<string, unknown> {
  return typeof el.content === "object" && el.content !== null && !Array.isArray(el.content) ? (el.content as Record<string, unknown>) : {};
}

interface Props {
  element: EditorElement;
}

export default function ElementOptionsDropdown({ element }: Props) {
  const { dispatch, pendingEtlAutoRunId, setPendingEtlAutoRunId } = useEditor();
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
  const isEtl = element.type === "etl";
  const isImage = element.type === "image";
  const isMedia = element.category === "Media";
  const isContent = element.category === "Content";
  const isLink = element.type === "link";
  const isButton = element.type === "button";
  const showQuickStyleForBlock = isMedia || isContent || isLink || isButton;
  const [executing, setExecuting] = useState(false);

  const handleEtlConfigChange = (field: "apiEndpoint" | "tenantName" | "request" | "body", value: string) => {
    dispatch({
      type: "UPDATE_ELEMENT",
      payload: { elementDetails: { ...element, [field]: value } },
    });
  };

  const [etlResponse, setEtlResponse] = useState<Record<string, unknown>[] | null>(null);
  const [etlError, setEtlError] = useState<string | null>(null);
  const [etlConfigOpen, setEtlConfigOpen] = useState(false);
  const [etlResponseModalOpen, setEtlResponseModalOpen] = useState(false);
  const [etlSelectedRows, setEtlSelectedRows] = useState<Set<number>>(new Set());
  const [etlCurrentPage, setEtlCurrentPage] = useState(1);
  const [etlTotalPages, setEtlTotalPages] = useState<number | null>(null);

  const fetchListById = useCallback(
    async (selectedIndices: Set<number>) => {
      if (!etlResponse || selectedIndices.size === 0) return;
      const token = element.useToken
        ? localStorage.getItem("access_token") || localStorage.getItem("token")
        : null;
      const tenantName = element.tenantName?.trim();
      const baseUrl = element.apiEndpoint?.trim().replace(/\/list\/?$/, "") || "";
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
          dispatch({ type: "UPDATE_ELEMENT", payload: { elementDetails: { ...element, etlDetailData: rows } } });
        }
      } catch (err) {
        console.error("ETL listById error:", err);
      }
    },
    [element, dispatch, etlResponse]
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

  const handleEtlExecute = async (pageNumber?: number) => {
    const endpoint = element.apiEndpoint?.trim();
    const token = element.useToken
      ? localStorage.getItem("access_token") || localStorage.getItem("token")
      : null;
    const tenantName = element.tenantName?.trim();
    const method = (element.request?.trim().toUpperCase() || "GET") as RequestInit["method"];
    let bodyStr = element.body?.trim() || undefined;
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
        const rows = normalizeToRows(data);
        setEtlResponse(rows);
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
        setEtlConfigOpen(false);
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

  // Auto-run ETL when dropped (pendingEtlAutoRunId is set by Container on drop)
  useEffect(() => {
    if (!isEtl || !pendingEtlAutoRunId || element.id !== pendingEtlAutoRunId) return;
    setPendingEtlAutoRunId(null); // clear immediately to avoid re-running
    handleEtlExecute();
  }, [isEtl, pendingEtlAutoRunId, element.id]);

  const threeDotsTrigger = (
    <div
      className="absolute bg-primary px-2.5 py-1 text-xs font-bold -top-7 -right-px rounded-t-lg cursor-pointer hover:bg-primary/90 transition-colors z-10"
      onClick={(e) => e.stopPropagation()}
    >
      <MoreVertical className="text-primary-foreground" size={16} />
    </div>
  );

  if (isEtl) {
    return (
      <>
      <Dialog open={etlConfigOpen} onOpenChange={setEtlConfigOpen}>
        <DialogTrigger asChild>{threeDotsTrigger}</DialogTrigger>
        <DialogContent
          className="max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>ETL – Quick config</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">API endpoint</Label>
              <Input
                placeholder="https://api.example.com/run"
                value={element.apiEndpoint ?? ""}
                onChange={(e) => handleEtlConfigChange("apiEndpoint", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Tenant name</Label>
              <Input
                placeholder="Tenant name"
                value={element.tenantName ?? ""}
                onChange={(e) => handleEtlConfigChange("tenantName", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <Label className="text-muted-foreground">Use session token</Label>
              <Switch
                checked={!!element.useToken}
                onCheckedChange={(checked) =>
                  dispatch({
                    type: "UPDATE_ELEMENT",
                    payload: { elementDetails: { ...element, useToken: checked } },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Request</Label>
              <Input
                placeholder="e.g. GET, POST"
                value={element.request ?? ""}
                onChange={(e) => handleEtlConfigChange("request", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Body</Label>
              <Textarea
                placeholder='e.g. {"key": "value"}'
                value={element.body ?? ""}
                onChange={(e) => handleEtlConfigChange("body", e.target.value)}
                className="min-h-[80px] text-sm"
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
            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleDuplicate()}
              >
                <Copy className="h-4 w-4 mr-1" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-destructive hover:text-destructive"
                onClick={() => handleDelete()}
              >
                <Trash className="h-4 w-4 mr-1" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={etlResponseModalOpen} onOpenChange={setEtlResponseModalOpen}>
        <DialogContent
          className="max-w-[90vw] max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {threeDotsTrigger}
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
                    value={
                      typeof element.styles?.fontSize === "number"
                        ? String(element.styles.fontSize)
                        : element.styles?.fontSize || ""
                    }
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

        {/* Container Element Options (exclude ETL – ETL uses modal above) */}
        {isContainer && !isEtl && (
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
