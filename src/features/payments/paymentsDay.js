import dayjs from "dayjs";

export const SETTLED = ["PAID", "REFUNDED"];

const procedureIdsOf = (payment) => payment.items.map((i) => i.procedure.id);

export const settledProcedureIds = (payments) =>
  new Set(
    payments.filter((p) => SETTLED.includes(p.status)).flatMap(procedureIdsOf),
  );

export const sum = (rows, key) =>
  rows.reduce((acc, r) => acc + Math.round(r[key] * 100), 0) / 100;

export function groupByPet(procedures) {
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

export const paymentsOnDay = (payments, day) =>
  payments.filter((p) => dayjs(p.createdAt).isSame(day, "day"));

export const missingProcedureIds = ({ procedures, payments, day }) => {
  const known = new Set(procedures.map((p) => p.id));
  return [
    ...new Set(
      paymentsOnDay(payments, day)
        .flatMap(procedureIdsOf)
        .filter((id) => !known.has(id)),
    ),
  ];
};

export function summarizePaymentsDay({
  procedures,
  payments: allPayments,
  day,
  extraProcedures = {},
}) {
  const settledIds = settledProcedureIds(allPayments);
  const isSettled = (id) => settledIds.has(id);
  const groups = groupByPet(procedures).map((g) => ({
    ...g,
    unpaid: g.procedures.filter((p) => !isSettled(p.id)),
  }));
  const unpaidCount = procedures.filter((p) => !isSettled(p.id)).length;

  const payments = paymentsOnDay(allPayments, day);
  const paid = payments.filter((p) => p.status === "PAID");
  const reversed = payments.filter((p) => p.status !== "PAID");

  const procedureById = {
    ...extraProcedures,
    ...Object.fromEntries(procedures.map((p) => [p.id, p])),
  };
  const petNames = Object.fromEntries(
    payments.map((payment) => {
      const names = procedureIdsOf(payment)
        .map((id) => procedureById[id]?.pet?.name)
        .filter(Boolean);
      return [payment.id, [...new Set(names)].join(", ")];
    }),
  );

  return {
    procedureCount: procedures.length,
    groups,
    unpaidCount,
    isSettled,
    payments,
    paid,
    received: sum(paid, "total"),
    discounts: sum(paid, "discount"),
    reversed,
    reversedTotal: sum(reversed, "total"),
    procedureById,
    petNames,
  };
}
