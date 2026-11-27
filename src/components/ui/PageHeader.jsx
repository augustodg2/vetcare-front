import { Group } from "@mantine/core";
import styles from "./PageHeader.module.css";

export function PageHeader({ title, finding, children }) {
  return (
    <div className={styles.header}>
      <div style={{ minWidth: 0 }}>
        <h1>{title}</h1>
        {finding && <p className={styles.finding}>{finding}</p>}
      </div>
      {children && (
        <Group gap="sm" wrap="wrap">
          {children}
        </Group>
      )}
    </div>
  );
}
