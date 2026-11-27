import { useEffect, useState } from "react";
import {
  ActionIcon,
  Button,
  Group,
  Loader,
  Menu,
  Modal,
  Pagination,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useDebouncedValue } from "@mantine/hooks";
import {
  IconDots,
  IconKey,
  IconMailForward,
  IconPlus,
  IconSearch,
  IconUserOff,
  IconPencil,
} from "@tabler/icons-react";
import { debounce, parseAsInteger, parseAsString, useQueryState } from "nuqs";
import {
  useDeactivateUser,
  useInviteUser,
  useResendInvite,
  useSendPasswordReset,
  useUpdateUser,
  useUsers,
} from "../../api/queries/users";
import { useSession } from "../../auth/session";
import { toast } from "../../lib/notify";
import {
  fmtDateTime,
  formatCrmv,
  isCpf,
  isEmail,
  maskCpf,
  onlyDigits,
  relDay,
  UFS,
} from "../../lib/format";
import { ROLE_LABEL, USER_STATUS } from "../../lib/status";
import {
  Async,
  Block,
  ConfirmDialog,
  DataTable,
  FormActions,
  PageHeader,
  PersonAvatar,
  Pill,
} from "../../components/ui";

const STAFF_ROLES = ["RECEP", "VET", "ADMIN"].map((value) => ({
  value,
  label: ROLE_LABEL[value],
}));

// a vet has a CPF/CRMV record, so the role can't move to or from VET on edit
const NON_VET_ROLES = STAFF_ROLES.filter((r) => r.value !== "VET");

// deactivated users are hidden by default; "todos" lists everyone
const STATUS_FILTERS = [
  {
    value: "abertos",
    label: "Ativos e convites",
    status: ["ACTIVE", "PENDING_INVITE"],
  },
  { value: "ativo", label: "Ativos", status: ["ACTIVE"] },
  { value: "convite", label: "Convite pendente", status: ["PENDING_INVITE"] },
  { value: "inativo", label: "Desativados", status: ["DEACTIVATED"] },
  { value: "todos", label: "Todos", status: undefined },
];
const DEFAULT_STATUS_FILTER = STATUS_FILTERS[0].value;

const SEARCH_DEBOUNCE_MS = 500;

