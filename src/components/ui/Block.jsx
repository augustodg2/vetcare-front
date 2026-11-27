import { Group } from "@mantine/core";
import { cx } from "@/lib/cx";
import styles from "./Block.module.css";

export function Block({ title, sub, actions, children, flush, className }) {
  return (
    <section className={cx(styles.block, className)}>
      {(title || actions) && (
        <div className={styles.head}>
          <div style={{ minWidth: 0 }}>
            {title && <h2>{title}</h2>}
            {sub && <div className={styles.sub}>{sub}</div>}
          </div>
          {actions && (
            <Group gap="xs" wrap="wrap">
              {actions}
            </Group>
          )}
        </div>
      )}
      {flush ? children : <div className={styles.body}>{children}</div>}
    </section>
  );
}
