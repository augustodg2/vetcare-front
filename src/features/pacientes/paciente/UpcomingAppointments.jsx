import { Badge, Button, Group, Text } from "@mantine/core";
import { IconCalendar, IconPlus } from "@tabler/icons-react";
import dayjs from "dayjs";
import { parseAsInteger, useQueryState } from "nuqs";
import { useState } from "react";
import { Link } from "react-router-dom";
import { usePetAppointments } from "@/api/queries/appointments";
import { rolePath } from "@/auth/roles";
import { Async, BlockPagination, Empty } from "@/components/ui";
import { AppointmentModal } from "@/features/agenda/AppointmentModal";
import { cx } from "@/lib/cx";
import { relDay } from "@/lib/format";
import { usePatient } from "./patientRoute";
import { typeColor, typeLabel } from "./procedureType";
import styles from "./records.module.css";

export const UPCOMING_DAYS = 31;

export function UpcomingAppointments() {
  const { pet, upcomingRange: range } = usePatient();
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const upcoming = usePetAppointments({ petId: pet.id, ...range, page });
  const total = upcoming.data?.total;
  const [booking, setBooking] = useState(false);

  return (
    <>
      <AppointmentModal
        opened={booking}
        onClose={() => setBooking(false)}
        pet={pet}
        ownVet
      />
      <div className={cx(styles.tabMeta, styles.tabToolbar)}>
        <span>
          {total > 0
            ? `${total} ${total === 1 ? "agendamento" : "agendamentos"} nos próximos ${UPCOMING_DAYS} dias`
            : `Próximos ${UPCOMING_DAYS} dias`}
        </span>
        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Button
            component={Link}
            to={`${rolePath("VET", "agenda")}?v=semana&paciente=${pet.id}`}
            variant="default"
            size="xs"
            leftSection={<IconCalendar size={14} />}
          >
            Ver na agenda
          </Button>
          <Button
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={() => setBooking(true)}
          >
            Novo agendamento
          </Button>
        </Group>
      </div>
      <Async q={upcoming} rows={3}>
        {({ rows, total, pageSize }) =>
          rows.length === 0 ? (
            <Empty>
              Nenhum agendamento para este pet nos próximos {UPCOMING_DAYS}{" "}
              dias.
            </Empty>
          ) : (
            <>
              <div className={styles.procedureList}>
                {rows.map((a) => (
                  <UpcomingItem key={a.id} appointment={a} />
                ))}
              </div>
              <BlockPagination
                page={page}
                pageSize={pageSize}
                total={total}
                onChange={setPage}
              />
            </>
          )
        }
      </Async>
    </>
  );
}

function UpcomingItem({ appointment: a }) {
  const d = dayjs(a.dateTime);

  return (
    <div className={cx(styles.procedureRow, styles.appointmentRow)}>
      <div className={styles.procedureWhen}>
        <span className={styles.date}>{d.format("DD MMM")}</span>
        <span className={styles.ago}>{relDay(a.dateTime)}</span>
      </div>
      <div className={styles.procedureBody}>
        <Group gap="xs" wrap="nowrap">
          <Badge variant="light" color={typeColor(a.type)} size="sm">
            {typeLabel(a.type)}
          </Badge>
          <Text size="xs" c="dimmed" truncate>
            {d.format("ddd, HH:mm")} · {a.vet.name}
          </Text>
        </Group>
        {a.obs && <div className={styles.procedureSummary}>{a.obs}</div>}
      </div>
    </div>
  );
}
