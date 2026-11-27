import { isStrongPassword, PASSWORD_RULE } from "@/lib/password";
import { http, HttpResponse } from "msw";
import { ENDPOINTS } from "@/api/endpoints";
import { STATUS } from "@/api/statusCodes";
import { vetStore } from "../vets";

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "";
const PAGE_SIZE = 8;

export const TOKEN_PREFIX = "mock-token-";

const ago = (days) => new Date(Date.now() - days * 86_400_000).toISOString();

const active = (id, name, email, role, lastAccessDays) => ({
  id,
  name,
  email,
  role,
  password: "password",
  status: "ACTIVE",
  lastAccessAt: lastAccessDays === null ? null : ago(lastAccessDays),
  inviteSentAt: null,
});

const pending = (id, name, email, role, sentDays) => ({
  id,
  name,
  email,
  role,
  password: null,
  status: "PENDING_INVITE",
  lastAccessAt: null,
  inviteSentAt: ago(sentDays),
  inviteToken: `convite-${id}`,
});

const deactivated = (...args) => ({
  ...active(...args),
  status: "DEACTIVATED",
});

const asVet = (user) => {
  const { id, cpf, crmv } = vetStore.find((v) => v.userId === user.id);
  return { ...user, vet: { id, cpf, crmv } };
};

export const store = {
  users: [
    active("u1", "Beatriz Nunes", "admin@vetcare.com.br", "ADMIN", 1),
    active("u2", "Joana Prado", "recepcao@vetcare.com.br", "RECEP", 0),
    pending("u3", "Lucas Viana", "lucas.viana@vetcare.com.br", "RECEP", 2),
    asVet(active("u4", "Dra. Camila Torres", "vet@vetcare.com.br", "VET", 0)),
    asVet(
      active(
        "u5",
        "Dr. Rafael Moura",
        "rafael.moura@vetcare.com.br",
        "VET",
        null,
      ),
    ),
    asVet(
      deactivated(
        "u6",
        "Dr. Henrique Sales",
        "henrique.sales@vetcare.com.br",
        "VET",
        30,
      ),
    ),
  ],
};

let nextId = 1000;

const err = (status, message) =>
  HttpResponse.json({ statusCode: status, message }, { status });

const publicUser = ({ password, inviteToken, resetToken, ...u }) => u;

export const userFromRequest = (request) => {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  return store.users.find((u) => TOKEN_PREFIX + u.email === token);
};

const requireAdmin = (request) => {
  const user = userFromRequest(request);
  if (!user || user.status !== "ACTIVE")
    return err(STATUS.UNAUTHORIZED, "Unauthorized");
  if (user.role !== "ADMIN")
    return err(403, "Acesso restrito a administradores.");
  return null;
};

const matches = (search, ...fields) => {
  const s = search.trim().toLowerCase();
  if (!s) return true;
  return fields.some((f) =>
    String(f ?? "")
      .toLowerCase()
      .includes(s),
  );
};

