import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { EditorProvider } from "@/contexts/EditorContext";
import { api } from "@/lib/api";
import SiteEditor from "../editor/SiteEditor";

export default function SiteViewPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [data, setData] = useState<{
    site?: { id: string; title: string; subdomain: string; visible: boolean; content?: string };
    private?: boolean;
    msg?: string;
  } | null>(null);

  useEffect(() => {
    if (!subdomain) return;
    api<{ site?: unknown; private?: boolean; msg?: string }>(`/site/${subdomain}`).then((res) => {
      setData(res as typeof data);
    });
  }, [subdomain]);

  if (!data) return <div className="flex items-center justify-center w-screen h-screen">Loading...</div>;

  if (data.private) {
    return (
      <div className="flex items-center justify-center w-screen h-screen">
        <h1 className="text-xl font-medium">{data.msg || "This site is private."}</h1>
      </div>
    );
  }

  if (!data.site) {
    return (
      <div className="flex items-center justify-center w-screen h-screen">
        <h1 className="text-xl font-medium">Site not found</h1>
      </div>
    );
  }

  const site = data.site;

  return (
    <EditorProvider siteId={site.id} siteDetails={site}>
      <SiteEditor siteId={site.id} liveMode initialContent={site.content} />
    </EditorProvider>
  );
}
