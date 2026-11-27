import {
  ActionIcon,
  Anchor,
  Collapse,
  Group,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { IconChevronDown, IconEye, IconEyeOff } from "@tabler/icons-react";
import { useState } from "react";
import { usePetOwner } from "@/api/queries/petOwners";
import { Async, Block, BlockBody, BlockHead, Dash } from "@/components/ui";
import { PetOwnerModal } from "@/features/pets/PetForms";
import { hideCpf, maskCpf, maskPhone } from "@/lib/format";
import textStyles from "@/styles/text.module.css";
import { EditButton } from "./EditButton";
import styles from "./PetOwner.module.css";

const telHref = (phone = "") => `tel:${phone.replace(/\D/g, "")}`;

export function PetOwnerSummary({ id }) {
  const petOwner = usePetOwner(id);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const t = petOwner.data;
  if (!t) return null;

  return (
    <Block flush className={styles.petOwnerSummary}>
      <UnstyledButton
        className={styles.petOwnerToggle}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="pet-owner-details"
      >
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className={textStyles.sectionLabel}>Tutor</div>
          <Text fw={600} truncate>
            {t.name}
          </Text>
        </div>
        <span className={styles.petOwnerToggleHint}>
          {open ? "Ocultar" : "Ver dados"}
          <IconChevronDown
            size={16}
            className={styles.petOwnerChevron}
            data-open={open || undefined}
          />
        </span>
      </UnstyledButton>
      <Collapse in={open} id="pet-owner-details">
        <PetOwnerInfo
          petOwner={t}
          className={styles.petOwnerSummaryBody}
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
    </Block>
  );
}

export function PetOwnerAside({ id }) {
  const petOwner = usePetOwner(id);
  const [editing, setEditing] = useState(false);

  return (
    <Block flush className={styles.petOwnerAside}>
      <Async q={petOwner} rows={4}>
        {(t) => (
          <>
            <BlockHead>
              <div style={{ minWidth: 0 }}>
                <div className={textStyles.sectionLabel}>Tutor</div>
                <h2 style={{ overflowWrap: "anywhere" }}>{t.name}</h2>
              </div>
              <EditButton
                onClick={() => setEditing(true)}
                label="Editar dados do tutor"
              />
            </BlockHead>
            <BlockBody>
              <PetOwnerInfo petOwner={t} />
            </BlockBody>
            <PetOwnerModal
              opened={editing}
              onClose={() => setEditing(false)}
              petOwner={t}
            />
          </>
        )}
      </Async>
    </Block>
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
              {showCpf ? maskCpf(t.cpf) : hideCpf(t.cpf)}
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
              {maskPhone(t.phone)}
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
