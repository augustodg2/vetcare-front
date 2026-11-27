import { Button, Text, UnstyledButton } from "@mantine/core";
import { IconChevronRight, IconPlus } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useMemo } from "react";
import { Async, BlockPagination, Empty } from "@/components/ui";
import { htmlToText } from "@/components/ui/RichText";
import { usePetPrescriptions } from "@/features/pacientes/queries";
import { cx } from "@/lib/cx";
import { ago, fmtDate } from "@/lib/format";
import styles from "./records.module.css";

export function Prescriptions({ petId, page, onPage, onOpen, onNew }) {
  const list = usePetPrescriptions({ petId, page });
  const total = list.data?.total;

  return (
    <>
      <div className={cx(styles.tabMeta, styles.tabToolbar)}>
        <span>
          {total > 0 &&
            `${total} ${total === 1 ? "prescrição" : "prescrições"}`}
        </span>
        <Button
          size="xs"
          leftSection={<IconPlus size={14} />}
          onClick={onNew}
          style={{ flexShrink: 0 }}
        >
          Nova prescrição
        </Button>
      </div>
      <Async q={list} rows={3}>
        {({ rows, total, pageSize }) =>
          rows.length === 0 ? (
            <Empty>Nenhuma prescrição registrada para este pet.</Empty>
          ) : (
            <>
              <div className={styles.procedureList}>
                {rows.map((rx) => (
                  <PrescriptionItem
                    key={rx.id}
                    prescription={rx}
                    onOpen={onOpen}
                  />
                ))}
              </div>
              <BlockPagination
                page={page}
                pageSize={pageSize}
                total={total}
                onChange={onPage}
              />
            </>
          )
        }
      </Async>
    </>
  );
}

function PrescriptionItem({ prescription: rx, onOpen }) {
  const d = dayjs(rx.createdAt);
  const summary = useMemo(() => htmlToText(rx.content), [rx.content]);

  return (
    <UnstyledButton
      className={styles.procedureRow}
      onClick={() => onOpen(rx)}
      aria-label={`Abrir prescrição de ${fmtDate(rx.createdAt)}`}
    >
      <div className={styles.procedureWhen}>
        <span className={styles.date}>{d.format("DD MMM YY")}</span>
        <span className={styles.ago}>{ago(rx.createdAt)}</span>
      </div>
      <div className={styles.procedureBody}>
        <Text size="xs" c="dimmed" truncate>
          {rx.vet.name}
        </Text>
        <div className={styles.procedureSummary}>{summary}</div>
      </div>
      <IconChevronRight size={18} className={styles.procedureChevron} />
    </UnstyledButton>
  );
}
