# Camada de API do front

As telas **nunca** chamam `fetch` direto: elas usam as funções de `index.js` (todas devolvem `Promise`).
Todas as funções usam a API real (`http.js` + `ENDPOINTS`); as rotas só são simuladas pelo MSW (`src/mocks/handlers/`) quando `VITE_ENABLE_MSW=true`.

As telas não chamam `index.js` direto: usam os hooks do React Query (`usePetOwners`, `useCreatePet`, `useUsers`, ...), que ficam em `src/api/queries/` ou no `queries.js` da funcionalidade em `src/features/` e guardam as chaves de cache e invalidam as listas após cada mutação.

Configuração: coloque o endereço da API em `.env` → `VITE_API_URL=https://...`. O token é guardado em `tokenStore` (`http.js`); `index.js` só faz as requisições. O `http.js` já manda `Authorization: Bearer` e lança `ApiError`; o redirecionamento para `/login` em 401 fica no handler global (`ApiErrorHandler`, acionado pelo `queryClient`).

## Mapeamento de campos (API → telas)

A tradução fica em `mappers.js`; as telas continuam usando os nomes antigos nos campos abaixo.

| API                                                              | Telas                           |
| ---------------------------------------------------------------- | ------------------------------- |
| `birthDate` (`YYYY-MM-DD`)                                       | `birth`                         |
| `notes` do pet                                                   | `alerts`                        |
| `petOwner` / `petOwnerId`                                        | `petOwner` / `petOwnerId`       |
| `cpf`, `phone` (só dígitos)                                      | mascarados para exibição        |
| `{ data, total, page, pageSize }`                                | `{ rows, total, pageSize }`     |
| `{ data, meta: { total, pagesize } }`                            | `{ rows, total, pageSize }`     |
| `status` do usuário: `ACTIVE` / `PENDING_INVITE` / `DEACTIVATED` | `ativo` / `convite` / `inativo` |
| `lastAccessAt` / `inviteSentAt`                                  | `lastSeen` / `invitedAt`        |
| `paymentMethod` do pagamento                                     | `method`                        |

Ao enviar, CPF e telefone vão só com dígitos, o CPF não é editável (o `PATCH` do tutor não o envia) e o tutor de um pet não muda (o `PATCH` do pet não envia `petOwnerId`).

Erros: se a API devolver `{ "message": "..." }` (ou um array de mensagens, como no `ValidationPipe` do Nest), o primeiro texto aparece no aviso vermelho da tela.

## Rotas (uma por função)

