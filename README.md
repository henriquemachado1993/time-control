# Controle de Horas

Aplicação web para registrar jornadas de trabalho e acompanhar o saldo de horas extras. Desenvolvida com Next.js, TypeScript e PostgreSQL, com interface em português brasileiro e suporte a temas claro e escuro.

## Índice

- [Visão geral](#visão-geral)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Desenvolvimento local](#desenvolvimento-local)
- [Comandos](#comandos)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Implantação](#implantação)
- [Contribuição](#contribuição)
- [Documentação](#documentação)
- [Licença](#licença)

## Visão geral

O fluxo começa com a criação de uma conta. Após o login, é possível registrar entradas e saídas, consultar o histórico e informar o uso de horas extras. O painel reúne os totais e permite acompanhar a jornada por calendário e gráficos.

O banco de horas considera o total dos períodos encerrados em cada dia. A jornada diária é configurável por conta, com padrão de oito horas; alterar essa configuração recalcula o histórico. Períodos em aberto entram nos totais somente após o registro da saída.

## Funcionalidades

| Área | Recursos |
| --- | --- |
| Conta | Cadastro e acesso por e-mail e senha, com sessões JWT e registros associados ao usuário. |
| Registro de ponto | Entrada e saída com o horário atual, com até um período em aberto por conta. |
| Histórico | Inclusão manual, edição e exclusão de períodos, agrupamento por dia, filtros e paginação. |
| Banco de horas | Cálculo de horas extras, registro de utilização e devolução ao saldo ao excluir um uso. |
| Painel | Totais de horas, calendário mensal, gráfico diário e comparação mensal de horas extras geradas e utilizadas. |
| Interface | Layout responsivo, temas claro e escuro e tabelas alternativas aos gráficos. |

Os registros permitem vários períodos no mesmo dia, desde que não se sobreponham e que a saída seja posterior à entrada. O formulário de utilização de horas extras aceita horas e minutos (`4:39`) ou horas decimais (`4.65` ou `4,65`).

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Aplicação | Next.js 16, React 19 e TypeScript |
| Interface | Tailwind CSS 4, shadcn/ui, Radix UI e Tabler Icons |
| Formulários | React Hook Form e Zod |
| Autenticação | NextAuth.js com provedor Credentials e bcrypt |
| Persistência | PostgreSQL e Prisma ORM 6 |
| Implantação | Configuração para Vercel; PostgreSQL pode ser hospedado no Supabase |

As versões e dependências completas estão em [package.json](package.json), com resolução registrada em [package-lock.json](package-lock.json).

## Desenvolvimento local

### Pré-requisitos

- Node.js 20.9 ou superior, conforme o requisito da versão instalada do Next.js.
- npm.
- Uma instância PostgreSQL acessível, local ou hospedada.

### 1. Obter o código

```bash
git clone https://github.com/henriquemachado1993/time-control.git
cd time-control
```

### 2. Instalar as dependências

```bash
npm ci
```

O script `postinstall` gera o cliente Prisma automaticamente.

### 3. Configurar o ambiente

Crie um arquivo `.env` na raiz do projeto:

```dotenv
DATABASE_URL="postgresql://usuario:senha@localhost:5432/controle_horas"
DIRECT_URL="postgresql://usuario:senha@localhost:5432/controle_horas"
NEXTAUTH_SECRET="substitua-por-um-segredo-aleatorio"
NEXTAUTH_URL="http://localhost:3000"
```

| Variável | Finalidade |
| --- | --- |
| `DATABASE_URL` | Conexão PostgreSQL utilizada pela aplicação. Pode usar o pool de conexões do provedor. |
| `DIRECT_URL` | Conexão direta ao PostgreSQL utilizada pelo Prisma nas migrações. Em uma instalação local, pode ser igual a `DATABASE_URL`. |
| `NEXTAUTH_SECRET` | Segredo utilizado pela autenticação. Gere um valor próprio para cada ambiente. |
| `NEXTAUTH_URL` | URL base da aplicação. |

Para gerar um segredo:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

O arquivo `.env` é ignorado pelo Git. Mantenha credenciais fora do controle de versão.

### 4. Aplicar as migrações

Com o banco disponível e as variáveis configuradas:

```bash
npx prisma migrate deploy
```

Esse comando aplica as migrações existentes. Ao desenvolver alterações no esquema, utilize `npx prisma migrate dev` para criar uma nova migração.

### 5. Iniciar a aplicação

```bash
npm run dev
```

Acesse [localhost:3000](http://localhost:3000) e crie uma conta na tela de acesso.

## Comandos

| Comando | Finalidade |
| --- | --- |
| `npm run dev` | Iniciar o servidor de desenvolvimento com Turbopack. |
| `npm run build` | Gerar o cliente Prisma e compilar a aplicação para produção. |
| `npm run start` | Iniciar o servidor de produção após a compilação. |
| `npx tsc --noEmit` | Verificar os tipos sem emitir arquivos JavaScript. |
| `npx eslint src/caminho/do/arquivo.tsx` | Executar ESLint nos arquivos informados. |
| `npx prisma generate` | Gerar novamente o cliente Prisma. |
| `npx prisma migrate dev` | Criar e aplicar migrações durante o desenvolvimento. |
| `npx prisma migrate deploy` | Aplicar migrações existentes no banco de destino. |
| `npx prisma studio` | Abrir a interface de consulta e edição do banco. |

O script `npm run lint` ainda utiliza `next lint`, removido no Next.js 16. Utilize a CLI do ESLint diretamente, como indicado acima.

## Estrutura do projeto

```text
time-control/
|-- docs/                   Documentação de produto, memória técnica e design system
|-- prisma/
|   |-- migrations/         Histórico de migrações
|   `-- schema.prisma       Modelos de dados
|-- public/                 Arquivos estáticos
|-- scripts/                Scripts de manutenção e geração de artefatos
|-- src/
|   |-- app/
|   |   |-- (dashboard)/    Painel, registros de horas e banco de horas
|   |   |-- api/            Autenticação, registros, configurações e tarefas
|   |   `-- login/          Tela de acesso
|   |-- components/         Componentes da aplicação e biblioteca de UI
|   |-- hooks/              Hooks compartilhados
|   |-- lib/                Autenticação, banco de dados e cálculos de horas
|   `-- styles/tokens/      Tokens CSS, exportação JSON e preset do Tailwind
|-- package.json            Dependências e scripts
`-- vercel.json             Agendamento de tarefa na Vercel
```

### Tokens de design

Os tokens utilizados pela aplicação ficam em `src/styles/tokens`. O arquivo `tokens.css` é a fonte dos valores e é importado por `src/app/globals.css`. A especificação visual fica em [docs/design-system](docs/design-system/admin-design-tokens.md).

Após alterar o CSS, atualize a exportação JSON executando, na raiz do repositório:

```bash
node scripts/generate-design-tokens.mjs src/styles/tokens/tokens.css src/styles/tokens/tokens.json
```

O arquivo `tailwind.preset.js` é uma configuração auxiliar; a aplicação utiliza Tailwind CSS 4 com mapeamentos em `globals.css`.

## Implantação

Para implantar na Vercel:

1. Importe o repositório no painel da plataforma.
2. Configure as quatro variáveis de ambiente descritas em [Desenvolvimento local](#3-configurar-o-ambiente), usando as conexões do banco de destino e a URL pública em `NEXTAUTH_URL`.
3. Aplique as migrações ao banco de destino com `npx prisma migrate deploy`, em um ambiente configurado para esse banco.
4. Execute a implantação com o comando de build `npm run build`.

O build gera o cliente Prisma, mas não aplica migrações. O arquivo [vercel.json](vercel.json) também define uma execução diária da rota `/api/cron`, com expressão `0 10 * * *` (10h UTC).

## Contribuição

Antes de alterar o projeto, consulte as [instruções do repositório](AGENTS.md) e o [contexto do produto](docs/PRODUCT.md). Para mudanças em autenticação, dados de conta, datas, horários ou cálculo de horas extras, leia também [MEMORY.md](docs/MEMORY.md).

1. Crie uma branch para a alteração.
2. Implemente a mudança seguindo as convenções existentes.
3. Execute `npm run build`, `npx tsc --noEmit` e ESLint nos arquivos de código alterados.
4. Abra um pull request descrevendo o problema, a solução e as verificações realizadas.

Preserve a interface em português brasileiro, os dois temas e os componentes compartilhados. Novos ícones de interface devem usar imports nomeados `Icon*` de `@tabler/icons-react`.

## Documentação

- [Produto](docs/PRODUCT.md): propósito, fluxos, capacidades e restrições.
- [Instruções do repositório](AGENTS.md): convenções para alterações.
- [Memória técnica](docs/MEMORY.md): decisões e cuidados com regras sensíveis.
- [Esquema de dados](prisma/schema.prisma): modelos e índices do PostgreSQL.
- [Design system](docs/design-system/admin-design-tokens.md): especificação visual e manutenção dos tokens.

## Licença

Este projeto está disponível sob a licença MIT. Consulte o arquivo [LICENSE](LICENSE) para os termos completos.
