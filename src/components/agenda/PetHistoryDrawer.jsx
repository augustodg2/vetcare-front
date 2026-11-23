import { Button, Drawer, Group, Pagination, Stack, Text } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useState } from "react";
import { usePetAppointments } from "../../api/queries/appointments";
import { fmtDateTime } from "../../lib/format";
import { APPOINTMENT_STATUS, PROCEDURE_LABEL } from "../../lib/status";
import { Async, Empty, Pill } from "../ui";
import { AppointmentModal } from "./AppointmentModal";

export function PetHistoryDrawer({ pet, onClose }) {
  return (
    <Drawer
      opened={!!pet}
      onClose={onClose}
      title="Histórico de agendamentos"
      size="md"
    >
      {pet && <PetHistory pet={pet} />}
    </Drawer>
  );
}

function PetHistory({ pet }) {
  const [page, setPage] = useState(1);
  const [booking, setBooking] = useState(false);
  const history = usePetAppointments({ petId: pet.id, page });

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
        <Button
          size="xs"
          leftSection={<IconPlus size={14} />}
          onClick={() => setBooking(true)}
        >
          Agendar
        </Button>
      </Group>

      <Async q={history} rows={4}>
        {({ rows, total, pageSize }) =>
          rows.length === 0 ? (
            <Empty>Nenhum agendamento para este pet.</Empty>
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
                  onChange={setPage}
                  total={Math.ceil(total / pageSize)}
                  size="sm"
                />
              )}
            </>
          )
        }
      </Async>

      <AppointmentModal
        opened={booking}
        onClose={() => setBooking(false)}
        pet={pet}
      />
    </Stack>
  );
}