| Função                                                         | Rota                                                                                        | Quem usa                         |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------- |
| `auth.login({ email, password })`                              | `POST /auth/login` → `{ access_token, user }`                                               | Login                            |
| `auth.me()`                                                    | `GET /users/me`                                                                             | Sessão (ao recarregar)           |
| `auth.acceptInvite(token, { password })`                       | `POST /auth/invite/:token/accept` (pública)                                                 | Página `/convite/:token`         |
| `auth.resetPassword(token, { password })`                      | `POST /auth/reset-password/:token` (pública)                                                | Página `/redefinir-senha/:token` |
| `users.list({ search, page, status })`                         | `GET /users?search=&page=&status=ACTIVE,PENDING_INVITE` → `{ data, total, page, pageSize }` | Admin › Usuários                 |
| `users.invite({ name, email, role })`                          | `POST /users/invite` (409 se o e-mail já existir)                                           | Admin › Convidar usuário         |
| `users.update(id, { name, role })`                             | `PATCH /users/:id` (e-mail não é editável)                                                  | Admin › Editar usuário           |
| `users.deactivate(id)`                                         | `POST /users/:id/deactivate`                                                                | Admin › Desativar acesso         |
| `users.resendInvite(id)`                                       | `POST /users/:id/resend-invite` (409 se o convite não estiver pendente)                     | Admin › Reenviar convite         |
| `users.sendPasswordReset(id)`                                  | `POST /users/:id/reset-password` (link de 24h para `/redefinir-senha/:token`)               | Admin › Link de nova senha       |
| `vets.list({ search, page })` / `vets.listAll()`               | `GET /vets?search=&page=` (`listAll` busca todas as páginas)                                | Agenda, agendamento              |
| `vets.create({ userId, cpf, crmv })`                           | `POST /vets` (chamado após o convite de um usuário VET)                                     | Admin › Convidar usuário         |
| `vets.remove(id)`                                              | `DELETE /vets/:id` (chamado ao desativar um usuário VET)                                    | Admin › Desativar acesso         |
| `petOwners.list({ search, page })`                             | `GET /pet-owners?search=&page=` (com `pets[]`)                                              | Pacientes                        |
| `petOwners.get(id)`                                            | `GET /pet-owners/:id` (com `pets[]`)                                                        | Ficha do tutor                   |
| `petOwners.create(data)`                                       | `POST /pet-owners` (aceita `pets[]` junto; 409 se o CPF já existir)                         | Cadastro de tutor e pet          |
| `petOwners.update(id, data)`                                   | `PATCH /pet-owners/:id` com `{ name, phone, email, address }`                               | Editar tutor                     |
| `petOwners.remove(id)`                                         | `DELETE /pet-owners/:id` (exclusão lógica, inclui os pets)                                  | Excluir tutor                    |
| `pets.list({ search, page })`                                  | `GET /pets?search=&page=` (com `petOwner`)                                                  | Pacientes                        |
| `pets.get(id)`                                                 | `GET /pets/:id` (com `petOwner`)                                                            | Ficha do paciente                |
| `pets.create(data)`                                            | `POST /pets` com `petOwnerId`                                                               | Novo pet                         |
| `pets.update(id, data)`                                        | `PATCH /pets/:id` sem `petOwnerId`                                                          | Editar pet                       |
| `pets.remove(id)`                                              | `DELETE /pets/:id`                                                                          | Excluir pet                      |
| `appointments.list({ from, to, vetId, petId, status })`        | `GET /appointments?from=&to=&vetId=&petId=&status=` → `{ data }` (sem paginação)            | Agenda, Atendimento              |
| `appointments.byPet(petId, { from, to, status, order, page })` | `GET /appointments?petId=&...&page=` → `{ data, total, page, pageSize }`                    | Ficha do paciente                |
| `appointments.create(data)`                                    | `POST /appointments`                                                                        | Novo agendamento                 |
| `appointments.update(id, data)`                                | `PATCH /appointments/:id` com `{ dateTime, type, obs }`                                     | Remarcar                         |
| `appointments.cancel(id)` / `appointments.complete(id)`        | `PATCH /appointments/:id/cancel` · `PATCH /appointments/:id/complete`                       | Agenda, Atendimento              |
| `procedures.list({ petId, type, dateFrom, dateTo, page })`     | `GET /procedures?...` → `{ data, meta }` (`listAll` busca todas as páginas)                 | Histórico clínico, Caixa         |
| `procedures.get(id)`                                           | `GET /procedures/:id`                                                                       | Detalhe do procedimento, Caixa   |
| `procedures.create(data)`                                      | `POST /procedures`                                                                          | Novo procedimento                |
| `procedures.addNote(id, content)`                              | `POST /procedures/:id/notes`                                                                | Observações do procedimento      |
| `prescriptions.list({ petId, vetId, page })`                   | `GET /prescriptions?petId=&vetId=&page=` → `{ data, meta }` (mais recente primeiro)         | Paciente › Receitas              |
| `prescriptions.get(id)`                                        | `GET /prescriptions/:id`                                                                    | Paciente › Receita               |
| `prescriptions.create({ content, petId, vetId })`              | `POST /prescriptions` (sem edição nem exclusão)                                             | Paciente › Nova receita          |
| `payments.list({ status, dateFrom, dateTo, page })`            | `GET /payments?...` → `{ data, meta }` (`listAll` busca todas as páginas)                   | Caixa                            |
| `payments.create(data)`                                        | `POST /payments` com `{ paymentMethod, discount, notes, items[] }`                          | Registrar pagamento              |
| `payments.cancel(id)` / `payments.refund(id)`                  | `PATCH /payments/:id/cancel` · `PATCH /payments/:id/refund`                                 | Caixa                            |
