import {
  ActionIcon,
  Anchor,
  Avatar,
  Badge,
  Button,
  Chip,
  Collapse,
  Group,
  Pagination,
  Skeleton,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconArrowLeft,
  IconCat,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconDog,
  IconEye,
  IconEyeOff,
  IconPaw,
  IconPencil,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePetOwner } from "../../api/queries/petOwners";
import { usePet } from "../../api/queries/pets";
import { usePetProcedures, useProcedure } from "../../api/queries/procedures";
import { PetModal, PetOwnerModal } from "../../components/PeopleForms";
import { htmlToText, RichText } from "../../components/RichText";
import { Async, Dash, Empty, LoadingRows } from "../../components/ui";
import { age, ago, fmtDate, hideCpf, kg } from "../../lib/format";
import {
  PROCEDURE_COLOR,
  PROCEDURE_LABEL,
  SPECIES_LABEL,
} from "../../lib/status";

const SEX_LABEL = { M: "Macho", F: "Fêmea" };
const SPECIES_ICON = { DOG: IconDog, CAT: IconCat };

const typeLabel = (type) => PROCEDURE_LABEL[type] ?? type;
const typeColor = (type) => PROCEDURE_COLOR[type] ?? "gray";

export default function Paciente() {
  const { id } = useParams();
  const pet = usePet(id);

  return (
    <>
      <Link to="/vet/pacientes" className="back-link">
        <IconChevronLeft size={14} />
        Pacientes
      </Link>
      <Async q={pet} fallback={<PacienteSkeleton />}>
        {(p) => (
          <>
            <PetHeader pet={p} />
            <TutorSummary id={p.petOwnerId} />
            <div className="grid-aside">
              <PetMain petId={p.id} />
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
      <section className="block pet-head">
        <div className="pet-head-main">
          <Skeleton height={56} width={56} radius="md" />
          <Stack gap={8} style={{ flex: 1 }}>
            <Skeleton height={22} width={160} />
            <Skeleton height={14} width={260} />
          </Stack>
        </div>
      </section>
      <div className="grid-aside">
        <section className="block">
          <LoadingRows rows={6} />
        </section>
        <section className="block">
          <LoadingRows rows={4} />
        </section>
      </div>
    </>
  );
}

function SpeciesAvatar({ species, size }) {
  const Icon = SPECIES_ICON[species] ?? IconPaw;
  return (
    <Avatar
      size={size}
      radius="md"
      variant="light"
      color={species === "CAT" ? "grape" : "teal"}
      style={{ flexShrink: 0 }}
    >
      <Icon size={size * 0.5} stroke={1.6} />
    </Avatar>
  );
}

function PetHeader({ pet: p }) {
  const [editing, setEditing] = useState(false);
  const species = SPECIES_LABEL[p.species] ?? p.species;
  const subtitle = [species, p.breed, SEX_LABEL[p.sex] ?? p.sex]
    .filter(Boolean)
    .join(" · ");

  return (
    <section className="block pet-head">
      <PetModal opened={editing} onClose={() => setEditing(false)} pet={p} />
      <div className="pet-head-main">
        <SpeciesAvatar species={p.species} size={56} />
        <div className="pet-head-name">
          <h1>{p.name}</h1>
          <Text size="sm" c="dimmed">
            {subtitle}
          </Text>
          <dl className="pet-stats">
            <div>
              <dt>Idade</dt>
              <dd>
                {p.birth ? (
                  <>
                    {age(p.birth)}{" "}
                    <span className="muted">nasc. {fmtDate(p.birth)}</span>
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
        <div className="pet-alert" role="note">
          <IconAlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>
            <strong>Alerta:</strong> {p.alerts}
          </span>
        </div>
      )}
    </section>
  );
}

function PetMain({ petId }) {
  const [procedureId, setProcedureId] = useQueryState(
    "procedimento",
    parseAsString.withOptions({ history: "push" }),
  );
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [type, setType] = useQueryState("tipo", parseAsString);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.getBoundingClientRect().top < 0) {
      el.scrollIntoView({ block: "start" });
    }
  }, [procedureId, page]);

  return (
    <section className="block" ref={ref} style={{ scrollMarginTop: 16 }}>
      {procedureId ? (
        <ProcedureDetail id={procedureId} onBack={() => setProcedureId(null)} />
      ) : (
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
        />
      )}
    </section>
  );
}

const TYPE_FILTERS = [
  "CONSULTATION",
  "EXAM",
  "VACCINATION",
  "SURGERY",
  "RETURN",
];

