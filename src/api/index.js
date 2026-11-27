import { ENDPOINTS } from "./endpoints";
import { onlyDigits } from "../lib/format";
import { http } from "./http";
import {
  fromApiAppointment,
  fromApiMetaPage,
  fromApiPage,
  fromApiProcedure,
  fromApiVet,
  fromApiPet,
  fromApiPetOwner,
  fromApiUser,
  toApiCreateAppointment,
  toApiCreateProcedure,
  toApiUpdateAppointment,
  toApiCreatePet,
  toApiCreatePetOwner,
  toApiUpdatePet,
  toApiUpdatePetOwner,
} from "./mappers";

// Serviços do VetCare. As telas só chamam estas funções, todas assíncronas e
// ligadas à API real (http.js + ENDPOINTS). O README desta pasta lista as rotas.

// ============================== autenticação ==============================

export const auth = {
  login: ({ email, password }) =>
    http.post(ENDPOINTS.auth.login, { email, password }),
  me: () => http.get(ENDPOINTS.users.me),
  acceptInvite: (token, { password }) =>
    http.post(ENDPOINTS.auth.acceptInvite(token), { password }),
};

// ============================== usuários ==============================
export const users = {
  list: async ({ search, page, status } = {}) =>
    fromApiPage(
      await http.get(ENDPOINTS.users.list, {
        search,
        page,
        status: status?.join(","),
      }),
      fromApiUser,
    ),
  invite: ({ name, email, role }) =>
    http.post(ENDPOINTS.users.invite, { name, email, role }),
  update: (id, { name, role }) =>
    http.patch(ENDPOINTS.users.byId(id), { name, role }),
  deactivate: (id) => http.post(ENDPOINTS.users.deactivate(id)),
};

// ============================== veterinários ==============================
export const vets = {
  list: async ({ search, page } = {}) =>
    fromApiPage(
      await http.get(ENDPOINTS.vets.list, { search, page }),
      fromApiVet,
    ),
  listAll: async () => {
    const first = await vets.list({ page: 1 });
    const pages = Math.ceil(first.total / first.pageSize);
    const rest = await Promise.all(
      Array.from({ length: Math.max(pages - 1, 0) }, (_, i) =>
        vets.list({ page: i + 2 }),
      ),
    );
    return [first, ...rest].flatMap((p) => p.rows);
  },
  create: ({ userId, cpf, crmv }) =>
    http.post(ENDPOINTS.vets.create, { userId, cpf: onlyDigits(cpf), crmv }),
  remove: (id) => http.delete(ENDPOINTS.vets.byId(id)),
};

// ============================== tutores e pacientes ==============================
export const petOwners = {
  list: async ({ search, page } = {}) =>
    fromApiPage(
      await http.get(ENDPOINTS.petOwners.list, { search, page }),
      fromApiPetOwner,
    ),
  get: async (id) =>
    fromApiPetOwner(await http.get(ENDPOINTS.petOwners.byId(id))),
  create: async (data) =>
    fromApiPetOwner(
      await http.post(ENDPOINTS.petOwners.create, toApiCreatePetOwner(data)),
    ),
  update: async (id, data) =>
    fromApiPetOwner(
      await http.patch(ENDPOINTS.petOwners.byId(id), toApiUpdatePetOwner(data)),
    ),
  remove: (id) => http.delete(ENDPOINTS.petOwners.byId(id)),
};

export const pets = {
  list: async ({ search, page } = {}) =>
    fromApiPage(
      await http.get(ENDPOINTS.pets.list, { search, page }),
      fromApiPet,
    ),
  get: async (id) => fromApiPet(await http.get(ENDPOINTS.pets.byId(id))),
  create: async (data) =>
    fromApiPet(await http.post(ENDPOINTS.pets.create, toApiCreatePet(data))),
  update: async (id, data) =>
    fromApiPet(await http.patch(ENDPOINTS.pets.byId(id), toApiUpdatePet(data))),
  remove: (id) => http.delete(ENDPOINTS.pets.byId(id)),
};

export const appointments = {
  list: async ({ from, to, vetId, status } = {}) => {
    const res = await http.get(ENDPOINTS.appointments.list, {
      from,
      to,
      vetId,
      status,
    });
    return res.data.map(fromApiAppointment);
  },
  byPet: async (petId, { from, to, status, order, page } = {}) =>
    fromApiPage(
      await http.get(ENDPOINTS.appointments.list, {
        petId,
        from,
        to,
        status,
        order,
        page,
      }),
      fromApiAppointment,
    ),
  update: async (id, data) =>
    fromApiAppointment(
      await http.patch(
        ENDPOINTS.appointments.byId(id),
        toApiUpdateAppointment(data),
      ),
    ),
  cancel: async (id) =>
    fromApiAppointment(await http.patch(ENDPOINTS.appointments.cancel(id))),
  create: async (data) =>
    fromApiAppointment(
      await http.post(
        ENDPOINTS.appointments.create,
        toApiCreateAppointment(data),
      ),
    ),
};

export const procedures = {
  list: async ({ petId, type, page } = {}) =>
    fromApiMetaPage(
      await http.get(ENDPOINTS.procedures.list, { petId, type, page }),
      fromApiProcedure,
    ),
  get: async (id) =>
    fromApiProcedure(await http.get(ENDPOINTS.procedures.byId(id))),
  create: async (data) =>
    fromApiProcedure(
      await http.post(ENDPOINTS.procedures.create, toApiCreateProcedure(data)),
    ),
  addNote: async (id, content) =>
    fromApiProcedure(
      await http.post(ENDPOINTS.procedures.notes(id), {
        content: content.trim(),
      }),
    ),
};

export const api = {
  auth,
  users,
  vets,
  appointments,
  petOwners,
  pets,
  procedures,
};