export const userHandlers = [
  http.get(`${API_URL}${ENDPOINTS.users.list}`, ({ request }) => {
    const denied = requireAdmin(request);
    if (denied) return denied;

    const url = new URL(request.url);
    const search = url.searchParams.get("search") ?? "";
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const status = url.searchParams.get("status")?.split(",");
    const found = store.users
      .filter((u) => !status || status.includes(u.status))
      .filter((u) => matches(search, u.name, u.email))
      .sort((a, b) => a.name.localeCompare(b.name));

    return HttpResponse.json({
      data: found
        .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
        .map(publicUser),
      total: found.length,
      page,
      pageSize: PAGE_SIZE,
    });
  }),

  http.post(`${API_URL}${ENDPOINTS.users.invite}`, async ({ request }) => {
    const denied = requireAdmin(request);
    if (denied) return denied;

    const { name, email, role } = await request.json();
    if (!name || !email || !role)
      return err(400, "Dados do convite incompletos.");
    if (store.users.some((u) => u.email.toLowerCase() === email.toLowerCase()))
      return err(409, "Já existe um usuário com esse e-mail.");

    const id = `u${++nextId}`;
    const user = {
      id,
      name,
      email,
      role,
      password: null,
      status: "PENDING_INVITE",
      lastAccessAt: null,
      inviteSentAt: new Date().toISOString(),
      inviteToken: `convite-${id}-${Math.random().toString(36).slice(2, 10)}`,
    };
    store.users.push(user);
    console.info(
      `[mock] invite for ${email}: ${window.location.origin}/convite/${user.inviteToken}`,
    );
    return HttpResponse.json(publicUser(user), { status: 201 });
  }),

  http.post(`${API_URL}${ENDPOINTS.vets.create}`, async ({ request }) => {
    const denied = requireAdmin(request);
    if (denied) return denied;

    const { userId, cpf, crmv } = await request.json();
    const user = store.users.find((u) => u.id === userId);
    if (!user) return err(404, "Usuário não encontrado.");
    if (!cpf || !crmv) return err(400, "Dados do veterinário incompletos.");
    if (user.vet) return err(409, "Esse usuário já é veterinário.");

    user.vet = { id: `v${++nextId}`, cpf, crmv };
    return HttpResponse.json({ ...user.vet, userId }, { status: 201 });
  }),

  http.delete(
    `${API_URL}${ENDPOINTS.vets.byId(":id")}`,
    ({ request, params }) => {
      const denied = requireAdmin(request);
      if (denied) return denied;

      const user = store.users.find((u) => u.vet?.id === params.id);
      if (!user) return err(404, "Veterinário não encontrado.");
      delete user.vet;
      return new HttpResponse(null, { status: 204 });
    },
  ),

  http.post(
    `${API_URL}${ENDPOINTS.auth.acceptInvite(":token")}`,
    async ({ request, params }) => {
      const user = store.users.find(
        (u) => u.inviteToken === params.token && u.status === "PENDING_INVITE",
      );
      if (!user) return err(404, "Convite inválido ou expirado.");

      const { password } = await request.json();
      if (!password || !isStrongPassword(password))
        return err(400, PASSWORD_RULE);

      user.password = password;
      user.status = "ACTIVE";
      user.inviteToken = null;
      user.lastAccessAt = new Date().toISOString();
      return HttpResponse.json({
        access_token: TOKEN_PREFIX + user.email,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    },
  ),

  http.post(
    `${API_URL}${ENDPOINTS.users.resendInvite(":id")}`,
    ({ request, params }) => {
      const denied = requireAdmin(request);
      if (denied) return denied;

      const user = store.users.find((u) => u.id === params.id);
      if (!user) return err(404, "Usuário não encontrado");
      if (user.status !== "PENDING_INVITE")
        return err(
          409,
          "Só é possível reenviar convite para usuários com convite pendente",
        );

      user.inviteToken = `convite-${user.id}-${Math.random().toString(36).slice(2, 10)}`;
      user.inviteSentAt = new Date().toISOString();
      console.info(
        `[mock] invite resent to ${user.email}: ${window.location.origin}/convite/${user.inviteToken}`,
      );
      return HttpResponse.json(publicUser(user));
    },
  ),

  http.post(
    `${API_URL}${ENDPOINTS.users.sendPasswordReset(":id")}`,
    ({ request, params }) => {
      const denied = requireAdmin(request);
      if (denied) return denied;

      const user = store.users.find((u) => u.id === params.id);
      if (!user) return err(404, "Usuário não encontrado");
      if (user.status !== "ACTIVE" || !user.password)
        return err(409, "Não é possível redefinir senha.");

      user.resetToken = `senha-${user.id}-${Math.random().toString(36).slice(2, 10)}`;
      console.info(
        `[mock] new password for ${user.email}: ${window.location.origin}/redefinir-senha/${user.resetToken}`,
      );
      return HttpResponse.json(200);
    },
  ),

  http.post(
    `${API_URL}${ENDPOINTS.auth.resetPassword(":token")}`,
    async ({ request, params }) => {
      const user = store.users.find(
        (u) => u.resetToken === params.token && u.status === "ACTIVE",
      );
      if (!user) return err(400, "Link inválido ou expirado");

      const { password } = await request.json();
      if (!password || !isStrongPassword(password))
        return err(400, PASSWORD_RULE);

      user.password = password;
      user.resetToken = null;
      return HttpResponse.json({
        access_token: TOKEN_PREFIX + user.email,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    },
  ),

  http.post(
    `${API_URL}${ENDPOINTS.users.deactivate(":id")}`,
    ({ request, params }) => {
      const denied = requireAdmin(request);
      if (denied) return denied;

      const user = store.users.find((u) => u.id === params.id);
      if (!user) return err(404, "Usuário não encontrado.");
      user.status = "DEACTIVATED";
      user.inviteToken = null;
      return new HttpResponse(null, { status: 204 });
    },
  ),

  http.patch(
    `${API_URL}${ENDPOINTS.users.byId(":id")}`,
    async ({ request, params }) => {
      const denied = requireAdmin(request);
      if (denied) return denied;

      const user = store.users.find((u) => u.id === params.id);
      if (!user) return err(404, "Usuário não encontrado.");
      const { name, role } = await request.json();
      if (name) user.name = name;
      if (role) user.role = role;
      return HttpResponse.json(publicUser(user));
    },
  ),
];
