import { ActionIcon, Group } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import dayjs from "dayjs";
import { Link, useLocation, useParams } from "react-router-dom";
import { useProcedure } from "@/api/queries/procedures";
import { Async, BlockHead, BlockSub, Empty } from "@/components/ui";
import { RichText } from "@/components/ui/RichText";
import panelStyles from "@/features/pacientes/recordPanel.module.css";
import { fmtDate } from "@/lib/format";
import { ExtraNotes } from "./ExtraNotes";
import { typeColor, typeLabel } from "./procedureType";
import styles from "./records.module.css";

export function ProcedureDetail() {
  const { procedureId } = useParams();
  const { search } = useLocation();
  const procedure = useProcedure(procedureId);
  const pr = procedure.data;

  return (
    <>
      <BlockHead className={panelStyles.head}>
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <ActionIcon
            variant="subtle"
            color="gray"
            component={Link}
            to={{ pathname: "..", search }}
            aria-label="Voltar ao histórico clínico"
          >
            <IconArrowLeft size={18} />
          </ActionIcon>
          {pr ? (
            <div style={{ minWidth: 0 }}>
              <Group gap={8} wrap="nowrap">
                <span
                  className={styles.typeDot}
                  style={{
                    background: `var(--mantine-color-${typeColor(pr.type)}-6)`,
                  }}
                />
                <h2>
                  {typeLabel(pr.type)} · {fmtDate(pr.dateTime)}
                </h2>
              </Group>
              <BlockSub>
                {dayjs(pr.dateTime).format("HH:mm")} · {pr.vet.name}
              </BlockSub>
            </div>
          ) : (
            <h2>Histórico clínico</h2>
          )}
        </Group>
      </BlockHead>
      <Async q={procedure} rows={6}>
        {(pr) => (
          <>
            <div className={panelStyles.section}>
              {pr.notes ? (
                <RichText html={pr.notes} />
              ) : (
                <Empty>Sem descrição registrada.</Empty>
              )}
            </div>
            <ExtraNotes procedure={pr} />
          </>
        )}
      </Async>
    </>
  );
}
