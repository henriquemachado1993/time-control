# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Inferência pendente de confirmação:** o público principal parece ser a pessoa que acompanha a própria jornada, em vez de uma equipe de RH. O sistema oferece contas individuais e guarda cada registro associado a um usuário. A interface e o README falam diretamente com a pessoa responsável pelos próprios horários.

Não há evidência suficiente para afirmar que o produto atende gestores ou RH.

## Product Purpose

Registrar horas trabalhadas e ajudar cada pessoa a entender e administrar o saldo de horas extras. A pessoa cria uma conta, informa os horários de trabalho, consulta os totais e registra as horas extras utilizadas.

O sucesso do produto é conseguir consultar a jornada registrada e acompanhar um saldo de horas extras coerente com os usos informados.

## Positioning

O mecanismo atual combina registros de entrada e saída, cálculo automático de horas acima de uma jornada padrão de oito horas por dia e abatimento dos usos registrados. Esse comportamento descreve o produto; sua diferenciação em relação a outros produtos não foi confirmada.

## Operating Context

- Aplicação web com interface e textos em português brasileiro.
- A pessoa cria uma conta individual e acessa seus dados mediante autenticação.
- Um registro de trabalho contém data, entrada, saída e descrição opcional. É possível registrar mais de um período no mesmo dia.
- As horas podem ser pesquisadas por data ou descrição. O histórico agrupa os períodos por dia e apresenta até cinco dias por página.
- O banco de horas calcula horas extras a partir do total trabalhado por dia e permite anotar seu uso. O formulário de uso aceita horas decimais ou o formato horas:minutos.
- A pessoa pode editar e excluir seus registros. Excluir um uso de horas extras devolve a quantidade ao saldo disponível.
- O painel mostra totais calculados a partir do histórico e um resumo de horas extras geradas, utilizadas e disponíveis.

## Capabilities and Constraints

- Autenticação por e-mail e senha, com criação de conta e proteção dos dados por usuário.
- Gerenciamento de registros de trabalho: criação, edição, exclusão, filtro por data e descrição, agrupamento diário e paginação.
- Resumo geral das horas trabalhadas, dos dias registrados, da média diária e do banco de horas.
- Gerenciamento de horas extras disponíveis e dos respectivos usos, com histórico e devolução ao saldo ao excluir um uso.
- A jornada padrão usada no cálculo atual é fixa em oito horas por dia. A interface não oferece uma configuração para outra jornada. A necessidade de tornar esse valor configurável permanece em aberto.
- Horários, registros e saldos são armazenados por usuário. A interface e o fluxo esperado são próprios para uso individual; gestão de equipes não está documentada.
- O código utiliza Next.js, TypeScript, Prisma e PostgreSQL. O README identifica Supabase como opção recomendada para o banco e Vercel para implantação.

## Evidence on Hand

- O [README.md](README.md) documenta o cadastro, o histórico de horários, os filtros, o banco de horas e a jornada padrão de oito horas.
- As telas implementadas em `src/app/(dashboard)/dashboard/page.tsx`, `src/app/(dashboard)/horarios/page.tsx` e `src/app/(dashboard)/horas-extras/page.tsx` demonstram os fluxos descritos acima.
- `prisma/schema.prisma` confirma a separação de registros por identificador de usuário e os campos disponíveis para registros de trabalho e usos de horas extras.
- Não foram identificados depoimentos, dados de clientes, avaliações externas ou medidas independentes de produtividade. Não inferir nem criar esses elementos.

## Product Principles

Os princípios abaixo são inferidos dos fluxos disponíveis e ainda não foram confirmados pelo usuário:

1. Facilitar o registro e a consulta de vários períodos de trabalho no mesmo dia.
2. Mostrar como horas trabalhadas e usos registrados se relacionam com o saldo de horas extras.
3. Permitir que cada pessoa administre seus próprios registros.
