import {
  Alert,
  Anchor,
  Badge,
  Button,
  Drawer,
  Group,
  Skeleton,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconCheck,
  IconPhone,
  IconX,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useCancelAppointment,
  useCompleteAppointment,
} from "@/api/queries/appointments";
import { usePetOwner } from "@/api/queries/petOwners";
import { usePet } from "@/api/queries/pets";
import { fmtDateTime, maskPhone } from "@/lib/format";
import { toast } from "@/lib/notify";
import {
  APPOINTMENT_STATUS,
  PROCEDURE_COLOR,
  PROCEDURE_LABEL,
  SPECIES_LABEL,
} from "@/lib/status";
import { ConfirmDialog, Pill, SpeciesAvatar } from "@/components/ui";
import { AppointmentModal } from "./AppointmentModal";
import textStyles from "@/styles/text.module.css";

export function AppointmentDrawer({
  appointment,
  onClose,
  onRescheduled,
  petHref,
  canManage = () => true,
}) {
  const [mode, setMode] = useState(null);

  const cancel = useCancelAppointment({
    onSuccess: () => {
      toast.ok(`Agendamento de ${appointment.pet.name} cancelado.`);
      setMode(null);
      onClose();
    },
  });

  const complete = useCompleteAppointment({
    onSuccess: () => {
      toast.ok(`Agendamento de ${appointment.pet.name} concluído.`);
      onClose();
    },
  });

  return (
    <>
      <Drawer
        opened={!!appointment && !mode}
        onClose={onClose}
        title="Agendamento"
        size="md"
      >
        {appointment && (
          <AppointmentDetails
            appointment={appointment}
            petHref={petHref?.(appointment.pet)}
            canManage={canManage(appointment)}
            canComplete={!dayjs(appointment.dateTime).isAfter(dayjs())}
            completing={complete.isPending}
            onComplete={() => complete.mutate(appointment.id)}
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
        title="Cancelar agendamento"
        confirmLabel="Cancelar agendamento"
      >
        {appointment &&
          `Cancelar o agendamento de ${appointment.pet.name} em ${fmtDateTime(appointment.dateTime)}? O horário fica livre e o registro continua no histórico.`}
      </ConfirmDialog>
    </>
  );
}

const telHref = (phone = "") => `tel:${phone.replace(/\D/g, "")}`;
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function AppointmentDetails({
  appointment: a,
  petHref,
  canManage,
  canComplete,
  completing,
  onComplete,
  onReschedule,
  onCancel,
}) {
  const petQuery = usePet(a.pet.id);
  const pet = petQuery.data;
  const petOwnerQuery = usePetOwner(pet?.petOwnerId);
  const petOwner = petOwnerQuery.data;
  const loading =
    petQuery.isPending || (!!pet?.petOwnerId && petOwnerQuery.isPending);
  const when = dayjs(a.dateTime);
  const species = SPECIES_LABEL[a.pet.species] ?? a.pet.species;

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <SpeciesAvatar species={a.pet.species} size={44} />
          <div style={{ minWidth: 0 }}>
            <Text fw={600} size="lg" truncate>
              {a.pet.name}
            </Text>
            <Text size="sm" c="dimmed" truncate>
              {petOwner ? `${species} · Tutor: ${petOwner.name}` : species}
            </Text>
            {petHref && (
              <Anchor component={Link} to={petHref} size="sm">
                Ver ficha →
              </Anchor>
            )}
          </div>
        </Group>
        <Pill status={a.status} map={APPOINTMENT_STATUS} />
      </Group>

      {loading ? (
        <DetailsSkeleton />
      ) : (
        <>
          {pet?.notes && (
            <Alert
              color="red"
              variant="light"
              icon={<IconAlertTriangle size={16} />}
              p="xs"
            >
              <strong>Alerta:</strong> {pet.notes}
            </Alert>
          )}

          <div>
            <Text fw={600} size="xl" className={textStyles.tnum}>
              {capitalize(when.format("ddd, D [de] MMM · HH:mm"))}
            </Text>
            <Group gap="xs" mt="xs" wrap="nowrap">
              <Badge
                variant="light"
                color={PROCEDURE_COLOR[a.type] ?? "gray"}
                size="sm"
              >
                {PROCEDURE_LABEL[a.type] ?? a.type}
              </Badge>
              <Text size="sm" truncate>
                {a.vet.name}
              </Text>
            </Group>
          </div>

          {a.obs && (
            <div>
              <div className={textStyles.sectionLabel}>Observações</div>
              <Text size="sm" mt={4} style={{ whiteSpace: "pre-line" }}>
                {a.obs}
              </Text>
            </div>
          )}

          {petOwner && (
            <div>
              <div className={textStyles.sectionLabel}>Tutor</div>
              <Group gap="xs" mt={4} wrap="wrap">
                <Text size="sm">{petOwner.name}</Text>
                {petOwner.phone && (
                  <Anchor
                    href={telHref(petOwner.phone)}
                    size="sm"
                    className={textStyles.tnum}
                  >
                    <Group gap={4} wrap="nowrap" component="span">
                      <IconPhone size={14} />
                      {maskPhone(petOwner.phone)}
                    </Group>
                  </Anchor>
                )}
              </Group>
            </div>
          )}

          {a.status === "ACTIVE" && canManage && (
            <Stack gap="xs">
              {canComplete && (
                <Button
                  fullWidth
                  leftSection={<IconCheck size={14} />}
                  loading={completing}
                  onClick={onComplete}
                >
                  Marcar como concluído
                </Button>
              )}
              <Group grow gap="xs">
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
                  Cancelar
                </Button>
              </Group>
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}

function DetailsSkeleton() {
  return (
    <Stack gap="lg" aria-busy="true" aria-label="Carregando">
      <Stack gap={8}>
        <Skeleton height={24} width="70%" />
        <Skeleton height={20} width="50%" mt={4} />
      </Stack>
      <Stack gap={8}>
        <Skeleton height={12} width={50} />
        <Skeleton height={16} width="60%" />
      </Stack>
      <Stack gap="xs">
        <Skeleton height={36} />
        <Skeleton height={36} />
      </Stack>
    </Stack>
  );
}
