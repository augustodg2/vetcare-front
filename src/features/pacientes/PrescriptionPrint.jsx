import dayjs from "dayjs";
import { createPortal } from "react-dom";
import { CLINIC } from "@/lib/clinic";
import { age, fmtDate } from "@/lib/format";
import { SPECIES_LABEL } from "@/lib/status";
import { RichText } from "@/components/ui/RichText";
import styles from "./PrescriptionPrint.module.css";

const SEX_LABEL = { M: "Macho", F: "Fêmea" };

function Field({ label, value }) {
  return (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}:</span>
      {value ? <span>{value}</span> : <span className={styles.blank} />}
    </div>
  );
}

export function PrescriptionPrint({ prescription: rx, pet, petOwner, crmv }) {
  const issued = dayjs(rx.createdAt);
  const clinicLine = [
    CLINIC.address,
    CLINIC.phone && `Tel. ${CLINIC.phone}`,
    CLINIC.cnpj && `CNPJ ${CLINIC.cnpj}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return createPortal(
    <div className={styles.sheet}>
      <header className={styles.head}>
        <div className={styles.clinic}>{CLINIC.name}</div>
        {clinicLine && <div className={styles.muted}>{clinicLine}</div>}
      </header>

      <h1 className={styles.title}>Receituário</h1>

      <section className={styles.ids}>
        <div className={styles.box}>
          <div className={styles.label}>Tutor</div>
          <Field label="Nome" value={petOwner?.name} />
          <Field label="CPF" value={petOwner?.cpf} />
          <Field label="Endereço" value={petOwner?.address} />
          <Field label="Telefone" value={petOwner?.phone} />
        </div>
        <div className={styles.box}>
          <div className={styles.label}>Paciente</div>
          <Field label="Nome" value={pet.name} />
          <Field
            label="Espécie"
            value={SPECIES_LABEL[pet.species] ?? pet.species}
          />
          <Field label="Raça" value={pet.breed} />
          <Field label="Sexo" value={SEX_LABEL[pet.sex] ?? pet.sex} />
          <Field
            label="Idade"
            value={
              pet.birth && `${age(pet.birth)} (nasc. ${fmtDate(pet.birth)})`
            }
          />
        </div>
      </section>

      <div className={styles.body}>
        <RichText html={rx.content} className={styles.content} />
      </div>

      <footer className={styles.foot}>
        <div>
          {CLINIC.city ? (
            `${CLINIC.city}, `
          ) : (
            <>
              <span className={styles.blank} />,{" "}
            </>
          )}
          {issued.format("D [de] MMMM [de] YYYY")}
        </div>
        <div className={styles.sign}>
          <div className={styles.signLine} />
          <div className={styles.signName}>{rx.vet.name}</div>
          <div>
            {crmv || (
              <>
                CRMV: <span className={styles.blank} />
              </>
            )}
          </div>
          <div className={styles.muted}>
            Assinatura e carimbo do médico-veterinário
          </div>
        </div>
      </footer>
    </div>,
    document.body,
  );
}
