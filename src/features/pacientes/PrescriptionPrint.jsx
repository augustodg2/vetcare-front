import dayjs from "dayjs";
import { createPortal } from "react-dom";
import { CLINIC } from "@/lib/clinic";
import { age, fmtDate } from "@/lib/format";
import { SPECIES_LABEL } from "@/lib/status";
import { RichText } from "@/components/ui/RichText";

const SEX_LABEL = { M: "Macho", F: "Fêmea" };

function Field({ label, value }) {
  return (
    <div className="rx-field">
      <span className="rx-field-label">{label}:</span>
      {value ? <span>{value}</span> : <span className="rx-blank" />}
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
    <div className="print-sheet rx-sheet">
      <header className="rx-head">
        <div className="rx-clinic">{CLINIC.name}</div>
        {clinicLine && <div className="rx-muted">{clinicLine}</div>}
      </header>

      <h1 className="rx-title">Receituário</h1>

      <section className="rx-ids">
        <div className="rx-box">
          <div className="rx-label">Tutor</div>
          <Field label="Nome" value={petOwner?.name} />
          <Field label="CPF" value={petOwner?.cpf} />
          <Field label="Endereço" value={petOwner?.address} />
          <Field label="Telefone" value={petOwner?.phone} />
        </div>
        <div className="rx-box">
          <div className="rx-label">Paciente</div>
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

      <div className="rx-body">
        <RichText html={rx.content} />
      </div>

      <footer className="rx-foot">
        <div className="rx-date">
          {CLINIC.city ? (
            `${CLINIC.city}, `
          ) : (
            <>
              <span className="rx-blank" />,{" "}
            </>
          )}
          {issued.format("D [de] MMMM [de] YYYY")}
        </div>
        <div className="rx-sign">
          <div className="rx-sign-line" />
          <div className="rx-sign-name">{rx.vet.name}</div>
          <div>
            {crmv || (
              <>
                CRMV: <span className="rx-blank" />
              </>
            )}
          </div>
          <div className="rx-muted">
            Assinatura e carimbo do médico-veterinário
          </div>
        </div>
      </footer>
    </div>,
    document.body,
  );
}
