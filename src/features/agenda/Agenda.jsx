import {
  ActionIcon,
  Button,
  Popover,
  SegmentedControl,
  Select,
} from "@mantine/core";
import { DatePicker, MonthPicker } from "@mantine/dates";
import {
  IconAdjustmentsHorizontal,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useDebouncedValue } from "@mantine/hooks";
import { useState } from "react";
import { rolePath } from "@/auth/roles";
import { useSession } from "@/auth/session";
import { useAppointments } from "@/api/queries/appointments";
import { usePet, usePets } from "@/api/queries/pets";
import { useAllVets } from "@/api/queries/vets";
import { AppointmentModal } from "./AppointmentModal";
import { AppointmentDrawer } from "./AppointmentDrawer";
import DayAgenda from "./DayAgenda";
import WeekAgenda from "./WeekAgenda";
import MonthAgenda from "./MonthAgenda";
import { Async, Block, PageHeader } from "@/components/ui";
import { ISO, todayISO, weekStart } from "@/lib/format";
import { cx } from "@/lib/cx";
import styles from "./Agenda.module.css";

const VIEWS = ["dia", "semana", "mes"];
const SCOPES = ["meus", "todos"];

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
  const month = view === "mes";

  const [vetId, setVetId] = useQueryState(
    "vet",
    parseAsString.withOptions({ history: "replace" }),
  );

  const [scope, setScope] = useQueryState(
    "escopo",
    parseAsStringLiteral(SCOPES)
      .withDefault("meus")
      .withOptions({ history: "replace" }),
  );
  const onlyMine = isVet && scope === "meus";

  const rangeStart = month
    ? weekStart(day.startOf("month"))
    : week
      ? weekStart(day)
      : day.startOf("day");
  const rangeEnd = month
    ? weekStart(day.endOf("month")).add(7, "day")
    : rangeStart.add(week ? 7 : 1, "day");

  const [petId, setPetId] = useQueryState(
    "paciente",
    parseAsString.withOptions({ history: "replace" }),
  );

  const vets = useAllVets({ enabled: !isVet });
  const appointments = useAppointments({
    vetId: isVet ? (onlyMine ? user.vetId : undefined) : vetId,
    petId,
    from: rangeStart.toISOString(),
    to: rangeEnd.toISOString(),
  });

  const [creating, setCreating] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const selected = appointments.data?.find((a) => a.id === selectedId);

  const go = (d) => setDate(dayjs(d).format(ISO));
  const now = dayjs();
  const showsToday = month
    ? now.isSame(day, "month")
    : !now.isBefore(rangeStart) && now.isBefore(rangeEnd);
  const unit = month ? "month" : week ? "week" : "day";
  const prevLabel = month
    ? "Mês anterior"
    : week
      ? "Semana anterior"
      : "Dia anterior";
  const nextLabel = month
    ? "Próximo mês"
    : week
      ? "Próxima semana"
      : "Próximo dia";

  const count = appointments.data?.filter(
    (a) =>
      a.status !== "CANCELLED" &&
      (!month || dayjs(a.dateTime).isSame(day, "month")),
  ).length;
  const period = month
    ? day.format("MMMM [de] YYYY")
    : week
      ? `${rangeStart.format("D [de] MMM")} a ${rangeEnd.subtract(1, "day").format("D [de] MMM")}`
      : day.format("ddd, D [de] MMMM");
  const activeFilters = [isVet ? !onlyMine : vetId, petId].filter(
    Boolean,
  ).length;
  const pick = (d) => {
    if (!d) return;
    go(d);
    setPickerOpen(false);
  };

  return (
    <div className={styles.page} data-fill-page>
      <PageHeader
        title={onlyMine ? "Minha agenda" : "Agenda"}
        finding={
          count != null
            ? `${count} ${count === 1 ? "consulta" : "consultas"} no período`
            : undefined
        }
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
        appointment={selected}
        onClose={() => setSelectedId(null)}
        onRescheduled={(a) => go(a.dateTime)}
        petHref={
          isVet ? (pet) => rolePath("VET", `pacientes/${pet.id}`) : undefined
        }
        canManage={(a) => !isVet || a.vet.id === user.vetId}
      />
      <Block flush className={styles.panel}>
        <div className={styles.toolbar}>
          <div className={styles.nav}>
            <SegmentedControl
              className={styles.views}
              aria-label="Visão"
              value={view}
              onChange={setView}
              data={[
                { value: "dia", label: "Dia" },
                { value: "semana", label: "Semana" },
                { value: "mes", label: "Mês" },
              ]}
            />
            <Button
              variant="default"
              onClick={() => go(dayjs())}
              disabled={showsToday}
            >
              Hoje
            </Button>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              aria-label={prevLabel}
              onClick={() => go(day.subtract(1, unit))}
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              aria-label={nextLabel}
              onClick={() => go(day.add(1, unit))}
            >
              <IconChevronRight size={18} />
            </ActionIcon>
            <Popover
              opened={pickerOpen}
              onChange={setPickerOpen}
              position="bottom-start"
              shadow="md"
            >
              <Popover.Target>
                <Button
                  variant="subtle"
                  color="dark"
                  className={styles.period}
                  rightSection={<IconChevronDown size={14} />}
                  onClick={() => setPickerOpen((o) => !o)}
                >
                  {period}
                </Button>
              </Popover.Target>
              <Popover.Dropdown>
                {month ? (
                  <MonthPicker value={day.toDate()} onChange={pick} />
                ) : (
                  <DatePicker value={day.toDate()} onChange={pick} />
                )}
              </Popover.Dropdown>
            </Popover>
          </div>
          <Button
            className={styles.filtersToggle}
            variant={activeFilters ? "light" : "default"}
            leftSection={<IconAdjustmentsHorizontal size={16} />}
            onClick={() => setFiltersOpen((o) => !o)}
            aria-expanded={filtersOpen}
          >
            Filtros{activeFilters ? ` · ${activeFilters}` : ""}
          </Button>
          <div className={cx(styles.filters, filtersOpen && styles.open)}>
            {isVet ? (
              <SegmentedControl
                aria-label="Agendamentos"
                value={scope}
                onChange={setScope}
                data={[
                  { value: "meus", label: "Meus agendamentos" },
                  { value: "todos", label: "Todos" },
                ]}
              />
            ) : (
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
              />
            )}
            <PetFilter value={petId} onChange={(id) => setPetId(id)} />
          </div>
        </div>
        <div className={styles.body}>
          <Async q={appointments} rows={3}>
            {(rows) =>
              month ? (
                <MonthAgenda
                  appointments={rows}
                  month={day}
                  onSelect={(a) => setSelectedId(a.id)}
                  onDay={(d) => {
                    go(d);
                    setView("dia");
                  }}
                />
              ) : week ? (
                <WeekAgenda
                  appointments={rows}
                  start={rangeStart}
                  onSelect={(a) => setSelectedId(a.id)}
                />
              ) : (
                <DayAgenda
                  appointments={rows}
                  day={day}
                  onSelect={(a) => setSelectedId(a.id)}
                />
              )
            }
          </Async>
        </div>
      </Block>
    </div>
  );
}

const SEARCH_DEBOUNCE_MS = 300;

function PetFilter({ value, onChange }) {
  const [search, setSearch] = useState("");
  const [debounced] = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const pets = usePets({ search: debounced });
  const selected = usePet(value).data;

  const options = [
    ...(selected ? [selected] : []),
    ...(pets.data?.rows ?? []).filter((p) => p.id !== value),
  ].map((p) => ({
    value: p.id,
    label: p.petOwner ? `${p.name} · ${p.petOwner.name}` : p.name,
  }));

  return (
    <Select
      aria-label="Paciente"
      placeholder="Todos os pacientes"
      searchable
      clearable
      data={options}
      filter={({ options }) => options}
      onSearchChange={setSearch}
      nothingFoundMessage={
        pets.isFetching ? "Buscando..." : "Nenhum pet encontrado"
      }
      value={value}
      onChange={onChange}
    />
  );
}
