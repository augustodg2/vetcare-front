import { Modal, Select, SimpleGrid, Stack, Textarea } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDebouncedValue } from "@mantine/hooks";
import dayjs from "dayjs";
import { useState } from "react";
import { useCreateAppointment } from "../../api/queries/appointments";
import { usePets } from "../../api/queries/pets";
import { useAllVets } from "../../api/queries/vets";
import { toast } from "../../lib/notify";
import { PROCEDURE_LABEL } from "../../lib/status";
import { FormActions } from "../ui";

const SEARCH_DEBOUNCE_MS = 300;
const OBS_MAX = 500;

// fixed 30-minute slots: the API only detects a conflict on the exact time
const SLOTS = Array.from({ length: 24 }, (_, i) => {
  const min = 8 * 60 + i * 30;
  const h = String(Math.floor(min / 60)).padStart(2, "0");
  const m = String(min % 60).padStart(2, "0");
  return `${h}:${m}`;
});

const TYPE_OPTIONS = Object.entries(PROCEDURE_LABEL).map(([value, label]) => ({
  value,
  label,
}));

const toDateTime = (date, time) => {
  const [h, m] = time.split(":").map(Number);
  return dayjs(date).hour(h).minute(m).second(0).millisecond(0).toDate();
};

export function AppointmentModal({ opened, onClose, date, vetId, onCreated }) {
  return (
    <Modal opened={opened} onClose={onClose} title="Novo agendamento" size="lg">
      {opened && (
        <AppointmentForm
          onClose={onClose}
          date={date}
          vetId={vetId}
          onCreated={onCreated}
        />
      )}
    </Modal>
  );
}

function AppointmentForm({ onClose, date, vetId, onCreated }) {
  const form = useForm({
    initialValues: {
      petId: null,
      vetId: vetId ?? null,
      type: "CONSULTATION",
      // past days cannot be booked
      date: date && !dayjs(date).isBefore(dayjs(), "day") ? date : new Date(),
      time: null,
      obs: "",
    },
    validate: {
      petId: (v) => (v ? null : "Escolha o pet"),
      vetId: (v) => (v ? null : "Escolha o veterinário"),
      date: (v) => (v ? null : "Informe o dia"),
      time: (v, values) => {
        if (!v) return "Escolha o horário";
        if (values.date && toDateTime(values.date, v) <= new Date()) {
          return "O horário deve ser futuro";
        }
        return null;
      },
      obs: (v) =>
        v.length > OBS_MAX ? `Máximo de ${OBS_MAX} caracteres` : null,
    },
  });

  // the pet list is searched on the server; the chosen pet stays in the
  // options even when a later search no longer returns it
  const [search, setSearch] = useState("");
  const [debounced] = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [chosenPet, setChosenPet] = useState(null);
  const pets = usePets({ search: debounced });
  const vets = useAllVets();

  const petOptions = [
    ...(chosenPet ? [chosenPet] : []),
    ...(pets.data?.rows ?? []).filter((p) => p.id !== chosenPet?.id),
  ].map((p) => ({
    value: p.id,
    label: p.petOwner ? `${p.name} · ${p.petOwner.name}` : p.name,
  }));

  const create = useCreateAppointment({
    onSuccess: (appointment) => {
      toast.ok(`Consulta de ${appointment.pet.name} agendada.`);
      onCreated?.(appointment);
      onClose();
    },
  });

  const onSubmit = form.onSubmit((v) =>
    create.mutate({
      petId: v.petId,
      vetId: v.vetId,
      type: v.type,
      obs: v.obs,
      dateTime: toDateTime(v.date, v.time),
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack gap="sm">
        <Select
          label="Pet"
          placeholder="Busque pelo nome do pet ou do tutor"
          searchable
          data={petOptions}
          filter={({ options }) => options}
          onSearchChange={setSearch}
          nothingFoundMessage={
            pets.isFetching ? "Buscando..." : "Nenhum pet encontrado"
          }
          onChange={(id) => {
            form.setFieldValue("petId", id);
            setChosenPet(
              id
                ? (pets.data?.rows.find((p) => p.id === id) ?? chosenPet)
                : null,
            );
          }}
          value={form.values.petId}
          error={form.errors.petId}
          required
          withAsterisk
        />
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <Select
            label="Veterinário"
            placeholder="Escolha o veterinário"
            data={(vets.data ?? []).map((v) => ({
              value: v.id,
              label: v.name,
            }))}
            disabled={!vets.data}
            required
            withAsterisk
            {...form.getInputProps("vetId")}
          />
          <Select
            label="Tipo"
            data={TYPE_OPTIONS}
            allowDeselect={false}
            required
            withAsterisk
            {...form.getInputProps("type")}
          />
          <DateInput
            label="Dia"
            valueFormat="DD/MM/YYYY"
            minDate={new Date()}
            required
            withAsterisk
            {...form.getInputProps("date")}
          />
          <Select
            label="Horário"
            placeholder="Escolha o horário"
            data={SLOTS}
            required
            withAsterisk
            {...form.getInputProps("time")}
          />
        </SimpleGrid>
        <Textarea
          label="Observações"
          autosize
          minRows={2}
          maxRows={5}
          {...form.getInputProps("obs")}
        />
      </Stack>
      <FormActions
        onCancel={onClose}
        loading={create.isPending}
        submitLabel="Agendar"
      />
    </form>
  );
}
