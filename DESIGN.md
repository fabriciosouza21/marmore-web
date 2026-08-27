---
version: alpha
name: Mármore
description: Identidade visual do Mármore, editor de fotos de ambientes com pedra aplicada
colors:
  surface-light: '#F6F4F0'
  surface-dark: '#1F2225'
  text-strong: '#2A2D31'
  text-on-dark: '#EDEAE4'
  primary: '#A0512D'
  primary-deep: '#7E3E22'
  danger: '#B3261E'
  on-primary: '#FFFFFF'
typography:
  display:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.2
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif"
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
  code:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace"
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.5
rounded:
  md: 0.5rem
  full: 9999px
spacing:
  sm: 0.5rem
  md: 1rem
  lg: 2rem
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    rounded: '{rounded.md}'
  button-primary-pressed:
    backgroundColor: '{colors.primary-deep}'
    textColor: '{colors.on-primary}'
  card:
    backgroundColor: '{colors.surface-light}'
    textColor: '{colors.text-strong}'
    rounded: '{rounded.md}'
  card-dark:
    backgroundColor: '{colors.surface-dark}'
    textColor: '{colors.text-on-dark}'
    rounded: '{rounded.md}'
  steps:
    textColor: '{colors.primary}'
  alert-error:
    backgroundColor: '{colors.danger}'
    textColor: '{colors.on-primary}'
  field:
    textColor: '{colors.text-strong}'
---

# Mármore

## Overview

O Mármore mostra como a pedra fica no ambiente do cliente: uma foto de balcão ou cozinha, o granito aplicado pela IA, o resultado na hora. A identidade vem do material que o produto vende: superfícies neutras de pedra, texto denso como mineral, e um único accent quente. A interface é mobile first — o uso principal é uma foto tirada no celular — então cada decisão prioriza coluna única, alvos de toque generosos e velocidade de primeiro carregamento.

## Colors

A paleta é um par claro/escuro espelhado com um accent de cobre.

- **Limestone (#F6F4F0):** calcário polido, superfície do tema claro. Mais orgânico que branco puro.
- **Basalto (#1F2225):** pedra vulcânica, superfície do tema escuro.
- **Grafite (#2A2D31):** texto principal sobre Limestone.
- **Cal (#EDEAE4):** texto principal sobre Basalto.
- **Cobre (#A0512D):** os veios metálicos do granito. Único tom quente da paleta e único motor de interação: botões primários, etapa ativa, links. Nunca usado como fundo de texto longo.
- **Cobre-profundidade (#7E3E22):** estado pressionado do Cobre.
- **Ferrugem (#B3261E):** feedback de erro e alertas. Texto sobre Cobre e sobre Ferrugem é sempre Neve (branco), contraste acima de 4.5:1.

## Typography

A tipografia é a System UI Stack do sistema operacional, sem web font de download: o app vive no celular do vendedor de pedra, e o peso do primeiro carregamento importa mais do que uma fonte de marca. A expressividade fica nas cores e na linguagem.

- **Display:** títulos de tela (Acesso à API key, resultado), 24px SemiBold.
- **Body:** texto corrente e instruções, 16px Regular com 1.5 de entrelinha.
- **Label:** rótulos de formulário e metadados (custo, latência), 14px Medium.
- **Code:** eventuais trechos técnicos, mono do sistema.

## Layout

Coluna única limitada a 28rem centralizada nas telas de fluxo; o card de token a 24rem. O ritmo vem da escala de espaçamento `sm` (0.5rem), `md` (1rem) e `lg` (2rem): `md` é o padding mínimo nas bordas para respirar em telas estreitas, `lg` separa a tela do viewport. Nenhuma tela exige scroll horizontal em 360px de largura.

## Components

Os componentes são os do Element Plus amarrados aos tokens; o app não desenha componente do zero.

- **Button Primary:** el-button primary em Cobre com texto Neve, pressionado em Cobre-profundidade; largura total nas telas de fluxo para alvo de toque.
- **Card:** el-card com superfície Limestone (claro) ou Basalto (escuro), cantos 0.5rem; contêiner das telas de token e resultado.
- **Steps:** el-steps simple com a etapa ativa em Cobre; os rótulos Recebido, Redimensionando e Gerando acompanham o SSE.
- **Alerta de erro:** el-alert error em Ferrugem com ação de retomar inline (Tentar novamente); erro nunca vira overlay.
- **Campo de formulário:** el-input em el-form-item, label em Grafite/Cal, mensagem de erro em Ferrugem.

## Do's and Don'ts

- **Faça:** referenciar tokens (`bg-cobre`, `text-grafite`, `var(--color-primary)`) em vez de hex crú em componente.
- **Faça:** mudar a identidade editando este arquivo primeiro, rodar o lint, e reaplicar os tokens no `src/assets/main.css`.
- **Não faça:** introduzir cor fora da paleta (nenhum azul de dashboard genérico).
- **Não faça:** web font de download; a família é a do sistema.
- **Não faça:** usar Cobre como fundo de texto longo ou parágrafo; é cor de ação.
