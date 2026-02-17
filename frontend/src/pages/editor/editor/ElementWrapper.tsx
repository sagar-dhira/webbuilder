import { EditorElement, useEditor, DRAGGED_ELEMENT_ID_KEY } from "@/contexts/EditorContext";
import { Badge } from "@/components/ui/badge";
import { defaultStyles } from "@/lib/constants";
import { cn, stripConflictingSizeClasses } from "@/lib/utils";
import ElementOptionsDropdown from "@/components/editor/ElementOptionsDropdown";
import ResizeHandle from "@/components/ui/resize-handle";
import { GripVertical } from "lucide-react";
import { useRef, useEffect } from "react";

const RESIZABLE_TYPES: (string | null)[] = [
  "image", "video", "audio", "marquee", "icon", "embed", "chart",
  "link", "button", "input", "textarea", "select", "checkbox", "radio", "submitButton",
  "ol", "ul", "blockquote", "code", "hr", "badge", "spacer", "table", "accordion", "tabs", "card",
];

interface Props {
  element: EditorElement;
  children: React.ReactNode;
  className?: string;
}

export default function ElementWrapper({ element, children, className }: Props) {
  const { state, dispatch } = useEditor();
  const isSelected = state.editor.selectedElement.id === element.id;
  const isLive = state.editor.liveMode;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const initialSizeRef = useRef<{ width: number; height: number } | null>(null);
  const cumulativeDeltaRef = useRef({ deltaX: 0, deltaY: 0 });
  const canResize = RESIZABLE_TYPES.includes(element.type) && !isLive;
  const hasExplicitWidth = !!(element.styles?.width && String(element.styles.width).trim());
  const hasExplicitHeight = !!(element.styles?.height && String(element.styles.height).trim());
  const effectiveClassName = stripConflictingSizeClasses(className, hasExplicitWidth, hasExplicitHeight);

  useEffect(() => {
    if (!isSelected) {
      initialSizeRef.current = null;
      cumulativeDeltaRef.current = { deltaX: 0, deltaY: 0 };
    }
  }, [isSelected, element.id]);

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    e.dataTransfer.setData(DRAGGED_ELEMENT_ID_KEY, element.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleResize = (deltaX: number, deltaY: number) => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    if (initialSizeRef.current === null) {
      initialSizeRef.current = { width: rect.width, height: rect.height };
      cumulativeDeltaRef.current = { deltaX: 0, deltaY: 0 };
    }
    cumulativeDeltaRef.current.deltaX += deltaX;
    cumulativeDeltaRef.current.deltaY += deltaY;
    const newWidth = Math.max(40, initialSizeRef.current.width + cumulativeDeltaRef.current.deltaX);
    const newHeight = Math.max(24, initialSizeRef.current.height + cumulativeDeltaRef.current.deltaY);
    dispatch({
      type: "UPDATE_ELEMENT",
      payload: {
        elementDetails: {
          ...element,
          styles: { ...element.styles, width: `${newWidth}px`, height: `${newHeight}px` },
        },
      },
    });
  };

  return (
    <div
      ref={wrapperRef}
      draggable={!isLive}
      onDragStart={handleDragStart}
      style={{ width: element.styles?.width || "auto", height: element.styles?.height || "auto" }}
      className={cn("relative p-0 cursor-grab active:cursor-grabbing", effectiveClassName, {
        "!border-blue-500 !border-2":
          isSelected && !isLive && state.editor.selectedElement.type !== "__body",
        "!border-yellow-400 !border-4": isSelected && !isLive && state.editor.selectedElement.type === "__body",
        "!border-solid": isSelected && !isLive,
      })}
      onClick={(e) => {
        e.stopPropagation();
        dispatch({ type: "CHANGE_SELECTED_ELEMENT", payload: { elementDetails: element } });
      }}
    >
      {isSelected && !isLive && (
        <Badge
          className="absolute -top-6 -left-px rounded-none rounded-t-lg bg-primary text-primary-foreground flex items-center gap-1"
          style={defaultStyles}
        >
          <GripVertical size={12} className="opacity-80 shrink-0" aria-hidden />
          {element.name}
        </Badge>
      )}
      <div className="overflow-hidden">{children}</div>
      {isSelected && !isLive && state.editor.selectedElement.type !== "__body" && (
        <ElementOptionsDropdown element={element} />
      )}
      {isSelected && !isLive && canResize && (
        <>
          <ResizeHandle
            direction="horizontal"
            onResize={(dx) => handleResize(dx, 0)}
            className="right-0 top-0 bottom-0 w-2 hover:w-3 transition-all rounded-r-sm cursor-ew-resize"
            disabled={isLive}
          />
          <ResizeHandle
            direction="vertical"
            onResize={(_, dy) => handleResize(0, dy)}
            className="bottom-0 left-0 right-0 h-2 hover:h-3 transition-all rounded-b-sm cursor-ns-resize"
            disabled={isLive}
          />
          <ResizeHandle
            direction="both"
            onResize={handleResize}
            className="bottom-0 right-0 w-5 h-5 rounded-br-sm cursor-nwse-resize"
            disabled={isLive}
          />
        </>
      )}
    </div>
  );
}
