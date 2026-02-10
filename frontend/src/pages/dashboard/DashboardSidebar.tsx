import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { SquareDashedMousePointer, LayoutDashboard, Globe, LogOut } from "lucide-react";
import styles from "./DashboardSidebar.module.scss";

export default function DashboardSidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <SquareDashedMousePointer className="w-5 h-5" />
          </div>
          <div>
            <div className={styles.brandText}>Framely</div>
            <div className={styles.brandSub}>Dashboard</div>
          </div>
        </div>
      </div>

      <nav className={styles.content}>
        <div className={styles.navGroup}>
          <div className={styles.navLabel}>Application</div>
          <Link to="/dashboard" className={styles.navItem}>
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </Link>
          <Link to="/dashboard" className={styles.navItem}>
            <Globe className="w-4 h-4" />
            Sites
          </Link>
        </div>
      </nav>

      <footer className={styles.footer}>
        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <div className="text-sm font-medium truncate">{user?.name || user?.email}</div>
            <div className={styles.userEmail}>{user?.email}</div>
          </div>
          <Button variant="ghost" size="icon" onClick={logout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </footer>
    </aside>
  );
}
