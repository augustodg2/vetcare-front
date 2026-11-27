import {
  ActionIcon,
  Badge,
  Box,
  Group,
  Pagination,
  Stack,
  Tabs,
  Text,
  UnstyledButton,
} from "@mantine/core";
import {
  IconAlertTriangle,
  IconChevronLeft,
  IconChevronRight,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { parseAsInteger, parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePetOwner } from "../../api/queries/petOwners";
import { usePet } from "../../api/queries/pets";
import { usePetProcedures, useProcedure } from "../../api/queries/procedures";
import { RichText, RichTextPreview } from "../../components/RichText";
import {
  Async,
  Block,
  Dash,
  Empty,
  Facts,
  PetAvatar,
} from "../../components/ui";
import { age, fmtDate, fmtDateTime, hideCpf, kg } from "../../lib/format";
import { PROCEDURE_COLOR, PROCEDURE_LABEL, SPECIES_LABEL } from "../../lib/status";

const SEX_LABEL = { M: "Macho", F: "Fêmea" };

export default function Paciente() {
  const { id } = useParams();
  const pet = usePet(id);

  return (
    <>
      <Link to="/vet/pacientes" className="back-link">
        <IconChevronLeft size={14} />
        Pacientes
      </Link>
      <Async q={pet} rows={2}>
        {(p) => (
          <>
            <PetHeader pet={p} />
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

function PetMain({ petId }) {
  const [procedureId, setProcedureId] = useQueryState(
    "procedimento",
    parseAsString.withOptions({ history: "push" }),
  );
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  return (
    <div style={{ minWidth: 0 }}>
      {procedureId ? (
        <>
          <UnstyledButton
            className="back-link"
            onClick={() => setProcedureId(null)}
          >
            <IconChevronLeft size={14} />
            Histórico clínico
          </UnstyledButton>
          <section className="block">
            <ProcedureDetail id={procedureId} />
          </section>
        </>
      ) : (
        <section className="block">
          <Tabs defaultValue="historico">
            <Tabs.List px="lg">
              <Tabs.Tab value="historico">Histórico clínico</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="historico">
              <ClinicalHistory
                petId={petId}
                page={page}
                onPage={setPage}
                onOpen={(pr) => setProcedureId(pr.id)}
              />
            </Tabs.Panel>
          </Tabs>
        </section>
      )}
    </div>
  );
}

function ClinicalHistory({ petId, page, onPage, onOpen }) {
  const history = usePetProcedures({ petId, page });

  return (
    <Async q={history} rows={4}>
      {({ rows, total, pageSize }) =>
        rows.length === 0 ? (
          <Empty>Nenhum procedimento registrado para este pet.</Empty>
        ) : (
          <>
            {rows.map((pr) => (
              <ProcedureItem key={pr.id} procedure={pr} onOpen={onOpen} />
            ))}
            {total > pageSize && (
              <div className="block-foot">
                <Text size="sm" c="dimmed">
                  {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}{" "}
                  de {total}
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
  );
}

function ProcedureSummary({ procedure: pr }) {
  return (
    <Group gap="xs" align="baseline">
      <Badge variant="light" color={PROCEDURE_COLOR[pr.type] ?? "gray"} size="sm">
        {PROCEDURE_LABEL[pr.type] ?? pr.type}
      </Badge>
      <Text size="sm" fw={500}>
        {fmtDateTime(pr.dateTime)}
      </Text>
      <Text size="xs" c="dimmed">
        {pr.vet.name}
      </Text>
    </Group>
  );
}

function ProcedureItem({ procedure: pr, onOpen }) {
  return (
    <UnstyledButton
      className="procedure-row"
      onClick={() => onOpen(pr)}
      aria-label={`Abrir ${PROCEDURE_LABEL[pr.type] ?? pr.type} de ${fmtDateTime(pr.dateTime)}`}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        <ProcedureSummary procedure={pr} />
        <RichTextPreview html={pr.notes} />
      </div>
      <IconChevronRight
        size={18}
        color="var(--vc-muted)"
        style={{ flexShrink: 0 }}
      />
    </UnstyledButton>
  );
}

function ProcedureDetail({ id }) {
  const procedure = useProcedure(id);

  return (
    <Async q={procedure} rows={6}>
      {(pr) => (
        <>
          <Box
            px="lg"
            py="md"
            style={{ borderBottom: "1px solid var(--vc-line)" }}
          >
            <ProcedureSummary procedure={pr} />
          </Box>
          <Box px="lg" py="md">
            {pr.notes ? (
              <RichText html={pr.notes} />
            ) : (
              <Empty>Sem descrição registrada.</Empty>
            )}
          </Box>
          {pr.extraNotes.length > 0 && (
            <Box
              px="lg"
              py="md"
              style={{ borderTop: "1px solid var(--vc-line)" }}
            >
              <div className="section-label">
                Notas adicionais ({pr.extraNotes.length})
              </div>
              <Stack gap="sm" mt="sm" className="note-list">
                {pr.extraNotes.map((n) => (
                  <div key={n.id} className="note">
                    <Text size="xs" c="dimmed">
                      {fmtDateTime(n.createdAt)}
                    </Text>
                    <Text size="sm" style={{ whiteSpace: "pre-line" }}>
                      {n.content}
                    </Text>
                  </div>
                ))}
              </Stack>
            </Box>
          )}
        </>
      )}
    </Async>
  );
}

function PetOwnerAside({ id }) {
  const petOwner = usePetOwner(id);
  const [showCpf, setShowCpf] = useState(false);
  return (
    <Block title="Tutor">
      <Async q={petOwner} rows={4}>
        {(t) => (
          <Stack gap="sm">
            <Text fw={600}>{t.name}</Text>
            <Info
              label="CPF"
              value={
                <Group gap={6} wrap="nowrap" component="span">
                  <span className="tnum">
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
            <Info label="Telefone" value={t.phone} />
            <Info label="E-mail" value={t.email} />
            <Info label="Endereço" value={t.address} />
          </Stack>
        )}
      </Async>
    </Block>
  );
}

function Info({ label, value }) {
  return (
    <div style={{ minWidth: 0 }}>
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text size="sm" style={{ overflowWrap: "anywhere" }}>
        {value || <Dash />}
      </Text>
    </div>
  );
}

function PetHeader({ pet: p }) {
  const species = SPECIES_LABEL[p.species] ?? p.species;
  return (
    <section className="block" style={{ marginBottom: "var(--vc-gutter)" }}>
      <Group gap="md" wrap="nowrap" px="lg" py="md" align="center">
        <PetAvatar pet={p} size={56} />
        <div style={{ minWidth: 0 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>{p.name}</h1>
          <Text size="sm" c="dimmed">
            {[species, p.breed, age(p.birth)].filter(Boolean).join(" · ")}
          </Text>
        </div>
      </Group>
      {p.alerts && (
        <Group
          gap={6}
          wrap="nowrap"
          px="lg"
          py="xs"
          style={{
            borderTop: "1px solid var(--vc-line)",
            background: "var(--mantine-color-red-0)",
          }}
        >
          <IconAlertTriangle
            size={16}
            color="var(--mantine-color-red-8)"
            style={{ flexShrink: 0 }}
          />
          <Text size="sm" c="red.8">
            {p.alerts}
          </Text>
        </Group>
      )}
      <Facts
        items={[
          ["Espécie", species],
          ["Raça", p.breed],
          ["Sexo", SEX_LABEL[p.sex] ?? p.sex],
          ["Nascimento", p.birth ? fmtDate(p.birth) : null],
          ["Peso", p.weight != null ? kg(p.weight) : null],
        ]}
      />
    </section>
  );
}
