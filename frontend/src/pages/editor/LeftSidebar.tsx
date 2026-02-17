import { useState } from "react";
import { useEditor } from "@/contexts/EditorContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import ComponentsTab from "./ComponentsTab";
import LayersTab from "./LayersTab";
import { PlusIcon, Layers, FileText, CheckCircle2, FilePlus2 } from "lucide-react";
import styles from "./LeftSidebar.module.scss";

export default function LeftSidebar() {
  const { state, siteDetails, pages, switchPage, addPage } = useEditor();
  const [addPageOpen, setAddPageOpen] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState("");

  if (state.editor.previewMode) return null;

  const isPublished = state.editor.visible;
  const siteName = siteDetails?.title ?? "Untitled site";
  const currentPageId = state.editor.currentPageId;
  const currentPageName =
    currentPageId === "home"
      ? "Home"
      : pages.find((p) => p.id === currentPageId)?.title ?? "Home";

  const statusLabel = isPublished ? "Published" : "Draft";
  const statusClass = isPublished ? styles.published : styles.draft;

  const handleAddPage = async () => {
    const title = newPageTitle.trim() || "New Page";
    await addPage(title);
    setNewPageTitle("");
    setAddPageOpen(false);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.label}>Site</div>
        <div className={styles.siteName} title={siteName}>
          {siteName}
        </div>
        <div className={styles.pageSection}>
          <div className={styles.pageLabel}>Pages</div>
          <div className={styles.pageList}>
            <button
              type="button"
              className={`${styles.pageItem} ${currentPageId === "home" ? styles.pageItemActive : ""}`}
              onClick={() => switchPage("home")}
            >
              Home
            </button>
            {pages.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`${styles.pageItem} ${currentPageId === p.id ? styles.pageItemActive : ""}`}
                onClick={() => switchPage(p.id)}
              >
                {p.title}
              </button>
            ))}
            <Dialog open={addPageOpen} onOpenChange={setAddPageOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className={styles.addPageBtn}>
                  <FilePlus2 className="w-3.5 h-3.5" />
                  Add page
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[340px]">
                <DialogHeader>
                  <DialogTitle>Add new page</DialogTitle>
                </DialogHeader>
                <Input
                  placeholder="Page title"
                  value={newPageTitle}
                  onChange={(e) => setNewPageTitle(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddPage()}
                />
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setAddPageOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddPage}>Add</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <div className={styles.pageRow}>
          <span className={styles.pageLabel}>Current</span>
          <span className={styles.pageName} title={currentPageName}>
            {currentPageName}
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
