import React, { useRef, useEffect, useState } from "react";
import { GripVertical, GripHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResizeHandleProps {
  onResize: (deltaX: number, deltaY: number) => void;
  direction: "horizontal" | "vertical" | "both";
  className?: string;
  disabled?: boolean;
}

export default function ResizeHandle({ onResize, direction, className, disabled }: ResizeHandleProps) {
  const [isResizing, setIsResizing] = useState(false);
  const startPos = useRef({ x: 0, y: 0 });
  const handleRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  const isFirstMove = useRef(true);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Cancel any pending animation frame
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }

      // Use requestAnimationFrame for smooth updates
      rafId.current = requestAnimationFrame(() => {
        const deltaX = e.clientX - startPos.current.x;
        const deltaY = e.clientY - startPos.current.y;
        
        // Only call onResize if there's actual movement
        if (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0) {
          // Pass a flag for first move to reset initial size
          const firstMove = isFirstMove.current;
          isFirstMove.current = false;
          
          // Create a wrapper that passes the first move flag
          // Since onResize signature is (deltaX, deltaY), we'll need to handle this differently
          // For now, we'll just call onResize normally and handle reset in the container
          onResize(deltaX, deltaY);
          startPos.current = { x: e.clientX, y: e.clientY };
        }
      });
    };

    const handleMouseUp = () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      setIsResizing(false);
      isFirstMove.current = true; // Reset for next resize session
    };

    // Prevent text selection during resize
    document.body.style.userSelect = "none";
    document.body.style.cursor = direction === "horizontal" ? "ew-resize" : direction === "vertical" ? "ns-resize" : "nwse-resize";
    
    document.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [isResizing, onResize, direction]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    isFirstMove.current = true; // Mark as first move for new resize session
    startPos.current = { x: e.clientX, y: e.clientY };
  };

  const showHorizontal = direction === "horizontal" || direction === "both";
  const showVertical = direction === "vertical" || direction === "both";

  return (
    <div
      ref={handleRef}
      onMouseDown={handleMouseDown}
      className={cn(
        "absolute z-50 bg-primary/80 hover:bg-primary transition-all",
        {
          "cursor-ew-resize": direction === "horizontal",
          "cursor-ns-resize": direction === "vertical",
          "cursor-nwse-resize": direction === "both",
          "opacity-50 pointer-events-none": disabled,
          "hover:bg-primary/100": !disabled,
        },
        className
      )}
      style={{
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {showHorizontal && (
        <div className="flex items-center justify-center w-full h-full">
          <GripVertical className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
      {showVertical && !showHorizontal && (
        <div className="flex items-center justify-center w-full h-full">
          <GripHorizontal className="w-3 h-3 text-primary-foreground" />
        </div>
      )}
      {direction === "both" && (
        <div className="flex items-center justify-center w-full h-full">
          <div className="flex flex-col gap-0.5">
            <GripVertical className="w-3 h-3 text-primary-foreground" />
            <GripHorizontal className="w-3 h-3 text-primary-foreground" />
          </div>
        </div>
      )}
    </div>
  );
}
