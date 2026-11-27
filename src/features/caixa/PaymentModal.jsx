import {
  Badge,
  Checkbox,
  Divider,
  Group,
  Modal,
  NumberInput,
  Pagination,
  SegmentedControl,
  Select,
  Skeleton,
  Stack,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDebouncedValue } from "@mantine/hooks";
import dayjs from "dayjs";
import { useState } from "react";
import { usePets } from "@/api/queries/pets";
import { usePetProcedures } from "@/api/queries/procedures";
import { Empty, FormActions } from "@/components/ui";
import { brl, toCents } from "@/lib/format";
import { toast } from "@/lib/notify";
import { PAYMENT_METHODS, PROCEDURE_LABEL } from "@/lib/status";
import { useCreatePayment, usePaymentsSince } from "./queries";
import styles from "./PaymentModal.module.css";

const NOTES_MAX = 2000;
const SEARCH_DEBOUNCE_MS = 300;
const PROCEDURE_PAGE_SIZE = 10;
const SETTLED = ["PAID", "REFUNDED"];

const money = {
  prefix: "R$ ",
  decimalSeparator: ",",
  thousandSeparator: ".",
  decimalScale: 2,
  fixedDecimalScale: true,
  hideControls: true,
  min: 0,
};

const toItem = (p) => ({
  procedureId: p.id,
  type: p.type,
  dateTime: p.dateTime,
  amount: "",
});

export function PaymentModal({ opened, onClose, charge }) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={charge ? `Cobrar · ${charge.pet.name}` : "Novo pagamento"}
      size="lg"
    >
      {opened && <PaymentForm charge={charge} onClose={onClose} />}
    </Modal>
  );
}

