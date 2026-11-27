import { Table } from "@mantine/core";
import { Dash } from "./Dash";
import { Empty } from "./feedback";
import { usePhone } from "./phone";
import styles from "./DataTable.module.css";

export function CellMain({ children }) {
  return <div className={styles.cellMain}>{children}</div>;
}

export function CellSub({ children }) {
  return <div className={styles.cellSub}>{children}</div>;
}

export function Num({ children }) {
  return <span className={styles.num}>{children}</span>;
}

export function DataTable({
  columns,
  rows,
  onRowClick,
  empty = "Nada por aqui.",
  mobile,
  minWidth = 640,
  fixed = false,
}) {
  const phone = usePhone();
  if (!rows.length) return <Empty>{empty}</Empty>;

  if (phone && mobile) {
    const Row = onRowClick ? "button" : "div";
    return (
      <div className={styles.rows}>
        {rows.map((r) => (
          <Row
            key={r.id}
            className={styles.row}
            onClick={onRowClick ? () => onRowClick(r) : undefined}
            type={onRowClick ? "button" : undefined}
          >
            <div className={styles.rowMain}>
              <div className={styles.rowTitle}>{mobile.title(r)}</div>
              {mobile.sub && (
                <div className={styles.cellSub}>{mobile.sub(r)}</div>
              )}
            </div>
            {mobile.side && (
              <div className={styles.rowSide}>{mobile.side(r)}</div>
            )}
          </Row>
        ))}
      </div>
    );
  }

  return (
    <Table.ScrollContainer minWidth={minWidth} type="native">
      <Table
        className={styles.table}
        highlightOnHover={!!onRowClick}
        style={fixed ? { tableLayout: "fixed" } : undefined}
      >
        <Table.Thead>
          <Table.Tr>
            {columns.map((c) => (
              <Table.Th
                key={c.key}
                className={c.num ? styles.num : undefined}
                style={c.width ? { width: c.width } : undefined}
              >
                {c.label}
              </Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {rows.map((r) => (
            <Table.Tr
              key={r.id}
              className={onRowClick ? styles.clickable : undefined}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => e.key === "Enter" && onRowClick(r)
                  : undefined
              }
            >
              {columns.map((c) => (
                <Table.Td
                  key={c.key}
                  className={c.num ? styles.num : undefined}
                >
                  {c.render ? c.render(r) : (r[c.key] ?? <Dash />)}
                </Table.Td>
              ))}
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  );
}
