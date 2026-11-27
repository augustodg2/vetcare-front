import dayjs from "dayjs";
import { http, HttpResponse } from "msw";
import { ENDPOINTS } from "@/api/endpoints";
import { STATUS } from "@/api/statusCodes";
import { procedureStore } from "./procedures";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
const PAGE_SIZE = 20;

let nextId = 1;
const toCents = (v) => Math.round(Number(v) * 100);

const build = ({ paymentMethod, discount = 0, notes, items, createdAt }) => {
  const subtotal = items.reduce((sum, i) => sum + toCents(i.amount), 0);
  const now = createdAt ?? new Date().toISOString();
  return {
    id: `pay${nextId++}`,
    paymentMethod,
    status: "PAID",
    discount,
    subtotal: subtotal / 100,
    total: (subtotal - toCents(discount)) / 100,
    notes: notes ?? null,
    createdAt: now,
    updatedAt: now,
    items: items.map((i, idx) => {
      const p = procedureStore.find((pr) => pr.id === i.procedureId);
      return {
        id: `ip${nextId}-${idx}`,
        amount: i.amount,
        description: i.description ?? null,
        procedure: { id: p.id, type: p.type, dateTime: p.dateTime },
      };
    }),
  };
};

const store = [
  build({
    paymentMethod: "PIX",
    items: [{ procedureId: procedureStore[0].id, amount: 120 }],
    createdAt: dayjs().hour(9).minute(40).second(0).toISOString(),
  }),
];

const notFound = () =>
  HttpResponse.json(
    { message: "Pagamento não encontrado" },
    { status: STATUS.NOT_FOUND },
  );

const changeStatus =
  (status, action) =>
  ({ params }) => {
    const found = store.find((p) => p.id === params.id);
    if (!found) return notFound();
    if (found.status !== "PAID") {
      return HttpResponse.json(
        {
          message: `Não é possível ${action} um pagamento com status ${found.status}`,
        },
        { status: STATUS.CONFLICT },
      );
    }
    found.status = status;
    found.updatedAt = new Date().toISOString();
    return HttpResponse.json(found);
  };

export const paymentHandlers = [
  http.get(`${API_URL}${ENDPOINTS.payments.list}`, ({ request }) => {
    const q = new URL(request.url).searchParams;
    const page = Math.max(1, Number(q.get("page")) || 1);
    const status = q.get("status");
    const dateFrom = q.get("dateFrom");
    const dateTo = q.get("dateTo");
    const rows = store
      .filter((p) => !status || p.status === status)
      .filter((p) => !dateFrom || p.createdAt >= dateFrom)
      .filter((p) => !dateTo || p.createdAt <= dateTo)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return HttpResponse.json({
      data: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      meta: { total: rows.length, page },
    });
  }),

  http.post(`${API_URL}${ENDPOINTS.payments.create}`, async ({ request }) => {
    const body = await request.json();
    const items = body.items ?? [];
    const ids = items.map((i) => i.procedureId);
    if (
      !body.paymentMethod?.trim() ||
      items.length === 0 ||
      items.some((i) => !(i.amount > 0)) ||
      new Set(ids).size !== ids.length
    ) {
      return HttpResponse.json(
        { message: "Dados inválidos" },
        { status: STATUS.BAD_REQUEST },
      );
    }
    const missing = ids.filter(
      (id) => !procedureStore.some((p) => p.id === id),
    );
    if (missing.length) {
      return HttpResponse.json(
        { message: `Procedimento(s) não encontrado(s): ${missing.join(", ")}` },
        { status: STATUS.NOT_FOUND },
      );
    }
    const subtotal = items.reduce((sum, i) => sum + toCents(i.amount), 0);
    if (toCents(body.discount ?? 0) > subtotal) {
      return HttpResponse.json(
        { message: "O desconto não pode ser maior que a soma dos itens" },
        { status: STATUS.BAD_REQUEST },
      );
    }
    const created = build(body);
    store.push(created);
    return HttpResponse.json(created, { status: STATUS.CREATED });
  }),

  http.patch(
    `${API_URL}${ENDPOINTS.payments.cancel(":id")}`,
    changeStatus("CANCELED", "cancelar"),
  ),

  http.patch(
    `${API_URL}${ENDPOINTS.payments.refund(":id")}`,
    changeStatus("REFUNDED", "estornar"),
  ),
];
