# Adminsax — Design System

Tokens e especificações extraídos visualmente das telas **Task / Board (Overview)** nos temas Light e Dark, completados com estados, componentes e regras derivados da mesma linguagem visual.

> Os valores são estimativas feitas a partir das imagens (sem acesso ao arquivo-fonte). Medidas convertidas para um artboard base de **1440px** (fator ≈ 1.17 sobre o screenshot). Itens marcados com **(derivado)** não aparecem nas imagens e foram definidos seguindo o estilo do design.

**Arquivos de implementação** (fonte única para os projetos):

| Arquivo | Uso |
|---|---|
| [tokens/tokens.css](tokens/tokens.css) | **Fonte única**: variáveis CSS com tema light (`:root`) e dark (`[data-theme="dark"]`) |
| [tokens/tokens.json](tokens/tokens.json) | Gerado a partir do CSS no formato W3C Design Tokens (Style Dictionary / Tokens Studio) — `node tokens/build-json.js tokens/tokens.css tokens/tokens.json` |
| [tokens/tailwind.preset.js](tokens/tailwind.preset.js) | Preset do Tailwind apontando para as variáveis CSS |

---

## 1. Fundamentos de uso

- **Flat com bordas:** profundidade vem de bordas de 1px; sombra só em elementos flutuantes (menus, modais, toasts) e no toggle de tema.
- **Formas arredondadas:** tudo que é controle é pill (`radius-full`); containers usam `radius-xl`.
- **Monocromático + cor funcional:** a interface é preto/branco/cinza. Cor saturada só comunica algo: ação primária (azul), status de coluna, prioridade e tags.
- **Um único botão primário por área.** Demais ações são secundárias ou ícones.
- **Hierarquia por tamanho e peso**, nunca por cor.

---

## 2. Cores

### 2.1 Primitivas

| Token | Hex | Uso |
|---|---|---|
| `neutral-0` | `#FFFFFF` | Superfície light |
| `neutral-25` | `#FAFAFB` | Fundo sutil light |
| `neutral-50` | `#F4F4F6` | Header "In Work", hover light |
| `neutral-100` | `#EEEEF1` | Bordas light |
| `neutral-200` | `#E3E5E8` | Fundo da página, bordas fortes light |
| `neutral-400` | `#A1A1AA` | Desabilitado light |
| `neutral-500` | `#71717A` | Texto secundário light |
| `neutral-550` | `#80808A` | Placeholder dark |
| `neutral-600` | `#8A8A93` | Texto secundário dark |
| `neutral-650` | `#5C5C63` | Desabilitado dark |
| `neutral-700` | `#2A2A2E` | Bordas fortes dark |
| `neutral-750` | `#222224` | Bordas dark |
| `neutral-800` | `#1A1A1C` | Fundo sutil / hover dark |
| `neutral-850` | `#141414` | Superfície dark |
| `neutral-900` | `#0A0A0A` | Texto primário light |
| `neutral-1000` | `#000000` | Fundo do app dark, nav ativo light |
| `blue-400` | `#4D8BFF` | Foco no dark |
| `blue-500` | `#1F6BFF` | Ação primária |
| `blue-600` | `#1A5CE6` | Hover da ação primária |
| `blue-700` | `#1650CC` | Pressed da ação primária |
| `blue-text-light` | `#1D4ED8` | Texto azul sobre fundo claro |
| `blue-text-dark` | `#60A5FA` | Texto azul sobre fundo escuro |
| `purple-500` | `#A855F7` | Acento roxo (não-texto) |
| `purple-text-light` | `#9333EA` | Texto roxo sobre fundo claro |
| `purple-text-dark` | `#C084FC` | Texto roxo sobre fundo escuro |
| `green-500` | `#22C55E` | Acento verde, texto verde no dark |
| `green-text-light` | `#15803D` | Texto verde sobre fundo claro |
| `orange-500` | `#F59E0B` | Acento laranja, texto laranja no dark |
| `orange-text-light` | `#B45309` | Texto laranja sobre fundo claro |
| `red-500` | `#F43F5E` | Acento vermelho, dot de notificação |
| `red-600` | `#E11D48` | Hover destrutivo |
| `red-700` | `#BE123C` | Ação destrutiva, texto vermelho sobre fundo claro |
| `red-text-dark` | `#FB7185` | Texto vermelho sobre fundo escuro |

