import { http, HttpResponse } from "msw";
import { ENDPOINTS } from "@/api/endpoints";
import { STATUS } from "@/api/statusCodes";
import { dayAt, todayFromNow } from "../dates";
import { vetStore, vetSummary } from "../vets";
import { petSummary } from "./petOwners";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
const PAGE_SIZE = 10;

let nextId = 1;
const procedure = (petId, vetId, type, dateTime, notes, extraNotes = []) => {
  const id = `pr${nextId++}`;
  return {
    id,
    type,
    notes,
    dateTime,
    createdAt: dateTime,
    pet: petSummary(petId),
    vet: vetSummary(vetId),
    extraNotes: extraNotes.map(([content, createdAt], i) => ({
      id: `pn-${id}-${i}`,
      content,
      createdAt,
    })),
  };
};

const paragraph = (text) => `<p>${text}</p>`;
const list = (items) =>
  `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
const consultation = ({
  anamnesis,
  parameters,
  assessment,
  diagnosis,
  prognosis,
}) =>
  [
    "<h3>Anamnese</h3>",
    paragraph(anamnesis),
    "<h3>Parâmetros aferidos / avaliação clínica</h3>",
    list(parameters),
    assessment ? paragraph(assessment) : "",
    "<h3>Diagnóstico</h3>",
    paragraph(diagnosis),
    "<h3>Prognóstico</h3>",
    paragraph(prognosis),
  ].join("");

export const procedureStore = [
  procedure(
    "p1",
    "v1",
    "CONSULTATION",
    todayFromNow(-150),
    consultation({
      anamnesis:
        "Tutora relata coceira intensa nas orelhas há cerca de uma semana, com balançar de cabeça frequente e odor forte. Sem alteração de apetite. Banho em pet shop há 10 dias.",
      parameters: [
        "Temperatura retal: 38,7 °C",
        "FC: 104 bpm · FR: 24 mpm",
        "Mucosas normocoradas, TPC &lt; 2 s",
        "Peso: 32,5 kg · escore corporal 5/9",
      ],
      assessment:
        "Conduto auditivo bilateral eritematoso, com secreção ceruminosa acastanhada. Dor à manipulação do pavilhão direito. Membrana timpânica íntegra à otoscopia.",
      diagnosis:
        "Otite externa bilateral, provavelmente por <strong>Malassezia</strong> (citologia solicitada).",
      prognosis:
        "Bom, com tratamento tópico por 14 dias e limpeza dos condutos. Retorno em 15 dias.",
    }),
    [
      [
        "Tutora orientada sobre a limpeza dos condutos antes de cada aplicação.",
        todayFromNow(-130),
      ],
    ],
  ),
  procedure(
    "p1",
    "v1",
    "EXAM",
    todayFromNow(-140),
    paragraph(
      "Citologia otológica: <strong>Malassezia</strong> em grande quantidade, sem bactérias em bastonete.",
    ),
  ),
  procedure(
    "p2",
    "v1",
    "VACCINATION",
    todayFromNow(-80),
    paragraph("V5 felina anual aplicada. Sem reações."),
  ),
  procedure(
    "p3",
    "v2",
    "CONSULTATION",
    dayAt(-14, 15, 10),
    consultation({
      anamnesis:
        "Tutor relata que o Bolt começou a mancar da pata traseira esquerda depois de uma corrida no parque, há 2 dias. Come e brinca normalmente.",
      parameters: [
        "Temperatura retal: 38,5 °C",
        "FC: 96 bpm · FR: 22 mpm",
        "Peso: 18 kg · escore corporal 5/9",
      ],
      assessment:
        "Claudicação grau II no membro pélvico esquerdo, com dor à palpação da musculatura da coxa. Testes de gaveta e de compressão tibial negativos.",
      diagnosis: "Distensão muscular no membro pélvico esquerdo.",
      prognosis:
        "Bom. Anti-inflamatório por 5 dias, repouso de 10 dias e retorno em 2 semanas.",
    }),
  ),
  procedure(
    "p1",
    "v3",
    "VACCINATION",
    dayAt(-40, 15),
    paragraph("V10 anual aplicada. Sem reações."),
  ),
  procedure(
    "p2",
    "v2",
    "CONSULTATION",
    dayAt(-7, 10, 20),
    consultation({
      anamnesis:
        "Perda de apetite há 2 dias, mais quieta que o normal. Sem vômitos. Mudança recente de casa.",
      parameters: [
        "Temperatura retal: 39,1 °C",
        "Desidratação estimada em 5%",
        "Mucosas levemente hipocoradas",
        "Peso: 4,0 kg (perdeu 200 g)",
      ],
      assessment: "Abdômen sem dor à palpação. Solicitado ultrassom abdominal.",
      diagnosis: "Hiporexia, provavelmente associada a estresse ambiental.",
      prognosis:
        "Bom. Fluidoterapia subcutânea, estimulante de apetite e reavaliação em 48 h.",
    }),
    [
      ["Ultrassom abdominal sem alterações.", dayAt(-6, 16)],
      ["Voltou a comer normalmente.", dayAt(-5, 9)],
    ],
  ),
  procedure(
    "p4",
    "v2",
    "SURGERY",
    dayAt(-60, 9),
    paragraph(
      "Tratamento periodontal sob anestesia, com extração de dois dentes. Fluidoterapia reforçada pela doença renal crônica.",
    ) +
      list([
        "Alimentação pastosa por 7 dias",
        "Evitar anti-inflamatórios não esteroidais",
      ]),
    [["Ligação de acompanhamento: comendo bem e sem dor.", dayAt(-59, 16)]],
  ),
];

export const procedureHandlers = [
  http.get(`${API_URL}${ENDPOINTS.procedures.list}`, ({ request }) => {
    const q = new URL(request.url).searchParams;
    const page = Math.max(1, Number(q.get("page")) || 1);
    const petId = q.get("petId");
    const type = q.get("type");
    const dateFrom = q.get("dateFrom");
    const dateTo = q.get("dateTo");
    const rows = procedureStore
      .filter((p) => !petId || p.pet.id === petId)
      .filter((p) => !type || p.type === type)
      .filter((p) => !dateFrom || p.dateTime >= dateFrom)
      .filter((p) => !dateTo || p.dateTime <= dateTo)
      .sort((a, b) => b.dateTime.localeCompare(a.dateTime));
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

  http.get(`${API_URL}${ENDPOINTS.procedures.byId(":id")}`, ({ params }) => {
    const found = procedureStore.find((p) => p.id === params.id);
    if (!found) {
      return HttpResponse.json(
        { message: "Procedimento não encontrado" },
        { status: STATUS.NOT_FOUND },
      );
    }
    return HttpResponse.json(found);
  }),

  http.post(
    `${API_URL}${ENDPOINTS.procedures.notes(":id")}`,
    async ({ params, request }) => {
      const found = procedureStore.find((p) => p.id === params.id);
      if (!found) {
        return HttpResponse.json(
          { message: "Procedimento não encontrado" },
          { status: STATUS.NOT_FOUND },
        );
      }
      const { content } = await request.json();
      if (!content?.trim()) {
        return HttpResponse.json(
          { message: "Dados inválidos" },
          { status: STATUS.BAD_REQUEST },
        );
      }
      found.extraNotes.push({
        id: `pn${nextId++}`,
        content,
        createdAt: new Date().toISOString(),
      });
      return HttpResponse.json(found, { status: STATUS.CREATED });
    },
  ),

  http.post(`${API_URL}${ENDPOINTS.procedures.create}`, async ({ request }) => {
    const { type, notes, dateTime, petId, vetId } = await request.json();
    if (!type || !notes?.trim() || !dateTime || !petId || !vetId) {
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
      id: `pr${nextId++}`,
      type,
      notes,
      dateTime,
      createdAt: new Date().toISOString(),
      pet: petSummary(petId),
      vet: { id: vet.id, name: vet.user.name },
      extraNotes: [],
    };
    procedureStore.push(created);
    return HttpResponse.json(created, { status: STATUS.CREATED });
  }),
];
