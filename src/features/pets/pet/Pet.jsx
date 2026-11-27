import { IconChevronLeft } from "@tabler/icons-react";
import { Link, useParams } from "react-router-dom";
import { usePet } from "@/api/queries/pets";
import { usePaths } from "@/auth/session";
import { Async } from "@/components/ui";
import { PetSkeleton } from "./PetSkeleton";
import { PetHeader } from "./PetHeader";
import { PetMain } from "./PetMain";
import { PetOwnerAside, PetOwnerSummary } from "./PetOwner";
import styles from "./Pet.module.css";

export default function Pet() {
  const { id } = useParams();
  const pet = usePet(id);
  const paths = usePaths();

  return (
    <>
      <Link to={paths.patients()} className={styles.backLink}>
        <IconChevronLeft size={14} />
        Pacientes
      </Link>
      <Async q={pet} fallback={<PetSkeleton />}>
        {(p) => (
          <>
            <PetHeader pet={p} />
            <PetOwnerSummary id={p.petOwnerId} />
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