> **Acento vs. texto:** os tons `*-500` reproduzem o visual das imagens e são usados em bordas, barras, pontos e ícones. Para **texto** sobre os fundos tingidos, use as variantes `*-text-*`, que passam no WCAG AA (ver seção 13).

### 2.2 Semânticas

| Token | Light | Dark |
|---|---|---|
| `color-bg-page` | `#E3E5E8` | `#000000` |
| `color-bg-app` | `#FFFFFF` | `#000000` |
| `color-bg-surface` | `#FFFFFF` | `#141414` |
| `color-bg-subtle` | `#F4F4F6` | `#1A1A1C` |
| `color-bg-input` | `#FFFFFF` | `#0F0F10` |
| `color-bg-hover` | `#F4F4F6` | `#1A1A1C` |
| `color-bg-pressed` | `#EEEEF1` | `#222224` |
| `color-bg-overlay` | `rgba(10,10,10,0.40)` | `rgba(0,0,0,0.70)` |
| `color-bg-elevated` | `#FFFFFF` | `#1A1A1C` |
| `color-border-default` | `#EEEEF1` | `#222224` |
| `color-border-strong` | `#E3E5E8` | `#2A2A2E` |
| `color-border-hover` | `#D4D6DA` | `#3A3A3F` |
| `color-text-primary` | `#0A0A0A` | `#FFFFFF` |
| `color-text-secondary` | `#71717A` | `#8A8A93` |
| `color-text-placeholder` | `#71717A` | `#80808A` |
| `color-text-disabled` | `#A1A1AA` | `#5C5C63` |
| `color-text-inverse` | `#FFFFFF` | `#0A0A0A` |
| `color-icon-default` | `#0A0A0A` | `#FFFFFF` |
| `color-icon-secondary` | `#71717A` | `#8A8A93` |
| `color-nav-active-bg` | `#000000` | `#FFFFFF` |
| `color-nav-active-text` | `#FFFFFF` | `#0A0A0A` |
| `color-action-primary` | `#1F6BFF` | `#1F6BFF` |
| `color-action-primary-hover` | `#1A5CE6` | `#4D8BFF` |
| `color-action-primary-pressed` | `#1650CC` | `#1A5CE6` |
| `color-action-primary-text` | `#FFFFFF` | `#FFFFFF` |
| `color-action-danger` | `#BE123C` | `#E11D48` |
| `color-action-danger-hover` | `#9F1239` | `#F43F5E` |
| `color-focus-ring` | `#1F6BFF` | `#4D8BFF` |
| `color-notification-dot` | `#0A0A0A` | `#F43F5E` |
| `color-progress-track` | `#EEEEF1` | `#2A2A2E` |
| `color-progress-fill` | `#22C55E` | `#22C55E` |
| `color-skeleton` | `#EEEEF1` | `#1A1A1C` |
| `color-skeleton-shine` | `#F7F7F9` | `#222224` |

> `color-bg-page` no dark é `#000000` em produto; o cinza `#8E8E8E` das imagens é só fundo de apresentação.

### 2.3 Feedback (derivado)

Reaproveita as famílias de prioridade para toasts, alertas e validação de formulário.

| Token | Light bg | Light fg | Dark bg | Dark fg |
|---|---|---|---|---|
| `success` | `#EAF8EF` | `#15803D` | `#0E2416` | `#22C55E` |
| `warning` | `#FFF4E0` | `#B45309` | `#2A1D06` | `#F59E0B` |
| `danger` | `#FFE9EE` | `#BE123C` | `#2B0D14` | `#FB7185` |
| `info` | `#E8F0FF` | `#1D4ED8` | `#0E2A66` | `#60A5FA` |

### 2.4 Status de coluna (Kanban)

| Coluna | Light bg | Light text | Dark bg | Dark text |
|---|---|---|---|---|
| In Work | `#F4F4F6` | `#0A0A0A` | `#141414` | `#FFFFFF` |
| Feedback | `#F5ECFF` | `#9333EA` | `#1E1430` | `#C084FC` |
| Done | `#E8F0FF` | `#1D4ED8` | `#0E2A66` | `#60A5FA` |

### 2.5 Prioridade (badges)

