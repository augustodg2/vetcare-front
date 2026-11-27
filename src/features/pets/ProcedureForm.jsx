import {
  ActionIcon,
  Group,
  Input,
  Select,
  SimpleGrid,
  Stack,
} from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { DateInput, TimeInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { Link, RichTextEditor } from "@mantine/tiptap";
import Placeholder from "@tiptap/extension-placeholder";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import dayjs from "dayjs";
import { useCreateProcedure } from "@/api/queries/procedures";
import { useAllVets } from "@/api/queries/vets";
import { useSession } from "@/auth/session";
import { toast } from "@/lib/notify";
import { PROCEDURE_LABEL } from "@/lib/status";
import { htmlToText, sanitizeHtml } from "@/components/ui/RichText";
import { BlockHead, FormActions } from "@/components/ui";
import panelStyles from "./recordPanel.module.css";

const TYPE_OPTIONS = Object.entries(PROCEDURE_LABEL).map(([value, label]) => ({
  value,
  label,
}));

const CONSULTATION_TEMPLATE = [
  "Anamnese",
  "Parâmetros aferidos / avaliação clínica",
  "Diagnóstico",
  "Prognóstico",
]
  .map((h) => `<h3>${h}</h3><p></p>`)
  .join("");

const templateFor = (type) =>
  type === "CONSULTATION" ? CONSULTATION_TEMPLATE : "";

const TYPE_HINT = {
  EXAM: "Exame realizado e resultado",
  VACCINATION: "Vacina aplicada, lote e reações",
  SURGERY: "Procedimento, intercorrências e prescrição pós-operatória",
  RETURN: "Evolução do quadro e conduta",
};

const toDateTime = (date, time) => {
  const [h, m] = time.split(":").map(Number);
  return dayjs(date).hour(h).minute(m).second(0).millisecond(0).toDate();
};

export function NewProcedure({ petId, onBack, onCreated }) {
  return (
    <>
      <BlockHead className={panelStyles.head}>
        <Group gap="sm" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={onBack}
            aria-label="Voltar ao histórico clínico"
          >
            <IconArrowLeft size={18} />
          </ActionIcon>
          <h2>Registrar procedimento</h2>
        </Group>
      </BlockHead>
      <div className={panelStyles.section}>
        <ProcedureForm petId={petId} onClose={onBack} onCreated={onCreated} />
      </div>
    </>
  );
}

function ProcedureForm({ petId, onClose, onCreated }) {
  const { user } = useSession();
  const ownVetId = user.vetId;
  const vets = useAllVets({ enabled: !ownVetId });
  const now = dayjs();

  const form = useForm({
    initialValues: {
      type: "CONSULTATION",
      vetId: ownVetId ?? null,
      date: now.toDate(),
      time: now.format("HH:mm"),
      notes: CONSULTATION_TEMPLATE,
    },
    validate: {
      vetId: (v) => (v ? null : "Escolha o veterinário"),
      date: (v) => (v ? null : "Informe o dia"),
      time: (v, values) => {
        if (!v) return "Informe o horário";
        if (values.date && toDateTime(values.date, v) > new Date()) {
          return "O horário não pode ser futuro";
        }
        return null;
      },
      notes: (v) =>
        htmlToText(v, { skipHeadings: true })
          ? null
          : "Descreva o procedimento",
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [3] } }),
      Link,
      Placeholder.configure({
        placeholder: ({ editor }) =>
          TYPE_HINT[form.getValues().type] && editor.isEmpty
            ? TYPE_HINT[form.getValues().type]
            : "",
      }),
    ],
    content: CONSULTATION_TEMPLATE,
    onUpdate: ({ editor }) => form.setFieldValue("notes", editor.getHTML()),
  });

  const onType = (type) => {
    const prev = form.values.type;
    form.setFieldValue("type", type);
    if (!editor) return;
    const untouched =
      !htmlToText(form.values.notes, { skipHeadings: true }) &&
      (form.values.notes === templateFor(prev) || editor.isEmpty);
    if (untouched) {
      editor.commands.setContent(templateFor(type), true);
    }
  };

  const create = useCreateProcedure({
    onSuccess: (procedure) => {
      toast.ok(
        `Registro de ${PROCEDURE_LABEL[procedure.type].toLowerCase()} salvo no histórico.`,
      );
      onCreated(procedure);
    },
  });

  const onSubmit = form.onSubmit((v) =>
    create.mutate({
      petId,
      vetId: v.vetId,
      type: v.type,
      dateTime: toDateTime(v.date, v.time),
      notes: sanitizeHtml(v.notes),
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack gap="sm">
        <SimpleGrid cols={{ base: 1, sm: ownVetId ? 3 : 2 }}>
          <Select
            label="Tipo"
            data={TYPE_OPTIONS}
            allowDeselect={false}
            required
            withAsterisk
            value={form.values.type}
            onChange={onType}
          />
          {!ownVetId && (
            <Select
              label="Veterinário"
              placeholder="Escolha o veterinário"
              data={(vets.data ?? []).map((v) => ({
                value: v.id,
                label: v.name,
              }))}
              disabled={!vets.data}
              required
              withAsterisk
              {...form.getInputProps("vetId")}
            />
          )}
          <DateInput
            label="Dia"
            valueFormat="DD/MM/YYYY"
            maxDate={new Date()}
            required
            withAsterisk
            {...form.getInputProps("date")}
          />
          <TimeInput
            label="Horário"
            required
            withAsterisk
            {...form.getInputProps("time")}
          />
        </SimpleGrid>
        <Input.Wrapper
          label="Descrição"
          required
          withAsterisk
          error={form.errors.notes}
        >
          <RichTextEditor
            editor={editor}
            className={panelStyles.editor}
            data-error={!!form.errors.notes || undefined}
          >
            <RichTextEditor.Toolbar>
              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Bold />
                <RichTextEditor.Italic />
                <RichTextEditor.Strikethrough />
              </RichTextEditor.ControlsGroup>
              <RichTextEditor.ControlsGroup>
                <RichTextEditor.H3 />
                <RichTextEditor.BulletList />
                <RichTextEditor.OrderedList />
              </RichTextEditor.ControlsGroup>
              <RichTextEditor.ControlsGroup>
                <RichTextEditor.Undo />
                <RichTextEditor.Redo />
              </RichTextEditor.ControlsGroup>
            </RichTextEditor.Toolbar>
            <RichTextEditor.Content />
          </RichTextEditor>
        </Input.Wrapper>
      </Stack>
      <FormActions
        onCancel={onClose}
        loading={create.isPending}
        submitLabel="Registrar"
      />
    </form>
  );
}
