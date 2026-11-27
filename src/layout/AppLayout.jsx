import { ActionIcon, Button, Drawer, Stack, Text } from "@mantine/core";
import { IconLogout, IconMenu2 } from "@tabler/icons-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ROLES } from "@/auth/roles";
import { useSession } from "@/auth/session";
import { PersonAvatar } from "@/components/ui";
import PageBoundary from "./PageBoundary";
import Sidebar, { useSidebarCollapsed } from "./Sidebar";
import { cx } from "@/lib/cx";
import styles from "./AppLayout.module.css";

export default function AppLayout() {
  const { user, logout } = useSession();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const { label: roleLabel, nav: items } = ROLES[user.role];
  const [collapsed, toggleCollapsed] = useSidebarCollapsed();

  const signOut = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const userRow = (
    <div className={styles.userRow}>
      <PersonAvatar name={user.name} size={32} />
      <div className={styles.who}>
        <Text size="sm" fw={500}>
          {user.name}
        </Text>
        <Text size="xs" c="dimmed">
          {roleLabel}
        </Text>
      </div>
      <ActionIcon
        variant="subtle"
        color="gray"
        onClick={signOut}
        aria-label="Sair"
      >
        <IconLogout size={17} />
      </ActionIcon>
    </div>
  );

  return (
    <div className={cx(styles.shell, collapsed && styles.collapsed)}>
      <Sidebar
        items={items}
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        footer={userRow}
      />

      <header className={styles.topbar}>
        <div className={styles.brand}>
          <img src="/favicon.svg" alt="" />
          VetCare
        </div>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          onClick={() => setMenu(true)}
          aria-label="Abrir menu"
        >
          <IconMenu2 size={20} />
        </ActionIcon>
      </header>

      <main className={styles.main}>
        <div className={styles.content}>
          <PageBoundary>
            <Outlet />
          </PageBoundary>
        </div>
      </main>

      <nav className={styles.bottomNav} aria-label="Navegação">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}>
            <Icon size={20} stroke={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      <Drawer
        opened={menu}
        onClose={() => setMenu(false)}
        title="Menu"
        size="85%"
      >
        <Stack gap="xs">
          {userRow}
          <Button
            variant="light"
            color="red"
            leftSection={<IconLogout size={16} />}
            onClick={signOut}
          >
            Sair
          </Button>
        </Stack>
      </Drawer>
    </div>
  );
}
