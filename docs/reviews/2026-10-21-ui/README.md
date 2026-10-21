# Revisão de interface — 21/10/2026

## Veredito de integridade

A linguagem visual é coerente com um aplicativo individual de controle de horas: navegação curta, hierarquia clara, durações em minutos, marca discreta e componentes compartilhados. A revisão identificou problemas funcionais que precisam de correção para os totais e formulários serem confiáveis em todos os cenários. A prioridade é corrigir esses comportamentos antes de ampliar o acabamento visual.

O detector do Impeccable retornou `[]`. Isso indica ausência de ocorrências nas regras estáticas executadas, não ausência de problemas de uso. Os achados abaixo foram verificados no código e, quando indicado, reproduzidos no navegador.

## Resultado

| Dimensão | Nota | Principal achado |
| --- | --- | --- |
| Acessibilidade | 2/4 | Contorno dos campos com pouco contraste e progresso sem valor numérico acessível. |
| Performance | 3/4 | Importações nomeadas e interface leve; histórico completo carregado para cálculos e paginação no cliente. |
| Responsividade | 3/4 | Sem estouro horizontal da página nas capturas; ações pequenas e formulário de uso distante do início no celular. |
| Temas | 3/4 | Claro e escuro consistentes, com oportunidade de melhorar a identificação dos campos. |
| Integridade da implementação | 2/4 | Totais filtrados e validações podem produzir informações ou decisões incorretas. |
| **Total** | **13/20** | **Aceitável; correções importantes pendentes.** |

Foram registrados **10 achados: 0 P0, 6 P1, 4 P2 e 0 P3**. As cinco prioridades funcionais são: total diário sob filtros, interpretação das durações, edição de usos existentes, validação de entrada/saída e acesso ao histórico completo de usos.

## Método e limites

- Aplicação compilada para produção; navegador Chrome/Chromium em modo headless.
- Login, dashboard, registros e horas extras em 1440 × 1000 e 390 × 844, nos temas claro e escuro: 16 combinações.
- Sessão e respostas de API interceptadas com dados fictícios. As interações de gravação foram respondidas pelo próprio cenário de inspeção: nenhuma gravação no banco real.
- Verificação de estados preenchidos, vazio e erro no dashboard; filtros, novo registro e formulário de uso de extras.
- Sem erros JavaScript de página e sem estouro horizontal do documento nas 16 combinações. Rolagem interna de tabelas não foi tratada como defeito.
- A inspeção em celular foi por viewport emulado com capacidade de toque. Não houve verificação em dispositivo físico, leitor de tela, outros motores de navegador ou benchmark de desempenho. O comportamento numérico do progresso foi conferido no DOM.
- Contexto do produto e memória do projeto consultados; contexto Impeccable reutilizado desta sessão. `DESIGN.md` não existe no projeto. Esta revisão preserva a identidade atual.

As notas são uma avaliação técnica deste escopo, não uma certificação WCAG nem uma medição de velocidade em produção.

## Achados P1 — corrigir antes da próxima entrega funcional

### 1. Filtro por descrição altera o que é chamado de total do dia

**Categoria:** integridade. **Local:** `src/app/(dashboard)/horarios/page.tsx:183`, `:463`, `:466`.

Um dia com duas sessões de quatro horas mostra oito horas e jornada completa. Ao buscar a descrição presente apenas na sessão da manhã, a tela passa a mostrar quatro horas e quatro horas faltantes. O rótulo continua sendo “Total do dia”, embora a soma contenha apenas os registros filtrados. A pessoa pode concluir que precisa registrar ou trabalhar mais horas, enquanto o banco de horas considera o dia completo.

**Reprodução:** `evidence.json → scenarios.filteredDay`: antes `8h 00min de 8h`; depois `4h 00min de 8h`.

**Recomendação:** separar os registros encontrados do agregado diário completo. A API pode retornar o total de cada data encontrada considerando todas as sessões dessa data e da conta autenticada. Caso o produto queira mostrar somente o subtotal filtrado, esse estado deve ser identificado e não apresentado como cumprimento da jornada inteira.

**Comando sugerido:** `$impeccable harden`.

### 2. Durações aceitam interpretações inesperadas e validação parcial

