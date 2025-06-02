This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### Configuração para Deploy na Vercel com Prisma

Este projeto está configurado para funcionar corretamente na Vercel. As seguintes configurações foram implementadas:

1. **Scripts do package.json atualizados**:
   - `build`: Inclui `prisma generate` antes do build
   - `postinstall`: Gera o Prisma Client após instalação
   - `vercel-build`: Script específico para a Vercel

2. **Arquivo vercel.json criado** com configurações otimizadas para Prisma

3. **Variáveis de ambiente necessárias na Vercel**:
   ```
   DATABASE_URL=sua_string_de_conexao_Supabase
   DIRECT_URL=sua_string_de_conexao_Supabase
   NEXTAUTH_SECRET=sua_chave_secreta_segura
   NEXTAUTH_URL=https://seu-dominio.vercel.app
   ```

4. **Passos para deploy**:
   - Conecte seu repositório na Vercel
   - Configure as variáveis de ambiente no painel da Vercel
   - O deploy será feito automaticamente com as configurações corretas

### Solução para erro "Prisma has detected that this project was built on Vercel"

Este projeto já inclui as correções necessárias:
- ✅ `prisma generate` no script de build
- ✅ `postinstall` configurado
- ✅ `vercel.json` com comandos corretos
- ✅ Configuração de timeout para APIs

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Configuração do Banco de Dados (Prisma + Supabase)

Crie um arquivo `.env` na raiz do projeto com a variável:

```
DATABASE_URL="postgresql://usuario:senha@host:porta/banco"
```

Pegue a string de conexão no painel do Supabase em Project Settings > Database > Connection string.

Para rodar as migrations e criar as tabelas:

```
npx prisma migrate dev --name init
```

Para gerar o client do Prisma:

```
npx prisma generate
```

O acesso ao banco de dados agora é feito via Prisma Client.
