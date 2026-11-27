import { Avatar } from "@mantine/core";
import { IconCat, IconDog, IconPaw } from "@tabler/icons-react";
import { initials } from "@/lib/format";
import { SPECIES_LABEL } from "@/lib/status";

export function PersonAvatar({ name, size = 32, color = "teal" }) {
  return (
    <Avatar
      size={size}
      radius="xl"
      color={color}
      variant="light"
      style={{ flexShrink: 0 }}
    >
      <span style={{ fontSize: size * 0.38, fontWeight: 600 }}>
        {initials(name)}
      </span>
    </Avatar>
  );
}

const SPECIES_ICON = { DOG: IconDog, CAT: IconCat };

export function SpeciesAvatar({ species, size }) {
  const Icon = SPECIES_ICON[species] ?? IconPaw;
  return (
    <Avatar
      size={size}
      radius="md"
      variant="light"
      color={species === "CAT" ? "grape" : "teal"}
      style={{ flexShrink: 0 }}
      title={SPECIES_LABEL[species]}
      aria-label={SPECIES_LABEL[species]}
    >
      <Icon size={size * 0.5} stroke={1.6} />
    </Avatar>
  );
}
