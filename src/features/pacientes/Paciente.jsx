import {
  ActionIcon,
  Anchor,
  Badge,
  Button,
  Chip,
  Collapse,
  Group,
  Pagination,
  Skeleton,
  Stack,
  Tabs,
  Text,
  Textarea,
  UnstyledButton,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCalendar,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconEyeOff,
  IconPencil,
  IconPlus,
  IconPrinter,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import {
  parseAsBoolean,
  parseAsInteger,
  parseAsString,
  useQueryState,
} from "nuqs";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePetAppointments } from "@/api/queries/appointments";
import { rolePath } from "@/auth/roles";
import { usePetOwner } from "@/api/queries/petOwners";
import { usePet } from "@/api/queries/pets";
import { usePetPrescriptions, usePrescription } from "./queries";
import {
  useAddProcedureNote,
  usePetProcedures,
  useProcedure,
} from "@/api/queries/procedures";
import { useAllVets } from "@/api/queries/vets";
import { AppointmentModal } from "@/features/agenda/AppointmentModal";
import { PetModal, PetOwnerModal } from "./PeopleForms";
import { NewPrescription } from "./PrescriptionForm";
import { PrescriptionPrint } from "./PrescriptionPrint";
import { NewProcedure } from "./ProcedureForm";
import { htmlToText, RichText } from "@/components/ui/RichText";
import {
  Async,
  Dash,
  Empty,
  LoadingRows,
  SpeciesAvatar,
} from "@/components/ui";
import { toast } from "@/lib/notify";
import { age, ago, fmtDate, hideCpf, kg, relDay } from "@/lib/format";
import { PROCEDURE_COLOR, PROCEDURE_LABEL, SPECIES_LABEL } from "@/lib/status";
import { cx } from "@/lib/cx";
import blockStyles from "@/components/ui/Block.module.css";
import textStyles from "@/styles/text.module.css";
import panelStyles from "./recordPanel.module.css";
import styles from "./Paciente.module.css";

const SEX_LABEL = { M: "Macho", F: "Fêmea" };

const typeLabel = (type) => PROCEDURE_LABEL[type] ?? type;
const typeColor = (type) => PROCEDURE_COLOR[type] ?? "gray";

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

function PacienteSkeleton() {
  return (
    <>
      <section className={cx(blockStyles.block, styles.petHead)}>
        <div className={styles.petHeadMain}>
          <Skeleton height={56} width={56} radius="md" />
          <Stack gap={8} style={{ flex: 1 }}>
            <Skeleton height={22} width={160} />
            <Skeleton height={14} width={260} />
          </Stack>
        </div>
      </section>
      <div className={styles.gridAside}>
        <section className={blockStyles.block}>
          <LoadingRows rows={6} />
        </section>
        <section className={blockStyles.block}>
          <LoadingRows rows={4} />
        </section>
      </div>
    </>
  );
}

