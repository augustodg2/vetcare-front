// Rótulos e cores dos estados. As pílulas usam o tom claro da cor com texto escuro do mesmo tom.

export const USER_STATUS = {
  ativo: { label: "Ativo", color: "teal" },
  convite: { label: "Convite pendente", color: "yellow" },
  inativo: { label: "Desativado", color: "gray" },
};

export const ROLE_LABEL = {
  RECEP: "Recepcionista",
  VET: "Veterinário",
  ADMIN: "Administrador",
};

export const APPOINTMENT_STATUS = {
  ACTIVE: { label: "Agendada", color: "blue" },
  DONE: { label: "Concluída", color: "gray" },
  CANCELLED: { label: "Cancelada", color: "red" },
};

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
