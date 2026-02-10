import { useEditor } from "@/contexts/EditorContext";
import { EditorElement } from "@/contexts/EditorContext";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

function LayerItem({ element, depth = 0 }: { element: EditorElement; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const { dispatch, state } = useEditor();
  const hasChildren = Array.isArray(element.content) && element.content.length > 0;
  const isSelected = state.editor.selectedElement.id === element.id;

  const handleClick = () => {
    dispatch({ type: "CHANGE_SELECTED_ELEMENT", payload: { elementDetails: element } });
    if (state.editor.selectedElement.id === element.id) setExpanded((e) => !e);
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 p-2 hover:bg-muted/50 rounded-lg cursor-pointer",
          isSelected && "bg-muted"
        )}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={handleClick}
      >
        {hasChildren ? (
          <button onClick={(e) => { e.stopPropagation(); setExpanded((x) => !x); }}>
            {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        ) : (
          <div className="w-4" />
        )}
        <span className="text-sm flex-1 truncate">{element.name}</span>
      </div>
      {hasChildren && expanded && (
        <div>
          {(element.content as EditorElement[]).map((child) => (
            <LayerItem key={child.id} element={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function LayersTab() {
  const { state } = useEditor();
  const root = state.editor.elements[0];
  if (!root) return null;
  return (
    <div className="p-2">
      <LayerItem element={root} />
    </div>
  );
}
