import { http, HttpResponse } from "msw";
import { ENDPOINTS } from "@/api/endpoints";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
const PAGE_SIZE = 8;

const digits = (v = "") => v.replace(/\D/g, "");

const pet = (id, name, species, breed, sex, birthDate, weight, notes = "") => ({
  id,
  name,
  species,
  breed,
  sex,
  birthDate,
  weight,
  notes,
});

export const store = {
  petOwners: [
    {
      id: "po1",
      name: "Marina Ribeiro",
      cpf: "31245789012",
      phone: "11987654321",
      email: "marina.ribeiro@email.com",
      address: "Rua Harmonia, 412 · Vila Madalena, São Paulo",
      pets: [
        pet(
          "p1",
          "Thor",
          "DOG",
          "Golden Retriever",
          "M",
          "2019-03-12",
          32.5,
          "Alergia a dipirona",
        ),
        pet("p2", "Mel", "CAT", "SRD", "F", "2021-07-02", 4.2),
      ],
    },
    {
      id: "po2",
      name: "Carlos Mota",
      cpf: "45678912345",
      phone: "1133224455",
      email: "carlos.mota@email.com",
      address: "",
      pets: [pet("p3", "Bolt", "DOG", "Border Collie", "M", "2020-11-20", 18)],
    },
    {
      id: "po3",
      name: "Ana Souza",
      cpf: "12345678909",
      phone: "11965432109",
      email: "ana.souza@email.com",
      address: "Rua Cardeal Arcoverde, 1540 · Pinheiros, São Paulo",
      pets: [
        pet(
          "p4",
          "Luna",
          "CAT",
          "Siamês",
          "F",
          "2010-05-30",
          3.8,
          "Doença renal crônica",
        ),
        pet("p5", "Pipoca", "CAT", "SRD", "M", null, null),
      ],
    },
    {
      id: "po4",
      name: "Roberto Lima",
      cpf: "98765432100",
      phone: "11991234567",
      email: "roberto.lima@email.com",
      address: "Av. Pompeia, 870 · Pompeia, São Paulo",
      pets: [
        pet(
          "p6",
          "Amora",
          "DOG",
          "Shih Tzu",
          "F",
          "2015-09-14",
          7.1,
          "Cardiopata: sopro grau II",
        ),
      ],
    },
  ],
};

export const petSummary = (id) => {
  const found = store.petOwners.flatMap((o) => o.pets).find((p) => p.id === id);
  return found && { id: found.id, name: found.name, species: found.species };
};

const matches = (search, ...fields) => {
  const s = search.trim().toLowerCase();
  if (!s) return true;
  const d = digits(s);
  return fields.some((f) => {
    const v = String(f ?? "").toLowerCase();
    return v.includes(s) || (d.length >= 3 && digits(v).includes(d));
  });
};

let nextId = 1000;

const badRequest = (message) =>
  HttpResponse.json({ statusCode: 400, message }, { status: 400 });

const notFound = (message) =>
  HttpResponse.json({ statusCode: 404, message }, { status: 404 });

const findPet = (id) => {
  for (const { pets, ...petOwner } of store.petOwners) {
    if (petOwner.deletedAt) continue;
    const pet = pets.find((p) => p.id === id);
    if (pet) return { pet, petOwner };
  }
};

const validatePet = (p) => {
  if (!p.name?.trim() || !p.species || !p.breed?.trim())
    return "name, species and breed are required";
  if (p.weight != null && (typeof p.weight !== "number" || p.weight < 0))
    return "weight must be a positive number";
};

