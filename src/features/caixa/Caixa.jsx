import { ActionIcon, Badge, Button, Menu, Popover } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import {
  IconArrowBackUp,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconDotsVertical,
  IconPlus,
  IconX,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import {
  Async,
  Block,
  ConfirmDialog,
  Dash,
  DataTable,
  Empty,
  Kpis,
  KpisLoading,
  PageHeader,
  Pill,
  SpeciesAvatar,
} from "@/components/ui";
import { ISO, brl, todayISO } from "@/lib/format";
import { toast } from "@/lib/notify";
import { PAYMENT_STATUS, PROCEDURE_LABEL } from "@/lib/status";
import { PaymentModal } from "./PaymentModal";
import {
  useCancelPayment,
  useCashDay,
  useProceduresById,
  useRefundPayment,
} from "./queries";
import tableStyles from "@/components/ui/DataTable.module.css";
import layoutStyles from "@/styles/layout.module.css";
import styles from "./Caixa.module.css";

const SETTLED = ["PAID", "REFUNDED"];

export default function Caixa() {
  const [dateParam, setDate] = useQueryState(
    "d",
    parseAsString.withDefault(todayISO()).withOptions({ history: "replace" }),
  );
  const day = dayjs(dateParam, ISO).isValid() ? dayjs(dateParam, ISO) : dayjs();
  const isToday = day.isSame(dayjs(), "day");
  const go = (d) => setDate(dayjs(d).format(ISO));

  const [pickerOpen, setPickerOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [action, setAction] = useState(null);
  const closeAction = () => setAction(null);

  const cash = useCashDay(day);
  const procedures = cash.data?.procedures ?? [];
  const allPayments = cash.data?.payments ?? [];

  const settledIds = new Set(
    allPayments
      .filter((p) => SETTLED.includes(p.status))
      .flatMap((p) => p.items.map((i) => i.procedure.id)),
  );
  const dayGroups = groupByPet(procedures);
  const unpaidCount = procedures.filter((p) => !settledIds.has(p.id)).length;
  const payments = allPayments.filter((p) =>
    dayjs(p.createdAt).isSame(day, "day"),
  );
  const paid = payments.filter((p) => p.status === "PAID");

  const knownProcedures = Object.fromEntries(procedures.map((p) => [p.id, p]));
  const missingIds = [
    ...new Set(
      payments
        .flatMap((p) => p.items.map((i) => i.procedure.id))
        .filter((id) => !knownProcedures[id]),
    ),
  ];
  const fetchedProcedures = useProceduresById(missingIds);
  const procedureById = (id) => knownProcedures[id] ?? fetchedProcedures[id];

  const received = sum(paid, "total");
  const discounts = sum(paid, "discount");
  const reversed = payments.filter((p) => p.status !== "PAID");
  const cancel = useCancelPayment({
    onSuccess: (p) => {
      toast.ok(`Pagamento de ${brl(p.total)} cancelado.`);
      closeAction();
    },
  });
  const refund = useRefundPayment({
    onSuccess: (p) => {
      toast.ok(`Pagamento de ${brl(p.total)} estornado.`);
      closeAction();
    },
  });

  const pickDay = (d) => {
    if (!d) return;
    go(d);
    setPickerOpen(false);
  };

  const petsOf = (payment) => {
    const names = payment.items
      .map((i) => procedureById(i.procedure.id)?.pet?.name)
      .filter(Boolean);
    return [...new Set(names)].join(", ");
  };

  return (
    <>
      <PageHeader
        title="Caixa"
        finding={day.format("dddd, D [de] MMMM [de] YYYY")}
      >
        <Button
          variant="default"
          onClick={() => go(dayjs())}
          disabled={isToday}
        >
          Hoje
        </Button>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          aria-label="Dia anterior"
          onClick={() => go(day.subtract(1, "day"))}
        >
          <IconChevronLeft size={18} />
        </ActionIcon>
        <ActionIcon
          variant="subtle"
          color="gray"
          size="lg"
          aria-label="Próximo dia"
          disabled={isToday}
          onClick={() => go(day.add(1, "day"))}
        >
          <IconChevronRight size={18} />
        </ActionIcon>
        <Popover
          opened={pickerOpen}
          onChange={setPickerOpen}
          position="bottom-end"
          shadow="md"
        >
          <Popover.Target>
            <Button
              variant="subtle"
              color="dark"
              rightSection={<IconChevronDown size={14} />}
              onClick={() => setPickerOpen((o) => !o)}
            >
              {day.format("DD/MM/YYYY")}
            </Button>
          </Popover.Target>
          <Popover.Dropdown>
            <DatePicker
              value={day.toDate()}
              onChange={pickDay}
              maxDate={new Date()}
            />
          </Popover.Dropdown>
        </Popover>
      </PageHeader>

      <PaymentModal
        opened={!!modal}
        onClose={() => setModal(null)}
        charge={modal?.charge}
      />
      <ConfirmDialog
        opened={action?.type === "cancel"}
        onClose={closeAction}
        onConfirm={() => cancel.mutate(action.payment.id)}
        loading={cancel.isPending}
        title="Cancelar pagamento"
        confirmLabel="Cancelar pagamento"
      >
        {action &&
          `Cancelar o pagamento de ${brl(action.payment.total)}? Use quando o registro foi feito por engano. O registro continua no histórico e os procedimentos voltam a ficar sem pagamento.`}
      </ConfirmDialog>
      <ConfirmDialog
        opened={action?.type === "refund"}
        onClose={closeAction}
        onConfirm={() => refund.mutate(action.payment.id)}
        loading={refund.isPending}
        title="Estornar pagamento"
        confirmLabel="Estornar"
        color="orange"
      >
        {action &&
          `Estornar ${brl(action.payment.total)} para o tutor? O pagamento fica como estornado e os procedimentos não voltam a ficar sem pagamento.`}
      </ConfirmDialog>

      <div className={layoutStyles.stack}>
        {cash.data === undefined ? (
          <KpisLoading n={4} />
        ) : (
          <Kpis
            items={[
              {
                label: "Recebido",
                value: brl(received),
                hint: `${paid.length} ${paid.length === 1 ? "pagamento" : "pagamentos"}`,
              },
              {
                label: "Procedimentos do dia",
                value: procedures.length,
                hint: `${unpaidCount} sem pagamento`,
              },
              {
                label: "Descontos",
                value: brl(discounts),
              },
              {
                label: "Cancelados e estornados",
                value: reversed.length,
                hint: reversed.length ? brl(sum(reversed, "total")) : undefined,
              },
            ]}
          />
        )}

        <Block title="Procedimentos do dia" flush>
          <Async q={cash} rows={3}>
            {() =>
              dayGroups.length === 0 ? (
                <Empty>Nenhum procedimento registrado neste dia.</Empty>
              ) : (
                dayGroups.map((g) => {
                  const unpaid = g.procedures.filter(
                    (p) => !settledIds.has(p.id),
                  );
                  return (
                    <div className={styles.chargeRow} key={g.pet.id}>
                      <SpeciesAvatar species={g.pet.species} size={40} />
                      <div className={styles.chargeMain}>
                        <div className={styles.chargePet}>{g.pet.name}</div>
                        <div className={styles.chargeItems}>
                          {g.procedures.map((p) => {
                            const paid = settledIds.has(p.id);
                            return (
                              <Badge
                                key={p.id}
                                variant="light"
                                color={paid ? "teal" : "gray"}
                                size="sm"
                                leftSection={
                                  paid && <IconCheck size={12} stroke={2.5} />
                                }
                                title={paid ? "Pago" : "Sem pagamento"}
                              >
                                {PROCEDURE_LABEL[p.type]} ·{" "}
                                {dayjs(p.dateTime).format("HH:mm")} ·{" "}
                                {p.vet.name}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                      {unpaid.length > 0 ? (
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() =>
                            setModal({
                              charge: { pet: g.pet, procedures: unpaid },
                            })
                          }
                        >
                          Cobrar
                        </Button>
                      ) : (
                        <Badge variant="light" color="teal">
                          Pago
                        </Badge>
                      )}
                    </div>
                  );
                })
              )
            }
          </Async>
        </Block>

        <Block
          title="Movimentações"
          sub={`${payments.length} ${payments.length === 1 ? "registro" : "registros"} no dia`}
          actions={
            <Button
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={() => setModal({ charge: null })}
            >
              Novo pagamento
            </Button>
          }
          flush
        >
          <Async q={cash} rows={4}>
            {() => (
              <DataTable
                rows={payments}
                empty="Nenhum pagamento registrado neste dia."
                columns={[
                  {
                    key: "time",
                    label: "Hora",
                    width: 72,
                    render: (p) => dayjs(p.createdAt).format("HH:mm"),
                  },
                  {
                    key: "pet",
                    label: "Paciente",
                    render: (p) => petsOf(p) || <Dash />,
                  },
                  {
                    key: "items",
                    label: "Itens",
                    render: (p) => (
                      <>
                        {itemsLabel(p)}
                        {p.notes && (
                          <div className={tableStyles.cellSub}>{p.notes}</div>
                        )}
                      </>
                    ),
                  },
                  { key: "method", label: "Forma" },
                  {
                    key: "total",
                    label: "Total",
                    num: true,
                    render: (p) => (
                      <>
                        {brl(p.total)}
                        {p.discount > 0 && (
                          <div className={tableStyles.cellSub}>
                            desconto {brl(p.discount)}
                          </div>
                        )}
                      </>
                    ),
                  },
                  {
                    key: "status",
                    label: "Status",
                    render: (p) => (
                      <Pill status={p.status} map={PAYMENT_STATUS} size="sm" />
                    ),
                  },
                  {
                    key: "actions",
                    label: "",
                    width: 48,
                    render: (p) =>
                      p.status === "PAID" && (
                        <PaymentMenu
                          onAction={(type) => setAction({ type, payment: p })}
                        />
                      ),
                  },
                ]}
                mobile={{
                  title: (p) => petsOf(p) || itemsLabel(p),
                  sub: (p) =>
                    `${dayjs(p.createdAt).format("HH:mm")} · ${p.method} · ${itemsLabel(p)}`,
                  side: (p) => (
                    <>
                      <span className={tableStyles.num}>{brl(p.total)}</span>
                      {p.status === "PAID" ? (
                        <PaymentMenu
                          onAction={(type) => setAction({ type, payment: p })}
                        />
                      ) : (
                        <Pill
                          status={p.status}
                          map={PAYMENT_STATUS}
                          size="sm"
                        />
                      )}
                    </>
                  ),
                }}
              />
            )}
          </Async>
        </Block>
      </div>
    </>
  );
}

function PaymentMenu({ onAction }) {
  return (
    <Menu position="bottom-end" shadow="md" withinPortal>
      <Menu.Target>
        <ActionIcon
          variant="subtle"
          color="gray"
          aria-label="Ações do pagamento"
          onClick={(e) => e.stopPropagation()}
        >
          <IconDotsVertical size={16} />
        </ActionIcon>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item
          leftSection={<IconArrowBackUp size={14} />}
          onClick={() => onAction("refund")}
        >
          Estornar
        </Menu.Item>
        <Menu.Item
          color="red"
          leftSection={<IconX size={14} />}
          onClick={() => onAction("cancel")}
        >
          Cancelar
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}

const sum = (rows, key) =>
  rows.reduce((acc, r) => acc + Math.round(r[key] * 100), 0) / 100;

const itemsLabel = (payment) =>
  payment.items.map((i) => PROCEDURE_LABEL[i.procedure.type]).join(", ");

function groupByPet(procedures) {
  const groups = new Map();
  [...procedures]
    .sort((a, b) => a.dateTime.localeCompare(b.dateTime))
    .forEach((p) => {
      const key = p.pet?.id ?? p.id;
      if (!groups.has(key)) groups.set(key, { pet: p.pet, procedures: [] });
      groups.get(key).procedures.push(p);
    });
  return [...groups.values()];
}
