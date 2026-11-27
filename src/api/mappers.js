import { onlyDigits } from "@/lib/format";

export const fromApiPet = (p) => ({
  id: p.id,
  name: p.name,
  species: p.species,
  breed: p.breed,
  sex: p.sex,
  birthDate: p.birthDate?.slice(0, 10),
  weight: p.weight,
  notes: p.notes,
  ...(p.petOwner && {
    petOwnerId: p.petOwner.id,
    petOwner: { id: p.petOwner.id, name: p.petOwner.name },
  }),
});

export const fromApiPetOwner = (o) => ({
  id: o.id,
  name: o.name,
  cpf: o.cpf,
  phone: o.phone,
  email: o.email,
  address: o.address,
  pets: (o.pets ?? []).map((p) => ({ ...fromApiPet(p), petOwnerId: o.id })),
});

const toApiNewPet = (p) => ({
  name: p.name,
  species: p.species,
  breed: p.breed,
  sex: p.sex,
  birthDate: p.birthDate,
  weight: p.weight,
  notes: p.notes,
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

export const fromApiUser = (u) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  status: u.status,
  lastAccessAt: u.lastAccessAt,
  inviteSentAt: u.inviteSentAt,
  vet: u.vet ? { id: u.vet.id, cpf: u.vet.cpf, crmv: u.vet.crmv } : null,
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

export const toApiUpdateAppointment = ({ dateTime, type, obs }) => ({
  dateTime: new Date(dateTime).toISOString(),
  type,
  obs: obs?.trim(),
});

export const toApiCreateProcedure = ({
  type,
  notes,
  dateTime,
  petId,
  vetId,
}) => ({
  type,
  notes,
  dateTime: new Date(dateTime).toISOString(),
  petId,
  vetId,
});

export const fromApiProcedure = (p) => ({
  id: p.id,
  type: p.type,
  dateTime: p.dateTime,
  notes: p.notes,
  ...(p.pet && {
    pet: { id: p.pet.id, name: p.pet.name, species: p.pet.species },
  }),
  vet: { id: p.vet.id, name: p.vet.name },
  extraNotes: (p.extraNotes ?? []).map((n) => ({
    id: n.id,
    content: n.content,
    createdAt: n.createdAt,
  })),
});

export const toApiCreatePrescription = ({ content, petId, vetId }) => ({
  content: content.trim(),
  petId,
  vetId,
});

export const fromApiPrescription = (p) => ({
  id: p.id,
  content: p.content,
  createdAt: p.createdAt,
  vet: { id: p.vet?.id, name: p.vet?.name },
});

export const fromApiPayment = (p) => ({
  id: p.id,
  paymentMethod: p.paymentMethod,
  status: p.status,
  discount: p.discount,
  total: p.total,
  notes: p.notes,
  createdAt: p.createdAt,
  items: p.items.map((i) => ({
    id: i.id,
    amount: i.amount,
    description: i.description,
    procedure: {
      id: i.procedure.id,
      type: i.procedure.type,
      dateTime: i.procedure.dateTime,
    },
  })),
});

export const toApiCreatePayment = ({
  paymentMethod,
  discount,
  notes,
  items,
}) => ({
  paymentMethod,
  discount: discount || undefined,
  notes: notes?.trim() || undefined,
  items: items.map((i) => ({ procedureId: i.procedureId, amount: i.amount })),
});

export const fromApiMetaPage = (res, map) => ({
  rows: res.data.map(map),
  total: res.meta.total,
  pageSize: res.meta.pagesize,
});

export const fromApiPage = (res, map) => ({
  rows: res.data.map(map),
  total: res.total,
  pageSize: res.pageSize,
});