| Prioridade | Light bg | Light text | Borda | Dark bg | Dark text |
|---|---|---|---|---|---|
| Low | `#EAF8EF` | `#15803D` | `#22C55E` @ 30% | `#0E2416` | `#22C55E` |
| Medium | `#FFF4E0` | `#B45309` | `#F59E0B` @ 30% | `#2A1D06` | `#F59E0B` |
| High | `#FFE9EE` | `#BE123C` | `#F43F5E` @ 30% | `#2B0D14` | `#FB7185` |

### 2.6 Tags / Labels

| Tag | Light bg | Light text | Dark bg | Dark text |
|---|---|---|---|---|
| Purple (Project) | `#F5ECFF` | `#9333EA` | `#24143A` | `#C084FC` |
| Orange (Business) | `#FFF3E0` | `#B45309` | `#2A1D06` | `#F59E0B` |
| Green | `#EAF8EF` | `#15803D` | `#0E2416` | `#22C55E` |
| Red | `#FFE9EE` | `#BE123C` | `#2B0D14` | `#FB7185` |
| Blue (derivado) | `#E8F0FF` | `#1D4ED8` | `#0E2A66` | `#60A5FA` |
| Gray (derivado) | `#F4F4F6` | `#71717A` | `#1A1A1C` | `#8A8A93` |

### 2.7 Gráficos

Paleta categórica validada para daltonismo (protan/deutan/tritan) nos dois temas. Usar sempre nesta ordem e nunca reaproveitar cores de status (verde/laranja/vermelho de feedback) como série.

| Token | Light | Dark |
|---|---|---|
| `color-chart-1` | `#1F6BFF` | `#4D8BFF` |
| `color-chart-2` | `#F97316` | `#EA580C` |
| `color-chart-grid` | `#EEEEF1` | `#222224` |

Barras com topo arredondado de 4px, 2px de espaço entre barras vizinhas, legenda sempre visível com 2+ séries, tooltip no hover e opção de ver os dados em tabela.

---

## 3. Tipografia

### 3.1 Família

| Token | Valor |
|---|---|
| `font-family-base` | `"Manrope", "Gilroy", system-ui, -apple-system, "Segoe UI", sans-serif` |
| `font-family-mono` | `"JetBrains Mono", ui-monospace, "SF Mono", Consolas, monospace` (derivado) |

- O design usa uma geométrica no estilo **Gilroy** (fonte paga).
- **Padrão oficial: Manrope** — gratuita (Google Fonts, licença OFL), mesma proporção geométrica e pesos 400/500/600. Se houver licença da Gilroy, ela pode vir primeiro na pilha sem mudar nenhum outro token.
- Importação: `https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600&display=swap`

### 3.2 Escala

| Token | Size / Line-height | Peso | Letter-spacing | Uso |
|---|---|---|---|---|
| `font-display` | 32 / 40 | 600 | -0.02em | Título da página ("Overview") |
| `font-heading-lg` | 24 / 32 | 600 | -0.02em | Logo, título de modal |
| `font-heading-md` | 20 / 28 | 500 | -0.01em | Título de painel ("Activity") |
| `font-heading-sm` | 16 / 24 | 500 | 0 | Seção ("Priority"), título de toast |
| `font-body-md` | 14 / 20 | 500 | 0 | Título de card, menu, tabs, botões |
| `font-body-sm` | 13 / 20 | 400 | 0 | Descrições, inputs, células de tabela |
| `font-caption` | 12 / 16 | 400 | 0.01em | Datas, horários, labels de seção |
| `font-badge` | 12 / 16 | 500 | 0 | Badges de prioridade |
| `font-micro` | 10 / 12 | 500 | 0.01em | Tags, contadores, pill de prazo |

> Nas imagens o `font-micro` fica em ~9px. O padrão adota **10px** como mínimo legível.

### 3.3 Regras

| Estilo | Cor |
|---|---|
| Display, headings, título de card, menu | `color-text-primary` |
| Datas, descrições, horários, labels de seção | `color-text-secondary` |
| Placeholder | `color-text-placeholder` |
| Desabilitado | `color-text-disabled` |

- Pesos permitidos: 400, 500, 600. Nada em 700+.
- Sentence case em toda a UI ("Create Task"); nunca caixa alta.
- Números em tabelas e contadores com `font-variant-numeric: tabular-nums`.
- Truncamento: títulos de card em até 2 linhas (`line-clamp: 2`); nomes e labels em 1 linha com reticências.

