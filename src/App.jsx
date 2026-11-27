import { lazy } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { isKnownRole, ROLES, roleHome } from "./auth/roles";
import { SignOut, useSession } from "./auth/session";
import AppLayout from "./layout/AppLayout";
import PageBoundary from "./layout/PageBoundary";

const AcceptInvite = lazy(() => import("@/features/auth/AcceptInvite"));
const AppointmentCalendar = lazy(
  () => import("@/features/appointments/AppointmentCalendar"),
);
const VetAppointmentDashboard = lazy(
  () => import("@/features/appointments/VetAppointmentDashboard"),
);
const Payments = lazy(() => import("@/features/payments/Payments"));
const Login = lazy(() => import("@/features/auth/Login"));
const Pets = lazy(() => import("@/features/pets/Pets"));
const PetRoutes = lazy(() => import("@/features/pets/pet/PetRoutes"));
const ResetPassword = lazy(() => import("@/features/auth/ResetPassword"));
const Users = lazy(() => import("@/features/users/Users"));

function RequireAuth() {
  const { user } = useSession();
  if (!user) return <Navigate to="/login" replace />;
  return isKnownRole(user.role) ? <Outlet /> : <SignOut />;
}

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
            <Route path="agenda" element={<AppointmentCalendar />} />
            <Route path="pacientes" element={<Pets />} />
            <Route path="caixa" element={<Payments />} />
          </Route>
          <Route path={ROLES.VET.base} element={<RoleGate role="VET" />}>
            <Route path="atendimento" element={<VetAppointmentDashboard />} />
            <Route path="agenda" element={<AppointmentCalendar />} />
            <Route path="pacientes" element={<Pets />} />
            <Route path="pacientes/:id/*" element={<PetRoutes />} />
          </Route>
          <Route path={ROLES.ADMIN.base} element={<RoleGate role="ADMIN" />}>
            <Route path="agenda" element={<AppointmentCalendar />} />
            <Route path="pacientes" element={<Pets />} />
            <Route path="usuarios" element={<Users />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