export default function Usuarios() {
  const { user: me } = useSession();
  const [invite, setInvite] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deactivate, setDeactivate] = useState(null);
  const deactivateUser = useDeactivateUser();
  const [passwordReset, setPasswordReset] = useState(null);
  const resendInvite = useResendInvite();
  const sendPasswordReset = useSendPasswordReset();

  const [search, setSearch] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({
      history: "replace",
      limitUrlUpdates: debounce(SEARCH_DEBOUNCE_MS),
    }),
  );
  const [debounced] = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsString
      .withDefault(DEFAULT_STATUS_FILTER)
      .withOptions({ history: "replace" }),
  );
  const activeFilter =
    STATUS_FILTERS.find((f) => f.value === statusFilter) ?? STATUS_FILTERS[0];
  const q = useUsers({
    search: debounced,
    page,
    status: activeFilter.status,
  });

  const total = q.data?.total ?? 0;
  const pageSize = q.data?.pageSize;
  const pages =
    total && pageSize ? Math.max(1, Math.ceil(total / pageSize)) : null;
  // when the current page no longer exists, fall back to the last one
  const lastPage = pages ?? 1;
  useEffect(() => {
    if (q.data && !q.isPlaceholderData && page > lastPage) setPage(lastPage);
  }, [q.data, q.isPlaceholderData, page, lastPage, setPage]);

  const confirmDeactivate = async () => {
    try {
      await deactivateUser.mutateAsync(deactivate);
    } catch {
      return; // the global handler already showed the error
    }
    toast.ok(`Acesso de ${deactivate.name} desativado.`);
    setDeactivate(null);
  };

  const onResendInvite = async (u) => {
    try {
      await resendInvite.mutateAsync(u.id);
    } catch {
      return;
    }
    toast.ok(`Convite reenviado para ${u.email}.`);
  };

  const confirmPasswordReset = async () => {
    try {
      await sendPasswordReset.mutateAsync(passwordReset.id);
    } catch {
      return;
    }
    toast.ok(`Link de nova senha enviado para ${passwordReset.email}.`);
    setPasswordReset(null);
  };

  return (
    <>
      <PageHeader title="Usuários" finding="Quem tem acesso ao VetCare">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setInvite(true)}
        >
          Convidar usuário
        </Button>
      </PageHeader>
      <div className="stack">
        <Block flush>
          <Group
            justify="space-between"
            px="lg"
            py="sm"
            gap="xs"
            wrap="nowrap"
            style={{ borderBottom: "1px solid var(--vc-line)" }}
          >
            <Group gap="xs" wrap="nowrap" style={{ flex: 1 }}>
              <TextInput
                leftSection={<IconSearch size={15} />}
                placeholder="Nome ou e-mail"
                value={search}
                onChange={(e) => {
                  setSearch(e.currentTarget.value);
                  setPage(1);
                }}
                w={{ base: "100%", sm: 300 }}
                aria-label="Buscar"
              />
              <Select
                aria-label="Filtrar por situação"
                data={STATUS_FILTERS.map(({ value, label }) => ({
                  value,
                  label,
                }))}
                value={activeFilter.value}
                onChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
                allowDeselect={false}
                w={{ base: 150, sm: 190 }}
              />
            </Group>
            {(q.isLoading || q.isPlaceholderData) && (
              <Loader size="xs" aria-label="Carregando" />
            )}
          </Group>
          <Async q={q} rows={6}>
            {({ rows }) => (
              <DataTable
                rows={rows}
                empty={
                  search
                    ? `Nenhum usuário encontrado para "${search}".`
                    : activeFilter.status
                      ? "Nenhum usuário nesta situação."
                      : "Nenhum usuário cadastrado."
                }
                columns={[
                  {
                    key: "n",
                    label: "Nome",
                    render: (u) => (
                      <Group gap="sm" wrap="nowrap">
                        <PersonAvatar
                          name={u.name}
                          size={30}
                          color={u.status === "inativo" ? "gray" : "teal"}
                        />
                        <div>
                          <div className="cell-main">
                            {u.name}
                            {u.id === me.id ? " (você)" : ""}
                          </div>
                          <div className="cell-sub">{u.email}</div>
                        </div>
                      </Group>
                    ),
                  },
                  {
                    key: "r",
                    label: "Perfil",
                    render: (u) => ROLE_LABEL[u.role],
                  },
                  {
                    key: "s",
                    label: "Situação",
                    render: (u) => <Pill status={u.status} map={USER_STATUS} />,
                  },
                  {
                    key: "l",
                    label: "Último acesso",
                    render: (u) =>
                      u.status === "convite" ? (
                        <span className="muted">
                          Convite enviado {relDay(u.invitedAt)}
                        </span>
                      ) : u.lastSeen ? (
                        fmtDateTime(u.lastSeen)
                      ) : (
                        <span className="faint">—</span>
                      ),
                  },
                  {
                    key: "a",
                    label: "",
                    width: 48,
                    render: (u) =>
                      u.id !== me.id && (
                        <Menu position="bottom-end" withinPortal>
                          <Menu.Target>
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              aria-label={`Ações para ${u.name}`}
                            >
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconPencil size={15} />}
                              onClick={() => setEditing(u)}
                            >
                              Editar usuário
                            </Menu.Item>
                            {u.status === "convite" && (
                              <Menu.Item
                                leftSection={<IconMailForward size={15} />}
                                onClick={() => onResendInvite(u)}
                              >
                                Reenviar convite
                              </Menu.Item>
                            )}
                            {u.status === "ativo" && (
                              <Menu.Item
                                leftSection={<IconKey size={15} />}
                                onClick={() => setPasswordReset(u)}
                              >
                                Enviar link de nova senha
                              </Menu.Item>
                            )}
                            {u.status !== "inativo" && (
                              <Menu.Item
                                leftSection={<IconUserOff size={15} />}
                                color="red"
                                onClick={() => setDeactivate(u)}
                              >
                                Desativar acesso
                              </Menu.Item>
                            )}
                          </Menu.Dropdown>
                        </Menu>
                      ),
                  },
                ]}
                mobile={{
                  title: (u) => u.name,
                  sub: (u) => `${ROLE_LABEL[u.role]} · ${u.email}`,
                  side: (u) => (
                    <Pill status={u.status} map={USER_STATUS} size="sm" />
                  ),
                }}
                minWidth={760}
              />
            )}
          </Async>

          {total > pageSize && (
            <div className="block-foot">
              <Text size="sm" c="dimmed">
                {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}{" "}
                de {total}
              </Text>
              <Pagination
                value={page}
                onChange={setPage}
                total={pages}
                size="sm"
              />
            </div>
          )}
        </Block>
      </div>

      <InviteModal opened={invite} onClose={() => setInvite(false)} />
      <EditUserModal
        key={editing?.id}
        user={editing}
        onClose={() => setEditing(null)}
      />
      <ConfirmDialog
        opened={!!deactivate}
        onClose={() => setDeactivate(null)}
        title="Desativar acesso"
        confirmLabel="Desativar"
        loading={deactivateUser.isPending}
        onConfirm={confirmDeactivate}
      >
        {deactivate?.name} não vai mais conseguir entrar no VetCare. Os
        registros feitos por essa pessoa continuam no sistema.
      </ConfirmDialog>
      <ConfirmDialog
        opened={!!passwordReset}
        onClose={() => setPasswordReset(null)}
        title="Enviar link de nova senha"
        confirmLabel="Enviar link"
        loading={sendPasswordReset.isPending}
        onConfirm={confirmPasswordReset}
      >
        {passwordReset?.name} vai receber em {passwordReset?.email} um link para
        definir uma nova senha, válido por 24 horas. A senha atual continua
        valendo até a troca.
      </ConfirmDialog>
    </>
  );
}