---

## 4. Espaçamento

Escala base de **4px**.

| Token | Valor |
|---|---|
| `space-0` | 0 |
| `space-0.5` | 2px |
| `space-1` | 4px |
| `space-1.5` | 6px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-8` | 32px |
| `space-10` | 40px |
| `space-12` | 48px |
| `space-16` | 64px |

| Contexto | Valor |
|---|---|
| Padding de card / painel | 16px |
| Gap entre colunas e entre cards | 16px |
| Gap interno do card | 12px |
| Gap entre tags | 4px |
| Gap ícone + texto | 8px (botões) / 12px (menu) |
| Padding do app shell | 32px (desktop) / 16px (mobile) |
| Distância título da página → conteúdo | 24px |

---

## 5. Border radius

| Token | Valor | Uso |
|---|---|---|
| `radius-xs` | 4px | Tags, checkbox |
| `radius-sm` | 6px | Badges, chips de nome, tooltip |
| `radius-md` | 10px | Capa do card, itens de dropdown |
| `radius-lg` | 12px | Item de navegação, item de prioridade, input de painel, toast |
| `radius-xl` | 20px | Cards, painéis, dropdown, tabela |
| `radius-2xl` | 32px | App shell, modal |
| `radius-full` | 9999px | Botões, inputs, headers de coluna, avatares, switch |

---

## 6. Bordas e foco

| Token | Valor |
|---|---|
| `border-width-default` | 1px |
| `border-width-avatar-ring` | 2px (cor = `color-bg-surface`) |
| `border-default` | `1px solid var(--color-border-default)` |
| `focus-ring` | `0 0 0 2px var(--color-bg-app), 0 0 0 4px var(--color-focus-ring)` |

- O anel de foco aparece **apenas** em `:focus-visible` (teclado), em todo elemento interativo, sem remover a borda existente.
- Inputs em foco: borda `color-focus-ring` + `focus-ring`.

---

## 7. Sombras / Elevação

| Token | Light | Dark | Uso |
|---|---|---|---|
| `shadow-none` | `none` | `none` | Cards, painéis |
| `shadow-xs` | `0 1px 2px rgba(16,24,40,0.04)` | `none` | Inputs |
| `shadow-sm` | `0 2px 8px rgba(16,24,40,0.08)` | `0 2px 8px rgba(0,0,0,0.40)` | Toggle de tema, tooltip |
| `shadow-md` | `0 8px 24px rgba(16,24,40,0.08)` | `0 8px 24px rgba(0,0,0,0.50)` | Hover de card, dropdown |
| `shadow-lg` | `0 24px 48px rgba(16,24,40,0.12)` | `0 24px 48px rgba(0,0,0,0.60)` | Modal, toast, drawer |

No dark, elementos flutuantes também usam `color-bg-elevated` + borda `color-border-strong` para se destacarem.

---

## 8. Opacidade, z-index e motion

| Token | Valor |
|---|---|
| `opacity-disabled` | 0.4 |
| `z-base` | 0 |
| `z-sticky` | 10 |
| `z-dropdown` | 100 |
| `z-overlay` | 200 |
| `z-modal` | 300 |
| `z-toast` | 400 |
| `z-tooltip` | 500 |
| `duration-fast` | 120ms (hover, cor) |
| `duration-base` | 200ms (dropdown, tooltip, toggle) |
| `duration-slow` | 300ms (modal, drawer) |
| `easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` |
| `easing-exit` | `cubic-bezier(0.4, 0, 1, 1)` |

Respeitar `prefers-reduced-motion: reduce` desativando transformações e mantendo só mudanças de opacidade.

---

## 9. Iconografia

| Token | Valor |
|---|---|
| Biblioteca | **Iconsax** — estilo *Linear* (gratuita) |
| Pacotes | `iconsax-react` (React), `iconsax` (Flutter) ou SVGs em iconsax.io |
| `icon-size-xs` | 14px (dentro de badges/pills) |
| `icon-size-sm` | 16px (meta do card: calendário, relógio) |
| `icon-size-md` | 20px (menu, botões, inputs) |
| `icon-size-lg` | 24px (topbar) |
| `icon-stroke` | 1.5px |

- Cor herdada do texto (`currentColor`).
- Estado ativo do menu continua *Linear* (não trocar para *Bold*).

---

## 10. Layout e grid

### 10.1 Estrutura do app

```
┌──────────┬───────────────────────────────────┬────────────┐
│ Sidebar  │ Topbar (busca · tabs · ações)     │            │
│ 248px    ├───────────────────────────────────┤ Activity   │
│          │ Título + ações da página          │ 320px      │
│          │ Board: 3 colunas fluidas, gap 16  │            │
└──────────┴───────────────────────────────────┴────────────┘
```

| Token | Valor |
|---|---|
| `layout-max-width` | 1440px (centralizado) |
| `layout-shell-padding` | 32px |
| `layout-shell-radius` | `radius-2xl` |
| `size-sidebar-width` | 248px |
| `size-sidebar-collapsed` | 80px (só ícones) |
| `size-activity-panel-width` | 320px |
| `size-topbar-height` | 72px |
| `layout-board-columns` | 3 colunas `1fr`, mínimo 240px |
| `layout-grid-columns` | 12 colunas, gutter 16px (páginas que não são board) |

A sidebar é separada do conteúdo por um divisor vertical `color-border-default`.

### 10.2 Breakpoints e comportamento (derivado)

| Token | Min-width | Comportamento |
|---|---|---|
| `breakpoint-sm` | 640px | Abaixo: tabs com scroll horizontal; título vira `font-heading-lg` |
| `breakpoint-md` | 768px | Abaixo: sidebar vira drawer (off-canvas) aberto por botão na topbar; board com scroll horizontal e colunas de 280px com *scroll-snap* |
| `breakpoint-lg` | 1024px | Abaixo: sidebar colapsa para 80px (ícone de colapso já existe no design) |
| `breakpoint-xl` | 1280px | Abaixo: painel Activity vira drawer lateral à direita |
| `breakpoint-2xl` | 1440px | Artboard base |

---

## 11. Componentes

### 11.1 Botão

| Variante | Altura | Padding | Bg | Texto | Borda |
|---|---|---|---|---|---|
| Primary | 40px | 0 20px | `color-action-primary` | `#FFFFFF` | — |
| Secondary | 40px | 0 16px | `color-bg-surface` | `color-text-primary` | `border-default` |
| Ghost (derivado) | 40px | 0 12px | transparente | `color-text-primary` | — |
| Danger (derivado) | 40px | 0 20px | `color-action-danger` | `#FFFFFF` | — |
| Icon | 40×40 | — | `color-bg-surface` | `color-icon-default` | `border-default` |
| Icon small | 32×32 | — | transparente | `color-icon-default` | `border-default` |

