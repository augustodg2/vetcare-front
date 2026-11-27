import { Badge, Tabs } from "@mantine/core";
import dayjs from "dayjs";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
  useResolvedPath,
  useSearchParams,
} from "react-router-dom";
import { usePetAppointments } from "@/api/queries/appointments";
import { Block } from "@/components/ui";
import PageBoundary from "@/layout/PageBoundary";
import { usePatient } from "./patientRoute";
import { UPCOMING_DAYS } from "./UpcomingAppointments";
import styles from "./records.module.css";

export function PetMain({ pet }) {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const page = searchParams.get("page");
  const [upcomingRange] = useState(() => {
    const now = dayjs();
    return {
      from: now.toISOString(),
      to: now.add(UPCOMING_DAYS, "day").toISOString(),
      status: "ACTIVE",
      order: "asc",
    };
  });
  const context = useMemo(() => ({ pet, upcomingRange }), [pet, upcomingRange]);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ block: "start" });
    }
  }, [pathname, page]);

  return (
    <Block flush ref={ref} style={{ scrollMarginTop: 16 }}>
      <PageBoundary>
        <Outlet context={context} />
      </PageBoundary>
    </Block>
  );
}

export function PetTabs() {
  const context = usePatient();
  const { pet, upcomingRange } = context;
  const base = useResolvedPath(".").pathname;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const tab =
    pathname.slice(base.length).replace(/^\/|\/$/g, "") || "historico";
  const upcomingTotal = usePetAppointments({ petId: pet.id, ...upcomingRange })
    .data?.total;

  return (
    <Tabs
      value={tab}
      onChange={(t) => navigate(t === "historico" ? "." : t, { replace: true })}
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
      <Tabs.Panel value={tab}>
        <Outlet context={context} />
      </Tabs.Panel>
    </Tabs>
  );
}
