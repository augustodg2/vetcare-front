import { Skeleton } from "@mantine/core";

// Indicadores num contêiner só, divididos por linhas finas
export function Kpis({ items }) {
  return (
    <div className="kpis" style={{ "--n": items.length }}>
      {items.map((k) => (
        <div className="kpi" key={k.label}>
          <div className="kpi-label">{k.label}</div>
          <div className="kpi-value">{k.value}</div>
          {k.hint && (
            <div className={`kpi-hint ${k.trend ?? ""}`}>{k.hint}</div>
          )}
        </div>
      ))}
    </div>
  );
}

export function KpisLoading({ n = 4 }) {
  return (
    <div className="kpis" style={{ "--n": n }}>
      {Array.from({ length: n }, (_, i) => (
        <div className="kpi" key={i}>
          <Skeleton height={12} width="50%" />
          <Skeleton height={24} width="70%" mt={10} />
        </div>
      ))}
    </div>
  );
}
