import { IconCalendar, IconUsers, IconUserShield } from "@tabler/icons-react";

// Mesmas páginas por perfil do protótipo do Figma
export const NAV = {
  RECEP: [
    { to: "/recepcao/agenda", label: "Agenda", icon: IconCalendar },
    { to: "/recepcao/pacientes", label: "Pacientes", icon: IconUsers },
  ],
  VET: [{ to: "/vet/agenda", label: "Agenda", icon: IconCalendar }],
  ADMIN: [
    { to: "/admin/agenda", label: "Agenda", icon: IconCalendar },
    { to: "/admin/pacientes", label: "Pacientes", icon: IconUsers },
    { to: "/admin/usuarios", label: "Usuários", icon: IconUserShield },
  ],
};
