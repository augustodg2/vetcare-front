import {
  Anchor,
  Button,
  PasswordInput,
  Popover,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { Navigate, useNavigate } from "react-router-dom";
import { ApiError } from "../api/errors";
import { useLogin } from "../api/queries/auth";
import { STATUS } from "../api/statusCodes";
import { isKnownRole, roleHome } from "../auth/roles";
import { SignOut, useSession } from "../auth/session";
import { AuthCard } from "../components/AuthCard";
import { isEmail } from "../lib/format";
import { toast } from "../lib/notify";

export default function Login() {
  const { user } = useSession();
  const navigate = useNavigate();

  const form = useForm({
    validate: {
      email: (v) => (isEmail(v) ? null : "Informe um e-mail válido"),
      password: (v) => (v ? null : "Informe a senha"),
    },
  });

  const loginMutation = useLogin();

  if (user) {
    return isKnownRole(user.role) ? (
      <Navigate to={roleHome(user.role)} replace />
    ) : (
      <SignOut />
    );
  }

  const onSubmit = form.onSubmit(async (v) => {
    try {
      const { user } = await loginMutation.mutateAsync(v);
      navigate(roleHome(user.role), { replace: true });
    } catch (e) {
      if (e instanceof ApiError && e.status === STATUS.UNAUTHORIZED) {
        toast.err(e, "E-mail ou senha incorretos.");
        return;
      }

      toast.err(e);
    }
  });

  return (
    <AuthCard title="Entrar" intro="Acesse com o e-mail cadastrado na clínica.">
      <form onSubmit={onSubmit} noValidate>
        <Stack gap="md">
          <TextInput
            label="E-mail"
            type="email"
            placeholder="voce@email.com"
            autoComplete="username"
            {...form.getInputProps("email")}
          />
          <PasswordInput
            label="Senha"
            autoComplete="current-password"
            {...form.getInputProps("password")}
          />
          <Button
            type="submit"
            fullWidth
            loading={loginMutation.isPending}
            mt={4}
          >
            Entrar
          </Button>
          <Popover width={280} position="bottom" withArrow shadow="md">
            <Popover.Target>
              <Anchor component="button" type="button" size="sm" mx="auto">
                Esqueceu a senha?
              </Anchor>
            </Popover.Target>
            <Popover.Dropdown>
              <Text size="sm">
                Peça a um administrador da clínica para enviar um link de nova
                senha. Ele chega no seu e-mail e vale por 24 horas.
              </Text>
            </Popover.Dropdown>
          </Popover>
        </Stack>
      </form>
    </AuthCard>
  );
}