function InviteModal({ opened, onClose }) {
  return (
    <Modal opened={opened} onClose={onClose} title="Convidar usuário" size="lg">
      {opened && <InviteForm onClose={onClose} />}
    </Modal>
  );
}

function InviteForm({ onClose }) {
  const form = useForm({
    initialValues: {
      name: "",
      email: "",
      role: "RECEP",
      cpf: "",
      crmv: "",
      crmvUf: null,
    },
    validate: {
      name: (v) =>
        v.trim().split(" ").length < 2 ? "Informe nome e sobrenome" : null,
      email: (v) => (isEmail(v) ? null : "E-mail inválido"),
      cpf: (v, values) =>
        values.role === "VET" && !isCpf(v) ? "CPF inválido" : null,
      crmv: (v, values) =>
        values.role === "VET" && v.length < 1
          ? "Informe o número do CRMV"
          : null,
      crmvUf: (v, values) =>
        values.role === "VET" && !v ? "Selecione a UF" : null,
    },
  });
  const isVet = form.values.role === "VET";
  const invite = useInviteUser();
  return (
    <form
      noValidate
      onSubmit={form.onSubmit(async (v) => {
        try {
          await invite.mutateAsync({
            name: v.name.trim(),
            email: v.email.trim().toLowerCase(),
            role: v.role,
            ...(v.role === "VET" && {
              vet: { cpf: v.cpf, crmv: formatCrmv(v.crmv, v.crmvUf) },
            }),
          });
        } catch {
          return; // the global handler already showed the error
        }
        toast.ok(`Convite enviado para ${v.email.trim()}.`);
        onClose();
      })}
    >
      <SimpleGrid cols={{ base: 1, sm: 2 }}>
        <TextInput label="Nome completo" {...form.getInputProps("name")} />
        <TextInput
          label="E-mail"
          type="email"
          {...form.getInputProps("email")}
        />
        <Select
          label="Perfil de acesso"
          data={STAFF_ROLES}
          allowDeselect={false}
          {...form.getInputProps("role")}
        />
        {isVet && (
          <>
            <TextInput
              label="CPF"
              placeholder="000.000.000-00"
              inputMode="numeric"
              {...form.getInputProps("cpf")}
              onChange={(e) =>
                form.setFieldValue("cpf", maskCpf(e.currentTarget.value))
              }
            />
            <div>
              <Text size="sm" fw={500} mb={4}>
                CRMV
              </Text>
              <Group gap="xs" wrap="nowrap">
                <Select
                  aria-label="UF do CRMV"
                  placeholder="UF"
                  data={UFS}
                  searchable
                  w={85}
                  {...form.getInputProps("crmvUf")}
                  error={!!form.errors.crmvUf}
                />
                <TextInput
                  aria-label="Número do CRMV"
                  placeholder="Número"
                  inputMode="numeric"
                  autoComplete="off"
                  leftSection={<Text size="sm">Nº</Text>}
                  leftSectionWidth={32}
                  style={{ flex: 1 }}
                  {...form.getInputProps("crmv")}
                  error={!!form.errors.crmv}
                  onChange={(e) =>
                    form.setFieldValue(
                      "crmv",
                      onlyDigits(e.currentTarget.value).slice(0, 6),
                    )
                  }
                />
              </Group>
              {(form.errors.crmvUf || form.errors.crmv) && (
                <Text size="xs" c="red" mt={4}>
                  Informe a UF e o número do CRMV
                </Text>
              )}
            </div>
          </>
        )}
      </SimpleGrid>
      <FormActions
        onCancel={onClose}
        loading={invite.isPending}
        submitLabel="Enviar convite"
      />
    </form>
  );
}

