import { ActionIcon, Group, Stack, Text } from "@mantine/core";
import {
  IconAlertTriangle,
  IconChevronLeft,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePetOwner } from "../../api/queries/petOwners";
import { usePet } from "../../api/queries/pets";
import { Async, Block, Dash, Facts, PetAvatar } from "../../components/ui";
import { age, fmtDate, hideCpf, kg } from "../../lib/format";
import { SPECIES_LABEL } from "../../lib/status";

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
              <div />
              <PetOwnerAside id={p.petOwnerId} />
            </div>
          </>
        )}
      </Async>
    </>
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
