import { useNavigate, useParams } from "react-router-dom";
import { roleHome } from "@/auth/roles";
import { AuthCard, NewPasswordForm } from "./AuthCard";
import { useAcceptInvite } from "./queries";

export default function AcceptInvite() {
  const { token } = useParams();
  const navigate = useNavigate();
  const accept = useAcceptInvite();

  const onSubmit = async (password) => {
    try {
      const user = await accept.mutateAsync({ token, password });
      navigate(roleHome(user.role), { replace: true });
    } catch {}
  };

  return (
    <AuthCard
      title="Defina sua senha"
      intro="Você foi convidado para o VetCare. Escolha uma senha para entrar."
    >
      <NewPasswordForm
        passwordLabel="Senha"
        submitLabel="Definir senha e entrar"
        loading={accept.isPending}
        onSubmit={onSubmit}
      />
    </AuthCard>
  );
}
