# VetCare · front-end

Front-end do VetCare, sistema de gestão para clínica veterinária: agenda, atendimento, prontuário,
caixa, cadastro de pacientes e tutores e controle de acesso da equipe. Todas as telas consomem a API
do VetCare; para trabalhar sem o back-end, a API pode ser simulada no navegador com o MSW.

## Funcionalidades

- **Autenticação:** login por e-mail e senha, sessão mantida ao recarregar a página e acesso separado
  por perfil (Recepcionista, Veterinário e Administrador).
- **Convites e senhas:** criação de senha pelo link de convite, com regra de senha forte; o
  administrador também pode enviar um link de redefinição de senha.
- **Agenda:** visões de dia, semana e mês, novo agendamento, remarcação, cancelamento, conclusão e
  detalhes da consulta com os dados do tutor. O veterinário alterna entre a própria agenda e a de
  todos, mas só altera as suas consultas.
- **Atendimento:** painel do dia do veterinário, com as próximas consultas e o histórico do dia, onde
  ele conclui, remarca ou cancela consultas.
- **Ficha do paciente:** dados do pet e do tutor com edição; histórico clínico filtrado por tipo, com
  registro de procedimentos (consulta, retorno, vacinação, cirurgia e exame) e observações
  complementares; receitas em texto formatado com impressão em A4; e agendamentos do pet.
- **Caixa:** movimentações de cada dia na recepção, registro de pagamentos dos procedimentos,
  cancelamento e estorno.
- **Pacientes e tutores:** busca por nome, raça, tutor ou CPF; a recepção e o administrador cadastram
  pet com tutor novo ou já existente, consultam a ficha do tutor, editam e excluem.
- **Usuários:** listagem com busca e filtro por situação, convite (com CPF e CRMV para
  veterinários), reenvio de convite, edição e desativação de acesso.
- **Integração com a API:** todas as telas ligadas às rotas do back-end, com tratamento de erros e API
  simulada para desenvolvimento.

## Stack

