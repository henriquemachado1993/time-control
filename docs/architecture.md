# Arquitetura

## Organização por funcionalidade

Os arquivos específicos de uma funcionalidade ficam junto da sua rota. Os módulos usados por outras telas continuam em `src/components`, `src/hooks` e `src/lib`.

As pastas locais usam os nomes `components`, `hooks` e `lib`, sem prefixo `_`. Elas não contêm `page.tsx` nem `route.ts` e, portanto, não criam rotas acessíveis.

## Registros de horas

```text
src/app/(dashboard)/horarios/
|-- page.tsx
|-- components/
|   |-- work-hours-history.tsx
|   |-- work-hours-filters.tsx
|   |-- work-day.tsx
|   |-- history-pagination.tsx
|   |-- work-hour-editor.tsx
|   |-- delete-work-hour.tsx
|   `-- daily-target-settings.tsx
|-- hooks/
|   `-- use-work-hours-history.ts
`-- lib/
    `-- types.ts
```

| Módulo | Responsabilidade |
| --- | --- |
| `page.tsx` | Aguardar a sessão, redirecionar acessos sem autenticação e montar a funcionalidade. |
| `work-hours-history.tsx` | Compor os fluxos, abrir edição e exclusão e atualizar o histórico e o ponto após alterações. |
| `use-work-hours-history.ts` | Consultar registros, manter filtros aplicados, agrupar dias, calcular totais e preservar a paginação. Consultas substituídas são canceladas. |
| `work-hours-filters.tsx` | Manter os filtros em edição e comunicar sua aplicação. |
| `work-day.tsx` | Apresentar os períodos, o total completo do dia e o progresso da jornada. |
| `history-pagination.tsx` | Apresentar a navegação entre páginas de dias. |
| `work-hour-editor.tsx` | Manter o formulário de criação ou edição, consultar conflitos do dia, validar e salvar. |
| `delete-work-hour.tsx` | Confirmar a exclusão, executar a operação e manter erros no diálogo para nova tentativa. |
| `daily-target-settings.tsx` | Consultar, editar e salvar a jornada diária e comunicar o valor ao histórico. |

O estado do formulário pertence ao editor e é reiniciado quando ele é fechado. Os filtros em edição ficam separados dos filtros aplicados ao histórico. O filtro por descrição limita os resultados, mas o total diário continua considerando todos os períodos retornados para aquele dia.

O ponto compartilhado em `src/components/clock-punch.tsx` aceita uma versão dos registros para renovar a consulta após edição ou exclusão. Entrada e saída pelo ponto comunicam suas alterações ao histórico. A atualização preserva os filtros aplicados e a página, ajustando-a quando a última página deixa de existir.

A autorização permanece nos handlers do servidor, com a identidade obtida da sessão e as consultas privadas limitadas à conta autenticada. As regras compartilhadas de duração e validação continuam em `src/lib/hours.ts` e `src/lib/work-hours.ts`.

## Banco de horas

`src/lib/overtime.ts` concentra a apuração diária em `calculateOvertime`: recebe períodos, jornada diária em minutos e horas já utilizadas; retorna geração por dia, total gerado, total utilizado e saldo disponível. Períodos em aberto ficam fora da apuração, dias abaixo da jornada não descontam extras de outros dias e o saldo disponível tem mínimo zero.

Os handlers de consulta, criação e edição de uso buscam somente os dados da conta autenticada e chamam esse mesmo cálculo. Na edição, a soma de usos exclui o registro atual; o valor já registrado pode ser mantido mesmo quando uma mudança de jornada reduz o saldo. A tarefa agendada também fornece a jornada de cada conta ao cálculo; sua apuração é registrada em log, sem gravar um saldo calculado no banco.

`npm test` executa os testes de regressão do cálculo e dos handlers com dependências de sessão e banco simuladas. Os testes verificam as respostas, os limites de uso, a seleção da jornada na tarefa agendada e o escopo das consultas por conta, sem acessar um banco real.
