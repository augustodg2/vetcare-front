import { Button, Drawer, Group, Stack, Text } from "@mantine/core";
import { IconCalendarEvent, IconFileText, IconX } from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useCancelAppointment } from "../../api/queries/appointments";
import { fmtDateTime } from "../../lib/format";
import { toast } from "../../lib/notify";
import { APPOINTMENT_STATUS, PROCEDURE_LABEL } from "../../lib/status";
import { ConfirmDialog, Facts, Pill } from "../ui";
import { AppointmentModal } from "./AppointmentModal";

export function AppointmentDrawer({
  appointment,
  onClose,
  onRescheduled,
  petHref,
}) {
  const [mode, setMode] = useState(null);

  const cancel = useCancelAppointment({
    onSuccess: () => {
      toast.ok(`Consulta de ${appointment.pet.name} cancelada.`);
      setMode(null);
      onClose();
    },
  });

  return (
    <>
      <Drawer
        opened={!!appointment && !mode}
        onClose={onClose}
        title="Consulta"
        size="md"
      >
        {appointment && (
          <AppointmentDetails
            appointment={appointment}
            petHref={petHref?.(appointment.pet)}
            onReschedule={() => setMode("reschedule")}
            onCancel={() => setMode("cancel")}
          />
        )}
      </Drawer>

      <AppointmentModal
        opened={mode === "reschedule"}
        onClose={() => setMode(null)}
        appointment={appointment}
        onSaved={(saved) => {
          setMode(null);
          onRescheduled?.(saved);
          onClose();
        }}
      />

      <ConfirmDialog
        opened={mode === "cancel"}
        onClose={() => setMode(null)}
        onConfirm={() => cancel.mutate(appointment.id)}
        loading={cancel.isPending}
        title="Cancelar consulta"
        confirmLabel="Cancelar consulta"
      >
        {appointment &&
          `Cancelar a consulta de ${appointment.pet.name} em ${fmtDateTime(appointment.dateTime)}? O horário fica livre e o registro continua no histórico.`}
      </ConfirmDialog>
    </>
  );
}

function AppointmentDetails({
  appointment: a,
  petHref,
  onReschedule,
  onCancel,
}) {
  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start">
        <Text fw={600} size="lg">
          {a.pet.name}
        </Text>
        <Pill status={a.status} map={APPOINTMENT_STATUS} />
      </Group>

      {petHref && (
        <Button
          component={Link}
          to={petHref}
          variant="light"
          leftSection={<IconFileText size={14} />}
        >
          Ver ficha do pet
        </Button>
      )}

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
            variant="default"
            leftSection={<IconCalendarEvent size={14} />}
            onClick={onReschedule}
          >
            Remarcar
          </Button>
          <Button
            color="red"
            variant="default"
            leftSection={<IconX size={14} />}
            onClick={onCancel}
          >
            Cancelar consulta
          </Button>
        </Group>
      )}
    </Stack>
  );
}
