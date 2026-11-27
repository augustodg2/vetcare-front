import { Badge, Tabs } from "@mantine/core";
import dayjs from "dayjs";
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  useQueryState,
} from "nuqs";
import { lazy, useEffect, useRef, useState } from "react";
import { usePetAppointments } from "@/api/queries/appointments";
import { Block } from "@/components/ui";
import PageBoundary from "@/layout/PageBoundary";
import { ClinicalHistory } from "./ClinicalHistory";
import { PrescriptionDetail } from "./PrescriptionDetail";
import { Prescriptions } from "./Prescriptions";
import { ProcedureDetail } from "./ProcedureDetail";
import { UPCOMING_DAYS, UpcomingAppointments } from "./UpcomingAppointments";
import styles from "./records.module.css";

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

export function PetMain({ pet }) {
  const petId = pet.id;
  const [procedureId, setProcedureId] = useQueryState(
    "procedimento",
    parseAsString.withOptions({ history: "push" }),
  );
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [type, setType] = useQueryState("tipo", parseAsString);
  const [tab, setTab] = useQueryState(
    "aba",
    parseAsString.withDefault("historico"),
  );
  const [upcomingRange] = useState(() => {
    const now = dayjs();
    return {
      from: now.toISOString(),
      to: now.add(UPCOMING_DAYS, "day").toISOString(),
      status: "ACTIVE",
      order: "asc",
    };
  });
  const upcomingTotal = usePetAppointments({ petId, ...upcomingRange }).data
    ?.total;
  const [creating, setCreating] = useQueryState(
    "novo",
    parseAsBoolean.withOptions({ history: "push" }),
  );
  const [prescriptionId, setPrescriptionId] = useQueryState(
    "prescricao",
    parseAsString.withOptions({ history: "push" }),
  );
  const [prescribing, setPrescribing] = useQueryState(
    "novaPrescricao",
    parseAsBoolean.withOptions({ history: "push" }),
  );
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ block: "start" });
    }
  }, [procedureId, page, creating, prescriptionId, prescribing]);

  return (
    <Block flush ref={ref} style={{ scrollMarginTop: 16 }}>
      {creating ? (
        <PageBoundary>
          <NewProcedure
            petId={petId}
            onBack={() => setCreating(null)}
            onCreated={(pr) => {
              setCreating(null);
              setType(null);
              setPage(null);
              setTab(null);
              setProcedureId(pr.id);
            }}
          />
        </PageBoundary>
      ) : prescribing ? (
        <PageBoundary>
          <NewPrescription
            petId={petId}
            onBack={() => setPrescribing(null)}
            onCreated={(rx) => {
              setPrescribing(null);
              setPage(null);
              setTab("prescricoes");
              setPrescriptionId(rx.id);
            }}
          />
        </PageBoundary>
      ) : procedureId ? (
        <ProcedureDetail id={procedureId} onBack={() => setProcedureId(null)} />
      ) : prescriptionId ? (
        <PrescriptionDetail
          id={prescriptionId}
          pet={pet}
          onBack={() => setPrescriptionId(null)}
        />
      ) : (
        <Tabs
          value={tab}
          onChange={(t) => {
            setTab(t === "historico" ? null : t);
            setPage(null);
          }}
          keepMounted={false}
        >
          <Tabs.List className={styles.petTabs}>
            <Tabs.Tab value="historico">Histórico clínico</Tabs.Tab>
            <Tabs.Tab value="prescricoes">Prescrições</Tabs.Tab>
            <Tabs.Tab
              value="agendamentos"
              rightSection={
                upcomingTotal > 0 && (
                  <Badge size="xs" circle variant="light">
                    {upcomingTotal}
                  </Badge>
                )
              }
            >
              Agendamentos
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="historico">
            <ClinicalHistory
              petId={petId}
              type={type}
              onType={(t) => {
                setType(t);
                setPage(null);
              }}
              page={page}
              onPage={setPage}
              onOpen={(pr) => setProcedureId(pr.id)}
              onNew={() => setCreating(true)}
            />
          </Tabs.Panel>
          <Tabs.Panel value="agendamentos">
            <UpcomingAppointments
              pet={pet}
              range={upcomingRange}
              page={page}
              onPage={setPage}
            />
          </Tabs.Panel>
          <Tabs.Panel value="prescricoes">
            <Prescriptions
              petId={petId}
              page={page}
              onPage={setPage}
              onOpen={(rx) => setPrescriptionId(rx.id)}
              onNew={() => setPrescribing(true)}
            />
          </Tabs.Panel>
        </Tabs>
      )}
    </Block>
  );
}
