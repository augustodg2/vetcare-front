import { http, HttpResponse } from "msw";
import { ENDPOINTS } from "@/api/endpoints";
import { STATUS } from "@/api/statusCodes";
import { dayAt, todayFromNow } from "../dates";
import { vetStore, vetSummary } from "../vets";
import { petSummary } from "./petOwners";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
const PAGE_SIZE = 20;

let nextId = 1;
const prescription = (petId, vetId, createdAt, content) => ({
  id: `rx${nextId++}`,
  content,
  createdAt,
  pet: petSummary(petId),
  vet: vetSummary(vetId),
});

const ol = (items) =>
  `<ol>${items.map((i) => `<li><p>${i}</p></li>`).join("")}</ol>`;

const store = [
  prescription(
    "p1",
    "v1",
    todayFromNow(-135),
    "<h3>Uso tópico</h3>" +
      ol([
        "<strong>Otomax</strong> (gentamicina + betametasona + clotrimazol): aplicar 8 gotas em cada ouvido a cada 12 h por 14 dias.",
        "<strong>Solução de limpeza otológica</strong>: limpar os condutos 1 vez ao dia, 15 min antes do medicamento.",
      ]) +
      "<h3>Orientações ao tutor</h3>" +
      "<p>Não usar hastes flexíveis. Retorno em 15 dias.</p>",
  ),
  prescription(
    "p3",
    "v2",
    dayAt(-14, 15, 40),
    "<h3>Uso oral</h3>" +
      ol([
        "<strong>Meloxicam 2 mg</strong>: 1 comprimido a cada 24 h por 5 dias, após a refeição.",
      ]) +
      "<h3>Orientações ao tutor</h3>" +
      "<p>Repouso por 10 dias: só passeios curtos na guia, sem correr ou pular. Retorno em 2 semanas.</p>",
  ),
  prescription(
    "p4",
    "v2",
    dayAt(-60, 12),
    "<h3>Uso oral</h3>" +
      ol([
        "<strong>Amoxicilina + clavulanato 62,5 mg</strong>: 1 comprimido a cada 12 h por 7 dias.",
      ]) +
      "<h3>Orientações ao tutor</h3>" +
      "<p>Alimentação pastosa por 7 dias.</p>",
  ),
];

export const prescriptionHandlers = [
  http.get(`${API_URL}${ENDPOINTS.prescriptions.list}`, ({ request }) => {
    const q = new URL(request.url).searchParams;
    const page = Math.max(1, Number(q.get("page")) || 1);
    const petId = q.get("petId");
    const vetId = q.get("vetId");
    const rows = store
      .filter((p) => !petId || p.pet.id === petId)
      .filter((p) => !vetId || p.vet.id === vetId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return HttpResponse.json({
      data: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
      meta: {
        total: rows.length,
        page,
        pagesize: PAGE_SIZE,
        totalPages: Math.ceil(rows.length / PAGE_SIZE),
      },
    });
  }),

  http.get(`${API_URL}${ENDPOINTS.prescriptions.byId(":id")}`, ({ params }) => {
    const found = store.find((p) => p.id === params.id);
    if (!found) {
      return HttpResponse.json(
        { message: "Prescrição não encontrada" },
        { status: STATUS.NOT_FOUND },
      );
    }
    return HttpResponse.json(found);
  }),

  http.post(
    `${API_URL}${ENDPOINTS.prescriptions.create}`,
    async ({ request }) => {
      const { content, petId, vetId } = await request.json();
      if (!content?.trim() || !petId || !vetId) {
        return HttpResponse.json(
          { message: "Dados inválidos" },
          { status: STATUS.BAD_REQUEST },
        );
      }
      const vet = vetStore.find((v) => v.id === vetId);
      if (!vet) {
        return HttpResponse.json(
          { message: "Veterinário não encontrado" },
          { status: STATUS.NOT_FOUND },
        );
      }
      const created = {
        id: `rx${nextId++}`,
        content,
        createdAt: new Date().toISOString(),
        pet: petSummary(petId),
        vet: { id: vet.id, name: vet.user.name },
      };
      store.push(created);
      return HttpResponse.json(created, { status: STATUS.CREATED });
    },
  ),
];