function ClinicalHistory({ petId, type, onType, page, onPage, onOpen }) {
  const history = usePetProcedures({ petId, type, page });
  const total = history.data?.total;

  return (
    <>
      <div className="block-head">
        <div>
          <h2>Histórico clínico</h2>
          {total > 0 && (
            <div className="sub">
              {total} {total === 1 ? "registro" : "registros"}
              {type && ` de ${typeLabel(type).toLowerCase()}`}
            </div>
          )}
        </div>
      </div>
      <div
        className="procedure-filters"
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
              <div className="procedure-list">
                {rows.map((pr, i) => {
                  const d = dayjs(pr.dateTime);
                  const prev = rows[i - 1] && dayjs(rows[i - 1].dateTime);
                  const newYear = !prev || prev.year() !== d.year();
                  return (
                    <Fragment key={pr.id}>
                      {newYear && (
                        <div className="procedure-year">{d.year()}</div>
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
                <div className="block-foot">
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
      className="procedure-row"
      data-same-day={sameDay || undefined}
      onClick={() => onOpen(pr)}
      aria-label={`Abrir ${typeLabel(pr.type)} de ${fmtDate(pr.dateTime)}`}
    >
      <div className="procedure-when">
        {!sameDay && (
          <>
            <span className="d">{d.format("DD MMM")}</span>
            <span className="ago">{ago(pr.dateTime)}</span>
          </>
        )}
      </div>
      <div className="procedure-body">
        <Group gap="xs" wrap="nowrap">
          <Badge variant="light" color={typeColor(pr.type)} size="sm">
            {typeLabel(pr.type)}
          </Badge>
          <Text size="xs" c="dimmed" truncate>
            {pr.vet.name}
          </Text>
        </Group>
        {summary && <div className="procedure-summary">{summary}</div>}
      </div>
      <IconChevronRight size={18} className="procedure-chevron" />
    </UnstyledButton>
  );
}

function ProcedureDetail({ id, onBack }) {
  const procedure = useProcedure(id);
  const pr = procedure.data;

  return (
    <>
      <div className="block-head procedure-head">
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
                  className="type-dot"
                  style={{
                    background: `var(--mantine-color-${typeColor(pr.type)}-6)`,
                  }}
                />
                <h2>
                  {typeLabel(pr.type)} · {fmtDate(pr.dateTime)}
                </h2>
              </Group>
              <div className="sub">
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
            <div className="procedure-section">
              {pr.notes ? (
                <RichText html={pr.notes} />
              ) : (
                <Empty>Sem descrição registrada.</Empty>
              )}
            </div>
            {pr.extraNotes.length > 0 && (
              <div className="procedure-section">
                <div className="section-label">
                  Notas adicionais ({pr.extraNotes.length})
                </div>
                <Stack gap="sm" mt="sm" className="note-list">
                  {pr.extraNotes.map((n) => (
                    <div key={n.id} className="note">
                      <Text size="xs" c="dimmed">
                        {fmtDate(n.createdAt)} às{" "}
                        {dayjs(n.createdAt).format("HH:mm")}
                      </Text>
                      <Text size="sm" style={{ whiteSpace: "pre-line" }}>
                        {n.content}
                      </Text>
                    </div>
                  ))}
                </Stack>
              </div>
            )}
          </>
        )}
      </Async>
    </>
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
    <section className="block tutor-summary">
      <UnstyledButton
        className="tutor-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="tutor-details"
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="section-label">Tutor</div>
          <Text fw={600} truncate>
            {t.name}
          </Text>
        </div>
        <span className="tutor-toggle-hint">
          {open ? "Ocultar" : "Ver dados"}
          <IconChevronDown
            size={16}
            className="tutor-chevron"
            data-open={open || undefined}
          />
        </span>
      </UnstyledButton>
      <Collapse in={open} id="tutor-details">
        <PetOwnerInfo
          petOwner={t}
          className="tutor-summary-body"
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
    <section className="block tutor-aside">
      <Async q={petOwner} rows={4}>
        {(t) => (
          <>
            <div className="block-head">
              <div style={{ minWidth: 0 }}>
                <div className="section-label">Tutor</div>
                <h2 style={{ overflowWrap: "anywhere" }}>{t.name}</h2>
              </div>
              <EditButton
                onClick={() => setEditing(true)}
                label="Editar dados do tutor"
              />
            </div>
            <PetOwnerInfo petOwner={t} className="block-body" />
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
            <span className="tnum">{showCpf ? t.cpf : hideCpf(t.cpf)}</span>
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
            <Anchor href={telHref(t.phone)} size="sm" className="tnum">
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