Tamanho `sm` (derivado): altura 32px, padding 0 12px, `font-caption` 500. Todos com `radius-full`, `font-body-md`, gap 8px.

| Estado | Primary | Secondary / Icon | Ghost |
|---|---|---|---|
| Hover | bg `action-primary-hover` | bg `bg-hover`, borda `border-hover` | bg `bg-hover` |
| Pressed | bg `action-primary-pressed` | bg `bg-pressed` | bg `bg-pressed` |
| Focus | `focus-ring` | `focus-ring` | `focus-ring` |
| Disabled | `opacity-disabled`, `cursor: not-allowed` | idem | idem |
| Loading | spinner 16px no lugar do ícone, texto mantido, sem clique | idem | idem |

### 11.2 Input / Textarea / Select

| Propriedade | Valor |
|---|---|
| Altura | 40px (topbar e formulários) / 44px (painel) |
| Padding | 0 16px; textarea 12px 16px, mínimo 96px de altura |
| Radius | `radius-full` (busca) / `radius-lg` (formulário, textarea, select) |
| Bg / borda | `color-bg-input` + `border-default` |
| Fonte | `font-body-sm`, texto `color-text-primary` |
| Ícone | 20px, gap 8px, `color-icon-secondary` |
| Label (derivado) | `font-caption` 500, `color-text-primary`, 6px acima |
| Texto de ajuda | `font-caption`, `color-text-secondary`, 6px abaixo |

| Estado | Visual |
|---|---|
| Hover | borda `border-hover` |
| Focus | borda `color-focus-ring` + `focus-ring` |
| Erro | borda `danger.fg`; ajuda em `danger.fg` com ícone de alerta 14px |
| Disabled | bg `color-bg-subtle`, texto `color-text-disabled` |

