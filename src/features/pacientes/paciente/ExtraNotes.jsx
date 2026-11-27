import { Button, Group, Stack, Text, Textarea } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import dayjs from "dayjs";
import { useState } from "react";
import { useAddProcedureNote } from "@/api/queries/procedures";
import panelStyles from "@/features/pacientes/recordPanel.module.css";
import { fmtDate } from "@/lib/format";
import { toast } from "@/lib/notify";
import textStyles from "@/styles/text.module.css";
import styles from "./records.module.css";

const NOTE_MAX = 2000;

export function ExtraNotes({ procedure: pr }) {
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
