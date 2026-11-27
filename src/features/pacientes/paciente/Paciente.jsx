import { IconChevronLeft } from "@tabler/icons-react";
import { Link, useParams } from "react-router-dom";
import { usePet } from "@/api/queries/pets";
import { rolePath } from "@/auth/roles";
import { Async } from "@/components/ui";
import { PacienteSkeleton } from "./PacienteSkeleton";
import { PetHeader } from "./PetHeader";
import { PetMain } from "./PetMain";
import { PetOwnerAside, TutorSummary } from "./PetOwner";
import styles from "./Paciente.module.css";

export default function Paciente() {
  const { id } = useParams();
  const pet = usePet(id);

  return (
    <>
      <Link to={rolePath("VET", "pacientes")} className={styles.backLink}>
        <IconChevronLeft size={14} />
        Pacientes
      </Link>
      <Async q={pet} fallback={<PacienteSkeleton />}>
        {(p) => (
          <>
            <PetHeader pet={p} />
            <TutorSummary id={p.petOwnerId} />
            <div className={styles.gridAside}>
              <PetMain pet={p} />
              <PetOwnerAside id={p.petOwnerId} />
            </div>
          </>
        )}
      </Async>
    </>
  );
}
