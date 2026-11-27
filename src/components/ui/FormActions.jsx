import { Button, Group } from "@mantine/core";

export function FormActions({ onCancel, submitLabel, loading, extra }) {
  return (
    <Group justify="flex-end" mt="lg" gap="sm">
      {extra}
      <Button variant="default" onClick={onCancel}>
        Cancelar
      </Button>
      <Button type="submit" loading={loading}>
        {submitLabel}
      </Button>
    </Group>
  );
}
