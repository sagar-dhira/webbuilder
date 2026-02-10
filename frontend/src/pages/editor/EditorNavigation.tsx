import { Link } from "react-router-dom";
import { useEditor } from "@/contexts/EditorContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { logInfo } from "@/lib/logger";
import { toast } from "sonner";
import {
  ChevronLeft,
  Eye,
  Loader2,
  Redo2,
  Undo2,
  Laptop,
  Tablet,
  Smartphone,
} from "lucide-react";
import { useState, useEffect } from "react";
import styles from "./EditorNavigation.module.scss";

const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN || "localhost:5173";

export default function EditorNavigation() {
  const { state, dispatch, siteDetails, siteId } = useEditor();

  useEffect(() => {
    if (siteId) dispatch({ type: "SET_SITE_ID", payload: { siteId } });
  }, [siteId, dispatch]);
  const [titleLoading, setTitleLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleTitleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value?.trim();
    if (!val || val === siteDetails?.title) return;
    setTitleLoading(true);
    const res = await api(`/sites/${siteDetails?.id}`, {
      method: "PUT",
      body: JSON.stringify({ title: val }),
    });
    setTitleLoading(false);
    if (res.success) toast.success("Title updated");
    else toast.error(res.msg);
  };

  const handlePreview = () => {
    dispatch({ type: "TOGGLE_PREVIEW_MODE" });
    dispatch({ type: "TOGGLE_LIVE_MODE", payload: { value: true } });
  };

  const handleVisibilityToggle = async (checked: boolean) => {
    dispatch({ type: "TOGGLE_VISIBILITY_STATUS", payload: { value: checked } });
    const res = await api(`/sites/${siteDetails?.id}`, {
      method: "PUT",
      body: JSON.stringify({ visible: checked }),
    });
    if (!res.success) {
      dispatch({ type: "TOGGLE_VISIBILITY_STATUS", payload: { value: !checked } });
      toast.error(res.msg);
    } else {
      toast.success(checked ? "Site is now public" : "Site is now private");
    }
  };

  const handleSave = async () => {
    logInfo("editor_save", "User saved site", { siteId: siteDetails?.id });
    setIsSaving(true);
    const res = await api(`/sites/${siteDetails?.id}`, {
      method: "PUT",
      body: JSON.stringify({ content: JSON.stringify(state.editor.elements) }),
    });
    setIsSaving(false);
    if (res.success) toast.success("Changes saved");
    else toast.error(res.msg);
  };

  const isHidden = state.editor.previewMode;

  return (
    <nav className={`${styles.nav} ${isHidden ? styles.hidden : ""}`}>
      <aside className={styles.left}>
        <Link to="/dashboard">
          <Button variant="ghost" size="icon">
            <ChevronLeft />
          </Button>
        </Link>
        <div className="flex flex-col w-full">
          <div className="flex items-center gap-2">
            <Input
              defaultValue={siteDetails?.title}
              className="border-none max-w-[7rem] p-0 h-5 m-0 text-lg"
              onBlur={handleTitleBlur}
            />
            {titleLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <a
            href={`${window.location.origin}/s/${siteDetails?.subdomain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            {siteDetails?.subdomain}.{ROOT_DOMAIN}
          </a>
        </div>
      </aside>

      <aside>
        <Tabs
          value={state.editor.device}
          onValueChange={(v) => dispatch({ type: "CHANGE_DEVICE", payload: { device: v as "Desktop" | "Tablet" | "Mobile" } })}
        >
          <TabsList className="bg-transparent grid grid-cols-3 h-fit">
            <TabsTrigger value="Desktop" className="w-10 h-10 p-0 data-[state=active]:bg-muted">
              <Laptop />
            </TabsTrigger>
            <TabsTrigger value="Tablet" className="w-10 h-10 p-0 data-[state=active]:bg-muted">
              <Tablet />
            </TabsTrigger>
            <TabsTrigger value="Mobile" className="w-10 h-10 p-0 data-[state=active]:bg-muted">
              <Smartphone />
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </aside>

      <aside className={styles.right}>
        <Button variant="ghost" size="icon" onClick={handlePreview}>
          <Eye />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => dispatch({ type: "UNDO" })}
          disabled={state.history.currentIndex <= 0}
        >
          <Undo2 />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => dispatch({ type: "REDO" })}
          disabled={state.history.currentIndex >= state.history.history.length - 1}
        >
          <Redo2 />
        </Button>
        <div className="flex items-center gap-2 mx-4">
          Draft <Switch checked={state.editor.visible} onCheckedChange={handleVisibilityToggle} /> Public
        </div>
        <Button onClick={handleSave} disabled={isSaving} className="w-[67px]">
          {isSaving ? <Loader2 className="animate-spin" /> : "Save"}
        </Button>
      </aside>
    </nav>
  );
}