| Tecnologia | Para que serve no projeto |
|---|---|
| [React 18](https://react.dev) | Construção da interface em componentes |
| [Vite 5](https://vite.dev) | Servidor de desenvolvimento e build de produção |
| [Mantine 7](https://mantine.dev) | Componentes visuais, formulários, campos de data e avisos |
| [TanStack Query 5](https://tanstack.com/query) | Busca, cache e atualização dos dados da API |
| [React Router 6](https://reactrouter.com) | Rotas e controle de acesso às páginas por perfil |
| [nuqs](https://nuqs.dev) | Busca e paginação guardadas na URL |
| [dayjs](https://day.js.org) | Datas em português |
| [Tabler Icons](https://tabler.io/icons) | Ícones |
| [Tiptap](https://tiptap.dev) | Editor de texto das receitas e dos procedimentos |
| [DOMPurify](https://github.com/cure53/DOMPurify) | Sanitização do HTML gerado pelo editor antes de exibi-lo |
| [MSW 2](https://mswjs.io) | API simulada no navegador durante o desenvolvimento |
| [PostCSS](https://postcss.org) | Processamento do CSS, com o preset do Mantine |
| [Prettier](https://prettier.io) | Formatação do código |

O projeto é escrito em JavaScript (JSX). As chamadas à API usam o `fetch` do navegador, centralizado
em `src/api/http.js`.

## Pré-requisitos

- [Node.js](https://nodejs.org/pt-br/download) na versão LTS, que já inclui o npm. A página de
  download traz as instruções para Windows, Linux e macOS.

## Como rodar

```bash
npm install
npm run dev
```

O app abre em `http://localhost:5181`.

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Gera a versão de produção em `dist/` |
| `npm run preview` | Serve o conteúdo de `dist/` localmente |
| `npm run format` | Formata `src/` com o Prettier |

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | Endereço da API |
| `VITE_ENABLE_MSW` | `true` liga a API simulada; qualquer outro valor usa a API real |
| `VITE_CLINIC_NAME` | Nome da clínica no receituário impresso (padrão: `VetCare`) |
| `VITE_CLINIC_CNPJ` | CNPJ da clínica no receituário |
| `VITE_CLINIC_ADDRESS` | Endereço da clínica no receituário |
| `VITE_CLINIC_CITY` | Cidade da clínica no receituário |
| `VITE_CLINIC_PHONE` | Telefone da clínica no receituário |

O `.env.development` traz os valores usados por `npm run dev`. Para mudar algo só na sua máquina,
crie um `.env.local` (ignorado pelo Git). O `.env.example` serve de modelo.

### API simulada

Com `VITE_ENABLE_MSW=true`, as rotas são respondidas por `src/mocks/handlers/`, com 1 segundo de
atraso por requisição. Os dados são fictícios e ficam em memória: voltam ao início ao recarregar a página.

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `admin@vetcare.com.br` | `password` |
| Recepcionista | `recepcao@vetcare.com.br` | `password` |
| Veterinário | `vet@vetcare.com.br` | `password` |

Na simulação, os links de convite e de redefinição de senha aparecem no console do navegador, já que
nenhum e-mail é enviado.

## Perfis e acesso

| Página | Recepcionista | Veterinário | Administrador |
|---|---|---|---|
| Atendimento | — | `/vet/atendimento` | — |
| Agenda | `/recepcao/agenda` | `/vet/agenda` | `/admin/agenda` |
| Pacientes | `/recepcao/pacientes` | `/vet/pacientes` | `/admin/pacientes` |
| Ficha do paciente | — | `/vet/pacientes/:id` | — |
| Caixa | `/recepcao/caixa` | — | — |
| Usuários | — | — | `/admin/usuarios` |

Cada perfil só entra nas próprias páginas. As rotas públicas são `/login`, `/convite/:token` e
`/redefinir-senha/:token`.

## Estrutura

```
src/
  api/          cliente HTTP, rotas, mapeadores, serviços e tratamento de erros
    queries/    hooks do TanStack Query usados pelas telas
  auth/         sessão e perfis
  components/
    ui/         componentes genéricos, usados por várias funcionalidades
  features/     uma pasta por funcionalidade, com telas, componentes e queries
  layout/       estrutura das páginas, barra lateral e navegação
  lib/          formatação, avisos, regra de senha e rótulos de estado
  mocks/        API simulada com MSW
  styles/       CSS global e classes de uso geral
```

As telas usam os hooks do TanStack Query, que chamam os serviços de `src/api/index.js`. Os
endereços ficam em `src/api/endpoints.js` e a conversão entre o formato da API e o das telas, em
`src/api/mappers.js`.

### Organização por funcionalidade

```
src/features/
  appointments/ agenda de dia, semana e mês, painel do veterinário e detalhes da consulta
  auth/         login, convite e redefinição de senha
  payments/     movimentações do dia e pagamentos
  pets/         pets, tutores, ficha clínica, procedimentos e receitas
  users/        gestão de usuários
```

- O que só uma funcionalidade usa fica na pasta dela, com as queries em `queries.js`.
- Queries usadas por mais de uma funcionalidade ficam em `src/api/queries/`.
- Um componente de funcionalidade pode ser importado por outra, como o `AppointmentModal` da agenda.
- `src/components/ui/` recebe apenas componentes genéricos, exportados por `@/components/ui`.
- Use o alias `@/` (que aponta para `src/`) para importar de fora da pasta, e `./` dentro dela.

### Estilos

- Os estilos ficam em CSS Modules, ao lado de quem os usa: `Pet.jsx` e `Pet.module.css`.
- `src/styles/global.css` guarda só o que vale para a aplicação toda: variáveis, `body` e ajustes do
  Mantine.
- Em `src/main.jsx`, o CSS do Mantine é importado antes do restante, para que os módulos possam
  sobrescrevê-lo.

## Deploy

A aplicação está publicada na Netlify, em [vetcare-aal.netlify.app](https://vetcare-aal.netlify.app).
O redirecionamento das rotas para `index.html` fica em `public/_redirects`.

Para publicar em outro lugar, a aplicação é estática: basta servir o conteúdo de `dist/`, com as
variáveis de ambiente definidas no momento do build.
