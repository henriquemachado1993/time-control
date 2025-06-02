# Deploy na Vercel - Controle de Horas

## 🚀 Configuração Completa para Deploy

Este projeto está configurado para resolver automaticamente o erro comum do Prisma na Vercel:
**"Prisma has detected that this project was built on Vercel, which caches dependencies"**

## ✅ Configurações Implementadas

### 1. Scripts do package.json
```json
{
  "scripts": {
    "build": "prisma generate && next build",
    "postinstall": "prisma generate",
    "vercel-build": "prisma generate && prisma db push && next build"
  }
}
```

### 2. Arquivo vercel.json
- Comando de build personalizado
- Comando de instalação com Prisma
- Configuração de timeout para APIs
- Variáveis de ambiente otimizadas

### 3. Variáveis de Ambiente Necessárias

Configure estas variáveis no painel da Vercel:

```bash
# Database (obrigatório)
DATABASE_URL=postgresql://user:password@host:port/database

# NextAuth (obrigatório)
NEXTAUTH_SECRET=sua-chave-secreta-super-segura-aqui
NEXTAUTH_URL=https://seu-projeto.vercel.app

# Supabase (se estiver usando)
NEXT_PUBLIC_SUPABASE_URL=https://sua-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anonima
```

## 📝 Passos para Deploy

1. **Conectar Repositório**
   - Acesse [vercel.com](https://vercel.com)
   - Conecte seu repositório GitHub

2. **Configurar Variáveis de Ambiente**
   - Vá em Settings > Environment Variables
   - Adicione todas as variáveis listadas acima

3. **Deploy Automático**
   - O projeto será deployado automaticamente
   - Todos os comandos do Prisma serão executados corretamente

## 🔧 Comandos Úteis

```bash
# Testar build localmente
npm run build

# Gerar Prisma Client
npx prisma generate

# Executar migrations
npx prisma migrate deploy

# Reset do banco (cuidado em produção!)
npx prisma migrate reset
```

## 🐛 Troubleshooting

### Se ainda houver erro do Prisma na Vercel:

1. **Limpar cache da Vercel**
   - No dashboard da Vercel, vá em Deployments
   - Clique nos 3 pontos do último deploy
   - Selecione "Redeploy"

2. **Verificar logs**
   - Acesse a aba "Functions" no deploy
   - Verifique se `prisma generate` foi executado

3. **Forçar rebuild**
   - Faça um commit vazio: `git commit --allow-empty -m "force rebuild"`
   - Push para o repositório

## 📊 Estrutura do Banco

O projeto usa Prisma com PostgreSQL (Supabase):
- Tabela `users` para autenticação
- Tabela `work_hours` para controle de horas
- Todas as migrations estão em `/prisma/migrations`

## 🔐 Segurança

- Todas as rotas API são protegidas por autenticação
- Validação de proprietário dos dados
- Sanitização de inputs
- Headers de segurança configurados 