# Roadmap: Fluxo de token e captura de foto do ambiente

**PRD:** `docs/prd/2026-07-27-token-captura-foto.md`
**Versão alvo:** `0.1.0`
**Branch:** `feat/0.1.0-token-captura-foto`

---

## Frontend (marmore)

### FE-1 — Fundação: proxy do Vite, store de auth, cliente SSE e modelo de resultado
`feat: adicionar proxy store de auth cliente sse e modelo de resultado`
- Proxy `/images` -> backend (`:8080`) no Vite para o navegador alcançar a API em dev.
- Store Pinia que guarda a API key em `localStorage` com ação de `sair`/limpar.
- Cliente `fetch` + `ReadableStream` para `POST /images/edit` injetando `X-API-Key` e `Accept: text/event-stream`, parseando os três formatos do stream: fase (JSON), done (JSON) e imagem final (base64 cru).
- Schema Zod da API key e tipos do resultado (imagem, custo, latência, erro).

### FE-2 — Tela 1: entrada da API key (TokenView)
`feat: substituir login por tela de api key`
- Substitui a `LoginView` (email/senha) por `TokenView`: campo único com `el-form` + vee-validate + zod.
- Guarda de rota: sem key salva, redireciona para o token; com key, liberada a captura.
- Trata o 401 (key rejeitada) com mensagem e retomada na própria tela.

### FE-3 — Tela 2: captura/upload da foto do ambiente
`feat: adicionar tela de captura/upload da foto`
- Duas opções na mesma tela: `<input type="file" accept="image/*" capture="environment">` (tira foto no mobile, envia no desktop) e botão de envio normal.
- Validação de tipo (JPG/PNG) e tamanho antes do envio; dispara o cliente SSE.
- Feedback das fases `recebido -> redimensionando -> gerando` para o usuário.

### FE-4 — Resultado, custo e tratamento de erros
`feat: exibir resultado custo e erros da edicao`
- Card inline com o PNG resultante, botão de download e exibição de `custo_brl`/`latency_ms` quando presentes.
- Erro de negócio do stream (`{"error": ...}`) e 400/401 fora do stream viram mensagem amigável com ação de retomar.
- Ação "editar outra foto" que reseta o fluxo mantendo a key.

### FE-5 — Polimento UX e testes
`test: cobrir parser sse store e fluxo token-upload`
- Indicador de "ainda processando" durante os pings; estados de loading/empty/error consistentes.
- Vitest do parser SSE e do store de auth; smoke test Playwright do fluxo token -> upload -> resultado.

---

## Documentação

### DOCS-1 — Changelog e versão 0.1.0
`chore: bump versao para 0.1.0 e atualizar readme`
- Atualizar versão no `package.json` para `0.1.0`.
- Atualizar `README.md` com como rodar (proxy, API key) e o fluxo das duas telas.

---

## Ordem dos Entregaveis

| # | Entregavel | Depende de | Status |
|---|-----------|-----------|--------|
| 1 | Fundação: proxy Vite, store de auth, cliente SSE, modelo de resultado | — | [x] |
| 2 | Tela 1: entrada da API key (TokenView) | 1 | [ ] |
| 3 | Tela 2: captura/upload da foto do ambiente | 1 | [ ] |
| 4 | Resultado, custo e tratamento de erros | 3 | [ ] |
| 5 | Polimento UX e testes | 4 | [ ] |
| 6 | Changelog e versão 0.1.0 | 5 | [ ] |
