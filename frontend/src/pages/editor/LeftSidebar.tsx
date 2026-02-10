import { useEditor } from "@/contexts/EditorContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ComponentsTab from "./ComponentsTab";
import LayersTab from "./LayersTab";
import { PlusIcon, Layers, FileText, CheckCircle2 } from "lucide-react";
import styles from "./LeftSidebar.module.scss";

export default function LeftSidebar() {
  const { state, siteDetails } = useEditor();

  if (state.editor.previewMode) return null;

  const isPublished = state.editor.visible;
  const siteName = siteDetails?.title ?? "Untitled site";
  const pageName = "Home"; // default page; can be extended for multi-page later

  const statusLabel = isPublished ? "Published" : "Draft";
  const statusClass = isPublished ? styles.published : styles.draft;

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.label}>Site</div>
        <div className={styles.siteName} title={siteName}>
          {siteName}
        </div>
        <div className={styles.pageRow}>
          <span className={styles.pageLabel}>Page</span>
          <span className={styles.pageName} title={pageName}>
            {pageName}
          </span>
        </div>
        <div className={styles.statusRow}>
          <span
            className={`${styles.statusBadge} ${statusClass}`}
            title={statusLabel}
          >
            {isPublished ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            {statusLabel}
          </span>
          {!isPublished && (
            <span className={`${styles.statusBadge} ${styles.saved}`} title="Saved">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved
            </span>
          )}
        </div>
      </div>
      <Tabs defaultValue="components" className={styles.tabs}>
        <div className={styles.tabList}>
          <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-0">
            <TabsTrigger value="components" className="w-10 h-10 m-1">
              <PlusIcon className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="layers" className="w-10 h-10 m-1">
              <Layers className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="components" className={`${styles.content} flex-1 m-0`}>
          <ComponentsTab />
        </TabsContent>
        <TabsContent value="layers" className={`${styles.content} flex-1 m-0`}>
          <LayersTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
