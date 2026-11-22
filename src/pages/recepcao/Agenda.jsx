import { ActionIcon, Group, Select } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import dayjs from "dayjs";
import { parseAsString, useQueryState } from "nuqs";
import { useAppointments } from "../../api/queries/appointments";
import { useAllVets } from "../../api/queries/vets";
import DayAgenda from "../../components/agenda/DayAgenda";
import { Async, Block, PageHeader } from "../../components/ui";
import { ISO, todayISO } from "../../lib/format";

export default function Agenda() {
  const [dateParam, setDate] = useQueryState(
    "d",
    parseAsString.withDefault(todayISO()).withOptions({ history: "replace" }),
  );
  const day = dayjs(dateParam, ISO).isValid() ? dayjs(dateParam, ISO) : dayjs();

  const [vetId, setVetId] = useQueryState(
    "vet",
    parseAsString.withOptions({ history: "replace" }),
  );

  const vets = useAllVets();
  const appointments = useAppointments({
    vetId,
    from: day.startOf("day").toISOString(),
    to: day.add(1, "day").startOf("day").toISOString(),
  });

  const go = (d) => setDate(dayjs(d).format(ISO));

  return (
    <>
      <PageHeader
        title="Agenda"
        finding={`${day.format("dddd, D [de] MMMM")}${
          appointments.data
            ? ` · ${appointments.data.filter((a) => a.status !== "CANCELLED").length} consultas`
            : ""
        }`}
      />
      <Block
        title="Horários"
        flush
        actions={
          <Group gap={6} wrap="wrap">
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
            <ActionIcon
              variant="default"
              aria-label="Dia anterior"
              onClick={() => go(day.subtract(1, "day"))}
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
              aria-label="Próximo dia"
              onClick={() => go(day.add(1, "day"))}
            >
              <IconChevronRight size={16} />
            </ActionIcon>
          </Group>
        }
      >
        <Async q={appointments} rows={3}>
          {(rows) => <DayAgenda appointments={rows} />}
        </Async>
      </Block>
    </>
  );
}