function EditUserModal({ user, onClose }) {
  return (
    <Modal
      opened={!!user}
      onClose={onClose}
      title={user ? `Editar ${user.name}` : ""}
      size="md"
    >
      {user && <EditUserForm user={user} onClose={onClose} />}
    </Modal>
  );
}

function EditUserForm({ user, onClose }) {
  const form = useForm({
    initialValues: { name: user.name, role: user.role },
    validate: {
      name: (v) =>
        v.trim().split(" ").length < 2 ? "Informe nome e sobrenome" : null,
    },
  });
  const updateUser = useUpdateUser();
  const isVet = user.role === "VET";
  return (
    <form
      noValidate
      onSubmit={form.onSubmit(async (v) => {
        try {
          await updateUser.mutateAsync({
            id: user.id,
            name: v.name.trim(),
            role: v.role,
          });
        } catch {
          return; // the global handler already showed the error
        }
        toast.ok("Usuário atualizado.");
        onClose();
      })}
    >
      <Stack gap="md">
        <TextInput label="Nome completo" {...form.getInputProps("name")} />
        <TextInput label="E-mail" value={user.email} disabled readOnly />
        <Select
          label="Perfil de acesso"
          data={isVet ? STAFF_ROLES : NON_VET_ROLES}
          allowDeselect={false}
          disabled={isVet}
          description={
            isVet
              ? "Perfil de veterinário não pode ser alterado."
              : "Para criar um veterinário, envie um novo convite."
          }
          {...form.getInputProps("role")}
        />
        {user.vet && (
          <SimpleGrid cols={2}>
            <TextInput label="CPF" value={user.vet.cpf} disabled readOnly />
            <TextInput label="CRMV" value={user.vet.crmv} disabled readOnly />
          </SimpleGrid>
        )}
      </Stack>
      <FormActions
        onCancel={onClose}
        loading={updateUser.isPending}
        submitLabel="Salvar"
      />
    </form>
  );
}
