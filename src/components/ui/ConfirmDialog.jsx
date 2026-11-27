import { Button, Group, Modal, Text } from "@mantine/core";

export function ConfirmDialog({
  opened,
  title,
  children,
  confirmLabel = "Excluir",
  color = "red",
  onConfirm,
  onClose,
  loading,
}) {
  return (
    <Modal opened={opened} onClose={onClose} title={title} size="sm">
      <Text size="sm">{children}</Text>
      <Group justify="flex-end" mt="lg">
        <Button variant="default" onClick={onClose}>
          Voltar
        </Button>
        <Button color={color} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </Group>
    </Modal>
  );
}
