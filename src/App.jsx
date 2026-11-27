import { lazy } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { isKnownRole, ROLES, roleHome } from "./auth/roles";
import { SignOut, useSession } from "./auth/session";
import AppLayout from "./layout/AppLayout";
import PageBoundary from "./layout/PageBoundary";

const AcceptInvite = lazy(() => import("@/features/auth/AcceptInvite"));
const Agenda = lazy(() => import("@/features/agenda/Agenda"));
const Atendimento = lazy(() => import("@/features/atendimento/Atendimento"));
const Caixa = lazy(() => import("@/features/caixa/Caixa"));
const Login = lazy(() => import("@/features/auth/Login"));
const Paciente = lazy(() => import("@/features/pacientes/paciente/Paciente"));
const Pacientes = lazy(() => import("@/features/pacientes/Pacientes"));
const ResetPassword = lazy(() => import("@/features/auth/ResetPassword"));
const Usuarios = lazy(() => import("@/features/usuarios/Usuarios"));

function RequireAuth() {
  const { user } = useSession();
  if (!user) return <Navigate to="/login" replace />;
  return isKnownRole(user.role) ? <Outlet /> : <SignOut />;
}

// cada perfil só entra nas próprias páginas
function RoleGate({ role }) {
  const { user } = useSession();
  if (!isKnownRole(user.role)) return <SignOut />;
  return user.role === role ? (
    <Outlet />
  ) : (
    <Navigate to={roleHome(user.role)} replace />
  );
}

function Home() {
  const { user } = useSession();
  if (user && !isKnownRole(user.role)) return <SignOut />;
  return <Navigate to={user ? roleHome(user.role) : "/login"} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route
        element={
          <PageBoundary>
            <Outlet />
          </PageBoundary>
        }
      >
        <Route path="/login" element={<Login />} />
        <Route path="/convite/:token" element={<AcceptInvite />} />
        <Route path="/redefinir-senha/:token" element={<ResetPassword />} />
      </Route>
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path={ROLES.RECEP.base} element={<RoleGate role="RECEP" />}>
            <Route path="agenda" element={<Agenda />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="caixa" element={<Caixa />} />
          </Route>
          <Route path={ROLES.VET.base} element={<RoleGate role="VET" />}>
            <Route path="atendimento" element={<Atendimento />} />
            <Route path="agenda" element={<Agenda />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="pacientes/:id" element={<Paciente />} />
          </Route>
          <Route path={ROLES.ADMIN.base} element={<RoleGate role="ADMIN" />}>
            <Route path="agenda" element={<Agenda />} />
            <Route path="pacientes" element={<Pacientes />} />
            <Route path="usuarios" element={<Usuarios />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
