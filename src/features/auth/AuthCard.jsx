import { Anchor, Button, PasswordInput, Stack, Text } from "@mantine/core";
import { useForm } from "@mantine/form";
import { Link } from "react-router-dom";
import { isStrongPassword, PASSWORD_RULE } from "@/lib/password";

export function AuthCard({ title, intro, children }) {
  return (
    <div className="login">
      <div className="login-card">
        <div className="login-brand">
          <img src="/favicon.svg" alt="" />
          <div>
            <Text fw={600} size="lg" lh={1.2}>
              VetCare
            </Text>
            <Text size="sm" c="dimmed">
              Clínica veterinária
            </Text>
          </div>
        </div>
        <div className="login-panel">
          <h1 style={{ margin: "0 0 4px", fontSize: 24, fontWeight: 600 }}>
            {title}
          </h1>
          <Text size="sm" c="dimmed" mb="lg">
            {intro}
          </Text>
          {children}
        </div>
      </div>
    </div>
  );
}

export function NewPasswordForm({
  passwordLabel,
  submitLabel,
  loading,
  onSubmit,
}) {
  const form = useForm({
    initialValues: { password: "", confirm: "" },
    validate: {
      password: (v) => (isStrongPassword(v) ? null : PASSWORD_RULE),
      confirm: (v, values) =>
        v === values.password ? null : "As senhas não são iguais",
    },
  });

  return (
    <form
      onSubmit={form.onSubmit(({ password }) => onSubmit(password))}
      noValidate
    >
      <Stack gap="md">
        <PasswordInput
          label={passwordLabel}
          autoComplete="new-password"
          {...form.getInputProps("password")}
        />
        <PasswordInput
          label="Confirmar senha"
          autoComplete="new-password"
          {...form.getInputProps("confirm")}
        />
        <Button type="submit" fullWidth loading={loading} mt={4}>
          {submitLabel}
        </Button>
        <Anchor component={Link} to="/login" size="sm" ta="center">
          Voltar ao login
        </Anchor>
      </Stack>
    </form>
  );
}
