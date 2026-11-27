import dayjs from "dayjs";
import { http, HttpResponse } from "msw";
import { ENDPOINTS } from "@/api/endpoints";
import { STATUS } from "@/api/statusCodes";
import { vetStore } from "./appointments";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
const PAGE_SIZE = 10;

const pets = {
  p1: { id: "p1", name: "Thor", species: "DOG" },
  p2: { id: "p2", name: "Mel", species: "CAT" },
  p3: { id: "p3", name: "Bolt", species: "DOG" },
};

const daysAgo = (n, hour = 10) =>
  dayjs()
    .subtract(n, "day")
    .hour(hour)
    .minute(0)
    .second(0)
    .millisecond(0)
    .toISOString();

let nextId = 1;
const procedure = (
  petId,
  vetId,
  type,
  ago,
  notes,
  extraNotes = [],
  hour = 10,
) => {
  const vet = vetStore.find((v) => v.id === vetId);
  const dateTime = daysAgo(ago, hour);
  return {
    id: `pr${nextId++}`,
    type,
    notes,
    dateTime,
    createdAt: dateTime,
    pet: pets[petId],
    vet: { id: vet.id, name: vet.user.name },
    extraNotes: extraNotes.map(([content, after], i) => ({
      id: `pn${nextId}-${i}`,
      content,
      createdAt: daysAgo(ago - after, 16),
    })),
  };
};

