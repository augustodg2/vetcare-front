import { Button, Drawer, Group, Stack, Text } from "@mantine/core";
import { IconX } from "@tabler/icons-react";
import { useState } from "react";
import { useCancelAppointment } from "../../api/queries/appointments";
import { fmtDateTime } from "../../lib/format";
import { toast } from "../../lib/notify";
import { APPOINTMENT_STATUS, PROCEDURE_LABEL } from "../../lib/status";
import { ConfirmDialog, Facts, Pill } from "../ui";

export function AppointmentDrawer({ appointment, onClose }) {
  return (
    <Drawer opened={!!appointment} onClose={onClose} title="Consulta" size="md">
      {appointment && (
        <AppointmentDetails appointment={appointment} onClose={onClose} />
      )}
    </Drawer>
  );
}

function AppointmentDetails({ appointment: a, onClose }) {
  const [confirming, setConfirming] = useState(false);
  const cancel = useCancelAppointment({
    onSuccess: () => {
      toast.ok(`Consulta de ${a.pet.name} cancelada.`);
      setConfirming(false);
      onClose();
    },
  });

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Text fw={600} size="lg">
          {a.pet.name}
        </Text>
        <Pill status={a.status} map={APPOINTMENT_STATUS} />
      </Group>

      <Facts
        items={[
          ["Data e hora", fmtDateTime(a.dateTime)],
          ["Tipo", PROCEDURE_LABEL[a.type]],
          ["Veterinário", a.vet.name],
          ["Observações", a.obs],
        ]}
      />

      {a.status === "ACTIVE" && (
        <Group justify="flex-end">
          <Button
            color="red"
            variant="default"
            leftSection={<IconX size={14} />}
            onClick={() => setConfirming(true)}
          >
            Cancelar consulta
          </Button>
        </Group>
      )}

      <ConfirmDialog
        opened={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => cancel.mutate(a.id)}
        loading={cancel.isPending}
        title="Cancelar consulta"
        confirmLabel="Cancelar consulta"
      >
        Cancelar a consulta de {a.pet.name} em {fmtDateTime(a.dateTime)}? O
        horário fica livre e o registro continua no histórico.
      </ConfirmDialog>
    </Stack>
  );
}
