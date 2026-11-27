import { Skeleton } from "@mantine/core";
import styles from "./Kpis.module.css";

export function Kpis({ items }) {
  return (
    <div className={styles.kpis} style={{ "--n": items.length }}>
      {items.map((k) => (
        <div className={styles.kpi} key={k.label}>
          <div className={styles.label}>{k.label}</div>
          <div className={styles.value}>{k.value}</div>
          {k.hint && <div className={styles.hint}>{k.hint}</div>}
        </div>
      ))}
    </div>
  );
}

export function KpisLoading({ n = 4 }) {
  return (
    <div className={styles.kpis} style={{ "--n": n }}>
      {Array.from({ length: n }, (_, i) => (
        <div className={styles.kpi} key={i}>
          <Skeleton height={12} width="50%" />
          <Skeleton height={24} width="70%" mt={10} />
        </div>
      ))}
    </div>
  );
}