**Categoria:** integridade / prevenção de erros. **Local:** `src/app/(dashboard)/horas-extras/page.tsx:72`; validação em `src/app/api/horas-extras/uso/route.ts` e `src/app/api/horas-extras/uso/[id]/route.ts`.

Digitar `1,5` mostra “Convertido: 1h 00min”; `1:90` mostra “Convertido: 2h 30min”. O parser usa `parseFloat` e não exige que o texto inteiro corresponda a um formato válido. Na interface brasileira, a vírgula decimal é uma entrada previsível. O texto de prévia ajuda, mas não impede uma gravação diferente da intenção.

Por leitura do código, POST e PUT validam presença e tipo de `hours_used`, mas não exigem valor positivo. Um número negativo passa por essas condições e pela comparação com o saldo. Esse caminho não foi executado no banco real.

**Reprodução:** `evidence.json → scenarios.commaDuration` e `scenarios.invalidMinutes`.

**Recomendação:** adotar um parser estrito e compartilhado, com minutos entre 00 e 59, política explícita para ponto/vírgula e validação de número finito e positivo no servidor. Formatos inválidos devem produzir uma mensagem vinculada ao campo, antes de enviar a requisição.

**Comando sugerido:** `$impeccable harden`.

### 3. Uso existente pode ficar impossível de editar quando o saldo está zerado

**Categoria:** integridade / controle do usuário. **Local:** `src/app/(dashboard)/horas-extras/page.tsx:176` e `:468`.

A interface compara o valor de uma edição com o saldo disponível atual, sem descontar o próprio uso que está sendo editado. Com saldo zero, editar um registro existente de 15 minutos e manter a mesma duração já é bloqueado. O servidor calcula a disponibilidade excluindo o registro original, portanto os dois lados usam regras diferentes.

**Reprodução:** `evidence.json → scenarios.editSpent`: “Horas insuficientes. Você tem 0h 00min disponíveis.” ao reenviar uma duração já registrada.

**Recomendação:** usar um limite de edição que considere `total_generated - total_used + duração_original`, respeitando o resultado do servidor. Aplicar a mesma regra à mensagem de máximo e à prévia de excesso. Somar o original ao saldo já limitado a zero pode ser insuficiente quando existir déficit após uma mudança de jornada.

**Comando sugerido:** `$impeccable harden`.

### 4. Entrada e saída em ordem inversa são enviadas sem orientação

**Categoria:** integridade / prevenção de erros. **Local:** `src/app/(dashboard)/horarios/page.tsx:241`; `src/app/api/horarios/route.ts:81`; helpers de duração e APIs de extras.

Foi possível preencher entrada `18:00` e saída `09:00` e enviar esse payload ao endpoint interceptado. A interface verifica somente se os campos existem; a API de criação também valida apenas presença. A listagem limita durações negativas a zero, enquanto as APIs de extras calculam a diferença com datas do mesmo dia. O mesmo registro pode afetar os resumos de formas diferentes.

**Reprodução:** `evidence.json → scenarios.reversedTime.outgoingMockedPayload`. A gravação foi simulada, e a validação da API foi conferida por leitura.

**Recomendação:** explicitar a regra para virada de dia. Se não houver suporte a turnos noturnos, bloquear saída anterior ou igual à entrada no cliente e no servidor. Se houver suporte, representar a data final e compartilhar o cálculo de duração entre a tela e as APIs.

**Comando sugerido:** `$impeccable harden`.

### 5. Usos anteriores aos dez mais recentes ficam sem acesso pela interface

**Categoria:** integridade / recuperação e controle. **Local:** `src/app/(dashboard)/horas-extras/page.tsx:371`.

A tela recebe o histórico inteiro, mas renderiza `slice(0, 10)`. A mensagem informa que existem mais registros, sem oferecer paginação, expansão ou busca. A pessoa não consegue consultar, editar ou excluir esses usos mais antigos pela tela.

**Reprodução:** o cenário entregou 12 usos e a página apresentou 10 botões de edição. Ver `evidence.json → scenarios.history` e a captura de horas extras no celular.

**Recomendação:** disponibilizar paginação ou “Carregar mais”, preservando acesso às ações de cada registro. Coordenar essa alteração com a paginação na API para não carregar tudo a cada acesso.

**Comando sugerido:** `$impeccable harden`.

### 6. Contornos dos campos têm contraste insuficiente para identificar a área de entrada

