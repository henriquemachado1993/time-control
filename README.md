# Controle de Horas - Sistema de Gestão de Horários de Trabalho

Um sistema completo para controle de horas trabalhadas, cálculo automático de horas extras e gestão de produtividade, desenvolvido com Next.js, TypeScript, Prisma e Supabase.

## Funcionalidades

### Autenticação e Segurança
- **Login seguro** com NextAuth.js
- **Registro de usuários** com validação
- **Sessões JWT** para controle de acesso
- **Proteção de rotas** autenticadas

### Dashboard Interativo
- **Visão geral** com estatísticas em tempo real
- **Cards informativos**: Horas trabalhadas, dias úteis, média diária, saldo de horas extras
- **Navegação intuitiva** entre módulos
- **Interface responsiva** para desktop e mobile

### Controle de Horários
- **Registro de entradas e saídas** de trabalho
- **Suporte a múltiplas sessões** por dia
- **Cálculo automático** de horas trabalhadas
- **Busca e filtros** por data e descrição
- **Paginação** para navegação eficiente
- **CRUD completo** (criar, editar, excluir)

### Sistema de Horas Extras
- **Cálculo automático** baseado em jornada de 8 horas/dia
- **Controle de saldo** em tempo real
- **Registro de utilização** com validação
- **Formatos flexíveis**: Decimal (4.65) ou horas:minutos (4:39)
- **Histórico completo** de uso
- **Exclusão de registros** com devolução automática ao saldo

### Interface Responsiva
- **Menu adaptativo**: Desktop (horizontal) e Mobile (dropdown)
- **Design moderno** com shadcn/ui
- **Tema escuro/claro** com persistência
- **Feedback visual** com alertas e notificações
- **Estados de loading** e skeletons

## Tecnologias Utilizadas

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS, shadcn/ui, Radix UI
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL via Prisma ORM
- **Auth:** NextAuth.js com provedor Credentials
- **Deploy:** Vercel com Supabase
- **Outros:** date-fns, lucide-react, sonner

## Pré-requisitos

- Node.js 18+
- PostgreSQL (via Supabase ou local)
- npm/yarn/pnpm

## Instalação e Configuração

### 1. Clone o repositório
```bash
git clone <seu-repositorio>
cd controle-horas
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o banco de dados
Crie um arquivo `.env` na raiz do projeto:

```env
# Banco de dados PostgreSQL (Supabase recomendado)
DATABASE_URL="postgresql://usuario:senha@host:porta/banco"
DIRECT_URL="postgresql://usuario:senha@host:porta/banco"

# NextAuth
NEXTAUTH_SECRET="sua-chave-secreta-super-segura-aqui"
NEXTAUTH_URL="http://localhost:3000" # ou sua URL de produção
```

### 4. Configure o banco de dados
```bash
# Execute as migrações
npx prisma migrate dev

# Gere o cliente Prisma
npx prisma generate
```

### 5. Execute o projeto
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

## Como Usar

### Primeiro Acesso
1. **Acesse a aplicação**
2. **Clique em "Criar conta"** para registrar um novo usuário
3. **Faça login** com suas credenciais

### Registrando Horários
1. **Acesse "Registros de Horas"**
2. **Clique em "Novo Registro"**
3. **Preencha**: Data, hora de entrada, hora de saída, descrição
4. **Salve** o registro

### Gerenciando Horas Extras
1. **Acesse "Horas Extras"**
2. **Verifique o saldo disponível** nos cards
3. **Registre uso** informando data e horas utilizadas
4. **Formatos aceitos**: `4.65` (decimal) ou `4:39` (horas:minutos)

### Dashboard
- **Visão geral** de todas as estatísticas
- **Links diretos** para funcionalidades específicas
- **Atualização automática** dos dados

## Estrutura do Projeto

```
controle-horas/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # Grupo de rotas autenticadas
│   │   │   ├── dashboard/        # Página inicial com estatísticas
│   │   │   ├── horarios/         # Gestão de horários
│   │   │   └── horas-extras/     # Controle de horas extras
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/             # Autenticação
│   │   │   ├── cron/             # Tarefas automáticas
│   │   │   ├── horarios/         # CRUD de horários
│   │   │   └── horas-extras/     # Gestão de horas extras
│   │   └── globals.css          # Estilos globais
│   ├── components/
│   │   ├── ui/                   # Componentes shadcn/ui
│   │   ├── navigation.tsx        # Menu de navegação
│   │   └── theme-*               # Tema e toggle
│   ├── hooks/
│   │   └── use-mobile.ts         # Hook para detectar mobile
│   └── lib/
│       ├── auth.ts               # Configuração NextAuth
│       └── prisma.ts             # Cliente Prisma
├── prisma/
│   ├── schema.prisma             # Schema do banco
│   └── migrations/               # Migrações do banco
├── public/                       # Arquivos estáticos
└── package.json
```

## Schema do Banco de Dados

### Usuários e Autenticação
- `User`: Dados do usuário
- `Account`: Contas vinculadas (NextAuth)
- `Session`: Sessões ativas
- `VerificationToken`: Tokens de verificação

### Controle de Horas
- `work_hours`: Registros de horários trabalhados
- `extra_hours_bank`: Bancos de horas extras (calculado automaticamente)
- `extra_hours_usage`: Registros de uso de horas extras

### Monitoramento
- `ConnectionHeartbeat`: Heartbeat para monitoramento

## Deploy na Vercel

### Configuração Automática
O projeto já está configurado para deploy na Vercel:

1. **Conecte seu repositório** no painel da Vercel
2. **Configure as variáveis de ambiente**:
   ```env
   DATABASE_URL=sua_string_de_conexao_Supabase
   DIRECT_URL=sua_string_de_conexao_Supabase
   NEXTAUTH_SECRET=sua_chave_secreta_segura
   NEXTAUTH_URL=https://seu-projeto.vercel.app
   ```
3. **Deploy automático** será executado

### Soluções Implementadas
- ✅ `prisma generate` no build
- ✅ Scripts de `postinstall`
- ✅ Arquivo `vercel.json` com timeouts
- ✅ Otimizações para serverless

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Servidor de produção

# Banco de dados
npx prisma studio    # Interface gráfica do Prisma
npx prisma migrate dev  # Executar migrações
npx prisma generate  # Gerar cliente Prisma

# Qualidade
npm run lint         # Executar ESLint
```

## Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---


