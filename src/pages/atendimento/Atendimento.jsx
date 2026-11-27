import { ActionIcon, Badge, Button, Menu } from "@mantine/core";
import { useInterval } from "@mantine/hooks";
import {
  IconCalendarEvent,
  IconCheck,
  IconDotsVertical,
  IconFileText,
  IconChevronRight,
  IconX,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState } from "react";
import { Link } from "react-router-dom";
import { rolePath } from "../../auth/roles";
import { useSession } from "../../auth/session";
import {
  useAppointments,
  useCancelAppointment,
  useCompleteAppointment,
} from "../../api/queries/appointments";
import { AppointmentModal } from "../../components/agenda/AppointmentModal";
import {
  Async,
  Block,
  ConfirmDialog,
  Empty,
  PageHeader,
  Pill,
  SpeciesAvatar,
} from "../../components/ui";
import { fmtDateTime } from "../../lib/format";
import { toast } from "../../lib/notify";
import { APPOINTMENT_STATUS, PROCEDURE_LABEL } from "../../lib/status";

const SLOT_MIN = 30;
const CLOCK_TICK_MS = 60_000;

const petHref = (pet) => rolePath("VET", `pacientes/${pet.id}`);

function useNow() {
  const [now, setNow] = useState(() => dayjs());
  useInterval(() => setNow(dayjs()), CLOCK_TICK_MS, { autoInvoke: true });
  return now;
}

export default function Atendimento() {
  const { user } = useSession();
  const now = useNow();
  const today = now.startOf("day");
  const [action, setAction] = useState(null);
  const closeAction = () => setAction(null);

  const appointments = useAppointments({
    vetId: user.vetId,
    from: today.toISOString(),
    to: today.add(1, "day").toISOString(),
  });
  const cancel = useCancelAppointment({
    onSuccess: () => {
      toast.ok(`Consulta de ${action.appointment.pet.name} cancelada.`);
      closeAction();
    },
  });
  const complete = useCompleteAppointment({
    onSuccess: (done) => toast.ok(`Consulta de ${done.pet.name} concluída.`),
  });
  const onAction = (type, appointment) =>
    type === "complete"
      ? complete.mutate(appointment.id)
      : setAction({ type, appointment });

  const all = [...(appointments.data ?? [])].sort((a, b) =>
    a.dateTime.localeCompare(b.dateTime),
  );
  const rows = all.filter((a) => a.status !== "CANCELLED");
  const isPast = (a) =>
    a.status !== "ACTIVE" ||
    !dayjs(a.dateTime).add(SLOT_MIN, "minute").isAfter(now);
  const upcoming = all.filter((a) => !isPast(a));
  const past = all.filter(isPast).reverse();

  const count =
    appointments.data === undefined
      ? ""
      : ` · ${rows.length} ${rows.length === 1 ? "consulta" : "consultas"}`;

  return (
    <>
      <PageHeader
        title="Atendimento"
        finding={`${now.format("dddd, D [de] MMMM")}${count}`}
      />

      <AppointmentModal
        opened={action?.type === "reschedule"}
        onClose={closeAction}
        appointment={action?.appointment}
        onSaved={closeAction}
      />
      <ConfirmDialog
        opened={action?.type === "cancel"}
        onClose={closeAction}
        onConfirm={() => cancel.mutate(action.appointment.id)}
        loading={cancel.isPending}
        title="Cancelar consulta"
        confirmLabel="Cancelar consulta"
      >
        {action?.appointment &&
          `Cancelar a consulta de ${action.appointment.pet.name} em ${fmtDateTime(action.appointment.dateTime)}? O horário fica livre e o registro continua no histórico.`}
      </ConfirmDialog>

      <div className="today-grid">
        <Block title="Próximas" flush>
          <Async q={appointments} rows={3}>
            {() =>
              upcoming.length === 0 ? (
                <Empty>Nenhuma consulta na fila.</Empty>
              ) : (
                upcoming.map((a, i) => (
                  <QueueRow
                    key={a.id}
                    appointment={a}
                    now={now}
                    highlight={i === 0}
                    onAction={onAction}
                  />
                ))
              )
            }
          </Async>
        </Block>

        <Block title="Histórico do dia" flush>
          <Async q={appointments} rows={3}>
            {() =>
              past.length === 0 ? (
                <Empty>Nenhuma consulta passou ainda.</Empty>
              ) : (
                past.map((a) => (
                  <QueueRow
                    key={a.id}
                    appointment={a}
                    now={now}
                    past
                    onAction={onAction}
                  />
                ))
              )
            }
          </Async>
        </Block>
      </div>
    </>
  );
}

function QueueRow({ appointment: a, now, highlight, past, onAction }) {
  const d = dayjs(a.dateTime);
  const inProgress = !past && !d.isAfter(now);
  const minutes = d.diff(now, "minute");
  const when = inProgress
    ? "Agora"
    : !past && minutes < 60
      ? `Em ${minutes} min`
      : null;

  return (
    <div
      className={`today-row${highlight ? " active" : ""}${past ? " past" : ""}${a.status === "CANCELLED" ? " cancelled" : ""}`}
    >
      <span className="time">{d.format("HH:mm")}</span>
      <span className="today-main">
        <SpeciesAvatar species={a.pet.species} size={40} />
        <span className="today-text">
          <span className="today-pet">{a.pet.name}</span>
          <span className="today-type">{PROCEDURE_LABEL[a.type]}</span>
          {a.obs && <span className="today-obs">{a.obs}</span>}
        </span>
      </span>
      {when ? (
        <Badge variant="light" color={inProgress ? "teal" : "blue"}>
          {when}
        </Badge>
      ) : (
        <Pill status={a.status} map={APPOINTMENT_STATUS} size="sm" />
      )}
      {past ? (
        <span />
      ) : (
        <Button
          component={Link}
          to={petHref(a.pet)}
          variant="default"
          size="xs"
          rightSection={<IconChevronRight size={14} />}
        >
          Ver ficha
        </Button>
      )}
      <Menu position="bottom-end" shadow="md" withinPortal>
        <Menu.Target>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label={`Mais ações para ${a.pet.name}`}
          >
            <IconDotsVertical size={16} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          {past && (
            <Menu.Item
              component={Link}
              to={petHref(a.pet)}
              leftSection={<IconFileText size={14} />}
            >
              Ver ficha
            </Menu.Item>
          )}
          {a.status === "ACTIVE" && (
            <>
              {!d.isAfter(now) && (
                <Menu.Item
                  leftSection={<IconCheck size={14} />}
                  onClick={() => onAction("complete", a)}
                >
                  Marcar como concluída
                </Menu.Item>
              )}
              <Menu.Item
                leftSection={<IconCalendarEvent size={14} />}
                onClick={() => onAction("reschedule", a)}
              >
                Remarcar
              </Menu.Item>
              <Menu.Item
                color="red"
                leftSection={<IconX size={14} />}
                onClick={() => onAction("cancel", a)}
              >
                Cancelar consulta
              </Menu.Item>
            </>
          )}
        </Menu.Dropdown>
      </Menu>
    </div>
  );
}