Select usa ícone *arrow-down* 16px à direita e abre um Dropdown (11.10).

### 11.3 Checkbox, radio e switch

| Componente | Tamanho | Off | On |
|---|---|---|---|
| Checkbox | 16px, `radius-xs` | borda `border-strong` | bg `color-text-primary`, check `color-text-inverse` |
| Radio (derivado) | 16px, `radius-full` | borda `border-strong` | borda 5px `color-text-primary` |
| Switch (derivado) | 36×20, thumb 16px | trilho `color-bg-pressed` | trilho `color-text-primary`, thumb `color-bg-surface` |

Hover: borda `border-hover`. Disabled: `opacity-disabled`. Label à direita com gap 8px, `font-body-sm`.

### 11.4 Tabs

| Propriedade | Valor |
|---|---|
| Gap | 32px |
| Fonte | `font-body-md` |
| Ativa | `color-text-primary` + indicador 16×2px, `radius-full`, 8px abaixo do texto |
| Inativa | `color-text-secondary`; hover `color-text-primary` |

### 11.5 Segmented control (toggle de tema)

Container pill `color-bg-subtle`, padding 4px; opções circulares de 36px; selecionada com `color-bg-surface` + `shadow-sm`. Serve para qualquer escolha de 2–4 opções.

### 11.6 Navegação lateral

| Estado | Bg | Texto/ícone |
|---|---|---|
| Default | transparente | `color-text-secondary` |
| Hover | `color-bg-hover` | `color-text-primary` |
| Active | `color-nav-active-bg` | `color-nav-active-text` |

Altura 44px, padding 0 16px, gap 12px, `radius-lg`. Indicador vertical 2×24px na borda direita da sidebar no item ativo. Contador: pill 22px, borda `border-default`, `font-caption`. Rótulo de grupo ("Main menu"): `font-caption`, `color-text-secondary`, 16px abaixo. Grupos separados por divisor 1px.

### 11.7 Header de coluna

Altura 30px, `radius-full`, `font-body-md` centralizado, cores em 2.4. Pode receber contador à direita (derivado) em `font-micro`.

### 11.8 Card de tarefa

| Propriedade | Valor |
|---|---|
| Bg / borda / radius | `color-bg-surface`, `border-default`, `radius-xl` |
| Padding / gap | 16px / 12px |
| Capa | largura total × 144px, `radius-md`, `object-fit: cover` |
| Header | checkbox 16px + badge de prioridade + botão "…" (icon 24px) à direita |
| Progresso | barra 4px abaixo do header (opcional) |
| Meta | ícone calendário 16px + datas `font-caption` separadas por chevron |
| Footer | icon small com contador `font-micro` no canto inferior direito; pill de prazo (`font-micro` + ícone relógio) à direita |

Estados: hover `shadow-md` + borda `border-hover`; arrastando (derivado) `shadow-lg`, `rotate(2deg)`, opacidade 0.95, e um placeholder tracejado `border-strong` no lugar; concluído com checkbox marcado (sem riscar o título).

### 11.9 Badge, tag, chip

| Componente | Altura | Padding | Radius | Fonte | Observação |
|---|---|---|---|---|---|
| Badge de prioridade | 20px | 0 6px | `radius-sm` | `font-badge` | Borda 1px na cor de acento @ 30% |
| Tag / label | 16px | 0 6px | `radius-xs` | `font-micro` | Sem borda |
| Chip de nome | 24px | 0 8px | `radius-sm` | `font-body-sm` 500 | Borda `border-default` |
| Chip de filtro (derivado) | 32px | 0 12px | `radius-full` | `font-caption` 500 | Selecionado: bg `color-text-primary`, texto `color-text-inverse` |

### 11.10 Dropdown / menu de contexto (derivado — botão "…")

| Propriedade | Valor |
|---|---|
| Container | `color-bg-elevated`, `border-default`, `radius-xl`, padding 6px, `shadow-md`, largura mín. 200px |
| Item | altura 36px, padding 0 10px, `radius-md`, `font-body-sm` 500, ícone 16px + gap 8px |
| Item hover | bg `color-bg-hover` |
| Item destrutivo | texto e ícone `color-action-danger` |
| Divisor | 1px `color-border-default`, margem 6px 0 |
| Entrada | fade + translateY(-4px → 0), `duration-base` |

