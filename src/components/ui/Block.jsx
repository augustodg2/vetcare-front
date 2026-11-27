import { Group, Pagination, Text } from "@mantine/core";
import { forwardRef } from "react";
import { cx } from "@/lib/cx";
import styles from "./Block.module.css";

export const Block = forwardRef(function Block(
  { title, sub, actions, children, flush, className, ...rest },
  ref,
) {
  return (
    <section ref={ref} className={cx(styles.block, className)} {...rest}>
      {(title || actions) && (
        <BlockHead>
          <div style={{ minWidth: 0 }}>
            {title && <h2>{title}</h2>}
            {sub && <BlockSub>{sub}</BlockSub>}
          </div>
          {actions && (
            <Group gap="xs" wrap="wrap">
              {actions}
            </Group>
          )}
        </BlockHead>
      )}
      {flush ? children : <BlockBody>{children}</BlockBody>}
    </section>
  );
});

export function BlockHead({ className, children }) {
  return <div className={cx(styles.head, className)}>{children}</div>;
}

export function BlockSub({ children }) {
  return <div className={styles.sub}>{children}</div>;
}

export function BlockBody({ className, children }) {
  return <div className={cx(styles.body, className)}>{children}</div>;
}

export function BlockFoot({ children }) {
  return <div className={styles.foot}>{children}</div>;
}

export function BlockPagination({ page, pageSize, total, onChange }) {
  if (!pageSize || total <= pageSize) return null;
  return (
    <BlockFoot>
      <Text size="sm" c="dimmed">
        {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)} de{" "}
        {total}
      </Text>
      <Pagination
        value={page}
        onChange={onChange}
        total={Math.ceil(total / pageSize)}
        size="sm"
      />
    </BlockFoot>
  );
}
