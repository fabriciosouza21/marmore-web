# Convenções

## Commits

Seguir Conventional Commits, descrição em português sem acentos.

## Versionamento

Seguir Semantic Versioning. Versão no `package.json`, injetada no build via `__APP_VERSION__`
(`define` no `vite.config.ts`) e exibida no rodapé do `App.vue`.

Toda feature nova bumpa a versão (minor; correções de bug usam patch). O bump entra no
próprio merge da feature.

## Branches

`main` é a branch permanente. Toda feature nova inicia em uma branch separada:

- `feature/<nome>`: nova funcionalidade. Origem e destino: `main`.
- `hotfix/<nome>`: correção urgente. Origem e destino: `main`.

Nomes de branch em kebab-case, sem acentos. Verbo no infinitivo descrevendo a entrega.

### Fluxo resumido

```bash
# Nova feature
git checkout main
git checkout -b feature/gerar-imagem-pia-americana

# Ao concluir: bump de versão no package.json, merge de volta para main, deletar a branch
git checkout main
git merge --no-ff feature/gerar-imagem-pia-americana
git branch -d feature/gerar-imagem-pia-americana
```