Posição: 8px abaixo do gatilho, alinhado à direita.

### 11.11 Modal (derivado)

| Propriedade | Valor |
|---|---|
| Overlay | `color-bg-overlay` |
| Container | `color-bg-surface`, `radius-2xl`, padding 24px, `shadow-lg` |
| Larguras | sm 400px / md 560px / lg 720px; mobile: largura total, `radius-xl` só no topo (bottom sheet) |
| Header | título `font-heading-lg` + botão fechar (icon 32px) |
| Footer | ações à direita, gap 8px, primária por último |
| Entrada | fade + scale(0.98 → 1), `duration-slow` |

### 11.12 Toast (derivado)

Container `color-bg-elevated`, `border-default`, `radius-lg`, padding 12px 16px, `shadow-lg`, largura 360px, canto inferior direito com 24px de margem. Ícone 20px na cor `fg` do tipo de feedback (2.3), título `font-body-md`, descrição `font-body-sm` secundária, botão fechar 24px. Duração padrão 5s.

### 11.13 Tooltip (derivado)

Bg `color-text-primary`, texto `color-text-inverse`, `font-caption`, padding 6px 10px, `radius-sm`, `shadow-sm`, distância 6px, delay de entrada 300ms.

### 11.14 Avatar e grupo

| Tamanho | Valor | Uso |
|---|---|---|
| xs | 20px | Grupo no card |
| sm | 24px | Composer, listas compactas |
| md | 32px | Feed de atividade, tabela |
| lg | 40px | Topbar (perfil) |

Fallback sem foto (derivado): iniciais em `font-caption` 600 sobre `color-bg-subtle`. Grupo: ring 2px na cor da superfície, overlap -6px, máx. 7 avatares + contador "+N" (`font-micro`, bg `color-bg-subtle`, `radius-full`).

### 11.15 Botão de notificação

Icon button 40px; dot 8px `color-notification-dot` com ring 2px `color-bg-app`, posicionado no canto inferior direito.

### 11.16 Item de prioridade (painel)

Container `border-default`, `radius-lg`, padding 12px; linha 1 com datas + badge à direita; linha 2 com duração (ícone relógio 16px) + alça de arrastar (*drag handle* ⋮⋮, 16px, `color-icon-secondary`) à direita. Gap 8px entre itens.

### 11.17 Item de atividade

Avatar 32px + chip de nome + menu "…"; horário `font-caption` secundário à direita; descrição `font-body-sm` secundária com recuo alinhado ao chip; badge alinhado à direita. Divisor 1px entre itens, 16px de espaço vertical. Grupos por data com rótulo `font-caption` secundário ("Today", "Yesterday").

### 11.18 Composer (rodapé do Activity)

Container `color-bg-subtle`, `radius-lg`, altura 48px, padding 0 12px; ícones de anexo/emoji 20px à esquerda, chip de menção, botão enviar 32px circular à direita (`color-text-primary` com ícone `color-text-inverse`).

### 11.19 Controle de ordenação

Texto `font-caption` 500 ("Newest") + ícone *arrow-swap* 16px, sem borda; hover em `color-text-secondary`.

### 11.20 Tabela — vista "List" (derivado)

| Propriedade | Valor |
|---|---|
| Container | `color-bg-surface`, `border-default`, `radius-xl`, overflow oculto |
| Header | altura 40px, bg `color-bg-subtle`, `font-caption` 500 `color-text-secondary` |
| Linha | altura 56px, `font-body-sm`, divisor 1px `color-border-default` |
| Linha hover | bg `color-bg-hover` |
| Linha selecionada | bg `color-bg-subtle` + checkbox marcado |
| Padding de célula | 0 16px |
| Colunas típicas | checkbox · tarefa · prioridade (badge) · datas · responsáveis (avatar group) · tags · ações (…) |

### 11.21 Timeline — vista "Timeline" (derivado)

Eixo de dias no topo (`font-caption` secundário, coluna de 48px por dia), linhas de 48px com divisores `color-border-default`, dia atual marcado por linha vertical 1px `color-action-primary`. Barra da tarefa: altura 28px, `radius-full`, bg do tipo de prioridade (`*-bg`) com borda 1px de acento @ 30%, título `font-caption` 500 e avatar xs à direita.

### 11.22 Estado vazio (derivado)

