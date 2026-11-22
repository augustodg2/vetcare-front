import { ActionIcon, Group } from "@mantine/core";
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

  const vets = useAllVets();
  const appointments = useAppointments({
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
        title="Horários por veterinário"
        flush
        actions={
          <Group gap={6} wrap="nowrap">
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
        <Async q={vets} rows={3}>
          {(vetRows) => (
            <Async q={appointments} rows={3}>
              {(rows) => <DayAgenda vets={vetRows} appointments={rows} />}
            </Async>
          )}
        </Async>
      </Block>
    </>
  );
}
