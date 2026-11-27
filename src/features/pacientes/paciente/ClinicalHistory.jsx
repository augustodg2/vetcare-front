import {
  Badge,
  Button,
  Chip,
  Group,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconChevronRight, IconPlus } from "@tabler/icons-react";
import dayjs from "dayjs";
import { Fragment, useMemo } from "react";
import { usePetProcedures } from "@/api/queries/procedures";
import { Async, BlockPagination, Empty } from "@/components/ui";
import { htmlToText } from "@/components/ui/RichText";
import { ago, fmtDate } from "@/lib/format";
import { typeColor, typeLabel } from "./procedureType";
import styles from "./records.module.css";

const TYPE_FILTERS = [
  "CONSULTATION",
  "EXAM",
  "VACCINATION",
  "SURGERY",
  "RETURN",
];

export function ClinicalHistory({
  petId,
  type,
  onType,
  page,
  onPage,
  onOpen,
  onNew,
}) {
  const history = usePetProcedures({ petId, type, page });

  return (
    <>
      <div className={styles.historyToolbar}>
        <div
          className={styles.procedureFilters}
          role="group"
          aria-label="Filtrar por tipo"
        >
          <Chip.Group
            value={type ?? "ALL"}
            onChange={(v) => onType(v === "ALL" ? null : v)}
          >
            <Chip value="ALL" size="xs" variant="outline">
              Todos
            </Chip>
            {TYPE_FILTERS.map((t) => (
              <Chip
                key={t}
                value={t}
                size="xs"
                variant="outline"
                color={typeColor(t)}
              >
                {typeLabel(t)}
              </Chip>
            ))}
          </Chip.Group>
        </div>
        <Button
          size="xs"
          leftSection={<IconPlus size={14} />}
          onClick={onNew}
          style={{ flexShrink: 0 }}
        >
          Novo registro
        </Button>
      </div>
      <Async q={history} rows={4}>
        {({ rows, total, pageSize }) =>
          rows.length === 0 ? (
            <Empty>
              {type
                ? `Nenhum registro de ${typeLabel(type).toLowerCase()} para este pet.`
                : "Nenhum procedimento registrado para este pet."}
            </Empty>
          ) : (
            <>
              <div className={styles.procedureList}>
                {rows.map((pr, i) => {
                  const d = dayjs(pr.dateTime);
                  const prev = rows[i - 1] && dayjs(rows[i - 1].dateTime);
                  const newYear = !prev || prev.year() !== d.year();
                  return (
                    <Fragment key={pr.id}>
                      {newYear && (
                        <div className={styles.procedureYear}>{d.year()}</div>
                      )}
                      <ProcedureItem
                        procedure={pr}
                        sameDay={!!prev && prev.isSame(d, "day")}
                        onOpen={onOpen}
                      />
                    </Fragment>
                  );
                })}
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

function ProcedureItem({ procedure: pr, sameDay, onOpen }) {
  const d = dayjs(pr.dateTime);
  const summary = useMemo(
    () => htmlToText(pr.notes, { skipHeadings: true }),
    [pr.notes],
  );

  return (
    <UnstyledButton
      className={styles.procedureRow}
      data-same-day={sameDay || undefined}
      onClick={() => onOpen(pr)}
      aria-label={`Abrir ${typeLabel(pr.type)} de ${fmtDate(pr.dateTime)}`}
    >
      <div className={styles.procedureWhen}>
        {!sameDay && (
          <>
            <span className={styles.date}>{d.format("DD MMM")}</span>
            <span className={styles.ago}>{ago(pr.dateTime)}</span>
          </>
        )}
      </div>
      <div className={styles.procedureBody}>
        <Group gap="xs" wrap="nowrap">
          <Badge variant="light" color={typeColor(pr.type)} size="sm">
            {typeLabel(pr.type)}
          </Badge>
          <Text size="xs" c="dimmed" truncate>
            {pr.vet.name}
          </Text>
        </Group>
        {summary && <div className={styles.procedureSummary}>{summary}</div>}
      </div>
      <IconChevronRight size={18} className={styles.procedureChevron} />
    </UnstyledButton>
  );
}
