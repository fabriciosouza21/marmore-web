import { test, expect } from '@playwright/test'

// PNG 1x1 valido em base64: o terminal de sucesso do SSE e base64 cru, o
// handler do frontend nao decodifica (vai direto pro data URL da img).
const PNG_1PX_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg=='

// O backend real (:8080) gasta creditos da OpenAI; o smoke intercepta o
// /images/edit e responde um SSE completo deterministico.
test.beforeEach(async ({ page }) => {
  await page.route('**/images/edit', async (route) => {
    const stream =
      [
        'data:{"fase":"recebido"}',
        'data:{"fase":"redimensionando"}',
        'data:{"fase":"gerando"}',
        'data:{"latency_ms":12345,"custo_brl":0.27}',
        `data:${PNG_1PX_BASE64}`,
      ].join('\n\n') + '\n\n'
    await route.fulfill({
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
      body: stream,
    })
  })
})

test('fluxo token -> upload -> resultado', async ({ page }) => {
  await page.goto('/')

  // guard: sem key salva, cai na tela do token
  await expect(page).toHaveURL(/\/token$/)
  await expect(page.getByText('Acesso à API key')).toBeVisible()

  await page.getByRole('textbox').fill('e2e-key')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/captura$/)

  // inputs nativos ocultos: setInputFiles atua direto no seletor de arquivo
  await page.setInputFiles('input[type="file"]:not([capture])', {
    name: 'foto.png',
    mimeType: 'image/png',
    buffer: Buffer.from(PNG_1PX_BASE64, 'base64'),
  })

  // indicador "Processando" e transitorio com o mock (stream inteiro num tick);
  // sua visibilidade durante a pendencia esta coberta no spec unit da view.
  await expect(page.locator('img')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Baixar' })).toBeVisible()
  await expect(page.getByText('R$ 0,27')).toBeVisible()
  await expect(page.getByText('12,3 s')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Editar outra foto' })).toBeVisible()
})
