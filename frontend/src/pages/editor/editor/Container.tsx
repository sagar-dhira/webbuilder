import { EditorElement, useEditor, DRAGGED_ELEMENT_ID_KEY } from "@/contexts/EditorContext";
import { Badge } from "@/components/ui/badge";
import { defaultStyles } from "@/lib/constants";
import { ElementTypes } from "@/lib/constants";
import { createId } from "@paralleldrive/cuid2";
import Recursive from "./Recursive";
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import ResizeHandle from "@/components/ui/resize-handle";
import ElementOptionsDropdown from "@/components/editor/ElementOptionsDropdown";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GripVertical, Database, Hash, FileText, Activity, Calendar, RefreshCw } from "lucide-react";

// Helper function to find parent and siblings in the element tree
function findParentAndSiblings(
  elements: EditorElement[],
  targetId: string,
  parent: EditorElement | null = null
): { parent: EditorElement | null; siblings: EditorElement[]; parentId: string | null } | null {
  for (const el of elements) {
    if (el.id === targetId) {
      return { 
        parent, 
        siblings: parent && Array.isArray(parent.content) ? parent.content : [],
        parentId: parent?.id || null
      };
    }
    if (Array.isArray(el.content)) {
      const result = findParentAndSiblings(el.content, targetId, el);
      if (result) return result;
    }
  }
  return null;
}

const ETL_DEFAULT_BODY = () => {
  const raw = import.meta.env.VITE_ETL_DEFAULT_BODY;
  if (typeof raw === "string" && raw.trim()) {
    try {
      return JSON.stringify(JSON.parse(raw));
    } catch {
      return raw;
    }
  }
  return JSON.stringify({ pipeline_name: "", limit: "", page_number: 1, filterStatus: "", data_flow_type: "ETL" });
};

