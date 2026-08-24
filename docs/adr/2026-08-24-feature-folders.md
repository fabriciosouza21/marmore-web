# ADR-001: Organizar `src/` por feature folders

## Status

Aceita (2026-08-24)

## Contexto

Esta decisão adapta para o frontend o [RFC09: Feature Folders vs Feature Modules](https://app.notion.com/p/RFC09-FEATURE-FOLDERS-VS-FEATURE-MODULES-31d1f5df611b80a99168db020d56ab0d), escrito para o backend NestJS. Lá, a escolha foi organizar Domain Modules (`@identity`, `@billing`) em pastas por feature de negócio, sem boundaries técnicos entre elas, mantendo um módulo NestJS único.

O problema aqui é análogo: como organizar `src/` do marmore à medida que features novas chegam (auth, edição de imagem, captura, catálogo). Sem decisão explícita, a tendência natural é cair em pastas por tipo técnico (`views/`, `stores/`, `services/`, `api/`), o que espalha um único conceito de negócio por várias pastas e esconde os domínios atrás de camadas.

Três fatos do contexto frontend mudam a forma da discussão em relação ao backend:

1. **A unidade de deploy é o app, nunca a feature.** No backend, o package era a unidade de deploy; aqui, é o bundle da SPA (ou, no limite, um chunk de rota lazy). Features sempre "deployam juntas", então boundaries fortes entre elas não têm retorno em deploy.
2. **O Vue/Pinia não tem mecanismo nativo de boundary por feature.** Stores Pinia são globais por natureza, acessíveis de qualquer lugar pelo id. O equivalente funcional de boundary técnico seria API pública via barrel (`index.ts`) reforçada por regra de lint, uma convenção construída à mão.
3. **O código já pratica essa decisão.** `src/auth/` e `src/edicao-imagem/` já são feature folders, com camadas internas (`api/`, `domain/`), testes co-localizados em `__tests__/` espelhando a estrutura, e o roteador central importando as views. Esta ADR formaliza o padrão para que features novas o sigam.

## Decisão

`src/` é organizado em **pastas por feature de negócio**, sem boundaries técnicos entre elas. Imports entre arquivos de features diferentes são permitidos e controlados apenas por code review.

Template:

```
src/
├── <feature>/                  # ex: auth/, edicao-imagem/, captura/
├── components/                 # UI genérica, sem vínculo com feature
├── router/index.ts             # composition root: importa views das features
└── assets/
```

### Template padrão de feature

Tradução do template do RFC09 (`core/`, `persistence/`, `http/`) para as boas práticas de frontend Vue. Camadas marcadas como opcionais surgem quando a feature cresce, não antes:

```
<feature>/                          # ex: auth/, edicao-imagem/, captura/
│
├── <Feature>View.vue               # interface externa: view da rota
├── <feature>Store.ts               # estado da feature (Pinia)
│
├── domain/                         # lógica de negócio (pura: sem DOM, sem rede)
│   ├── types.ts                    # tipos e schemas zod
│   ├── errors.ts                   # erros específicos da feature (opcional)
│   └── <regra>.ts                  # funções e regras puras, nomeadas pelo negócio (opcional)
│
├── api/                            # camada de dados: acesso ao backend
│   ├── <operacao>.ts               # chamadas HTTP (ex: editarImagem.ts)
│   └── <stream>.ts                 # streams SSE (ex: parsearFramesSse.ts)
│
├── components/                     # componentes específicos da feature (opcional)
├── composables/                    # composables de UI da feature (opcional)
├── storage/                        # persistência local, se crescer (opcional)
│
└── __tests__/                      # testes co-localizados, espelhando a estrutura
```

### Mapeamento das camadas do RFC09

| RFC09 (backend) | marmore (frontend) | Papel |
| --- | --- | --- |
| `core/service/` | `domain/` + `composables/` | Lógica de negócio pura em `domain/`; lógica reativa de apresentação em `composables/` |
| `core/interface/`, `core/enum/` | `domain/types.ts` | Contratos. Schemas zod validam na fronteira e inferem os tipos |
| `core/exception/` | `domain/errors.ts` | Erros específicos da feature |
| `persistence/entity/` + `repository/` | `api/` (+ `storage/`) | A fonte de verdade é o backend; o cliente HTTP é o repository do frontend. Persistência local pequena mora na store (`useStorage`), vira pasta `storage/` com `idb-keyval` quando crescer |
| `http/rest/controller/` + `dto/` | `<Feature>View.vue` + `components/` | A interface externa da feature. No backend a feature expõe endpoints; no frontend, expõe UI |
| (não existe) | `<feature>Store.ts` | Estado reativo compartilhado, concern exclusivo do frontend |

### Regras de ouro

- A feature começa **flat** (como `auth/` hoje); as camadas internas do template surgem quando a feature cresce, não antes. O template completo é o estado de maturidade, não o ponto de partida.
- **Dependência unidirecional**: `view → components → store/composables → api → domain`. `domain/` é a camada mais interna: não importa nada da feature e é testável sem DOM nem rede. View não contém lógica de negócio.
- **Validação na fronteira**: inputs de formulário são validados com os schemas zod de `domain/` (vee-validate + zod); o código interno confia nos tipos.
- **O formato da API não vaza para a UI**: `api/` mapeia respostas e streams para tipos de `domain/` (ex: `parsearFramesSse`).
- O `router/index.ts` central é o único ponto que conhece todas as features. Views são importadas direto da pasta da feature.
- `components/` na raiz é reservado para UI genuinamente genérica (ex: `ThemeToggle.vue`). Componente que serve a uma feature mora na feature.
- **Nomenclatura bilíngue por natureza do termo**: negócio em português, técnica em inglês.
  - **Negócio (português)**: nomes de feature e conceitos do produto no vocabulário do domínio (`edicao-imagem/`, `captura/`, `editarImagem`, `despacharFrame`, `EdicaoFalhouError`), seguindo a linguagem ubíqua.
  - **Técnica (inglês)**: camadas e artefatos técnicos (`domain/`, `api/`, `components/`, `composables/`, `storage/`, `types.ts`, `errors.ts`, `authStore.ts`, `useToken.ts`, `tokenSchema.ts`, `TokenView.vue`). Termos técnicos consagrados podem nomear features (`auth/`).

## Alternativas consideradas

### Pastas por camada técnica (`views/`, `stores/`, `services/`)

Estrutura tradicional de scaffold Vue. Rejeitada pelo mesmo motivo do RFC09: para entender "edição de imagem" seria necessário navegar entre `views/`, `stores/`, `services/` e `api/`. A estrutura esconde os conceitos de negócio.

### Features com API pública (barrel + lint boundaries)

O análogo frontend da Opção B do RFC09: cada feature expõe um `index.ts` e uma regra de lint (eslint-plugin-boundaries ou `import/no-restricted-paths`) proíbe importar arquivos internos de outra feature. Rejeitada porque:

- A unidade de deploy é o app; boundaries entre features não se convertem em deploy separado, só em fricção.
- O Pinia fura o boundary por design: uma store é acessível de qualquer componente pelo id, então o isolamento seria parcial de qualquer forma.
- Barrels adicionam indireção e atrapalham tree-shaking.
- O projeto usa oxlint, que hoje não tem equivalente maduro ao eslint-plugin-boundaries; impor essa alternativa exigiria trocar ou adjuntar ferramenta de lint para obter um enforcement que o contexto não pede.
- Time único mantendo o app inteiro: o custo de configuração e da curva de aprendizado não retorna em isolamento real.

### Comparação

| Aspecto | Feature folders (escolhida) | Barrel + lint boundaries |
| --- | --- | --- |
| Boundary entre features | Nenhum (code review) | Via lint, parcial (Pinia escapa) |
| Custo de manutenção | Baixo | Barrel por feature + config de lint |
| Tree-shaking / HMR | Neutro | Barrels pioram |
| Imposição por ferramenta | Não, depende de disciplina | Sim, parcialmente |
| Adequada para | Time único, deploy único | Times múltiplos, features com donos distintos |

## Consequências

**Positivas:**

- Todo o código de um conceito de negócio em um lugar; a estrutura de pastas comunica os domínios do produto.
- Onboarding rápido: basta ler `src/` para saber o que o app faz.
- Preparado para code splitting por rota: cada feature folder vira naturalmente um chunk lazy quando fizer sentido.
- Baixa fricção: refatorar código entre camadas internas da feature não toca outras features.

**Negativas:**

- Sem enforcement técnico: nada impede que um componente da feature A importe internals da feature B. Dependemos de disciplina e review.
- Um import cíclico entre features ou um "compartilhamento conveniente" pode criar acoplamento silencioso. Mitigação: código compartilhado entre features deve subir para `components/` ou virar feature própria quando recorrente.

## Quando reavaliar

- Mais de um time mantendo o frontend, com features de donos distintos que não coordenam.
- Necessidade de imposição técnica de boundaries por requisito não funcional (compliance, auditoria).
- Se isso ocorrer, o caminho é barrel + lint boundaries; a estrutura de pastas por feature permanece a mesma, então a migração é incremental.

## Referências

- [RFC09: Feature Folders vs Feature Modules (backend, NestJS)](https://app.notion.com/p/RFC09-FEATURE-FOLDERS-VS-FEATURE-MODULES-31d1f5df611b80a99168db020d56ab0d)
- Evidência no código: `src/auth/`, `src/edicao-imagem/`
- [Screaming Architecture, Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2011/09/30/Screaming-Architecture.html)
- [Package by Feature, not Layer, Philipp Hauer](https://phauer.com/2020/package-by-feature/)
