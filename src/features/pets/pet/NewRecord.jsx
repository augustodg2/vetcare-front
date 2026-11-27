import { lazy } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePetContext } from "./petRoute";

const NewProcedure = lazy(() =>
  import("@/features/pets/ProcedureForm").then((m) => ({
    default: m.NewProcedure,
  })),
);
const NewPrescription = lazy(() =>
  import("@/features/pets/PrescriptionForm").then((m) => ({
    default: m.NewPrescription,
  })),
);

export function CreateProcedure() {
  const { pet } = usePetContext();
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
  const { pet } = usePetContext();
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