Centralizado, padding 48px; ícone Iconsax 40px dentro de círculo 72px `color-bg-subtle`; título `font-heading-sm`; descrição `font-body-sm` secundária (máx. 320px); botão secondary opcional, 16px abaixo. Em coluna vazia do board: container com borda tracejada `border-strong`, `radius-xl`, altura 120px.

### 11.23 Skeleton (derivado)

Blocos `color-skeleton` com shimmer `color-skeleton-shine` em 1.2s linear infinito; mesmos raios dos elementos reais (linhas de texto `radius-xs`, avatares `radius-full`, capa `radius-md`). Sem shimmer quando `prefers-reduced-motion`.

---

## 12. Conteúdo

- Datas no formato do locale do projeto; nas imagens `DD/MM/YYYY`, intervalo separado por chevron (`08/09/2024 › 12/09/2024`).
- Durações curtas e capitalizadas: "2 Days", "8 Hours".
- Ações em verbo + substantivo: "Create Task", "Share".

---

## 13. Acessibilidade

Razões de contraste calculadas (WCAG 2.1). Mínimo AA: 4.5:1 para texto normal, 3:1 para texto ≥ 18px ou 14px bold e componentes de UI.

| Par | Original (imagem) | Ajustado | Status |
|---|---|---|---|
| Verde sobre `#EAF8EF` | `#22C55E` — 2.08 | `#15803D` — 4.58 | ✅ |
| Laranja sobre `#FFF4E0` | `#F59E0B` — 1.97 | `#B45309` — 4.61 | ✅ |
| Vermelho sobre `#FFE9EE` | `#F43F5E` — 3.17 | `#BE123C` — 5.43 | ✅ |
| Roxo sobre `#F5ECFF` | `#A855F7` — 3.45 | `#9333EA` — 4.70 | ✅ |
| Azul sobre `#E8F0FF` | `#2563EB` — 4.51 | `#1D4ED8` — 5.85 | ✅ |
| Azul sobre `#0E2A66` (dark) | `#3B82F6` — 3.70 | `#60A5FA` — 5.36 | ✅ |
| Roxo sobre `#24143A` (dark) | `#A855F7` — 4.29 | `#C084FC` — 6.43 | ✅ |
| Vermelho sobre `#2B0D14` (dark) | `#F43F5E` — 4.89 | `#FB7185` — 6.67 | ✅ (mais legível) |
| Verde / laranja no dark | 7.19 / 7.66 | mantido | ✅ |
| Secundário light `#71717A` / branco | 4.83 | mantido | ✅ |
| Secundário dark `#8A8A93` / `#141414` | 5.38 | mantido | ✅ |
| Placeholder dark | `#5C5C63` — 2.78 | `#80808A` — 4.71 | ✅ |
| Branco sobre primário `#1F6BFF` | 4.56 | mantido | ✅ |

Regras:
- `color-text-disabled` (`#A1A1AA` / `#5C5C63`) só para conteúdo desabilitado (isento pelo WCAG).
- Área de toque mínima de 32×32px no desktop e 44×44px no mobile (botões de 32px ganham área extra via padding/pseudo-elemento).
- Prioridade nunca só por cor: o badge sempre exibe o texto ("Low", "Medium", "High").
- Botões só com ícone exigem `aria-label`; contadores de ação entram no rótulo ("Comentários, 7").
- Checkbox do card precisa de rótulo acessível com o título da tarefa.
- Board navegável por teclado: Tab entre cards, Enter abre, menu "…" acessível via teclado.

---

## 14. Como aplicar em um projeto

1. Copiar a pasta `tokens/` para o projeto (ou publicar como pacote interno).
2. Importar `tokens/tokens.css` no CSS global e carregar a fonte Manrope.
3. Com Tailwind: `presets: [require("./tokens/tailwind.preset.js")]` e usar classes como `bg-surface`, `text-secondary`, `rounded-xl`, `text-body-md`.
4. Sem Tailwind: usar as variáveis diretamente (`var(--color-bg-surface)`).
5. Tema escuro: `document.documentElement.dataset.theme = "dark"`; padrão inicial seguindo `prefers-color-scheme`.
6. Para outras plataformas (iOS, Android, Flutter), gerar a partir de `tokens.json` com Style Dictionary.
7. Alterações de token sempre em `tokens.css` primeiro; depois regenerar o `tokens.json` e atualizar este documento.
