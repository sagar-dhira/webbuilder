import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { EditorProvider, useEditor } from "@/contexts/EditorContext";
import { api } from "@/lib/api";
import { logInfo } from "@/lib/logger";
import EditorNavigation from "./EditorNavigation";
import SiteEditor from "./SiteEditor";
import LeftSidebar from "./LeftSidebar";
import RightSidebar from "./RightSidebar";
import { Button } from "@/components/ui/button";
import styles from "./EditorPage.module.scss";

function EditorContent() {
  const { siteId } = useParams<{ siteId: string }>();
  const [siteDetails, setSiteDetails] = useState<{
    id: string;
    title: string;
    subdomain: string;
    visible: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!siteId) return;
    api<{ site: { id: string; title: string; subdomain: string; visible: boolean } }>(`/sites/${siteId}`).then(
      (res) => {
        if (res.success && res.site) {
          setSiteDetails(res.site);
          logInfo("editor_open", "User opened editor", { siteId });
        } else {
          setError(res.msg || "Site not found");
        }
        setLoading(false);
      }
    );
  }, [siteId]);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (error || !siteDetails) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <h1 className="text-xl">{error || "Site not found"}</h1>
        <Button asChild>
          <Link to="/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <EditorProvider siteId={siteId!} siteDetails={siteDetails}>
      <AppLayout
        variant="editor"
        header={<EditorNavigation />}
        leftSlot={<LeftSidebar />}
        rightSlot={<RightSidebar />}
      >
        <SiteEditor siteId={siteId!} />
      </AppLayout>
    </EditorProvider>
  );
}

export default function EditorPage() {
  return <EditorContent />;
}
