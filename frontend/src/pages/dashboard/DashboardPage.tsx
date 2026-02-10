import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import DashboardSidebar from "./DashboardSidebar";
import NewSiteModal from "./NewSiteModal";
import SiteItem from "./SiteItem";
import { api } from "@/lib/api";
import { logInfo } from "@/lib/logger";
import styles from "./DashboardPage.module.scss";

interface Page {
  id: string;
  title: string;
  subdomain: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const [sites, setSites] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSites = async () => {
    const res = await api<{ sites: Page[] }>("/sites");
    if (res.success && res.sites) {
      setSites(res.sites);
    }
    setLoading(false);
  };

  useEffect(() => {
    logInfo("dashboard_view", "User viewed dashboard");
    fetchSites();
  }, []);

  return (
    <AppLayout sidebar={<DashboardSidebar />} variant="dashboard">
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Sites</h1>
          <NewSiteModal onCreated={fetchSites} />
        </div>

        <div className={styles.siteGrid}>
          {loading ? (
            <p className={styles.empty}>Loading...</p>
          ) : sites.length >= 1 ? (
            sites.map((site) => (
              <SiteItem key={site.id} site={site} onDeleted={fetchSites} />
            ))
          ) : (
            <p className={styles.empty}>It&apos;s pretty empty in here, create a site to get started.</p>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
