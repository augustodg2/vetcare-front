# VetCare · front-end

Front-end do VetCare, sistema de gestão para clínica veterinária: cadastro de pacientes e
tutores e controle de acesso da equipe. Todas as telas consomem a API do VetCare; para trabalhar sem
o back-end, a API pode ser simulada no navegador com o MSW.

## Entrega 2

Esta versão corresponde à **entrega 2** do trabalho, com as seguintes entregas:

- **Autenticação:** login por e-mail e senha, sessão mantida ao recarregar a página e acesso separado
  por perfil (Administrador e Recepcionista).
- **Convites:** criação de senha pelo link de convite, com regra de senha forte.
- **Pacientes e tutores:** busca por nome, raça, tutor ou CPF; cadastro de pet com tutor novo ou já
  existente; ficha do tutor, edição e exclusão.
- **Usuários:** listagem com busca, convite, edição e desativação de acesso.
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

O `.env.development` traz os valores usados por `npm run dev`. Para mudar algo só na sua máquina,
crie um `.env.local` (ignorado pelo Git). O `.env.example` serve de modelo.

### API simulada

Com `VITE_ENABLE_MSW=true`, as rotas são respondidas por `src/mocks/handlers/`, com 1 segundo de
atraso por requisição. Os dados são fictícios e ficam em memória: voltam ao início ao recarregar a página.

| Perfil | E-mail | Senha |
|---|---|---|
| Administrador | `admin@vetcare.com.br` | `password` |
| Recepcionista | `recepcao@vetcare.com.br` | `password` |

Na simulação, o link de um novo convite aparece no console do navegador, já que nenhum e-mail é enviado.

## Perfis e acesso

| Página | Administrador | Recepcionista |
|---|---|---|
| Pacientes | `/admin/pacientes` | `/recepcao/pacientes` |
| Usuários | `/admin/usuarios` | — |

Cada perfil só entra nas próprias páginas. As rotas públicas são `/login` e `/convite/:token`.

## Estrutura

```
src/
  api/          cliente HTTP, rotas, mapeadores, serviços e tratamento de erros
    queries/    hooks do TanStack Query usados pelas telas
  auth/         sessão e perfis
  components/   peças compartilhadas e formulários
  data/         dados da antiga demonstração (sem uso nas telas)
  layout/       estrutura das páginas, barra lateral e navegação
  lib/          formatação, avisos, regra de senha e rótulos de estado
  mocks/        API simulada com MSW
  pages/        telas
```

As telas usam os hooks de `src/api/queries/`, que chamam os serviços de `src/api/index.js`. Os
endereços ficam em `src/api/endpoints.js` e a conversão entre o formato da API e o das telas, em
`src/api/mappers.js`.

## Deploy

Nesta entrega, a Vercel estava configurada com deploys automáticos a partir do repositório. O
redirecionamento das rotas para `index.html` fica em `vercel.json`.

Para publicar em outro lugar, a aplicação é estática: basta servir o conteúdo de `dist/`, com as
variáveis de ambiente definidas no momento do build.
