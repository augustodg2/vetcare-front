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
  CellSub,
  ConfirmDialog,
  Dash,
  DataTable,
  Empty,
  Kpis,
  KpisLoading,
  Num,
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
  usePaymentsDaySummary,
  useRefundPayment,
} from "./queries";
import layoutStyles from "@/styles/layout.module.css";
import styles from "./Payments.module.css";

export default function Payments() {
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

  const { query: paymentsDay, summary } = usePaymentsDaySummary(day);
  const {
    procedureCount,
    groups,
    unpaidCount,
    isSettled,
    payments,
    paid,
    received,
    discounts,
    reversed,
    reversedTotal,
    petNames,
  } = summary;
  const petsOf = (payment) => petNames[payment.id];

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
        {paymentsDay.data === undefined ? (
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
                value: procedureCount,
                hint: `${unpaidCount} sem pagamento`,
              },
              {
                label: "Descontos",
                value: brl(discounts),
              },
              {
                label: "Cancelados e estornados",
                value: reversed.length,
                hint: reversed.length ? brl(reversedTotal) : undefined,
              },
            ]}
          />
        )}

        <Block title="Procedimentos do dia" flush>
          <Async q={paymentsDay} rows={3}>
            {() =>
              groups.length === 0 ? (
                <Empty>Nenhum procedimento registrado neste dia.</Empty>
              ) : (
                groups.map((g) => {
                  return (
                    <div className={styles.chargeRow} key={g.pet.id}>
                      <SpeciesAvatar species={g.pet.species} size={40} />
                      <div className={styles.chargeMain}>
                        <div className={styles.chargePet}>{g.pet.name}</div>
                        <div className={styles.chargeItems}>
                          {g.procedures.map((p) => {
                            const paid = isSettled(p.id);
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
                      {g.unpaid.length > 0 ? (
                        <Button
                          size="xs"
                          variant="light"
                          onClick={() =>
                            setModal({
                              charge: { pet: g.pet, procedures: g.unpaid },
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
          <Async q={paymentsDay} rows={4}>
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
                        {p.notes && <CellSub>{p.notes}</CellSub>}
                      </>
                    ),
                  },
                  { key: "paymentMethod", label: "Forma" },
                  {
                    key: "total",
                    label: "Total",
                    num: true,
                    render: (p) => (
                      <>
                        {brl(p.total)}
                        {p.discount > 0 && (
                          <CellSub>desconto {brl(p.discount)}</CellSub>
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
                    `${dayjs(p.createdAt).format("HH:mm")} · ${p.paymentMethod} · ${itemsLabel(p)}`,
                  side: (p) => (
                    <>
                      <Num>{brl(p.total)}</Num>
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

const itemsLabel = (payment) =>
  payment.items.map((i) => PROCEDURE_LABEL[i.procedure.type]).join(", ");