function PaymentForm({ charge, onClose }) {
  const [pet, setPet] = useState(charge?.pet ?? null);
  const [search, setSearch] = useState("");
  const [debounced] = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useState(1);
  const pets = usePets({ search: debounced, enabled: !charge });

  const procedures = usePetProcedures({ petId: pet?.id, page });
  const rows = procedures.data?.rows ?? [];
  const oldest = rows.length
    ? rows.reduce(
        (min, p) => (p.dateTime < min ? p.dateTime : min),
        rows[0].dateTime,
      )
    : null;
  const payments = usePaymentsSince(oldest);
  const settledIds = new Set(
    (payments.data ?? [])
      .filter((p) => SETTLED.includes(p.status))
      .flatMap((p) => p.items.map((i) => i.procedure.id)),
  );

  const form = useForm({
    initialValues: {
      items: (charge?.procedures ?? []).map(toItem),
      paymentMethod: PAYMENT_METHODS[0],
      discount: "",
      received: "",
      notes: "",
    },
    validate: {
      items: {
        amount: (v) => (Number(v) > 0 ? null : "Informe o valor"),
      },
      discount: (v, values) =>
        toCents(v) > subtotalCents(values) ? "Maior que o subtotal" : null,
      notes: (v) =>
        v.length > NOTES_MAX ? `Máximo de ${NOTES_MAX} caracteres` : null,
    },
  });

  const create = useCreatePayment({
    onSuccess: (payment) => {
      toast.ok(`Pagamento de ${brl(payment.total)} registrado.`);
      onClose();
    },
  });

  const { values } = form;
  const indexOf = (id) => values.items.findIndex((i) => i.procedureId === id);
  const toggle = (p) => {
    const i = indexOf(p.id);
    if (i >= 0) form.removeListItem("items", i);
    else form.insertListItem("items", toItem(p));
  };
  const choosePet = (id) => {
    setPet(id ? (pets.data?.rows.find((p) => p.id === id) ?? null) : null);
    setPage(1);
    form.setFieldValue("items", []);
  };

  const subtotal = subtotalCents(values);
  const total = Math.max(subtotal - toCents(values.discount), 0);
  const cash = values.paymentMethod === "Dinheiro";
  const change = toCents(values.received) - total;
  const offPage = values.items.filter(
    (i) => !rows.some((p) => p.id === i.procedureId),
  ).length;

  const pageSize = procedures.data?.pageSize || PROCEDURE_PAGE_SIZE;
  const pages = Math.ceil((procedures.data?.total ?? 0) / pageSize);

  const petOptions = [
    ...(pet ? [pet] : []),
    ...(pets.data?.rows ?? []).filter((p) => p.id !== pet?.id),
  ].map((p) => ({
    value: p.id,
    label: p.petOwner ? `${p.name} · ${p.petOwner.name}` : p.name,
  }));

  const submit = form.onSubmit(
    (v) =>
      v.items.length > 0 &&
      create.mutate({
        paymentMethod: v.paymentMethod,
        discount: Number(v.discount) || 0,
        notes: v.notes,
        items: v.items.map((i) => ({
          procedureId: i.procedureId,
          amount: Number(i.amount),
        })),
      }),
  );

  return (
    <form onSubmit={submit} noValidate>
      <Stack gap="md">
        {charge ? (
          <TextInput label="Pet" value={charge.pet.name} disabled />
        ) : (
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
            onChange={choosePet}
            value={pet?.id ?? null}
            required
            withAsterisk
          />
        )}

        {pet && (
          <Stack gap="xs">
            <Text size="sm" fw={500}>
              Procedimentos
            </Text>
            {procedures.data === undefined ? (
              <Stack gap={8}>
                <Skeleton height={36} />
                <Skeleton height={36} />
              </Stack>
            ) : rows.length === 0 ? (
              <Empty>Nenhum procedimento registrado para este pet.</Empty>
            ) : (
              rows.map((p) => {
                const i = indexOf(p.id);
                const settled = settledIds.has(p.id);
                return (
                  <Group key={p.id} gap="sm" wrap="nowrap" mih={36}>
                    <Checkbox
                      aria-label={`Cobrar ${PROCEDURE_LABEL[p.type]}`}
                      checked={i >= 0}
                      disabled={settled && i < 0}
                      onChange={() => toggle(p)}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text size="sm" fw={500}>
                        {PROCEDURE_LABEL[p.type]}
                      </Text>
                      <Text size="xs" c="dimmed" truncate>
                        {dayjs(p.dateTime).format("DD/MM/YYYY HH:mm")} ·{" "}
                        {p.vet.name}
                      </Text>
                    </div>
                    {i >= 0 ? (
                      <NumberInput
                        {...money}
                        w={140}
                        placeholder="R$ 0,00"
                        aria-label={`Valor de ${PROCEDURE_LABEL[p.type]}`}
                        {...form.getInputProps(`items.${i}.amount`)}
                      />
                    ) : (
                      settled && (
                        <Badge variant="light" color="teal" size="sm">
                          Pago
                        </Badge>
                      )
                    )}
                  </Group>
                );
              })
            )}
            {pages > 1 && (
              <Group justify="space-between">
                <Text size="xs" c="dimmed">
                  {offPage > 0 &&
                    `${offPage} ${offPage === 1 ? "selecionado" : "selecionados"} em outras páginas`}
                </Text>
                <Pagination
                  size="sm"
                  value={page}
                  onChange={setPage}
                  total={pages}
                />
              </Group>
            )}
          </Stack>
        )}

        <Divider />

        <Stack gap={6}>
          <Text size="sm" fw={500}>
            Forma de pagamento
          </Text>
          <SegmentedControl
            fullWidth
            data={PAYMENT_METHODS}
            {...form.getInputProps("paymentMethod")}
          />
        </Stack>

        <Group grow align="flex-start">
          <NumberInput
            {...money}
            label="Desconto"
            placeholder="R$ 0,00"
            {...form.getInputProps("discount")}
          />
          {cash && (
            <NumberInput
              {...money}
              label="Valor recebido"
              placeholder="R$ 0,00"
              description={
                values.received !== "" && change >= 0
                  ? `Troco: ${brl(change / 100)}`
                  : undefined
              }
              error={
                values.received !== "" && change < 0
                  ? "Menor que o total"
                  : undefined
              }
              {...form.getInputProps("received")}
            />
          )}
        </Group>

        <Textarea
          label="Observações"
          autosize
          minRows={2}
          maxRows={5}
          {...form.getInputProps("notes")}
        />

        <Stack gap={4} className={styles.summary}>
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Subtotal ({values.items.length}{" "}
              {values.items.length === 1 ? "item" : "itens"})
            </Text>
            <Text size="sm">{brl(subtotal / 100)}</Text>
          </Group>
          {toCents(values.discount) > 0 && (
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Desconto
              </Text>
              <Text size="sm">− {brl(toCents(values.discount) / 100)}</Text>
            </Group>
          )}
          <Group justify="space-between">
            <Text fw={600}>Total</Text>
            <Text fw={600} size="lg">
              {brl(total / 100)}
            </Text>
          </Group>
        </Stack>
      </Stack>

      <FormActions
        onCancel={onClose}
        submitLabel="Registrar pagamento"
        loading={create.isPending}
        extra={
          pet &&
          values.items.length === 0 && (
            <Text size="sm" c="dimmed" mr="auto">
              Selecione ao menos um procedimento
            </Text>
          )
        }
      />
    </form>
  );
}

const subtotalCents = (values) =>
  values.items.reduce((sum, i) => sum + toCents(i.amount), 0);
