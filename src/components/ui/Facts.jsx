import { Dash } from "./Dash";
import styles from "./Facts.module.css";

// Par chave/valor para fichas e detalhes
export function Facts({ items }) {
  return (
    <div className={styles.facts}>
      {items.map(([k, v]) => (
        <div className={styles.fact} key={k}>
          <div className={styles.label}>{k}</div>
          <div className={styles.value}>{v ?? <Dash />}</div>
        </div>
      ))}
    </div>
  );
}
