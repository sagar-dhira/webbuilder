import { ElementTypes } from "@/lib/constants";
import type { LucideIcon } from "lucide-react";

interface Props {
  type: ElementTypes;
  title: string;
  Icon: LucideIcon;
}

export default function ElementPlaceholder({ type, title, Icon }: Props) {
  const handleDragStart = (e: React.DragEvent) => {
    if (!type) return;
    e.dataTransfer.setData("componentType", type);
  };

  return (
    <div
      className="flex items-center gap-2 p-2 mb-2 rounded-md cursor-pointer bg-sidebar-accent"
      draggable
      onDragStart={handleDragStart}
    >
      <div className="flex items-center justify-center w-6 h-6 rounded-sm bg-muted">
        <Icon size={15} className="text-muted-foreground" />
      </div>
      <span className="text-muted-foreground">{title}</span>
    </div>
  );
}
