import { Group } from "@mantine/core";

export function PageHeader({ title, finding, children }) {
  return (
    <div className="page-head">
      <div style={{ minWidth: 0 }}>
        <h1>{title}</h1>
        {finding && <p className="finding">{finding}</p>}
      </div>
      {children && (
        <Group gap="sm" wrap="wrap">
          {children}
        </Group>
      )}
    </div>
  );
}
