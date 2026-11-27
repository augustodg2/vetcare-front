import { lazy } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePatient } from "./patientRoute";

const NewProcedure = lazy(() =>
  import("@/features/pacientes/ProcedureForm").then((m) => ({
    default: m.NewProcedure,
  })),
);
const NewPrescription = lazy(() =>
  import("@/features/pacientes/PrescriptionForm").then((m) => ({
    default: m.NewPrescription,
  })),
);

export function CreateProcedure() {
  const { pet } = usePatient();
  const navigate = useNavigate();
  const { search } = useLocation();

  return (
    <NewProcedure
      petId={pet.id}
      onBack={() => navigate({ pathname: "..", search })}
      onCreated={(pr) =>
        navigate(`../procedimentos/${pr.id}`, { replace: true })
      }
    />
  );
}

export function CreatePrescription() {
  const { pet } = usePatient();
  const navigate = useNavigate();
  const { search } = useLocation();

  return (
    <NewPrescription
      petId={pet.id}
      onBack={() => navigate({ pathname: "../prescricoes", search })}
      onCreated={(rx) => navigate(`../prescricoes/${rx.id}`, { replace: true })}
    />
  );
}
