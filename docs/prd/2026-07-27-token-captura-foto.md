# PRD: Fluxo de token e captura de foto do ambiente

**Data:** 2026-07-27
**Status:** Draft
**Versão alvo:** 0.1.0

## Problema

O frontend `marmore` é scaffolding puro: uma `LoginView` de email/senha que não conversa com nenhum backend e views de demo (`HomeView`, `AboutView`). A `marmore-api` já expõe `POST /images/edit`, que recebe a foto de um ambiente e devolve, via SSE, uma versão editada com a pedra (granito) aplicada ao Balcão. Falta o frontend que consome esse fluxo de ponta a ponta: informar a API key, capturar ou enviar a foto do ambiente, acompanhar o progresso e ver o resultado.

## Background

Ferramenta de visualização: o usuário fotografa o balcão/cozinha/ambiente, a IA aplica o granito de referência (`data/granito.png`) e devolve a imagem tratada. Autenticação stateless por API key no header `X-API-Key`, não há login de usuário. O resultado vem como stream SSE com fases (`recebido`, `redimensionando`, `gerando`), seguido do PNG final em base64, ou de um erro de negócio dentro do próprio stream. Mesmo falhas de domínio chegam como evento SSE num HTTP 200; só 400 (foto ausente) e 401 (key inválida) saem do stream.

## Requisitos

### Must Have

- **Tela 1, Token (API key):** campo único de entrada da API key, validação de preenchimento, submissão que armazena a chave para as chamadas seguintes. Tratamento explícito do 401 (key inválida).
- **Tela 2, Captura/Upload:** opção de tirar foto (câmera) OU enviar arquivo JPG/PNG. Envio para `POST /images/edit` com `Accept: text/event-stream` e header `X-API-Key`.
- **Progresso SSE:** feedback das fases `recebido -> redimensionando -> gerando` durante a geração.
- **Resultado:** exibição do PNG final com botão de download.
- **Erro de negócio** (`{"error": ...}` no stream): mensagem amigável, sem quebrar a tela.
- **Erros de contrato/auth** (400/401 fora do stream): mensagem clara e ação de retomada.

### Should Have

- Exibir `custo_brl` e `latency_ms` quando retornados.
- Ação de "editar outra foto" (reset do fluxo mantendo a key).
- Indicador de "ainda processando" durante os pings (a geração pode levar dezenas de segundos).

### Out of Scope

- Login de usuário / multiusuário (auth é por API key única).
- Histórico persistente de edições.
- Troca/seleção da pedra de referência (fixa no backend em `marmore.openai.image.stone-path`).
- Ajustes finos do prompt de Balcao (fixo no backend).

## Restrições

- O `X-API-Key` é um header customizado; `EventSource` nativo não serve (não envia headers). O SSE tem que ser lido via `fetch` + `ReadableStream`.
- O evento terminal de sucesso é **base64 cru** (sem envelope JSON), distinto do evento de erro e do evento de fase (ambos JSON). O parser do stream precisa diferenciar os formatos.
- O `capture` nativo do `<input>` só aciona câmera em mobile; em desktop cai para seletor de arquivo.
- O backend roda em `:8080`; o frontend em Vite (`:5173`). Precisa de proxy de dev ou CORS no backend.

## Critérios de Aceitação

### Tela do Token

- Dado usuário sem key salva, quando abre o app, então cai na tela do token.
- Dado key inválida, quando submete, então vê "API key inválida" e permanece na tela.
- Dado key válida, quando submete, então é levado à tela de captura.

### Tela de Captura/Upload

- Dado key válida, quando escolhe/tira uma foto JPG ou PNG, então o envio inicia e vê a fase "recebido".
- Dado envio em andamento, quando chegam eventos de fase, então vê "redimensionando" e "gerando" em sequência.
- Dado geração concluída, quando chega o PNG base64, então vê a imagem resultante e um botão de download.
- Dado falha de negócio no stream, quando chega `{"error": ...}`, então vê mensagem de erro e pode tentar outra foto.
- Dado foto ausente (400), quando o backend rejeita, então vê mensagem e pode reenviar.

## Decisões (gating)

- Persistência da key: `localStorage` com botão "sair/limpar".
- LoginView atual: substituída pela tela de token.
- Mecanismo de câmera: `<input type="file" accept="image/*" capture="environment">` nativo.
- Versão alvo: `0.1.0`.
- Escopo: frontend apenas; backend pronto conforme `openapi.yaml`.
- Resultado: inline na própria tela de captura (app fica em duas telas).