**Categoria:** acessibilidade / temas. **Local:** `src/app/globals.css`, tokens `--input` e `--card`; `src/components/ui/input.tsx`; `src/components/ui/textarea.tsx`.

O contorno claro usa `oklch(0.922 0 0)` sobre cartão branco, aproximadamente **1,26:1**. No escuro, `oklch(0.25 0 0)` sobre cartão `oklch(0.12 0 0)` fica em aproximadamente **1,27:1**. Os valores foram calculados a partir dos tokens neutros e as cores computadas estão registradas na evidência. A sombra suave não oferece uma separação forte entre o campo e o cartão.

Isso dificulta localizar os campos antes do foco, especialmente para baixa visão. O ponto relevante é o contraste do componente, não o contraste do texto, que está mais forte.

**Referência:** WCAG 2.2, critério 1.4.11, para informação visual necessária à identificação dos componentes, com alvo de 3:1.

**Recomendação:** ajustar o token específico dos campos ou introduzir uma diferença de superfície que identifique a área de entrada nos dois temas. Não é necessário escurecer todas as divisórias do aplicativo.

**Comando sugerido:** `$impeccable harden`.

## Achados P2 — próxima rodada

### 7. Progresso visual não transmite valor numérico ao componente acessível

**Categoria:** acessibilidade. **Local:** `src/components/ui/progress.tsx:14`.

O wrapper recebe `value`, usa o número no `transform` do indicador e não o repassa ao `ProgressPrimitive.Root`. No DOM, as três barras ficaram com `data-state="indeterminate"` e sem `aria-valuenow`, mesmo com totais conhecidos. O `aria-label` textual informa a duração e reduz o impacto, mas o papel de barra de progresso comunica um estado diferente.

**Recomendação:** repassar `value` à raiz Radix e conferir mínimo, máximo e valor atual. **Referência:** WCAG 4.1.2, nome, função e valor. **Comando sugerido:** `$impeccable harden`.

### 8. Alvos de toque pequenos, principalmente o fechamento de modal

**Categoria:** responsividade / acessibilidade. **Local:** `src/components/ui/dialog.tsx`, `src/components/ui/button.tsx`, ações das listagens.

O fechamento do diálogo mede 16 × 16 px; editar/excluir nos registros mede 36 × 36 px; tema e conta medem 40 × 40 px. Esses tamanhos tornam a operação menos confortável no celular. O link de pular conteúdo, que mede 1 × 1 px quando escondido, foi excluído desta avaliação: esse tamanho é intencional fora de foco.

**Recomendação:** manter o desenho interno pequeno e ampliar a área clicável para cerca de 44 × 44 px, especialmente no fechar e nas ações repetidas. A recomendação de conforto de 44 px não equivale a afirmar que todos os alvos abaixo disso violam automaticamente a WCAG 2.2, que prevê critérios e exceções de espaçamento.

**Comando sugerido:** `$impeccable adapt`.

### 9. A ação de registrar uso fica distante no celular

**Categoria:** responsividade / hierarquia. **Local:** `src/app/(dashboard)/horas-extras/page.tsx:286`.

Na composição de 390 × 844, três cartões de resumo empilhados ocupam grande parte da página antes do botão “Registrar Uso”. O dashboard já usa um resumo mais compacto, enquanto esta tela dá o mesmo peso a três números relacionados. A pessoa precisa percorrer bastante conteúdo para iniciar a tarefa principal.

**Recomendação:** levar a ação para o cabeçalho da página e compactar o resumo no celular, destacando o saldo disponível e subordinando geradas/utilizadas. Preservar o texto de indisponibilidade quando o saldo for zero.

**Comando sugerido:** `$impeccable layout`.

### 10. Resumos e paginação dependem de carregar todo o histórico

**Categoria:** performance. **Local:** `src/app/api/horarios/route.ts:50`, `src/app/(dashboard)/dashboard/page.tsx:30`, `:47`, `:95`; lista de usos de extras.

A API retorna todos os registros e o navegador agrupa, soma e pagina os resultados. No dashboard, o histórico completo é transferido para mostrar totais e apenas cinco datas recentes. O impacto cresce com o tempo de uso da conta; não foi feito benchmark com uma conta grande, portanto não se afirma lentidão atual.