const para = (text) => `<p>${text}</p>`;
const list = (items) =>
  `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
const consultation = ({
  anamnese,
  parametros,
  avaliacao,
  diagnostico,
  prognostico,
}) =>
  [
    "<h3>Anamnese</h3>",
    para(anamnese),
    "<h3>Parâmetros aferidos / avaliação clínica</h3>",
    list(parametros),
    avaliacao ? para(avaliacao) : "",
    "<h3>Diagnóstico</h3>",
    para(diagnostico),
    "<h3>Prognóstico</h3>",
    para(prognostico),
  ].join("");

export const procedureStore = [
  procedure(
    "p2",
    "v2",
    "VACCINATION",
    0,
    para("V5 felina anual aplicada. Sem reações."),
    [],
    9,
  ),
  procedure(
    "p3",
    "v1",
    "RETURN",
    0,
    para("Retorno da distensão muscular. Sem claudicação, alta."),
    [],
    10,
  ),
  procedure(
    "p3",
    "v1",
    "EXAM",
    0,
    para("Radiografia do membro pélvico esquerdo sem alterações."),
    [],
    11,
  ),
  procedure(
    "p1",
    "v1",
    "CONSULTATION",
    6,
    consultation({
      anamnese:
        "Tutora relata coceira intensa nas orelhas há cerca de uma semana, com balançar de cabeça frequente e odor forte. Sem alteração de apetite. Banho em pet shop há 10 dias.",
      parametros: [
        "Temperatura retal: 38,7 °C",
        "FC: 104 bpm · FR: 24 mpm",
        "Mucosas normocoradas, TPC &lt; 2 s",
        "Peso: 32,4 kg · escore corporal 5/9",
      ],
      avaliacao:
        "Conduto auditivo bilateral eritematoso, com secreção ceruminosa acastanhada. Dor à manipulação do pavilhão direito. Membrana timpânica íntegra à otoscopia.",
      diagnostico:
        "Otite externa bilateral, provavelmente por <strong>Malassezia</strong> (citologia solicitada).",
      prognostico:
        "Bom, com tratamento tópico por 14 dias e limpeza dos condutos. Retorno em 15 dias.",
    }),
    [["Tutora relatou melhora da coceira após 3 dias.", 3]],
  ),
  procedure(
    "p1",
    "v1",
    "EXAM",
    6,
    para(
      "Citologia otológica: <strong>Malassezia</strong> em grande quantidade, sem bactérias em bastonete.",
    ),
  ),
  procedure(
    "p1",
    "v2",
    "VACCINATION",
    40,
    para("V10 anual aplicada. Sem reações."),
  ),
  procedure("p1", "v2", "VACCINATION", 41, para("Antirrábica anual aplicada.")),
  procedure(
    "p1",
    "v1",
    "RETURN",
    75,
    para("Retorno pós-castração. Pontos retirados, cicatrização boa."),
  ),
  procedure(
    "p1",
    "v3",
    "SURGERY",
    85,
    para("Orquiectomia eletiva sem intercorrências. Alta no mesmo dia.") +
      list([
        "Meloxicam 0,1 mg/kg a cada 24 h por 3 dias",
        "Colar elisabetano por 10 dias",
      ]),
    [
      ["Ligação de acompanhamento: animal comendo e ativo.", 1],
      ["Tutora enviou foto da incisão, sem sinais de infecção.", 4],
    ],
  ),
  procedure(
    "p1",
    "v3",
    "EXAM",
    92,
    para("Hemograma e bioquímico pré-operatórios dentro da normalidade."),
  ),
  procedure(
    "p1",
    "v1",
    "CONSULTATION",
    95,
    consultation({
      anamnese:
        "Tutor deseja castração eletiva. Animal sem queixas, vacinação em dia, vermifugado há 2 meses.",
      parametros: [
        "Temperatura retal: 38,5 °C",
        "FC: 96 bpm · FR: 20 mpm",
        "Ausculta cardiopulmonar sem alterações",
        "Peso: 31,8 kg",
      ],
      diagnostico: "Animal hígido, apto para procedimento anestésico (ASA I).",
      prognostico: "Excelente. Solicitados exames pré-operatórios.",
    }),
  ),
  procedure(
    "p1",
    "v2",
    "CONSULTATION",
    160,
    consultation({
      anamnese:
        "Dois episódios de vômito nos últimos 3 dias, logo após a troca brusca de ração. Fezes pastosas. Segue ativo e bebendo água.",
      parametros: [
        "Temperatura retal: 38,9 °C",
        "Hidratação adequada",
        "Abdômen sem dor à palpação",
      ],
      diagnostico: "Gastroenterite alimentar leve por troca abrupta de dieta.",
      prognostico:
        "Bom. Orientada transição gradual de 7 dias e dieta leve por 48 h.",
    }),
  ),
  procedure("p1", "v2", "VACCINATION", 400, para("V10 anual aplicada.")),
  procedure(
    "p1",
    "v2",
    "VACCINATION",
    401,
    para("Antirrábica anual aplicada."),
  ),
  procedure(
    "p1",
    "v1",
    "CONSULTATION",
    420,
    consultation({
      anamnese: "Check-up anual, sem queixas.",
      parametros: [
        "Temperatura retal: 38,6 °C",
        "Peso: 31 kg · escore corporal 5/9",
        "Dentes com tártaro leve",
      ],
      diagnostico: "Animal saudável. Doença periodontal grau 1.",
      prognostico: "Excelente. Recomendada escovação diária.",
    }),
  ),
  procedure(
    "p2",
    "v3",
    "CONSULTATION",
    12,
    consultation({
      anamnese:
        "Perda de apetite há 2 dias, mais quieta que o normal. Sem vômitos. Mudança recente de casa.",
      parametros: [
        "Temperatura retal: 39,1 °C",
        "Desidratação estimada em 5%",
        "Mucosas levemente hipocoradas",
        "Peso: 4,0 kg (perdeu 200 g)",
      ],
      avaliacao: "Abdômen sem dor à palpação. Solicitado ultrassom abdominal.",
      diagnostico: "Hiporexia, provavelmente associada a estresse ambiental.",
      prognostico:
        "Bom. Fluidoterapia subcutânea, estimulante de apetite e reavaliação em 48 h.",
    }),
    [["Voltou a comer normalmente.", 2]],
  ),
  procedure(
    "p2",
    "v3",
    "EXAM",
    12,
    para("Ultrassom abdominal sem alterações."),
  ),
  procedure("p2", "v2", "VACCINATION", 200, para("V5 felina anual aplicada.")),
  procedure(
    "p3",
    "v1",
    "CONSULTATION",
    30,
    consultation({
      anamnese:
        "Começou a mancar da pata traseira esquerda após corrida no parque, ontem à tarde.",
      parametros: [
        "Temperatura retal: 38,4 °C",
        "Claudicação grau 2/4 no membro pélvico esquerdo",
        "Teste de gaveta negativo",
      ],
      avaliacao:
        "Dor à palpação da musculatura da coxa, sem crepitação articular.",
      diagnostico: "Distensão muscular no membro pélvico esquerdo.",
      prognostico:
        "Bom. Repouso e anti-inflamatório por 5 dias; se não melhorar, radiografia.",
    }),
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
      pet: pets[petId] ?? { id: petId, name: "", species: "" },
      vet: { id: vet.id, name: vet.user.name },
      extraNotes: [],
    };
    procedureStore.push(created);
    return HttpResponse.json(created, { status: STATUS.CREATED });
  }),
];
