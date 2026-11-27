import {
  IconCalendar,
  IconCashRegister,
  IconLayoutDashboard,
  IconPaw,
  IconUserShield,
} from "@tabler/icons-react";

const defineRole = ({ label, base, home, nav, can = {} }) => ({
  label,
  base,
  can,
  home: `${base}/${home}`,
  nav: nav.map(([page, label, icon]) => ({
    to: `${base}/${page}`,
    label,
    icon,
  })),
});

export const ROLES = {
  RECEP: defineRole({
    label: "Recepcionista",
    base: "/recepcao",
    home: "agenda",
    nav: [
      ["agenda", "Agenda", IconCalendar],
      ["pacientes", "Pacientes", IconPaw],
      ["caixa", "Caixa", IconCashRegister],
    ],
    can: { editPatients: true },
  }),
  VET: defineRole({
    label: "Veterinário",
    base: "/vet",
    home: "atendimento",
    nav: [
      ["atendimento", "Atendimento", IconLayoutDashboard],
      ["agenda", "Agenda", IconCalendar],
      ["pacientes", "Pacientes", IconPaw],
    ],
    can: { openPatientRecord: true, scopeOwnAgenda: true },
  }),
  ADMIN: defineRole({
    label: "Administrador",
    base: "/admin",
    home: "agenda",
    nav: [
      ["agenda", "Agenda", IconCalendar],
      ["pacientes", "Pacientes", IconPaw],
      ["usuarios", "Usuários", IconUserShield],
    ],
    can: { editPatients: true },
  }),
};

export const isKnownRole = (role) => Object.hasOwn(ROLES, role);

export const roleLabel = (role) =>
  isKnownRole(role) ? ROLES[role].label : undefined;

export const roleHome = (role) =>
  isKnownRole(role) ? ROLES[role].home : "/login";

export const rolePath = (role, page) => `${ROLES[role].base}/${page}`;

export const can = (user, capability) =>
  Boolean(user && isKnownRole(user.role) && ROLES[user.role].can[capability]);

export const rolePaths = (role) => ({
  patients: () => rolePath(role, "pacientes"),
  patient: (id) => rolePath(role, `pacientes/${id}`),
  agenda: ({ petId } = {}) =>
    petId
      ? `${rolePath(role, "agenda")}?v=semana&paciente=${petId}`
      : rolePath(role, "agenda"),
});

export const ROLE_OPTIONS = Object.entries(ROLES).map(([value, { label }]) => ({
  value,
  label,
}));
