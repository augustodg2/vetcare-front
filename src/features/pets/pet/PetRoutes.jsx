import { Navigate, Route, Routes } from "react-router-dom";
import { roleHome } from "@/auth/roles";
import { ClinicalHistory } from "./ClinicalHistory";
import { CreatePrescription, CreateProcedure } from "./NewRecord";
import Pet from "./Pet";
import { PetTabs } from "./PetMain";
import { PrescriptionDetail } from "./PrescriptionDetail";
import { Prescriptions } from "./Prescriptions";
import { ProcedureDetail } from "./ProcedureDetail";
import { UpcomingAppointments } from "./UpcomingAppointments";

export default function PetRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Pet />}>
        <Route element={<PetTabs />}>
          <Route index element={<ClinicalHistory />} />
          <Route path="prescricoes" element={<Prescriptions />} />
          <Route path="agendamentos" element={<UpcomingAppointments />} />
        </Route>
        <Route path="procedimentos/novo" element={<CreateProcedure />} />
        <Route
          path="procedimentos/:procedureId"
          element={<ProcedureDetail />}
        />
        <Route path="prescricoes/nova" element={<CreatePrescription />} />
        <Route
          path="prescricoes/:prescriptionId"
          element={<PrescriptionDetail />}
        />
      </Route>
      <Route path="*" element={<Navigate to={roleHome("VET")} replace />} />
    </Routes>
  );
}
