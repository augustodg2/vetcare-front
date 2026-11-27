import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from "@tabler/icons-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { cx } from "@/lib/cx";
import styles from "./Sidebar.module.css";

const STORAGE_KEY = "vc-sidebar-collapsed";

export function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const toggle = () =>
    setCollapsed((c) => {
      try {
        localStorage.setItem(STORAGE_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });
  return [collapsed, toggle];
}

export default function Sidebar({ items, collapsed, onToggle, footer }) {
  const toggleLabel = collapsed
    ? "Expandir barra lateral"
    : "Recolher barra lateral";

  const toggle = (
    <button
      type="button"
      className={cx(styles.sideButton, styles.sideToggle)}
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-label={toggleLabel}
      title={toggleLabel}
    >
      {collapsed ? (
        <IconLayoutSidebarLeftExpand size={18} stroke={1.8} />
      ) : (
        <IconLayoutSidebarLeftCollapse size={18} stroke={1.8} />
      )}
    </button>
  );

  return (
    <aside className={cx(styles.sidebar, collapsed && styles.collapsed)}>
      {collapsed && toggle}
      <div className={styles.clinic}>
        <img src="/favicon.svg" alt="" />
        <div className={styles.txt}>
          <div className={styles.clinicName}>VetCare</div>
          <div className={styles.clinicSub}>Clínica veterinária</div>
        </div>
        {!collapsed && toggle}
      </div>
      <div className={styles.navLabel}>Menu principal</div>
      <nav aria-label="Menu principal">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={styles.navLink}
            title={collapsed ? label : undefined}
          >
            <Icon size={16} stroke={1.8} />
            <span className={styles.txt}>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div style={{ flex: 1 }} />

      {footer}
    </aside>
  );
}
