import { Text } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { useState } from "react";
import { Block, Dash, SpeciesAvatar } from "@/components/ui";
import { PetModal } from "@/features/pets/PetForms";
import { age, fmtDate, kg } from "@/lib/format";
import { SPECIES_LABEL } from "@/lib/status";
import { EditButton } from "./EditButton";
import styles from "./PetHeader.module.css";

const SEX_LABEL = { M: "Macho", F: "Fêmea" };

export function PetHeader({ pet: p }) {
  const [editing, setEditing] = useState(false);
  const species = SPECIES_LABEL[p.species] ?? p.species;
  const subtitle = [species, p.breed, SEX_LABEL[p.sex] ?? p.sex]
    .filter(Boolean)
    .join(" · ");

  return (
    <Block flush className={styles.petHead}>
      <PetModal opened={editing} onClose={() => setEditing(false)} pet={p} />
      <div className={styles.petHeadMain}>
        <SpeciesAvatar species={p.species} size={56} />
        <div className={styles.petHeadName}>
          <h1>{p.name}</h1>
          <Text size="sm" c="dimmed">
            {subtitle}
          </Text>
          <dl className={styles.petStats}>
            <div>
              <dt>Idade</dt>
              <dd>
                {p.birthDate ? (
                  <>
                    {age(p.birthDate)}{" "}
                    <span className={styles.birth}>
                      nasc. {fmtDate(p.birthDate)}
                    </span>
                  </>
                ) : (
                  <Dash />
                )}
              </dd>
            </div>
            <div>
              <dt>Peso</dt>
              <dd>{p.weight != null ? kg(p.weight) : <Dash />}</dd>
            </div>
          </dl>
        </div>
        <EditButton
          onClick={() => setEditing(true)}
          label="Editar dados do pet"
          style={{ alignSelf: "flex-start" }}
        />
      </div>
      {p.notes && (
        <div className={styles.petAlert} role="note">
          <IconAlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>
            <strong>Alerta:</strong> {p.notes}
          </span>
        </div>
      )}
    </Block>
  );
}
