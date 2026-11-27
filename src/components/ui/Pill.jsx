import { Badge } from "@mantine/core";

export function Pill({ status, map, size = "md" }) {
  const s = map[status];
  if (!s) return null;
  return (
    <Badge color={s.color} size={size}>
      {s.label}
    </Badge>
  );
}
