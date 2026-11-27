import { Button } from "@mantine/core";
import { IconPencil } from "@tabler/icons-react";

export function EditButton({ onClick, label, style }) {
  return (
    <Button
      variant="default"
      size="xs"
      leftSection={<IconPencil size={14} />}
      onClick={onClick}
      aria-label={label}
      style={{ flexShrink: 0, ...style }}
    >
      Editar
    </Button>
  );
}
