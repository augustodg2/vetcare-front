import { maskCpf, maskPhone, onlyDigits } from "../lib/format";

// The API speaks `petOwner` / `species` / `birthdate` / `notes`; the pages keep
// the `species` / `birth` / `alerts` names they already use.

export const fromApiPet = (p) => ({
  id: p.id,
  name: p.name,
  species: p.species,
  breed: p.breed,
  sex: p.sex,
  birth: p.birthDate,
  weight: p.weight,
  alerts: p.notes,
  ...(p.petOwner && {
    petOwnerId: p.petOwner.id,
    petOwner: { id: p.petOwner.id, name: p.petOwner.name },
  }),
});

export const fromApiPetOwner = (o) => ({
  id: o.id,
  name: o.name,
  cpf: maskCpf(o.cpf),
  phone: maskPhone(o.phone),
  email: o.email,
  address: o.address,
  pets: (o.pets ?? []).map((p) => ({ ...fromApiPet(p), petOwnerId: o.id })),
});

const toApiNewPet = (p) => ({
  name: p.name,
  species: p.species,
  breed: p.breed,
  sex: p.sex,
  birthDate: p.birth,
  weight: p.weight,
  notes: p.alerts,
});

export const toApiCreatePet = ({ petOwnerId, ...p }) => ({
  ...toApiNewPet(p),
  petOwnerId,
});

export const toApiUpdatePet = toApiNewPet;

export const toApiCreatePetOwner = ({ pet, ...o }) => ({
  name: o.name,
  cpf: onlyDigits(o.cpf),
  phone: onlyDigits(o.phone),
  email: o.email,
  address: o.address,
  ...(pet && { pets: [toApiNewPet(pet)] }),
});

export const toApiUpdatePetOwner = (o) => ({
  name: o.name,
  phone: onlyDigits(o.phone),
  email: o.email,
  address: o.address,
});

// The page keeps its own status names (`ativo` / `convite` / `inativo`).
const USER_STATUS_FROM_API = {
  ACTIVE: "ativo",
  PENDING_INVITE: "convite",
  DEACTIVATED: "inativo",
};

export const fromApiUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: USER_STATUS_FROM_API[u.status] ?? u.status,
  lastSeen: u.lastAccessAt,
  invitedAt: u.inviteSentAt,
  vet: u.vet
    ? { id: u.vet.id, cpf: maskCpf(u.vet.cpf), crmv: u.vet.crmv }
    : null,
});

export const fromApiVet = (v) => ({
  id: v.id,
  name: v.user.name,
  crmv: v.crmv,
});

export const fromApiAppointment = (a) => ({
  id: a.id,
  dateTime: a.dateTime,
  type: a.type,
  status: a.status,
  obs: a.obs,
  pet: { id: a.pet.id, name: a.pet.name, species: a.pet.species },
  vet: { id: a.vet.id, name: a.vet.name },
});

// `dateTime` is a Date (or ISO string); the API wants an ISO 8601 UTC string
export const toApiCreateAppointment = ({
  dateTime,
  type,
  obs,
  petId,
  vetId,
}) => ({
  dateTime: new Date(dateTime).toISOString(),
  type,
  obs: obs?.trim() || undefined,
  petId,
  vetId,
});

// the API accepts only the day/time, type and notes of an existing appointment
export const toApiUpdateAppointment = ({ dateTime, type, obs }) => ({
  dateTime: new Date(dateTime).toISOString(),
  type,
  obs: obs?.trim(),
});

export const fromApiPage = (res, map) => ({
  rows: res.data.map(map),
  total: res.total,
  pageSize: res.pageSize,
});
