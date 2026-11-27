import {
  IconCalendar,
  IconLayoutDashboard,
  IconPaw,
  IconUserShield,
} from "@tabler/icons-react";

// Mesmas páginas por perfil do protótipo do Figma
export const NAV = {
  RECEP: [
    { to: "/recepcao/agenda", label: "Agenda", icon: IconCalendar },
    { to: "/recepcao/pacientes", label: "Pacientes", icon: IconPaw },
  ],
  VET: [
    {
      to: "/vet/atendimento",
      label: "Atendimento",
      icon: IconLayoutDashboard,
    },
    { to: "/vet/agenda", label: "Agenda", icon: IconCalendar },
    { to: "/vet/pacientes", label: "Pacientes", icon: IconPaw },
  ],
  ADMIN: [
    { to: "/admin/agenda", label: "Agenda", icon: IconCalendar },
    { to: "/admin/pacientes", label: "Pacientes", icon: IconPaw },
    { to: "/admin/usuarios", label: "Usuários", icon: IconUserShield },
  ],
};
