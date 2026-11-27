import { useNavigate, useParams } from "react-router-dom";
import { useResetPassword } from "../api/queries/users";
import { AuthCard, NewPasswordForm } from "../components/AuthCard";
import { toast } from "../lib/notify";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const reset = useResetPassword();

  const onSubmit = async (password) => {
    try {
      await reset.mutateAsync({ token, password });
    } catch {
      return;
    }
    toast.ok("Senha redefinida. Entre com a nova senha.");
    navigate("/login", { replace: true });
  };

  return (
    <AuthCard
      title="Redefina sua senha"
      intro="Escolha uma nova senha para acessar o VetCare."
    >
      <NewPasswordForm
        passwordLabel="Nova senha"
        submitLabel="Salvar nova senha"
        loading={reset.isPending}
        onSubmit={onSubmit}
      />
    </AuthCard>
  );
}
