import { EditorElement, useEditor, DRAGGED_ELEMENT_ID_KEY } from "@/contexts/EditorContext";
import { Badge } from "@/components/ui/badge";
import { defaultStyles } from "@/lib/constants";
import { ElementTypes } from "@/lib/constants";
import { createId } from "@paralleldrive/cuid2";
import Recursive from "./Recursive";
import { useState, useRef, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import ResizeHandle from "@/components/ui/resize-handle";
import ElementOptionsDropdown from "@/components/editor/ElementOptionsDropdown";
import { GripVertical, Database, Hash, FileText, Activity, Calendar } from "lucide-react";

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

// Helper function to parse width/height values
function parseSize(value: string | undefined): number {
  if (!value) return 0;
  const match = value.match(/^(\d+(?:\.\d+)?)(px|%|rem|em)$/);
  if (!match) return 0;
  return parseFloat(match[1]);
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
  const isSelected = state.editor.selectedElement.id === id;
  const containerRef = useRef<HTMLDivElement>(null);
  const initialSizeRef = useRef<{ width: number; height: number } | null>(null);
  const cumulativeDeltaRef = useRef<{ deltaX: number; deltaY: number }>({ deltaX: 0, deltaY: 0 });
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
    const addElement = (details: EditorElement) => {
      dispatch({ type: "ADD_ELEMENT", payload: { containerId: id, elementDetails: details } });
    };

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

  // Handle width resize for columns, grids, and cells
  const handleWidthResize = (deltaX: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const currentActualWidth = rect.width;
    
    // Initialize or reset if this looks like a new resize session
    // Always use actual rendered size for consistency
    if (initialSizeRef.current === null) {
      // First resize - initialize with actual rendered size
      initialSizeRef.current = { 
        width: currentActualWidth, 
        height: rect.height 
      };
      cumulativeDeltaRef.current = { deltaX: 0, deltaY: 0 };
    } else {
      // Check if we need to reset (element was resized externally or new session started)
      const expectedWidth = initialSizeRef.current.width + cumulativeDeltaRef.current.deltaX;
      const widthDiff = Math.abs(currentActualWidth - expectedWidth);
      if (widthDiff > 10) {
        // Reset - size doesn't match, likely a new resize session
        initialSizeRef.current = { 
          width: currentActualWidth, 
          height: rect.height 
        };
        cumulativeDeltaRef.current = { deltaX: 0, deltaY: 0 };
      }
    }
    
    // Accumulate the delta
    cumulativeDeltaRef.current.deltaX += deltaX;
    
    // Use memoized parent siblings info
    const parentSiblings = findParentAndSiblings(state.editor.elements, id);
    if (!parentSiblings || !parentSiblings.parent) {
      // If no parent, just update this element using initial size + cumulative delta
      const newWidth = Math.max(50, initialSizeRef.current.width + cumulativeDeltaRef.current.deltaX);
      const updatedElement = {
        ...element,
        styles: {
          ...styles,
          width: `${newWidth}px`,
        },
      };
      dispatch({ type: "UPDATE_ELEMENT", payload: { elementDetails: updatedElement } });
      dispatch({ type: "CHANGE_SELECTED_ELEMENT", payload: { elementDetails: updatedElement } });
      return;
    }
    
    // Reset initial size ref when resize ends (handled by checking if delta is 0 or resize stops)
    // For now, we'll use the current approach but improve it
    const containerRect = containerRef.current.getBoundingClientRect();
    const currentWidth = containerRect.width;
    
    const { parent, siblings } = parentSiblings;
    const currentIndex = siblings.findIndex((s) => s.id === id);
    
    if (currentIndex === -1) return;
    
    // Get parent container element
    const parentElement = document.querySelector(`[data-element-id="${parent.id}"]`) as HTMLElement;
    const parentWidth = parentElement?.getBoundingClientRect().width || containerRect.width * siblings.length;
    
    // Calculate new width percentage
    const newWidth = currentWidth + deltaX;
    const newWidthPercent = (newWidth / parentWidth) * 100;
    const minWidth = 10; // Minimum 10%
    const maxWidth = 90; // Maximum 90%
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidthPercent));
    
    // Calculate current total width of all siblings
    let totalCurrentWidth = 0;
    siblings.forEach((sib) => {
      const sibWidth = parseSize(sib.styles?.width as string);
      totalCurrentWidth += sibWidth || (100 / siblings.length);
    });
    
    // Calculate remaining width for other siblings
    const remainingWidth = 100 - clampedWidth;
    const otherSiblingsCurrentWidth = totalCurrentWidth - (parseSize(styles?.width as string) || (100 / siblings.length));
    const scaleFactor = otherSiblingsCurrentWidth > 0 ? remainingWidth / otherSiblingsCurrentWidth : (remainingWidth / (siblings.length - 1));
    
    // Update all siblings
    const updatedSiblings = siblings.map((sib, idx) => {
      if (idx === currentIndex) {
        return {
          ...sib,
          styles: {
            ...sib.styles,
            width: `${clampedWidth}%`,
            flex: "none",
          },
        };
      }
      
      const currentSibWidth = parseSize(sib.styles?.width as string);
      const baseWidth = currentSibWidth || (100 / siblings.length);
      const newSibWidth = baseWidth * scaleFactor;
      
      return {
        ...sib,
        styles: {
          ...sib.styles,
          width: `${newSibWidth}%`,
          flex: "none",
        },
      };
    });
    
    // Update parent with new children
    const updatedParent = {
      ...parent,
      content: updatedSiblings,
    };
    
    dispatch({ type: "UPDATE_ELEMENT", payload: { elementDetails: updatedParent } });
    
    // Update selected element
    const updatedElement = updatedSiblings[currentIndex];
    dispatch({ type: "CHANGE_SELECTED_ELEMENT", payload: { elementDetails: updatedElement } });
  };

  // Handle height resize
  const handleHeightResize = (deltaY: number) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const currentActualHeight = rect.height;
    
    // Initialize or reset if this looks like a new resize session
    // Always use actual rendered size for consistency
    if (initialSizeRef.current === null) {
      // First resize - initialize with actual rendered size
      initialSizeRef.current = { 
        width: rect.width,
        height: currentActualHeight 
      };
      cumulativeDeltaRef.current = { deltaX: 0, deltaY: 0 };
    } else {
      // Check if we need to reset (element was resized externally or new session started)
      const expectedHeight = initialSizeRef.current.height + cumulativeDeltaRef.current.deltaY;
      const heightDiff = Math.abs(currentActualHeight - expectedHeight);
      if (heightDiff > 10) {
        // Reset - size doesn't match, likely a new resize session
        initialSizeRef.current = { 
          width: rect.width,
          height: currentActualHeight 
        };
        cumulativeDeltaRef.current = { deltaX: 0, deltaY: 0 };
      }
    }
    
    // Accumulate the delta
    cumulativeDeltaRef.current.deltaY += deltaY;
    
    // Use initial size + cumulative delta for smoother resizing
    const newHeight = Math.max(50, initialSizeRef.current.height + cumulativeDeltaRef.current.deltaY); // Minimum 50px
    
    // Find parent and siblings
    const parentSiblings = findParentAndSiblings(state.editor.elements, id);
    
    // Update current element
    const updatedElement = {
      ...element,
      styles: {
        ...styles,
        height: `${newHeight}px`,
      },
    };
    
    // If we have siblings in a column or row layout, update them to match height
    if (parentSiblings && parentSiblings.parent && (
      parentSiblings.parent.type === "2Col" || 
      parentSiblings.parent.type === "3Col" ||
      parentSiblings.parent.type === "2Row" ||
      parentSiblings.parent.type === "3Row" ||
      parentSiblings.parent.type === "Grid2x2" ||
      parentSiblings.parent.type === "Layout7"
    )) {
      const { siblings } = parentSiblings;
      const currentIndex = siblings.findIndex((s) => s.id === id);
      
      if (currentIndex !== -1) {
        // For row layouts, resize height similar to column width resizing
        const parentType = parentSiblings.parent.type;
        if (parentType === "2Row" || parentType === "3Row") {
          const parentElement = document.querySelector(`[data-element-id="${parentSiblings.parent.id}"]`) as HTMLElement;
          const currentRect = containerRef.current?.getBoundingClientRect();
          const parentHeight = parentElement?.getBoundingClientRect().height || (currentRect ? currentRect.height * siblings.length : 0);
          const newHeightPercent = (newHeight / parentHeight) * 100;
          const minHeight = 10;
          const maxHeight = 90;
          const clampedHeight = Math.max(minHeight, Math.min(maxHeight, newHeightPercent));
          
          let totalCurrentHeight = 0;
          siblings.forEach((sib) => {
            const sibHeight = parseSize(sib.styles?.height as string);
            totalCurrentHeight += sibHeight || (100 / siblings.length);
          });
          
          const remainingHeight = 100 - clampedHeight;
          const otherSiblingsCurrentHeight = totalCurrentHeight - (parseSize(styles?.height as string) || (100 / siblings.length));
          const scaleFactor = otherSiblingsCurrentHeight > 0 ? remainingHeight / otherSiblingsCurrentHeight : (remainingHeight / (siblings.length - 1));
          
          const updatedSiblings = siblings.map((sib, idx) => {
            if (idx === currentIndex) {
              return {
                ...sib,
                styles: {
                  ...sib.styles,
                  height: `${clampedHeight}%`,
                  flex: "none",
                },
              };
            }
            
            const currentSibHeight = parseSize(sib.styles?.height as string);
            const baseHeight = currentSibHeight || (100 / siblings.length);
            const newSibHeight = baseHeight * scaleFactor;
            
            return {
              ...sib,
              styles: {
                ...sib.styles,
                height: `${newSibHeight}%`,
                flex: "none",
              },
            };
          });
          
          const updatedParent = {
            ...parentSiblings.parent,
            content: updatedSiblings,
          };
          
          dispatch({ type: "UPDATE_ELEMENT", payload: { elementDetails: updatedParent } });
          dispatch({ type: "CHANGE_SELECTED_ELEMENT", payload: { elementDetails: updatedSiblings[currentIndex] } });
          return;
        }
        
        // For column layouts and grids, update siblings to match height
        const updatedSiblings = siblings.map((sib, idx) => {
          if (idx === currentIndex) return updatedElement;
          
          // Update height to match if it's a cell in the same row
          return {
            ...sib,
            styles: {
              ...sib.styles,
              height: `${newHeight}px`,
            },
          };
        });
        
        // Update parent with new children
        const updatedParent = {
          ...parentSiblings.parent,
          content: updatedSiblings,
        };
        
        dispatch({ type: "UPDATE_ELEMENT", payload: { elementDetails: updatedParent } });
        dispatch({ type: "CHANGE_SELECTED_ELEMENT", payload: { elementDetails: updatedElement } });
        return;
      }
    }
    
    // No siblings or not in column layout, just update this element
    dispatch({ type: "UPDATE_ELEMENT", payload: { elementDetails: updatedElement } });
    dispatch({ type: "CHANGE_SELECTED_ELEMENT", payload: { elementDetails: updatedElement } });
  };

  // Handle resize for both dimensions
  const handleResize = (deltaX: number, deltaY: number) => {
    // Initialize initial size on first resize
    if (initialSizeRef.current === null && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const currentWidth = parseSize(styles?.width as string) || rect.width;
      const currentHeight = parseSize(styles?.height as string) || rect.height;
      initialSizeRef.current = { width: currentWidth, height: currentHeight };
      cumulativeDeltaRef.current = { deltaX: 0, deltaY: 0 };
    }
    
    if (deltaX !== 0) handleWidthResize(deltaX);
    if (deltaY !== 0) handleHeightResize(deltaY);
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
              const id = item.data_flow_id ?? item.entity_id ?? "—";
              const name = item.data_flow_name ?? "—";
              const status = item.status ?? "—";
              const created = item.created_datetime_timestamp ?? item.created_datetime_times ?? "—";
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
                        <p className="text-sm font-semibold truncate">{id != null ? String(id) : "—"}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data Flow Name</p>
                        <p className="text-sm font-semibold truncate" title={String(name)}>{name != null ? String(name) : "—"}</p>
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
                  </div>
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
            onResize={(deltaX) => handleWidthResize(deltaX)}
            className="right-0 top-0 bottom-0 w-2 hover:w-3 transition-all rounded-r-sm cursor-ew-resize"
            disabled={state.editor.liveMode}
          />
          
          {/* Bottom edge resize handle for height */}
          <ResizeHandle
            direction="vertical"
            onResize={(deltaY) => handleHeightResize(deltaY)}
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
