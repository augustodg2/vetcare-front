import dayjs from "dayjs";
import { http, HttpResponse } from "msw";
import { ENDPOINTS } from "@/api/endpoints";
import { STATUS } from "@/api/statusCodes";
import { store as petOwnerStore } from "./petOwners";
import { userFromRequest } from "./users";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
const VET_PAGE_SIZE = 10;
const HISTORY_PAGE_SIZE = 10;

export const vetStore = [
  { id: "v1", crmv: "CRMV-SP 11234", cpf: "52998224725", name: "Camila Rocha" },
  { id: "v2", crmv: "CRMV-SP 20987", cpf: "11144477735", name: "Rafael Nunes" },
  { id: "v3", crmv: "CRMV-SP 33456", cpf: "39053344705", name: "Paula Mendes" },
].map(({ name, ...v }) => ({
  ...v,
  createdAt: new Date().toISOString(),
  deletedAt: null,
  user: { name },
}));

const pets = {
  p1: { id: "p1", name: "Thor", species: "DOG" },
  p2: { id: "p2", name: "Mel", species: "CAT" },
  p3: { id: "p3", name: "Bolt", species: "DOG" },
};

const at = (dayOffset, hour, minute = 0) =>
  dayjs()
    .add(dayOffset, "day")
    .hour(hour)
    .minute(minute)
    .second(0)
    .millisecond(0)
    .toISOString();

const appt = (
  id,
  vetId,
  petId,
  dateTime,
  type,
  status = "ACTIVE",
  obs = null,
) => {
  const vet = vetStore.find((v) => v.id === vetId);
  return {
    id,
    dateTime,
    createdAt: new Date().toISOString(),
    obs,
    status,
    type,
    pet: pets[petId],
    vet: { id: vet.id, name: vet.user.name },
  };
};

const FORBIDDEN_MESSAGE = "Você só pode alterar as suas próprias consultas";

const canManage = (request, appointment) => {
  const caller = userFromRequest(request);
  if (caller?.role !== "VET") return true;
  const ownVet = vetStore.find((v) => v.user.name === caller.name);
  return ownVet?.id === appointment.vet.id;
};

const appointmentStore = {
  appointments: [
    appt("a1", "v1", "p1", at(0, 9), "CONSULTATION", "DONE"),
    appt("a2", "v1", "p2", at(0, 10, 30), "VACCINATION"),
    appt("a3", "v1", "p3", at(0, 14), "RETURN", "ACTIVE", "Revisar curativo"),
    appt("a4", "v2", "p1", at(0, 9, 30), "EXAM"),
    appt("a5", "v2", "p2", at(0, 15), "CONSULTATION"),
    appt("a6", "v2", "p3", at(0, 16), "SURGERY", "CANCELLED"),
    appt("a7", "v3", "p2", at(1, 11), "CONSULTATION"),
    appt("a8", "v1", "p1", at(1, 10), "RETURN"),
  ],
};

