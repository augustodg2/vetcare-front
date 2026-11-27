import {
  ActionIcon,
  Button,
  Drawer,
  Group,
  Pagination,
  Stack,
  Text,
} from "@mantine/core";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { usePetAppointments } from "../../api/queries/appointments";
import { fmtDateTime } from "../../lib/format";
import { APPOINTMENT_STATUS, PROCEDURE_LABEL } from "../../lib/status";
import { Async, Empty, Pill } from "../ui";
import { AppointmentModal } from "./AppointmentModal";

const thisMonth = () => dayjs().startOf("month");

export function PetHistoryDrawer({ pet, onClose }) {
  const [month, setMonth] = useState(thisMonth);
  const [page, setPage] = useState(1);
  const [booking, setBooking] = useState(false);
  const petId = pet?.id;

  useEffect(() => {
    setMonth(thisMonth());
    setPage(1);
    setBooking(false);
  }, [petId]);

  return (
    <>
      <Drawer
        opened={!!pet && !booking}
        onClose={onClose}
        title="Histórico de agendamentos"
        size="md"
      >
        {pet && (
          <PetHistory
            pet={pet}
            month={month}
            onMonth={(m) => {
              setMonth(m);
              setPage(1);
            }}
            page={page}
            onPage={setPage}
            onBook={() => setBooking(true)}
          />
        )}
      </Drawer>

      <AppointmentModal
        opened={booking}
        onClose={() => setBooking(false)}
        pet={pet}
      />
    </>
  );
}

function PetHistory({ pet, month, onMonth, page, onPage, onBook }) {
  const history = usePetAppointments({
    petId: pet.id,
    from: month.toISOString(),
    to: month.add(1, "month").toISOString(),
    order: "desc",
    page,
  });

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <div>
          <Text fw={600} size="lg">
            {pet.name}
          </Text>
          {pet.petOwner && (
            <Text size="sm" c="dimmed">
              Tutor: {pet.petOwner.name}
            </Text>
          )}
        </div>
        <Button size="xs" leftSection={<IconPlus size={14} />} onClick={onBook}>
          Agendar
        </Button>
      </Group>

      <Group justify="space-between" wrap="nowrap">
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={() => onMonth(month.subtract(1, "month"))}
          aria-label="Mês anterior"
        >
          <IconChevronLeft size={18} />
        </ActionIcon>
        <Text size="sm" fw={500} tt="capitalize">
          {month.format("MMMM [de] YYYY")}
        </Text>
        <ActionIcon
          variant="subtle"
          color="gray"
          onClick={() => onMonth(month.add(1, "month"))}
          aria-label="Próximo mês"
        >
          <IconChevronRight size={18} />
        </ActionIcon>
      </Group>

      <Async q={history} rows={4}>
        {({ rows, total, pageSize }) =>
          rows.length === 0 ? (
            <Empty>Nenhum agendamento neste mês.</Empty>
          ) : (
            <>
              <Stack
                gap={0}
                style={{ border: "1px solid var(--vc-line)", borderRadius: 8 }}
              >
                {rows.map((a, i) => (
                  <Group
                    key={a.id}
                    justify="space-between"
                    align="flex-start"
                    p="sm"
                    wrap="nowrap"
                    style={
                      i ? { borderTop: "1px solid var(--vc-line)" } : undefined
                    }
                  >
                    <div style={{ minWidth: 0 }}>
                      <Text size="sm" fw={500}>
                        {fmtDateTime(a.dateTime)}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {PROCEDURE_LABEL[a.type]} · {a.vet.name}
                      </Text>
                      {a.obs && (
                        <Text size="xs" c="dimmed" mt={2}>
                          {a.obs}
                        </Text>
                      )}
                    </div>
                    <Pill status={a.status} map={APPOINTMENT_STATUS} />
                  </Group>
                ))}
              </Stack>
              {total > pageSize && (
                <Pagination
                  value={page}
                  onChange={onPage}
                  total={Math.ceil(total / pageSize)}
                  size="sm"
                />
              )}
            </>
          )
        }
      </Async>
    </Stack>
  );
}