**Recomendação:** mover agregados e paginação para consultas da API, mantendo a separação por usuário. Medir uma conta com alguns anos de registros antes de acrescentar memoização ou cache.

**Comando sugerido:** `$impeccable optimize`.

## Padrões e acertos

Os problemas mais importantes se concentram na separação entre os dados exibidos e os dados usados nos cálculos, além de regras repetidas entre cliente e servidor. Corrigir essas fronteiras melhora a confiança no produto mais do que alterar a paleta ou acrescentar efeitos.

Vale preservar:

- Navegação curta com estado ativo claro e nomes acessíveis nas ações de editar/excluir.
- Jornada configurável por conta, progresso diário e totais em minutos.
- Formulários compartilhados com shadcn/Radix, diálogos limitados à altura da tela e estados vazios com ação de início.
- Recuperação explícita de falha no dashboard; o botão “Tentar novamente” apareceu no cenário de erro.
- Temas consistentes, foco visível e ausência de estouro horizontal do documento nos cenários verificados.

O CSS global reduz animações com `0.01ms`. Não foi contado como falha comprovada nesta rodada: os rótulos de estado permanecem presentes; a política merece uma avaliação individual das animações se forem adicionadas transições mais complexas. A marca em SVG tem cores fixas intencionais e também não foi contada como desvio de tokens.

## Migração para Tabler concluída

- 19 arquivos de interface migrados para importações nomeadas `Icon*` de `@tabler/icons-react`.
- Inclui páginas, navegação, calendário, date picker, select, dropdown, comandos, diálogos, confirmação, notificações, spinner e sidebar.
- Dependência `lucide-react` removida; `@tabler/icons-react` instalado na versão resolvida 3.49.0.
- `components.json` configurado com `iconLibrary: "tabler"`.
- Convenção registrada em `AGENTS.md` e `MEMORY.md`: componentes nomeados, traço padrão e cor herdada da interface.
- Nenhum SVG com classe Lucide foi encontrado nas 16 páginas renderizadas; ícones Tabler foram identificados em todas elas. A marca e os controles nativos do navegador são elementos distintos do conjunto de ícones da interface.

Referências consultadas: [Tabler Icons para React](https://github.com/tabler/tabler-icons/blob/main/packages/icons-react/README.md), [schema do shadcn](https://ui.shadcn.com/schema.json), [WCAG 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [WCAG 4.1.2](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html).

## Validação e evidências

`npm run build`, `npx tsc --noEmit` e ESLint nos 19 arquivos alterados passaram. O detector `impeccable detect --json src` retornou uma lista vazia. O servidor local e o navegador iniciados para a inspeção foram encerrados.

- [Dados e reproduções da inspeção](evidence.json)
- [Dashboard desktop claro](dashboard-1440-light.png) · [Dashboard celular escuro](dashboard-390-dark.png)
- [Registros desktop claro](horarios-1440-light.png) · [Registros celular escuro](horarios-390-dark.png)
- [Horas extras desktop escuro](horas-extras-1440-dark.png) · [Horas extras celular claro](horas-extras-390-light.png)
- [Login desktop claro](login-1440-light.png) · [Login celular escuro](login-390-dark.png)
- [Formulário de registro no celular](registro-mobile.png) · [Formulário de uso no celular](uso-mobile.png)

As capturas usam dados fictícios. Capturas de página inteira com modal mostram também conteúdo abaixo da altura visível do navegador: a área de overlay pertence ao viewport e isso não foi registrado como defeito do aplicativo.

## Ordem recomendada

1. **P1 — `$impeccable harden`:** corrigir agregados filtrados, parser de duração, validação dos endpoints e limite de edição; disponibilizar todo o histórico.
2. **P1/P2 — `$impeccable harden`:** corrigir contraste dos campos e semântica da barra de progresso.
3. **P2 — `$impeccable adapt`:** ampliar alvos de toque.
4. **P2 — `$impeccable layout`:** compactar o resumo de extras e antecipar sua ação principal no celular.
5. **P2 — `$impeccable optimize`:** medir volume de histórico e implementar agregação/paginação no servidor.
6. **`$impeccable polish`:** finalizar alinhamentos e estados depois das correções funcionais.

Após as correções, uma nova execução de `$impeccable audit` pode comparar os mesmos cenários. Os itens foram documentados como recomendações; a mudança de código desta rodada foi a padronização dos ícones.
