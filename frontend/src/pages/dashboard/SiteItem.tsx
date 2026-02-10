import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MoreHorizontal, Globe, ExternalLink } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN || "localhost:5173";

interface Page {
  id: string;
  title: string;
  subdomain: string;
  updatedAt: string;
}

export default function SiteItem({ site, onDeleted }: { site: Page; onDeleted?: () => void }) {
  const handleDelete = async () => {
    const res = await api(`/sites/${site.id}`, { method: "DELETE" });
    if (res.success) {
      toast.success("Success", { description: "Site deleted successfully" });
      onDeleted?.();
    } else {
      toast.error("Error", { description: res.msg || "Failed to delete site" });
    }
  };

  const siteUrl = `/${site.subdomain}`;
  const editorUrl = `/editor/${site.id}`;
  const liveUrl = `${window.location.origin}/s/${site.subdomain}`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 group">
        <div className="flex-1">
          <Link to={editorUrl} target="_blank" rel="noopener noreferrer" className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold transition-colors group-hover:text-primary">
                {site.title}
              </h2>
              <ExternalLink className="w-4 h-4 opacity-0 transition-opacity group-hover:opacity-50" />
            </div>
          </Link>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-accent/50">
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem
              className="flex items-center gap-2 text-destructive"
              onClick={handleDelete}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center text-sm gap-x-6 gap-y-2 text-muted-foreground">
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-primary"
          >
            <Globe className="flex-shrink-0 w-4 h-4 mt-1" />
            {site.subdomain}.{ROOT_DOMAIN}
          </a>
          <div className="flex items-center gap-2">
            <span>Updated {formatTimeAgo(new Date(site.updatedAt).getTime())}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