export const petHandlers = [
  http.post(`${API_URL}${ENDPOINTS.pets.create}`, async ({ request }) => {
    const { petOwnerId, ...data } = await request.json();
    const error =
      validatePet(data) ?? (!petOwnerId && "petOwnerId is required");
    if (error) return badRequest(error);

    const petOwner = store.petOwners.find(
      (o) => o.id === petOwnerId && !o.deletedAt,
    );
    if (!petOwner) return notFound("Pet owner not found");

    const pet = { notes: "", ...data, id: `p${nextId++}` };
    petOwner.pets.push(pet);
    const { pets, ...petOwnerData } = petOwner;
    return HttpResponse.json(
      { ...pet, petOwner: petOwnerData },
      { status: 201 },
    );
  }),

  http.get(`${API_URL}${ENDPOINTS.pets.byId(":id")}`, ({ params }) => {
    const found = findPet(params.id);
    if (!found) return notFound("Pet not found");
    return HttpResponse.json({ ...found.pet, petOwner: found.petOwner });
  }),

  http.patch(
    `${API_URL}${ENDPOINTS.pets.byId(":id")}`,
    async ({ params, request }) => {
      const found = findPet(params.id);
      if (!found) return notFound("Pet not found");

      const { name, species, breed, sex, birthDate, weight, notes } =
        await request.json();
      const data = { name, species, breed, sex, birthDate, weight, notes };
      const error = validatePet(data);
      if (error) return badRequest(error);

      Object.assign(found.pet, data, { notes: notes ?? "" });
      return HttpResponse.json({ ...found.pet, petOwner: found.petOwner });
    },
  ),

  http.delete(`${API_URL}${ENDPOINTS.pets.byId(":id")}`, ({ params }) => {
    const found = findPet(params.id);
    if (!found) return notFound("Pet not found");
    const petOwner = store.petOwners.find((o) => o.id === found.petOwner.id);
    petOwner.pets = petOwner.pets.filter((p) => p.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_URL}${ENDPOINTS.pets.list}`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

    const found = store.petOwners
      .filter((o) => !o.deletedAt)
      .flatMap(({ pets, ...petOwner }) => pets.map((p) => ({ ...p, petOwner })))
      .filter((p) =>
        matches(search, p.name, p.breed, p.petOwner.name, p.petOwner.cpf),
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    return HttpResponse.json({
      data: found.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      total: found.length,
      page,
      pageSize: PAGE_SIZE,
    });
  }),
];

export const petOwnerHandlers = [
  http.post(`${API_URL}${ENDPOINTS.petOwners.create}`, async ({ request }) => {
    const {
      name,
      cpf,
      phone,
      email,
      address,
      pets = [],
    } = await request.json();

    if (!name?.trim() || !email?.trim())
      return badRequest("name and email are required");
    if (!/^\d{11}$/.test(cpf ?? "")) return badRequest("cpf must be 11 digits");
    if (!/^\d{10,11}$/.test(phone ?? ""))
      return badRequest("phone must be 10 or 11 digits");
    if (pets.some((p) => !p.name?.trim() || !p.species || !p.breed))
      return badRequest("invalid pet");

    if (store.petOwners.some((o) => !o.deletedAt && o.cpf === cpf))
      return HttpResponse.json(
        { statusCode: 409, message: "Já existe um tutor com esse CPF." },
        { status: 409 },
      );

    const petOwner = {
      id: `po${nextId++}`,
      name,
      cpf,
      phone,
      email,
      address: address ?? "",
      pets: pets.map((p) => ({ notes: "", ...p, id: `p${nextId++}` })),
    };
    store.petOwners.push(petOwner);
    return HttpResponse.json(petOwner, { status: 201 });
  }),

  http.patch(
    `${API_URL}${ENDPOINTS.petOwners.byId(":id")}`,
    async ({ params, request }) => {
      const petOwner = store.petOwners.find((o) => o.id === params.id);
      if (!petOwner || petOwner.deletedAt) {
        return HttpResponse.json(
          { statusCode: 404, message: "Pet owner not found" },
          { status: 404 },
        );
      }

      const { name, phone, email, address } = await request.json();

      if (!name?.trim() || !email?.trim())
        return badRequest("name and email are required");
      if (!/^\d{10,11}$/.test(phone ?? ""))
        return badRequest("phone must be 10 or 11 digits");

      Object.assign(petOwner, { name, phone, email, address: address ?? "" });
      return HttpResponse.json(petOwner);
    },
  ),

  http.delete(`${API_URL}${ENDPOINTS.petOwners.byId(":id")}`, ({ params }) => {
    const petOwner = store.petOwners.find((o) => o.id === params.id);
    if (!petOwner || petOwner.deletedAt) return notFound("Pet owner not found");
    petOwner.deletedAt = new Date().toISOString();
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API_URL}${ENDPOINTS.petOwners.list}`, ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

    const found = store.petOwners
      .filter((o) => !o.deletedAt)
      .filter((o) =>
        matches(search, o.name, o.phone, o.cpf, ...o.pets.map((p) => p.name)),
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    return HttpResponse.json({
      data: found.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      total: found.length,
      page,
      pageSize: PAGE_SIZE,
    });
  }),

  http.get(`${API_URL}${ENDPOINTS.petOwners.byId(":id")}`, ({ params }) => {
    const petOwner = store.petOwners.find((o) => o.id === params.id);
    if (!petOwner || petOwner.deletedAt) {
      return HttpResponse.json(
        { statusCode: 404, message: "Pet owner not found" },
        { status: 404 },
      );
    }
    return HttpResponse.json(petOwner);
  }),
];