export const appointmentHandlers = [
  http.get(`${API_URL}${ENDPOINTS.vets.list}`, ({ request }) => {
    const page = Math.max(
      1,
      Number(new URL(request.url).searchParams.get("page")) || 1,
    );
    return HttpResponse.json({
      data: vetStore.slice((page - 1) * VET_PAGE_SIZE, page * VET_PAGE_SIZE),
      total: vetStore.length,
      page,
      pageSize: VET_PAGE_SIZE,
    });
  }),

  http.get(`${API_URL}${ENDPOINTS.appointments.list}`, ({ request }) => {
    const q = new URL(request.url).searchParams;
    const petId = q.get("petId");
    const from = new Date(q.get("from")).getTime();
    const to = new Date(q.get("to")).getTime();
    const vetId = q.get("vetId");
    const status = q.get("status");
    const type = q.get("type");
    const desc = q.get("order") === "desc";
    const page = q.get("page") && Math.max(1, Number(q.get("page")) || 1);

    const data = appointmentStore.appointments
      .filter((a) => {
        const t = new Date(a.dateTime).getTime();
        return (
          t >= from &&
          t < to &&
          (!vetId || a.vet.id === vetId) &&
          (!petId || a.pet.id === petId) &&
          (!status || a.status === status) &&
          (!type || a.type === type)
        );
      })
      .sort((a, b) =>
        desc
          ? b.dateTime.localeCompare(a.dateTime)
          : a.dateTime.localeCompare(b.dateTime),
      );

    if (!page) return HttpResponse.json({ data, total: data.length });
    return HttpResponse.json({
      data: data.slice((page - 1) * HISTORY_PAGE_SIZE, page * HISTORY_PAGE_SIZE),
      total: data.length,
      page,
      pageSize: HISTORY_PAGE_SIZE,
    });
  }),

  http.patch(
    `${API_URL}${ENDPOINTS.appointments.cancel(":id")}`,
    ({ params, request }) => {
      const found = appointmentStore.appointments.find(
        (a) => a.id === params.id,
      );
      if (!found) {
        return HttpResponse.json(
          { message: "Consulta não encontrada" },
          { status: STATUS.NOT_FOUND },
        );
      }
      if (!canManage(request, found)) {
        return HttpResponse.json(
          { message: FORBIDDEN_MESSAGE },
          { status: STATUS.FORBIDDEN },
        );
      }
      if (found.status !== "ACTIVE") {
        return HttpResponse.json(
          {
            message:
              found.status === "CANCELLED"
                ? "A consulta já está cancelada"
                : "Uma consulta concluída não pode ser cancelada",
          },
          { status: STATUS.BAD_REQUEST },
        );
      }
      found.status = "CANCELLED";
      return HttpResponse.json(found);
    },
  ),

  http.patch(
    `${API_URL}${ENDPOINTS.appointments.complete(":id")}`,
    ({ params, request }) => {
      const fail = (status, message) =>
        HttpResponse.json({ message }, { status });
      const found = appointmentStore.appointments.find(
        (a) => a.id === params.id,
      );
      if (!found) return fail(STATUS.NOT_FOUND, "Consulta não encontrada");
      if (!canManage(request, found))
        return fail(STATUS.FORBIDDEN, FORBIDDEN_MESSAGE);
      if (found.status === "DONE")
        return fail(STATUS.BAD_REQUEST, "A consulta já está concluída");
      if (found.status === "CANCELLED") {
        return fail(
          STATUS.BAD_REQUEST,
          "Uma consulta cancelada não pode ser concluída",
        );
      }
      if (new Date(found.dateTime).getTime() > Date.now()) {
        return fail(
          STATUS.BAD_REQUEST,
          "Não é possível concluir uma consulta que ainda não começou",
        );
      }
      found.status = "DONE";
      return HttpResponse.json(found);
    },
  ),

  http.patch(
    `${API_URL}${ENDPOINTS.appointments.byId(":id")}`,
    async ({ params, request }) => {
      const { dateTime, type, obs } = await request.json();
      const fail = (status, message) =>
        HttpResponse.json({ message }, { status });

      const found = appointmentStore.appointments.find(
        (a) => a.id === params.id,
      );
      if (!found) return fail(STATUS.NOT_FOUND, "Consulta não encontrada");
      if (!canManage(request, found))
        return fail(STATUS.FORBIDDEN, FORBIDDEN_MESSAGE);
      if (found.status !== "ACTIVE") {
        return fail(
          STATUS.BAD_REQUEST,
          "Apenas consultas ativas podem ser alteradas",
        );
      }
      if (dateTime !== undefined) {
        const when = new Date(dateTime);
        if (when.getTime() <= Date.now()) {
          return fail(STATUS.BAD_REQUEST, "A data da consulta deve ser futura");
        }
        const taken = appointmentStore.appointments.some(
          (a) =>
            a.id !== found.id &&
            a.vet.id === found.vet.id &&
            a.status === "ACTIVE" &&
            new Date(a.dateTime).getTime() === when.getTime(),
        );
        if (taken) {
          return fail(
            STATUS.CONFLICT,
            "O veterinário já possui uma consulta nesse horário",
          );
        }
        found.dateTime = when.toISOString();
      }
      if (type !== undefined) found.type = type;
      if (obs !== undefined) found.obs = obs || null;
      return HttpResponse.json(found);
    },
  ),

  http.post(
    `${API_URL}${ENDPOINTS.appointments.create}`,
    async ({ request }) => {
      const body = await request.json();
      const { dateTime, type, obs, petId } = body;
      const caller = userFromRequest(request);
      const ownVet =
        caller?.role === "VET" &&
        vetStore.find((v) => v.user.name === caller.name);
      const vetId = ownVet ? ownVet.id : body.vetId;
      const fail = (status, message) =>
        HttpResponse.json({ message }, { status });

      const when = new Date(dateTime);
      if (when.getTime() <= Date.now()) {
        return fail(STATUS.BAD_REQUEST, "A data da consulta deve ser futura");
      }
      const pet = petOwnerStore.petOwners
        .filter((o) => !o.deletedAt)
        .flatMap((o) => o.pets)
        .find((p) => p.id === petId);
      if (!pet) return fail(STATUS.NOT_FOUND, "Pet não encontrado");
      const vet = vetStore.find((v) => v.id === vetId);
      if (!vet) return fail(STATUS.NOT_FOUND, "Veterinário não encontrado");

      const taken = appointmentStore.appointments.some(
        (a) =>
          a.vet.id === vetId &&
          a.status === "ACTIVE" &&
          new Date(a.dateTime).getTime() === when.getTime(),
      );
      if (taken) {
        return fail(
          STATUS.CONFLICT,
          "O veterinário já possui uma consulta nesse horário",
        );
      }

      const created = {
        id: `a${Date.now()}`,
        dateTime: when.toISOString(),
        createdAt: new Date().toISOString(),
        obs: obs ?? null,
        status: "ACTIVE",
        type,
        pet: { id: pet.id, name: pet.name, species: pet.species },
        vet: { id: vet.id, name: vet.user.name },
      };
      appointmentStore.appointments.push(created);
      return HttpResponse.json(created, { status: STATUS.CREATED });
    },
  ),
];
