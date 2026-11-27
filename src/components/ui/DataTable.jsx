import { Table } from "@mantine/core";
import { Dash } from "./Dash";
import { Empty } from "./feedback";
import { usePhone } from "./phone";

/**
 * Tabela que no celular vira lista de duas linhas.
 * columns: [{ key, label, render(row), num, width }]
 * mobile: { title(row), sub(row), side(row) }
 */
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
      <div className="mrows">
        {rows.map((r) => (
          <Row
            key={r.id}
            className="mrow"
            onClick={onRowClick ? () => onRowClick(r) : undefined}
            type={onRowClick ? "button" : undefined}
          >
            <div className="mrow-main">
              <div className="mrow-title">{mobile.title(r)}</div>
              {mobile.sub && <div className="cell-sub">{mobile.sub(r)}</div>}
            </div>
            {mobile.side && <div className="mrow-side">{mobile.side(r)}</div>}
          </Row>
        ))}
      </div>
    );
  }

  return (
    <Table.ScrollContainer minWidth={minWidth} type="native">
      <Table
        className="vc-table"
        highlightOnHover={!!onRowClick}
        style={fixed ? { tableLayout: "fixed" } : undefined}
      >
        <Table.Thead>
          <Table.Tr>
            {columns.map((c) => (
              <Table.Th
                key={c.key}
                className={c.num ? "num" : undefined}
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
              className={onRowClick ? "clickable" : undefined}
              onClick={onRowClick ? () => onRowClick(r) : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => e.key === "Enter" && onRowClick(r)
                  : undefined
              }
            >
              {columns.map((c) => (
                <Table.Td key={c.key} className={c.num ? "num" : undefined}>
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
