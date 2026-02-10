import { useEditor } from "@/contexts/EditorContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SettingsTab from "./SettingsTab";
import { Settings } from "lucide-react";
import { cn } from "@/lib/utils";

export default function RightSidebar() {
  const { state } = useEditor();

  if (state.editor.previewMode) return null;

  const hasSelection = state.editor.selectedElement.type !== null;

  return (
    <div
      className={cn(
        "mt-[65px] w-80 min-w-80 border-l border-border bg-sidebar-background",
        !hasSelection && "translate-x-full"
      )}
    >
      <Tabs defaultValue="settings" className="flex flex-col flex-1">
        <div className="flex gap-4 p-2 border-b border-border">
          <TabsList className="flex items-center gap-4 bg-transparent">
            <TabsTrigger
              value="settings"
              className="h-10 px-4 data-[state=active]:bg-muted rounded-md flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span className="text-xs">Settings</span>
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="settings" className="flex-1 overflow-auto max-h-[calc(100vh-160px)]">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
