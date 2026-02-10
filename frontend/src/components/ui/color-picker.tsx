import * as React from "react";
import { HexColorPicker } from "react-colorful";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Input } from "./input";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  id?: string;
  className?: string;
}

export function ColorPicker({ value = "#ffffff", onChange, id, className }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          className={cn(
            "h-9 w-9 rounded-md border border-input shrink-0",
            className
          )}
          style={{ backgroundColor: value || "#ffffff" }}
        />
      </PopoverTrigger>
      <PopoverContent 
        className="w-auto p-3"
        align="start"
        side="right"
        sideOffset={8}
        avoidCollisions={true}
      >
        <HexColorPicker color={value || "#ffffff"} onChange={onChange} />
        <Input
          value={value || "#ffffff"}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2"
        />
      </PopoverContent>
    </Popover>
  );
}
