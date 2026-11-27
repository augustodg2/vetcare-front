import { ActionIcon, Button, Group } from "@mantine/core";
import { IconArrowLeft, IconPrinter } from "@tabler/icons-react";
import dayjs from "dayjs";
import { usePetOwner } from "@/api/queries/petOwners";
import { useAllVets } from "@/api/queries/vets";
import { Async, BlockHead, BlockSub } from "@/components/ui";
import { RichText } from "@/components/ui/RichText";
import { PrescriptionPrint } from "@/features/pacientes/PrescriptionPrint";
import { usePrescription } from "@/features/pacientes/queries";
import panelStyles from "@/features/pacientes/recordPanel.module.css";
import { fmtDate } from "@/lib/format";

export function PrescriptionDetail({ id, pet, onBack }) {
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
      <BlockHead className={panelStyles.head}>
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
              <BlockSub>
                {dayjs(rx.createdAt).format("HH:mm")} · {rx.vet.name}
              </BlockSub>
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
      </BlockHead>
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
