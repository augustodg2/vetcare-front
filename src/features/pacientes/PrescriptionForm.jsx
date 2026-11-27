import { ActionIcon, Group, Input, Select, Stack } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Link, RichTextEditor } from "@mantine/tiptap";
import { IconArrowLeft } from "@tabler/icons-react";
import Placeholder from "@tiptap/extension-placeholder";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useCreatePrescription } from "./queries";
import { useAllVets } from "@/api/queries/vets";
import { useSession } from "@/auth/session";
import { toast } from "@/lib/notify";
import { htmlToText, sanitizeHtml } from "@/components/ui/RichText";
import { FormActions } from "@/components/ui";
import { cx } from "@/lib/cx";
import blockStyles from "@/components/ui/Block.module.css";
import panelStyles from "./recordPanel.module.css";

const GUIDANCE = "Orientações ao tutor";

const TEMPLATE = `<h3>Uso oral</h3><ol><li><p></p></li></ol><h3>${GUIDANCE}</h3><p></p>`;

const ITEM_HINT =
  "Fármaco, concentração e forma farmacêutica (quantidade total). Dose, frequência e duração.";
const GUIDANCE_HINT = "Cuidados, sinais de alerta e data de retorno.";

function hintFor({ editor, node, pos }) {
  if (editor.isEmpty) return "Escreva a prescrição";
  if (node.type.name !== "paragraph") return "";
  const $pos = editor.state.doc.resolve(pos);
  if ($pos.parent.type.name === "listItem") return ITEM_HINT;
  const before = $pos.nodeBefore;
  if (before?.type.name === "heading" && before.textContent === GUIDANCE) {
    return GUIDANCE_HINT;
  }
  return "";
}

export function NewPrescription({ petId, onBack, onCreated }) {
  return (
    <>
      <div className={cx(blockStyles.head, panelStyles.head)}>
        <Group gap="sm" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="gray"
            onClick={onBack}
            aria-label="Voltar às prescrições"
          >
            <IconArrowLeft size={18} />
          </ActionIcon>
          <h2>Nova prescrição</h2>
        </Group>
      </div>
      <div className={panelStyles.section}>
        <PrescriptionForm
          petId={petId}
          onClose={onBack}
          onCreated={onCreated}
        />
      </div>
    </>
  );
}

function PrescriptionForm({ petId, onClose, onCreated }) {
  const { user } = useSession();
  const ownVetId = user.vetId;
  const vets = useAllVets({ enabled: !ownVetId });

  const form = useForm({
    initialValues: { vetId: ownVetId ?? null, content: TEMPLATE },
    validate: {
      vetId: (v) => (v ? null : "Escolha o veterinário"),
      content: (v) =>
        htmlToText(v, { skipHeadings: true }) ? null : "Escreva a prescrição",
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [3] } }),
      Link,
      Placeholder.configure({
        showOnlyCurrent: false,
        includeChildren: true,
        placeholder: hintFor,
      }),
    ],
    content: TEMPLATE,
    autofocus: "end",
    onUpdate: ({ editor }) =>
      form.setFieldValue("content", editor.isEmpty ? "" : editor.getHTML()),
  });

  const create = useCreatePrescription({
    onSuccess: (prescription) => {
      toast.ok("Prescrição salva.");
      onCreated(prescription);
    },
  });

  const onSubmit = form.onSubmit((v) =>
    create.mutate({ petId, vetId: v.vetId, content: sanitizeHtml(v.content) }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <Stack gap="sm">
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
        <Input.Wrapper
          label="Prescrição"
          description="Agrupe os medicamentos pela via de administração (uso oral, tópico, oftálmico, otológico, injetável)."
          styles={{ description: { marginBottom: 8 } }}
          required
          withAsterisk
          error={form.errors.content}
        >
          <RichTextEditor
            editor={editor}
            className={panelStyles.editor}
            data-error={!!form.errors.content || undefined}
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
        submitLabel="Salvar prescrição"
      />
    </form>
  );
}
