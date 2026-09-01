import { test, expect, type Page } from '@playwright/test'

// PNG 1x1 valido em base64, mesmo padrao do fluxo-edicao.spec.ts: serve como
// bytes de GET /images/{id}/arquivo.
const PNG_1PX_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg=='

const PNG_1PX = Buffer.from(PNG_1PX_BASE64, 'base64')

// Formato de GET /images, conforme imagemGeradaSchema (todos os campos
// obrigatorios; os de exibicao sao nullable).
const IMAGENS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    criado_em: '2026-09-01T12:00:00.000Z',
    modelo: 'gpt-image-1',
    custo_brl: 0.03,
    latencia_ms: 8214,
    pedra: 'verde_ubatuba',
    nome_pedra: 'Verde Ubatuba',
    produto: 'pia-americana',
    nome_produto: 'Pia americana',
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    criado_em: '2026-09-02T15:30:00.000Z',
    modelo: 'gpt-image-1',
    custo_brl: null,
    latencia_ms: 5000,
    pedra: null,
    nome_pedra: null,
    produto: 'pia-americana',
    nome_produto: 'Pia americana',
  },
]

// O guard do router le useStorage('marmore.apiKey', ''); o useStorage do
// @vueuse/core com default '' usa o serializer "any", que grava strings CRUAS
// (sem aspas de JSON), igual ao entrar() do TokenView. Por isso basta setar o
// valor cru antes do goto para pular a tela de token.
async function autenticar(page: Page): Promise<void> {
  await page.addInitScript(() => localStorage.setItem('marmore.apiKey', 'e2e-key'))
}

test('galeria lista as imagens geradas com pedra, produto e data', async ({ page }) => {
  await page.route('**/images', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(IMAGENS),
    }),
  )
  await page.route('**/images/*/arquivo', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1PX }),
  )
  await autenticar(page)

  await page.goto('/galeria')

  await expect(page).toHaveURL(/\/galeria$/)
  // Na suíte completa (5 projects em paralelo) o primeiro acesso a rota lazy
  // disputa o dev server: timeout folgado so no primeiro assert da tela.
  await expect(page.getByRole('heading', { name: 'Imagens geradas' })).toBeVisible({
    timeout: 15_000,
  })
  // o texto de instrucao so existe depois do carregamento, fora do estado vazio
  await expect(page.getByText('Toque em uma imagem para ampliar.')).toBeVisible()
  await expect(page.getByAltText('Imagem gerada')).toHaveCount(2)
  await expect(page.getByText('Verde Ubatuba')).toBeVisible()
  // 'Pia americana' aparece na legenda dos dois cartoes
  await expect(page.getByText('Pia americana')).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'Gerar nova bancada' })).toBeVisible()
})

test('galeria vazia orienta gerar a primeira bancada', async ({ page }) => {
  await page.route('**/images', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  // o clique leva a /captura, que consome /pedras no mount
  await page.route('**/pedras', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await autenticar(page)

  await page.goto('/galeria')

  await expect(page.getByText('Nenhuma imagem gerada ainda.')).toBeVisible({ timeout: 15_000 })
  await page.getByRole('button', { name: 'Gerar primeira bancada' }).click()
  await expect(page).toHaveURL(/\/captura$/)
})

test('captura leva para a galeria', async ({ page }) => {
  await page.route('**/pedras', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await page.route('**/images', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
  )
  await autenticar(page)

  await page.goto('/captura')

  await page.getByRole('button', { name: 'Ver imagens geradas' }).click()
  await expect(page).toHaveURL(/\/galeria$/)
  await expect(page.getByRole('heading', { name: 'Imagens geradas' })).toBeVisible({
    timeout: 15_000,
  })
  await expect(page.getByText('Nenhuma imagem gerada ainda.')).toBeVisible()
})
