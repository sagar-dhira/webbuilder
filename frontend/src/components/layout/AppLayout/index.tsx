import React from "react";
import styles from "./AppLayout.module.scss";
import { cn } from "@/lib/utils";

// Extensible layout - add new slots as needed without breaking existing layouts
export interface AppLayoutProps {
  /** Optional header slot - add new features here */
  header?: React.ReactNode;
  /** Optional left sidebar - for dashboard or editor */
  sidebar?: React.ReactNode;
  /** Optional left slot for editor (components panel) */
  leftSlot?: React.ReactNode;
  /** Main content - required */
  children: React.ReactNode;
  /** Optional right slot for editor (settings panel) */
  rightSlot?: React.ReactNode;
  /** Layout variant */
  variant?: "default" | "dashboard" | "editor";
  className?: string;
}

export function AppLayout({
  header,
  sidebar,
  leftSlot,
  children,
  rightSlot,
  variant = "default",
  className,
}: AppLayoutProps) {
  return (
    <div className={cn(styles.root, className)}>
      {header && <header className={styles.header}>{header}</header>}

      <div className={styles.body}>
        {sidebar && <aside className={styles.sidebar}>{sidebar}</aside>}
        {leftSlot && <div className={styles.leftSlot}>{leftSlot}</div>}
        <main className={styles.main}>{children}</main>
        {rightSlot && <div className={styles.rightSlot}>{rightSlot}</div>}
      </div>
    </div>
  );
}