function PetHeader({ pet: p }) {
  const [editing, setEditing] = useState(false);
  const species = SPECIES_LABEL[p.species] ?? p.species;
  const subtitle = [species, p.breed, SEX_LABEL[p.sex] ?? p.sex]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className={cx(blockStyles.block, styles.petHead)}>
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
                {p.birth ? (
                  <>
                    {age(p.birth)}{" "}
                    <span className={styles.birth}>
                      nasc. {fmtDate(p.birth)}
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
      {p.alerts && (
        <div className={styles.petAlert} role="note">
          <IconAlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>
            <strong>Alerta:</strong> {p.alerts}
          </span>
        </div>
      )}
    </section>
  );
}

function PetMain({ pet }) {
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
    <section
      className={blockStyles.block}
      ref={ref}
      style={{ scrollMarginTop: 16 }}
    >
      {creating ? (
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
      ) : prescribing ? (
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
    </section>
  );
}

const UPCOMING_DAYS = 31;

function UpcomingAppointments({ pet, range, page, onPage }) {
  const upcoming = usePetAppointments({ petId: pet.id, ...range, page });
  const total = upcoming.data?.total;
  const [booking, setBooking] = useState(false);

  return (
    <>
      <AppointmentModal
        opened={booking}
        onClose={() => setBooking(false)}
        pet={pet}
        ownVet
      />
      <div className={cx(styles.tabMeta, styles.tabToolbar)}>
        <span>
          {total > 0
            ? `${total} ${total === 1 ? "agendamento" : "agendamentos"} nos próximos ${UPCOMING_DAYS} dias`
            : `Próximos ${UPCOMING_DAYS} dias`}
        </span>
        <Group gap="xs" wrap="nowrap" style={{ flexShrink: 0 }}>
          <Button
            component={Link}
            to={`${rolePath("VET", "agenda")}?v=semana&paciente=${pet.id}`}
            variant="default"
            size="xs"
            leftSection={<IconCalendar size={14} />}
          >
            Ver na agenda
          </Button>
          <Button
            size="xs"
            leftSection={<IconPlus size={14} />}
            onClick={() => setBooking(true)}
          >
            Novo agendamento
          </Button>
        </Group>
      </div>
      <Async q={upcoming} rows={3}>
        {({ rows, total, pageSize }) =>
          rows.length === 0 ? (
            <Empty>
              Nenhum agendamento para este pet nos próximos {UPCOMING_DAYS}{" "}
              dias.
            </Empty>
          ) : (
            <>
              <div className={styles.procedureList}>
                {rows.map((a) => (
                  <UpcomingItem key={a.id} appointment={a} />
                ))}
              </div>
              {total > pageSize && (
                <div className={blockStyles.foot}>
                  <Text size="sm" c="dimmed">
                    {(page - 1) * pageSize + 1}–
                    {Math.min(page * pageSize, total)} de {total}
                  </Text>
                  <Pagination
                    value={page}
                    onChange={onPage}
                    total={Math.ceil(total / pageSize)}
                    size="sm"
                  />
                </div>
              )}
            </>
          )
        }
      </Async>
    </>
  );
}

function UpcomingItem({ appointment: a }) {
  const d = dayjs(a.dateTime);

  return (
    <div className={cx(styles.procedureRow, styles.appointmentRow)}>
      <div className={styles.procedureWhen}>
        <span className={styles.date}>{d.format("DD MMM")}</span>
        <span className={styles.ago}>{relDay(a.dateTime)}</span>
      </div>
      <div className={styles.procedureBody}>
        <Group gap="xs" wrap="nowrap">
          <Badge variant="light" color={typeColor(a.type)} size="sm">
            {typeLabel(a.type)}
          </Badge>
          <Text size="xs" c="dimmed" truncate>
            {d.format("ddd, HH:mm")} · {a.vet.name}
          </Text>
        </Group>
        {a.obs && <div className={styles.procedureSummary}>{a.obs}</div>}
      </div>
    </div>
  );
}

const TYPE_FILTERS = [
  "CONSULTATION",
  "EXAM",
  "VACCINATION",
  "SURGERY",
  "RETURN",
];

function ClinicalHistory({ petId, type, onType, page, onPage, onOpen, onNew }) {
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
              {total > pageSize && (
                <div className={blockStyles.foot}>
                  <Text size="sm" c="dimmed">
                    {(page - 1) * pageSize + 1}–
                    {Math.min(page * pageSize, total)} de {total}
                  </Text>
                  <Pagination
                    value={page}
                    onChange={onPage}
                    total={Math.ceil(total / pageSize)}
                    size="sm"
                  />
                </div>
              )}
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

function ProcedureDetail({ id, onBack }) {
  const procedure = useProcedure(id);
  const pr = procedure.data;

  return (
    <>
      <div className={cx(blockStyles.head, panelStyles.head)}>
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={onBack}
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
              <div className={blockStyles.sub}>
                {dayjs(pr.dateTime).format("HH:mm")} · {pr.vet.name}
              </div>
            </div>
          ) : (
            <h2>Histórico clínico</h2>
          )}
        </Group>
      </div>
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

function Prescriptions({ petId, page, onPage, onOpen, onNew }) {
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
              {total > pageSize && (
                <div className={blockStyles.foot}>
                  <Text size="sm" c="dimmed">
                    {(page - 1) * pageSize + 1}–
                    {Math.min(page * pageSize, total)} de {total}
                  </Text>
                  <Pagination
                    value={page}
                    onChange={onPage}
                    total={Math.ceil(total / pageSize)}
                    size="sm"
                  />
                </div>
              )}
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

function PrescriptionDetail({ id, pet, onBack }) {
  const prescription = usePrescription(id);
  const petOwner = usePetOwner(pet.petOwnerId);
  const vets = useAllVets();
  const rx = prescription.data;
  const crmv = rx && vets.data?.find((v) => v.id === rx.vet.id)?.crmv;

  return (
    <>
      {rx && (
        <PrescriptionPrint
          prescription={rx}
          pet={pet}
          petOwner={petOwner.data}
          crmv={crmv}
        />
      )}
      <div className={cx(blockStyles.head, panelStyles.head)}>
        <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={onBack}
            aria-label="Voltar às prescrições"
          >
            <IconArrowLeft size={18} />
          </ActionIcon>
          <div style={{ minWidth: 0 }}>
            <h2>Prescrição{rx && ` · ${fmtDate(rx.createdAt)}`}</h2>
            {rx && (
              <div className={blockStyles.sub}>
                {dayjs(rx.createdAt).format("HH:mm")} · {rx.vet.name}
              </div>
            )}
          </div>
        </Group>
        <Button
          variant="default"
          size="xs"
          leftSection={<IconPrinter size={14} />}
          onClick={() => window.print()}
          disabled={!rx || petOwner.isPending || vets.isPending}
          style={{ flexShrink: 0 }}
        >
          Imprimir
        </Button>
      </div>
      <Async q={prescription} rows={6}>
        {(rx) => (
          <div className={panelStyles.section}>
            <RichText html={rx.content} />
          </div>
        )}
      </Async>
    </>
  );
}

const NOTE_MAX = 2000;

function ExtraNotes({ procedure: pr }) {
  const [adding, setAdding] = useState(false);
  const [content, setContent] = useState("");
  const [error, setError] = useState(null);
  const count = pr.extraNotes.length;

  const close = () => {
    setAdding(false);
    setContent("");
    setError(null);
  };

  const add = useAddProcedureNote({
    onSuccess: () => {
      toast.ok("Nota adicionada.");
      close();
    },
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return setError("Escreva a nota");
    if (content.length > NOTE_MAX) {
      return setError(`Máximo de ${NOTE_MAX} caracteres`);
    }
    add.mutate({ id: pr.id, content });
  };

  return (
    <div className={panelStyles.section}>
      <div className={textStyles.sectionLabel}>
        Notas adicionais{count > 0 && ` (${count})`}
      </div>
      {count > 0 && (
        <Stack gap="sm" mt="sm" className={styles.noteList}>
          {pr.extraNotes.map((n) => (
            <div key={n.id} className={styles.note}>
              <Text size="xs" c="dimmed">
                {fmtDate(n.createdAt)} às {dayjs(n.createdAt).format("HH:mm")}
              </Text>
              <Text size="sm" style={{ whiteSpace: "pre-line" }}>
                {n.content}
              </Text>
            </div>
          ))}
        </Stack>
      )}
      {!adding && (
        <Button
          mt="sm"
          variant="default"
          size="xs"
          leftSection={<IconPlus size={14} />}
          onClick={() => setAdding(true)}
        >
          Adicionar nota
        </Button>
      )}
      {adding && (
        <form onSubmit={onSubmit} noValidate>
          <Textarea
            mt="sm"
            aria-label="Nova nota"
            placeholder="Evolução, contato com o tutor, resultado de exame..."
            autosize
            minRows={3}
            maxRows={10}
            autoFocus
            value={content}
            onChange={(e) => {
              setContent(e.currentTarget.value);
              setError(null);
            }}
            error={error}
          />
          <Group justify="flex-end" gap="sm" mt="sm">
            <Button variant="default" size="xs" onClick={close}>
              Cancelar
            </Button>
            <Button type="submit" size="xs" loading={add.isPending}>
              Salvar nota
            </Button>
          </Group>
        </form>
      )}
    </div>
  );
}

const telHref = (phone = "") => `tel:${phone.replace(/\D/g, "")}`;

function EditButton({ onClick, label, style }) {
  return (
    <Button
      variant="default"
      size="xs"
      leftSection={<IconPencil size={14} />}
      onClick={onClick}
      aria-label={label}
      style={{ flexShrink: 0, ...style }}
    >
      Editar
    </Button>
  );
}

function TutorSummary({ id }) {
  const petOwner = usePetOwner(id);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const t = petOwner.data;
  if (!t) return null;

  return (
    <section className={cx(blockStyles.block, styles.tutorSummary)}>
      <UnstyledButton
        className={styles.tutorToggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="tutor-details"
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className={textStyles.sectionLabel}>Tutor</div>
          <Text fw={600} truncate>
            {t.name}
          </Text>
        </div>
        <span className={styles.tutorToggleHint}>
          {open ? "Ocultar" : "Ver dados"}
          <IconChevronDown
            size={16}
            className={styles.tutorChevron}
            data-open={open || undefined}
          />
        </span>
      </UnstyledButton>
      <Collapse in={open} id="tutor-details">
        <PetOwnerInfo
          petOwner={t}
          className={styles.tutorSummaryBody}
          footer={
            <Group justify="flex-end">
              <EditButton
                onClick={() => setEditing(true)}
                label="Editar dados do tutor"
              />
            </Group>
          }
        />
      </Collapse>
      <PetOwnerModal
        opened={editing}
        onClose={() => setEditing(false)}
        petOwner={t}
      />
    </section>
  );
}

function PetOwnerAside({ id }) {
  const petOwner = usePetOwner(id);
  const [editing, setEditing] = useState(false);

  return (
    <section className={cx(blockStyles.block, styles.tutorAside)}>
      <Async q={petOwner} rows={4}>
        {(t) => (
          <>
            <div className={blockStyles.head}>
              <div style={{ minWidth: 0 }}>
                <div className={textStyles.sectionLabel}>Tutor</div>
                <h2 style={{ overflowWrap: "anywhere" }}>{t.name}</h2>
              </div>
              <EditButton
                onClick={() => setEditing(true)}
                label="Editar dados do tutor"
              />
            </div>
            <PetOwnerInfo petOwner={t} className={blockStyles.body} />
            <PetOwnerModal
              opened={editing}
              onClose={() => setEditing(false)}
              petOwner={t}
            />
          </>
        )}
      </Async>
    </section>
  );
}

function PetOwnerInfo({ petOwner: t, className, footer }) {
  const [showCpf, setShowCpf] = useState(false);

  return (
    <Stack gap="sm" className={className}>
      <Info
        label="CPF"
        value={
          <Group gap={6} wrap="nowrap" component="span">
            <span className={textStyles.tnum}>
              {showCpf ? t.cpf : hideCpf(t.cpf)}
            </span>
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              aria-label={showCpf ? "Ocultar CPF" : "Mostrar CPF"}
              aria-pressed={showCpf}
              onClick={() => setShowCpf((v) => !v)}
            >
              {showCpf ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </ActionIcon>
          </Group>
        }
      />
      <Info
        label="Telefone"
        value={
          t.phone && (
            <Anchor
              href={telHref(t.phone)}
              size="sm"
              className={textStyles.tnum}
            >
              {t.phone}
            </Anchor>
          )
        }
      />
      <Info
        label="E-mail"
        value={
          t.email && (
            <Anchor href={`mailto:${t.email}`} size="sm">
              {t.email}
            </Anchor>
          )
        }
      />
      <Info label="Endereço" value={t.address} />
      {footer}
    </Stack>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ minWidth: 0 }}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm" component="div" style={{ overflowWrap: "anywhere" }}>
        {value || <Dash />}
      </Text>
    </div>
  );
}