export default function Container({ element }: { element: EditorElement }) {
  const { id, content, name, styles, type } = element;
  const { state, dispatch, setPendingEtlAutoRunId } = useEditor();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [rerunLoadingIndex, setRerunLoadingIndex] = useState<number | null>(null);
  const isSelected = state.editor.selectedElement.id === id;
  const containerRef = useRef<HTMLDivElement>(null);
  const initialSizeRef = useRef<{ width: number; height: number } | null>(null);
  const cumulativeDeltaRef = useRef<{ deltaX: number; deltaY: number }>({ deltaX: 0, deltaY: 0 });
  const elementRef = useRef(element);
  const wsRef = useRef<WebSocket | null>(null);
  useEffect(() => {
    elementRef.current = element;
  }, [element]);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);
  const isColumnLayout = type === "2Col" || type === "3Col";
  const isRowLayout = type === "2Row" || type === "3Row";
  const isGridLayout = type === "Grid2x2" || type === "Layout7";
  const isComplexLayout = type === "Header2Col" || type === "2ColFooter" || type === "Sidebar2Row" || 
                          type === "Layout1" || type === "Layout2" || type === "Layout3" || 
                          type === "Layout4" || type === "Layout5" || type === "Layout6" || type === "Layout8";
  
  // Check if this is a cell (container that's a child of a layout)
  // Memoize to avoid recalculating on every render
  const parentSiblingsInfo = useMemo(() => {
    return findParentAndSiblings(state.editor.elements, id);
  }, [state.editor.elements, id]);
  
  const isCell = type === "container" && parentSiblingsInfo?.parent && (
    parentSiblingsInfo.parent.type === "2Col" || 
    parentSiblingsInfo.parent.type === "3Col" ||
    parentSiblingsInfo.parent.type === "2Row" ||
    parentSiblingsInfo.parent.type === "3Row" ||
    parentSiblingsInfo.parent.type === "Grid2x2" ||
    parentSiblingsInfo.parent.type === "Layout7" ||
    isComplexLayout
  );

  const handleRerunJob = useCallback(
    async (item: Record<string, unknown>, idx: number) => {
      const sessionId = item.session_id as string | undefined;
      if (!sessionId || typeof sessionId !== "string") {
        toast.error("Rerun failed", { description: "No session ID available for this ETL job" });
        return;
      }
      const baseUrl = element.apiEndpoint?.replace(/\/data_flow\/list\/?$/, "") || "https://api-dev.akashic.dhira.io/application";
      const runJobUrl = `${baseUrl}/job/ETL/run_immediate_job`;
      const token = element.useToken
        ? localStorage.getItem("access_token") || localStorage.getItem("token")
        : null;
      const tenantName = element.tenantName?.trim() || import.meta.env.VITE_ETL_TENANT_NAME || "tenanta";
      setRerunLoadingIndex(idx);
      try {
        const headers: Record<string, string> = { accept: "*/*", "Content-Type": "application/json" };
        if (token?.trim()) headers["Authorization"] = `Bearer ${token.trim()}`;
        if (tenantName) headers["tenantname"] = tenantName;
        const res = await fetch(runJobUrl, {
          method: "POST",
          headers,
          body: JSON.stringify({ session_id: sessionId }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          toast.success("Job started", { description: "ETL job has been queued for rerun" });
          const wsUrl = "wss://api-dev.akashic.dhira.io/websocket/job_monitoring_channel";
          const dataFlowId = item.data_flow_id ?? item.entity_id;
          const clearRunning = () => {
            wsRef.current?.close();
            wsRef.current = null;
            setRerunLoadingIndex(null);
          };
          try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;
            ws.onmessage = (event) => {
              try {
                const parsed = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
                console.log("[Job Monitoring WebSocket]", parsed);
                const msg = parsed as { id?: number; status?: string; error?: string; last_executed?: string; messageType?: string };
                if (msg.messageType !== "data_flow") return;
                const msgId = msg.id;
                if (msgId == null || String(msgId) !== String(dataFlowId)) return;
                const el = elementRef.current;
                const detail = el.etlDetailData;
                if (!Array.isArray(detail)) return;
                const itemIdx = detail.findIndex(
                  (d) => String(d.data_flow_id ?? d.entity_id) === String(msgId)
                );
                if (itemIdx === -1) return;
                const updated = [...detail];
                updated[itemIdx] = {
                  ...updated[itemIdx],
                  status: msg.status ?? updated[itemIdx].status,
                  error: msg.error ?? updated[itemIdx].error,
                  last_executed: msg.last_executed ?? updated[itemIdx].last_executed,
                };
                dispatch({
                  type: "UPDATE_ELEMENT",
                  payload: { elementDetails: { ...el, etlDetailData: updated } },
                });
                const s = (msg.status ?? "").toLowerCase();
                if (s === "failed" || s === "finished" || s === "completed" || s === "error") {
                  clearRunning();
                }
              } catch {
                console.log("[Job Monitoring WebSocket]", event.data);
              }
            };
            ws.onerror = (err) => {
              console.warn("[Job Monitoring WebSocket] error", err);
              clearRunning();
            };
            ws.onclose = () => {
              console.log("[Job Monitoring WebSocket] closed");
              clearRunning();
            };
          } catch (wsErr) {
            console.warn("[Job Monitoring WebSocket] failed to connect", wsErr);
            setRerunLoadingIndex(null);
          }
        } else {
          const msg = (data as { message?: string }).message || (data as { msg?: string }).msg || "Failed to rerun job";
          toast.error("Rerun failed", { description: msg });
          setRerunLoadingIndex(null);
        }
      } catch (err) {
        toast.error("Rerun failed", { description: err instanceof Error ? err.message : "Network error" });
        setRerunLoadingIndex(null);
      }
    },
    [element.apiEndpoint, element.useToken, element.tenantName, dispatch]
  );

  const handleDrop = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDraggingOver(false);
    const draggedElementId = e.dataTransfer.getData(DRAGGED_ELEMENT_ID_KEY);

    // Move existing element (reorder or move to another container)
    if (draggedElementId) {
      if (draggedElementId === id) return; // can't drop onto self
      if (!Array.isArray(content)) return; // only containers with array content accept drops
      dispatch({ type: "MOVE_ELEMENT", payload: { elementId: draggedElementId, targetContainerId: id } });
      return;
    }

    // Add new element from sidebar
    const componentType = e.dataTransfer.getData("componentType") as ElementTypes;
    const chartDataRaw = e.dataTransfer.getData("chartData");
    const addElement = (details: EditorElement) => {
      dispatch({ type: "ADD_ELEMENT", payload: { containerId: id, elementDetails: details } });
    };

    // Superset chart (chartId + baseUrl from chartData)
    if (componentType === "chart" && chartDataRaw) {
      try {
        const { chartId, baseUrl, sliceName } = JSON.parse(chartDataRaw) as {
          chartId: number;
          baseUrl: string;
          sliceName?: string;
        };
        if (chartId && baseUrl) {
          addElement({
            content: { chartId, baseUrl, height: 400 },
            id: createId(),
            name: sliceName || `Chart ${chartId}`,
            styles: {},
            type: "chart",
            category: "Content",
          });
        }
      } catch {
        // ignore invalid chartData
      }
      return;
    }

    switch (componentType) {
      case "h1":
      case "h2":
      case "h3":
      case "h4":
      case "h5":
      case "h6":
        addElement({
          content: { innerText: `Heading ${componentType.charAt(1)}` },
          id: createId(),
          name: `Heading ${componentType.charAt(1)}`,
          styles: {
            color: "black",
            ...defaultStyles,
            fontSize:
              componentType === "h1" ? "2.5rem" : componentType === "h2" ? "2rem" : componentType === "h3" ? "1.75rem" : componentType === "h4" ? "1.5rem" : componentType === "h5" ? "1.25rem" : "1rem",
            fontWeight: componentType === "h1" || componentType === "h2" ? "700" : "600",
            lineHeight: "1.2",
            marginBottom: "0.5rem",
          },
          type: componentType,
          category: "Text",
        });
        break;
      case "p":
        addElement({
          content: { innerText: "Paragraph" },
          id: createId(),
          name: "Paragraph",
          styles: { color: "black", ...defaultStyles, fontSize: "1rem", lineHeight: "1.5", marginBottom: "1rem" },
          type: "p",
          category: "Text",
        });
        break;
      case "span":
        addElement({
          content: { innerText: "Text" },
          id: createId(),
          name: "Text",
          styles: { color: "black", ...defaultStyles, fontSize: "1rem", display: "inline" },
          type: "span",
          category: "Text",
        });
        break;
      case "image":
        addElement({
          content: { imageUrl: undefined, altText: undefined },
          id: createId(),
          name: "Image",
          styles: {},
          type: "image",
          category: "Basic",
        });
        break;
      case "container":
        addElement({ content: [], id: createId(), name: "Container", styles: { ...defaultStyles }, type: "container", category: "Container" });
        break;
      case "2Col":
        addElement({
          content: [
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
          ],
          id: createId(),
          name: "Two Columns",
          styles: { ...defaultStyles, display: "flex" },
          type: "2Col",
          category: "Container",
        });
        break;
      case "3Col":
        addElement({
          content: [
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
          ],
          id: createId(),
          name: "Three Columns",
          styles: { ...defaultStyles, display: "flex" },
          type: "3Col",
          category: "Container",
        });
        break;
      case "2Row":
        addElement({
          content: [
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
          ],
          id: createId(),
          name: "Two Rows",
          styles: { ...defaultStyles, display: "flex", flexDirection: "column" },
          type: "2Row",
          category: "Container",
        });
        break;
      case "3Row":
        addElement({
          content: [
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
          ],
          id: createId(),
          name: "Three Rows",
          styles: { ...defaultStyles, display: "flex", flexDirection: "column" },
          type: "3Row",
          category: "Container",
        });
        break;
      case "Header2Col":
        addElement({
          content: [
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            { content: [
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            ], id: createId(), name: "Two Columns", styles: { ...defaultStyles, display: "flex", width: "100%" }, type: "2Col", category: "Container" },
          ],
          id: createId(),
          name: "Header + 2 Cols",
          styles: { ...defaultStyles, display: "flex", flexDirection: "column" },
          type: "Header2Col",
          category: "Container",
        });
        break;
      case "2ColFooter":
        addElement({
          content: [
            { content: [
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            ], id: createId(), name: "Two Columns", styles: { ...defaultStyles, display: "flex", width: "100%" }, type: "2Col", category: "Container" },
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
          ],
          id: createId(),
          name: "2 Cols + Footer",
          styles: { ...defaultStyles, display: "flex", flexDirection: "column" },
          type: "2ColFooter",
          category: "Container",
        });
        break;
      case "Sidebar2Row":
        addElement({
          content: [
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%", flex: "2" }, type: "container", category: "Container" },
            { content: [
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            ], id: createId(), name: "Two Rows", styles: { ...defaultStyles, display: "flex", flexDirection: "column", width: "100%", flex: "1" }, type: "2Row", category: "Container" },
          ],
          id: createId(),
          name: "Sidebar + 2 Rows",
          styles: { ...defaultStyles, display: "flex" },
          type: "Sidebar2Row",
          category: "Container",
        });
        break;
      case "Grid2x2":
        addElement({
          content: [
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
          ],
          id: createId(),
          name: "2x2 Grid",
          styles: { ...defaultStyles, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gridTemplateRows: "repeat(2, 1fr)" },
          type: "Grid2x2",
          category: "Container",
        });
        break;
      case "Layout1":
        addElement({
          content: [
            { content: [
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%", flex: "2" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%", flex: "1" }, type: "container", category: "Container" },
            ], id: createId(), name: "Two Columns", styles: { ...defaultStyles, display: "flex", width: "100%" }, type: "2Col", category: "Container" },
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
          ],
          id: createId(),
          name: "Layout 1",
          styles: { ...defaultStyles, display: "flex", flexDirection: "column" },
          type: "Layout1",
          category: "Container",
        });
        break;
      case "Layout2":
        addElement({
          content: [
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%", flex: "1" }, type: "container", category: "Container" },
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%", flex: "1" }, type: "container", category: "Container" },
            { content: [
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            ], id: createId(), name: "Two Rows", styles: { ...defaultStyles, display: "flex", flexDirection: "column", width: "100%", flex: "1" }, type: "2Row", category: "Container" },
          ],
          id: createId(),
          name: "Layout 2",
          styles: { ...defaultStyles, display: "flex" },
          type: "Layout2",
          category: "Container",
        });
        break;
      case "Layout3":
        addElement({
          content: [
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%", flex: "2" }, type: "container", category: "Container" },
            { content: [
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            ], id: createId(), name: "2x2 Grid", styles: { ...defaultStyles, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gridTemplateRows: "repeat(2, 1fr)", width: "100%", flex: "1" }, type: "Grid2x2", category: "Container" },
          ],
          id: createId(),
          name: "Layout 3",
          styles: { ...defaultStyles, display: "flex" },
          type: "Layout3",
          category: "Container",
        });
        break;
      case "Layout4":
        addElement({
          content: [
            { content: [
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            ], id: createId(), name: "Three Columns", styles: { ...defaultStyles, display: "flex", width: "100%" }, type: "3Col", category: "Container" },
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
          ],
          id: createId(),
          name: "Layout 4",
          styles: { ...defaultStyles, display: "flex", flexDirection: "column" },
          type: "Layout4",
          category: "Container",
        });
        break;
      case "Layout5":
        addElement({
          content: [
            { content: [
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%", flex: "2" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%", flex: "1" }, type: "container", category: "Container" },
            ], id: createId(), name: "Two Columns", styles: { ...defaultStyles, display: "flex", width: "100%" }, type: "2Col", category: "Container" },
            { content: [
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            ], id: createId(), name: "Three Columns", styles: { ...defaultStyles, display: "flex", width: "100%" }, type: "3Col", category: "Container" },
          ],
          id: createId(),
          name: "Layout 5",
          styles: { ...defaultStyles, display: "flex", flexDirection: "column" },
          type: "Layout5",
          category: "Container",
        });
        break;
      case "Layout6":
        addElement({
          content: [
            { content: [
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%", flex: "1" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%", flex: "1" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%", flex: "2" }, type: "container", category: "Container" },
            ], id: createId(), name: "Three Columns", styles: { ...defaultStyles, display: "flex", width: "100%" }, type: "3Col", category: "Container" },
            { content: [
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%", flex: "1" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%", flex: "2" }, type: "container", category: "Container" },
            ], id: createId(), name: "Two Columns", styles: { ...defaultStyles, display: "flex", width: "100%" }, type: "2Col", category: "Container" },
          ],
          id: createId(),
          name: "Layout 6",
          styles: { ...defaultStyles, display: "flex", flexDirection: "column" },
          type: "Layout6",
          category: "Container",
        });
        break;
      case "Layout7":
        addElement({
          content: [
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
          ],
          id: createId(),
          name: "Layout 7",
          styles: { ...defaultStyles, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(2, 1fr)" },
          type: "Layout7",
          category: "Container",
        });
        break;
      case "Layout8":
        addElement({
          content: [
            { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            { content: [
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%", flex: "1" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%", flex: "2" }, type: "container", category: "Container" },
            ], id: createId(), name: "Two Columns", styles: { ...defaultStyles, display: "flex", width: "100%" }, type: "2Col", category: "Container" },
            { content: [
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
              { content: [], id: createId(), name: "Container", styles: { ...defaultStyles, width: "100%" }, type: "container", category: "Container" },
            ], id: createId(), name: "Three Columns", styles: { ...defaultStyles, display: "flex", width: "100%" }, type: "3Col", category: "Container" },
          ],
          id: createId(),
          name: "Layout 8",
          styles: { ...defaultStyles, display: "flex", flexDirection: "column" },
          type: "Layout8",
          category: "Container",
        });
        break;
      case "section":
        addElement({ content: [], id: createId(), name: "Section", styles: { ...defaultStyles }, type: "section", category: "Container" });
        break;
      case "video":
        addElement({ content: { videoUrl: "", controls: true }, id: createId(), name: "Video", styles: {}, type: "video", category: "Media" });
        break;
      case "audio":
        addElement({ content: { audioUrl: "", controls: true }, id: createId(), name: "Audio", styles: {}, type: "audio", category: "Media" });
        break;
      case "marquee":
        addElement({ content: { marqueeText: "Scrolling text..." }, id: createId(), name: "Marquee", styles: { color: "black", fontSize: "1rem" }, type: "marquee", category: "Media" });
        break;
      case "icon":
        addElement({ content: { iconName: "Star", href: "" }, id: createId(), name: "Icon", styles: { fontSize: "1.5rem" }, type: "icon", category: "Media" });
        break;
      case "embed":
        addElement({ content: { embedUrl: "" }, id: createId(), name: "Embed", styles: {}, type: "embed", category: "Media" });
        break;
      case "link":
        addElement({ content: { innerText: "Link", href: "#" }, id: createId(), name: "Link", styles: { color: "blue", textDecoration: "underline" }, type: "link", category: "Link" });
        break;
      case "button":
        addElement({ content: { buttonLabel: "Button", href: "#" }, id: createId(), name: "Button", styles: {}, type: "button", category: "Basic" });
        break;
      case "form":
        addElement({ content: [], id: createId(), name: "Form", styles: { ...defaultStyles }, type: "form", category: "Form" });
        break;
      case "input":
        addElement({ content: { inputType: "text", placeholder: "" }, id: createId(), name: "Input", styles: {}, type: "input", category: "Form" });
        break;
      case "textarea":
        addElement({ content: { placeholder: "Enter text..." }, id: createId(), name: "Textarea", styles: {}, type: "textarea", category: "Form" });
        break;
      case "select":
        addElement({ content: { options: "Option 1\nOption 2\nOption 3", placeholder: "Select..." }, id: createId(), name: "Select", styles: {}, type: "select", category: "Form" });
        break;
      case "checkbox":
        addElement({ content: { innerText: "Checkbox", checked: false }, id: createId(), name: "Checkbox", styles: {}, type: "checkbox", category: "Form" });
        break;
      case "radio":
        addElement({ content: { innerText: "Radio", name: "radio", value: "option1" }, id: createId(), name: "Radio", styles: {}, type: "radio", category: "Form" });
        break;
      case "submitButton":
        addElement({ content: { buttonLabel: "Submit" }, id: createId(), name: "Submit", styles: {}, type: "submitButton", category: "Form" });
        break;
      case "ol":
        addElement({ content: { listItems: "Item 1\nItem 2\nItem 3" }, id: createId(), name: "Ordered List", styles: {}, type: "ol", category: "Content" });
        break;
      case "ul":
        addElement({ content: { listItems: "Item 1\nItem 2\nItem 3" }, id: createId(), name: "Unordered List", styles: {}, type: "ul", category: "Content" });
        break;
      case "li":
        addElement({ content: { innerText: "List item" }, id: createId(), name: "List Item", styles: {}, type: "li", category: "Content" });
        break;
      case "blockquote":
        addElement({ content: { innerText: "Quote text" }, id: createId(), name: "Blockquote", styles: { borderLeft: "4px solid #ccc", paddingLeft: "1rem", fontStyle: "italic" }, type: "blockquote", category: "Content" });
        break;
      case "code":
        addElement({ content: { codeText: "const x = 1;" }, id: createId(), name: "Code", styles: { fontFamily: "monospace", backgroundColor: "#f4f4f4", padding: "0.5rem" }, type: "code", category: "Content" });
        break;
      case "hr":
        addElement({ content: {}, id: createId(), name: "Divider", styles: { border: "none", borderTop: "1px solid #ccc", margin: "1rem 0" }, type: "hr", category: "Content" });
        break;
      case "badge":
        addElement({ content: { badgeText: "Badge" }, id: createId(), name: "Badge", styles: {}, type: "badge", category: "Content" });
        break;
      case "spacer":
        addElement({ content: { spacerHeight: "24px", spacerWidth: "100%" }, id: createId(), name: "Spacer", styles: {}, type: "spacer", category: "Content" });
        break;
      case "table":
        addElement({ content: { tableHeaders: "Col1, Col2, Col3", tableRows: "A1, A2, A3\nB1, B2, B3" }, id: createId(), name: "Table", styles: {}, type: "table", category: "Content" });
        break;
      case "accordion":
        addElement({ content: { accordionItems: "Item 1|Content 1\nItem 2|Content 2" }, id: createId(), name: "Accordion", styles: {}, type: "accordion", category: "Content" });
        break;
      case "tabs":
        addElement({ content: { tabLabels: "Tab 1, Tab 2", tabContents: "Content 1\nContent 2" }, id: createId(), name: "Tabs", styles: {}, type: "tabs", category: "Content" });
        break;
      case "card":
        addElement({ content: { cardTitle: "Card Title", cardBody: "Card body text.", cardImageUrl: "" }, id: createId(), name: "Card", styles: {}, type: "card", category: "Content" });
        break;
      case "etl": {
        const etlId = createId();
        const etlUrl = import.meta.env.VITE_ETL_API_URL || "https://api-dev.akashic.dhira.io/application/data_flow/list";
        const etlTenant = import.meta.env.VITE_ETL_TENANT_NAME || "tenanta";
        const etlElement: EditorElement = {
          content: [],
          id: etlId,
          name: "Extract Load and Transform (ETL)",
          styles: { ...defaultStyles },
          type: "etl",
          category: "Container",
          apiEndpoint: etlUrl,
          tenantName: etlTenant,
          request: "POST",
          body: ETL_DEFAULT_BODY(),
          useToken: true,
        };
        addElement(etlElement);
        dispatch({ type: "CHANGE_SELECTED_ELEMENT", payload: { elementDetails: etlElement } });
        setPendingEtlAutoRunId(etlId);
        break;
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDragStart = (e: React.DragEvent) => {
    if (type === "__body") return;
    e.dataTransfer.setData(DRAGGED_ELEMENT_ID_KEY, id);
    e.dataTransfer.setData("componentType", type || "container");
    e.dataTransfer.effectAllowed = "move";
  };

  // Widget-style resize: same logic as ElementWrapper for all layouts
  const handleResize = (deltaX: number, deltaY: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (initialSizeRef.current === null) {
      initialSizeRef.current = { width: rect.width, height: rect.height };
      cumulativeDeltaRef.current = { deltaX: 0, deltaY: 0 };
    }
    cumulativeDeltaRef.current.deltaX += deltaX;
    cumulativeDeltaRef.current.deltaY += deltaY;
    const newWidth = Math.max(40, initialSizeRef.current.width + cumulativeDeltaRef.current.deltaX);
    const newHeight = Math.max(24, initialSizeRef.current.height + cumulativeDeltaRef.current.deltaY);
    const updatedElement = {
      ...element,
      styles: { ...styles, width: `${newWidth}px`, height: `${newHeight}px` },
    };
    dispatch({ type: "UPDATE_ELEMENT", payload: { elementDetails: updatedElement } });
    dispatch({ type: "CHANGE_SELECTED_ELEMENT", payload: { elementDetails: updatedElement } });
  };
  
  // Reset initial size when element changes or selection changes
  useEffect(() => {
    if (!isSelected) {
      initialSizeRef.current = null;
      cumulativeDeltaRef.current = { deltaX: 0, deltaY: 0 };
    }
  }, [isSelected, id]);

  const Wrapper = type === "form" ? "form" : "div";
  const formProps = type === "form" ? { action: element.formAction || undefined, method: (element.formMethod as "get" | "post") || undefined } : {};

  return (
    <Wrapper
      {...formProps}
      ref={containerRef as React.RefObject<HTMLDivElement & HTMLFormElement>}
      data-element-id={id}
      draggable={type !== "__body" && !state.editor.liveMode}
      className={cn("relative group my-1", {
        "max-w-full w-full": (type === "container" || type === "section" || type === "form" || type === "etl" || isColumnLayout || isRowLayout || isGridLayout || isComplexLayout) && !styles?.width,
        "h-fit": (type === "container" || type === "section" || type === "form" || type === "etl") && !styles?.height,
        "h-full": type === "__body",
        "!h-screen !m-0 !rounded-none": type === "__body" && state.editor.liveMode,
        "cursor-grab active:cursor-grabbing": type !== "__body" && !state.editor.liveMode,
        // Column layouts and complex row layouts (horizontal on desktop, vertical on mobile)
        "flex flex-col md:flex-row": isColumnLayout || type === "Sidebar2Row" || type === "Layout2" || type === "Layout3",
        // Row layouts and complex column layouts
        "flex flex-col": isRowLayout || type === "Header2Col" || type === "2ColFooter" || type === "Layout1" || type === "Layout4" || type === "Layout5" || type === "Layout6" || type === "Layout8",
        // Grid layouts
        "grid grid-cols-1 md:grid-cols-2": type === "Grid2x2",
        "grid grid-cols-1 md:grid-cols-3": type === "Layout7",
        // Responsive device widths
        "!w-[350px]": type === "__body" && state.editor.device === "Mobile",
        "!w-[800px]": type === "__body" && state.editor.device === "Tablet",
        "!w-full": type === "__body" && state.editor.device === "Desktop",
        // Selection outlines
        "!outline-blue-500 !outline-2":
          isSelected && !state.editor.liveMode && state.editor.selectedElement.type !== "__body" && !isDraggingOver,
        "!outline-yellow-400 !outline-4": isSelected && !state.editor.liveMode && state.editor.selectedElement.type === "__body",
        "!outline-yellow-400 outline-dashed !outline-2": isDraggingOver,
        "outline-dashed outline-[1px] outline-slate-300": !state.editor.liveMode,
      })}
      style={{ 
        width: styles?.width, 
        height: styles?.height, 
        flex: styles?.flex,
        display: styles?.display || (isColumnLayout ? "flex" : isRowLayout ? "flex" : isGridLayout ? "grid" : isComplexLayout ? "flex" : undefined),
        flexDirection: styles?.flexDirection || (isRowLayout || type === "Header2Col" || type === "2ColFooter" || type === "Layout1" || type === "Layout4" || type === "Layout5" || type === "Layout6" || type === "Layout8" ? "column" : undefined),
        gridTemplateColumns: styles?.gridTemplateColumns || (type === "Grid2x2" ? "repeat(2, 1fr)" : type === "Layout7" ? "repeat(3, 1fr)" : undefined),
        gridTemplateRows: styles?.gridTemplateRows || (type === "Grid2x2" ? "repeat(2, 1fr)" : type === "Layout7" ? "repeat(2, 1fr)" : undefined),
      } as React.CSSProperties}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDragStart={handleDragStart}
      onClick={(e) => {
        e.stopPropagation();
        dispatch({ type: "CHANGE_SELECTED_ELEMENT", payload: { elementDetails: element } });
      }}
    >
      {isSelected && !state.editor.liveMode && (
        <Badge className="absolute -top-6 -left-px rounded-none rounded-t-lg hidden sm:flex sm:items-center sm:gap-1 bg-primary text-primary-foreground">
          <GripVertical size={12} className="opacity-80 shrink-0" aria-hidden />
          {type === "etl" ? "ETL" : name}
        </Badge>
      )}
      <div style={{ ...styles, width: undefined, height: undefined } as React.CSSProperties} className={cn("w-full h-full", type === "etl" ? "p-0" : "p-4")}>
        {type === "etl" && element.etlDetailData && element.etlDetailData.length > 0 ? (
          <div className="flex flex-col gap-3 min-h-[100px] w-full rounded-lg border bg-card shadow-sm border-border p-4 overflow-auto">
            {element.etlDetailData.map((item, idx) => {
              const flowId = item.data_flow_id ?? item.entity_id ?? "—";
              const flowName = item.data_flow_name ?? "—";
              const status = item.status ?? "—";
              const created = item.created_datetime_timestamp ?? item.created_datetime_times ?? "—";
              const lastExecuted = item.last_executed ?? "";
              const formatDate = (val: unknown) => {
                if (val == null || val === "") return "—";
                const str = String(val);
                try {
                  const d = new Date(str);
                  if (!isNaN(d.getTime())) {
                    const date = d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
                    const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true });
                    return `${date} at ${time}`;
                  }
                } catch {}
                return str;
              };
              return (
                <div
                  key={idx}
                  className="rounded-lg border bg-gradient-to-br from-background to-muted/30 p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Hash className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data Flow ID</p>
                        <p className="text-sm font-semibold truncate">{flowId != null ? String(flowId) : "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data Flow Name</p>
                        <p className="text-sm font-semibold truncate" title={String(flowName)}>{flowName != null ? String(flowName) : "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Activity className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</p>
                        <p className={cn(
                          "text-sm font-medium",
                          status === "finished" || status === "completed" ? "text-emerald-600 dark:text-emerald-400" : "",
                          status === "running" || status === "pending" ? "text-amber-600 dark:text-amber-400" : "",
                          status === "failed" || status === "error" ? "text-destructive" : ""
                        )}>
                          {status != null && status !== "" ? String(status) : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Created</p>
                        <p className="text-sm font-medium">{formatDate(created)}</p>
                      </div>
                    </div>
                    {lastExecuted && (
                      <div className="flex items-start gap-3 sm:col-span-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <RefreshCw className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Last executed (live)</p>
                          <p className="text-sm font-medium">{formatDate(lastExecuted)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {typeof item.session_id === "string" && item.session_id.trim() !== "" && (
                    <div className="mt-4 pt-3 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full sm:w-auto gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRerunJob(item, idx);
                        }}
                        disabled={rerunLoadingIndex === idx}
                      >
                        <RefreshCw className={cn("h-4 w-4", rerunLoadingIndex === idx && "animate-spin")} />
                        {rerunLoadingIndex === idx ? "Running" : "Rerun job"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : type === "etl" && Array.isArray(content) && content.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 min-h-[100px] w-full rounded-lg border bg-card shadow-sm border-border">
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
              <Database className="w-6 h-6 text-muted-foreground" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">ETL</span>
          </div>
        ) : type === "etl" && Array.isArray(content) && content.length > 0 ? (
          content.map((child) => <Recursive key={child.id} element={child} />)
        ) : (
          Array.isArray(content) && content.map((child) => <Recursive key={child.id} element={child} />)
        )}
      </div>
      {isSelected && !state.editor.liveMode && state.editor.selectedElement.type !== "__body" && (
        <ElementOptionsDropdown element={element} />
      )}
      
      {/* Resize handles for columns, rows, grids, cells, and containers */}
      {isSelected && !state.editor.liveMode && type !== "__body" && (type === "container" || type === "etl" || type === "section" || isColumnLayout || isRowLayout || isGridLayout || isComplexLayout || isCell) && (
        <>
          {/* Right edge resize handle for width */}
          <ResizeHandle
            direction="horizontal"
            onResize={(dx) => handleResize(dx, 0)}
            className="right-0 top-0 bottom-0 w-2 hover:w-3 transition-all rounded-r-sm cursor-ew-resize"
            disabled={state.editor.liveMode}
          />
          
          {/* Bottom edge resize handle for height */}
          <ResizeHandle
            direction="vertical"
            onResize={(_, dy) => handleResize(0, dy)}
            className="bottom-0 left-0 right-0 h-2 hover:h-3 transition-all rounded-b-sm cursor-ns-resize"
            disabled={state.editor.liveMode}
          />
          
          {/* Corner resize handle for both dimensions */}
          <ResizeHandle
            direction="both"
            onResize={handleResize}
            className="bottom-0 right-0 w-5 h-5 rounded-br-sm cursor-nwse-resize"
            disabled={state.editor.liveMode}
          />
        </>
      )}
    </Wrapper>
  );
}
