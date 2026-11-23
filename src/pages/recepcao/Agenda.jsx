import {
  ActionIcon,
  Button,
  Group,
  SegmentedControl,
  Select,
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import {
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";
import { useSession } from "../../auth/session";
import { useAppointments } from "../../api/queries/appointments";
import { useAllVets } from "../../api/queries/vets";
import { AppointmentModal } from "../../components/agenda/AppointmentModal";
import { AppointmentDrawer } from "../../components/agenda/AppointmentDrawer";
import DayAgenda from "../../components/agenda/DayAgenda";
import WeekAgenda from "../../components/agenda/WeekAgenda";
import { Async, Block, PageHeader } from "../../components/ui";
import { ISO, todayISO, weekStart } from "../../lib/format";

const VIEWS = ["dia", "semana"];

export default function Agenda() {
  const { user } = useSession();
  const isVet = user.role === "VET";

  const [dateParam, setDate] = useQueryState(
    "d",
    parseAsString.withDefault(todayISO()).withOptions({ history: "replace" }),
  );
  const day = dayjs(dateParam, ISO).isValid() ? dayjs(dateParam, ISO) : dayjs();

  const [view, setView] = useQueryState(
    "v",
    parseAsStringLiteral(VIEWS)
      .withDefault("dia")
      .withOptions({ history: "replace" }),
  );
  const week = view === "semana";

  const [vetId, setVetId] = useQueryState(
    "vet",
    parseAsString.withOptions({ history: "replace" }),
  );

  const rangeStart = week ? weekStart(day) : day.startOf("day");
  const rangeEnd = rangeStart.add(week ? 7 : 1, "day");

  const vets = useAllVets({ enabled: !isVet });
  const appointments = useAppointments({
    vetId: isVet ? null : vetId,
    from: rangeStart.toISOString(),
    to: rangeEnd.toISOString(),
  });

  const [creating, setCreating] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const selected = appointments.data?.find((a) => a.id === selectedId);

  const go = (d) => setDate(dayjs(d).format(ISO));
  const step = week ? 7 : 1;

  const count = appointments.data?.filter(
    (a) => a.status !== "CANCELLED",
  ).length;
  const period = week
    ? `${rangeStart.format("D [de] MMM")} a ${rangeEnd.subtract(1, "day").format("D [de] MMM")}`
    : day.format("dddd, D [de] MMMM");

  return (
    <>
      <PageHeader
        title={isVet ? "Minha agenda" : "Agenda"}
        finding={`${period}${count != null ? ` · ${count} ${count === 1 ? "consulta" : "consultas"}` : ""}`}
      >
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setCreating(true)}
        >
          Novo agendamento
        </Button>
      </PageHeader>
      <AppointmentModal
        opened={creating}
        onClose={() => setCreating(false)}
        date={day.toDate()}
        vetId={vetId}
        ownVet={isVet}
        onCreated={(a) => go(a.dateTime)}
      />
      <AppointmentDrawer
        readOnly={isVet}
        appointment={selected}
        onClose={() => setSelectedId(null)}
        onRescheduled={(a) => go(a.dateTime)}
      />
      <Block
        title="Horários"
        flush
        actions={
          <Group gap={6} wrap="wrap">
            <SegmentedControl
              aria-label="Visão"
              value={view}
              onChange={setView}
              data={[
                { value: "dia", label: "Dia" },
                { value: "semana", label: "Semana" },
              ]}
            />
            {!isVet && (
              <Select
                aria-label="Veterinário"
                placeholder="Todos os veterinários"
                clearable
                data={(vets.data ?? []).map((v) => ({
                  value: v.id,
                  label: v.name,
                }))}
                value={vetId}
                onChange={(id) => setVetId(id)}
                disabled={!vets.data}
                w={220}
              />
            )}
            <ActionIcon
              variant="default"
              aria-label={week ? "Semana anterior" : "Dia anterior"}
              onClick={() => go(day.subtract(step, "day"))}
            >
              <IconChevronLeft size={16} />
            </ActionIcon>
            <DateInput
              aria-label="Dia"
              value={day.toDate()}
              onChange={(d) => d && go(d)}
              valueFormat="DD/MM/YYYY"
              w={140}
            />
            <ActionIcon
              variant="default"
              aria-label={week ? "Próxima semana" : "Próximo dia"}
              onClick={() => go(day.add(step, "day"))}
            >
              <IconChevronRight size={16} />
            </ActionIcon>
          </Group>
        }
      >
        <Async q={appointments} rows={3}>
          {(rows) =>
            week ? (
              <WeekAgenda
                appointments={rows}
                start={rangeStart}
                onSelect={(a) => setSelectedId(a.id)}
              />
            ) : (
              <DayAgenda
                appointments={rows}
                onSelect={(a) => setSelectedId(a.id)}
              />
            )
          }
        </Async>
      </Block>
    </>
  );
}
