// Rótulos e cores dos estados. As pílulas usam o tom claro da cor com texto escuro do mesmo tom.

export const USER_STATUS = {
  ACTIVE: { label: "Ativo", color: "teal" },
  PENDING_INVITE: { label: "Convite pendente", color: "yellow" },
  DEACTIVATED: { label: "Desativado", color: "gray" },
};

export const APPOINTMENT_STATUS = {
  ACTIVE: { label: "Agendada", color: "blue" },
  DONE: { label: "Concluída", color: "gray" },
  CANCELLED: { label: "Cancelada", color: "red" },
};

export const PAYMENT_STATUS = {
  PAID: { label: "Pago", color: "teal" },
  CANCELED: { label: "Cancelado", color: "gray" },
  REFUNDED: { label: "Estornado", color: "orange" },
};

export const PAYMENT_METHODS = [
  "PIX",
  "Dinheiro",
  "Cartão de débito",
  "Cartão de crédito",
];

export const PROCEDURE_LABEL = {
  CONSULTATION: "Consulta",
  RETURN: "Retorno",
  VACCINATION: "Vacinação",
  SURGERY: "Cirurgia",
  EXAM: "Exame",
};

export const PROCEDURE_COLOR = {
  CONSULTATION: "teal",
  RETURN: "blue",
  VACCINATION: "grape",
  SURGERY: "red",
  EXAM: "orange",
};

export const SPECIES_LABEL = { DOG: "Cão", CAT: "Gato" };
