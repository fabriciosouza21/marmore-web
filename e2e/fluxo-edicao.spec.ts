import { test, expect, type Request } from '@playwright/test'

// PNG 1x1 valido em base64: o terminal de sucesso do SSE e base64 cru, o
// handler do frontend nao decodifica (vai direto pro data URL da img). Tambem
// serve de amostra para GET /pedras/{id}/imagem.
const PNG_1PX_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg=='

const PNG_1PX = Buffer.from(PNG_1PX_BASE64, 'base64')

const PEDRAS = [
  { id: 'verde_ubatuba', nome: 'Verde Ubatuba', categoria: 'Granitos' },
  { id: 'preto_sao_gabriel', nome: 'Preto São Gabriel', categoria: 'Granitos' },
  { id: 'calacatta', nome: 'Calacatta', categoria: 'Marmores' },
]

// O backend real (:8080) gasta creditos da OpenAI; o smoke intercepta o
// /images/edit e responde um SSE completo deterministico. A CapturaView agora
// tambem consome GET /pedras (catalogo, no mount) e GET /pedras/{id}/imagem
// (amostra, ao selecionar), ambos mockados aqui.
const pedidosEdicao: Request[] = []

test.beforeEach(async ({ page }) => {
  pedidosEdicao.length = 0

  await page.route('**/pedras', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(PEDRAS),
    }),
  )

  await page.route('**/pedras/*/imagem', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG_1PX }),
  )

  await page.route('**/images/edit', async (route) => {
    pedidosEdicao.push(route.request())
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

// O multipart do POST /images/edit tem partes "image" (arquivo) e "pedra"
// (string); extrai o valor de uma parte de texto pelo nome.
async function parteTextoMultipart(request: Request, campo: string): Promise<string> {
  const contentType = request.headers()['content-type'] ?? ''
  const boundary = /boundary=(?:"([^"]+)"|([^;]+))/.exec(contentType)
  if (!boundary) throw new Error(`multipart sem boundary: ${contentType}`)
  const corpo = (request.postDataBuffer() ?? Buffer.alloc(0)).toString('latin1')
  const match = new RegExp(`name="${campo}"\\r\\n\\r\\n([^\\r\\n]*)`).exec(corpo)
  if (!match) throw new Error(`parte "${campo}" ausente no multipart`)
  return match[1]
}

test('fluxo token -> pedra + foto -> resultado', async ({ page }) => {
  await page.goto('/')

  // guard: sem key salva, cai na tela do token
  await expect(page).toHaveURL(/\/token$/)
  await expect(page.getByText('Acesso à API key')).toBeVisible()

  await page.getByRole('textbox').fill('e2e-key')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/captura$/)

  // seletor real do Element Plus: o click de usuario cai no wrapper visivel
  // (o input com role="combobox" e coberto pelo placeholder) e abre o dropdown
  // teleportado ao body; a escolha pela opcao de texto e interacao de verdade.
  await page.locator('.seletor-pedra').click()
  await page.getByRole('option', { name: 'Verde Ubatuba' }).click()

  // selecionar a pedra dispara a busca da amostra
  await expect(page.getByAltText('Amostra da pedra')).toBeVisible()

  // inputs nativos ocultos: setInputFiles atua direto no seletor de arquivo
  await page.setInputFiles('input[type="file"]:not([capture])', {
    name: 'foto.png',
    mimeType: 'image/png',
    buffer: PNG_1PX,
  })

  // o click espera o botao sair de disabled (pedra + foto escolhidas)
  await page.getByRole('button', { name: 'Gerar bancada' }).click()

  // indicador "Processando" e transitorio com o mock (stream inteiro num tick);
  // sua visibilidade durante a pendencia esta coberta no spec unit da view.
  await expect(page.getByAltText('Ambiente editado')).toBeVisible()
  await expect(page.getByRole('link', { name: 'Baixar' })).toBeVisible()
  await expect(page.getByText('R$ 0,27')).toBeVisible()
  await expect(page.getByText('12,3 s')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Editar outra foto' })).toBeVisible()

  // contrato ponta-a-ponta: o multipart enviado carrega a pedra escolhida
  expect(pedidosEdicao).toHaveLength(1)
  expect(await parteTextoMultipart(pedidosEdicao[0], 'pedra')).toBe('verde_ubatuba')
})

// contrato ponta-a-ponta da descricao: o texto digitado na textarea precisa
// atravessar o browser real e chegar como parte "descricao" no multipart do
// POST /images/edit (a view unitaria cobre o nivel de componente, este cobre
// a UI inteira).
test('fluxo com descricao preenchida envia a parte descricao', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/token$/)

  await page.getByRole('textbox').fill('e2e-key')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/captura$/)

  await page.locator('.seletor-pedra').click()
  await page.getByRole('option', { name: 'Verde Ubatuba' }).click()
  await expect(page.getByAltText('Amostra da pedra')).toBeVisible()

  await page.setInputFiles('input[type="file"]:not([capture])', {
    name: 'foto.png',
    mimeType: 'image/png',
    buffer: PNG_1PX,
  })

  const descricao = 'Na mureta, a bancada da pia; acima, um espelho.'
  await page.locator('textarea').fill(descricao)

  await page.getByRole('button', { name: 'Gerar bancada' }).click()
  await expect(page.getByAltText('Ambiente editado')).toBeVisible()

  expect(pedidosEdicao).toHaveLength(1)
  expect(await parteTextoMultipart(pedidosEdicao[0], 'pedra')).toBe('verde_ubatuba')
  expect(await parteTextoMultipart(pedidosEdicao[0], 'descricao')).toBe(descricao)
})

// contrato ponta-a-ponta da regeneracao: partindo de um resultado, o vendedor
// clica "Ajustar e gerar outra versao", muda SOMENTE a pedra e gera de novo
// sem reenviar o arquivo. O segundo POST /images/edit precisa carregar a
// nova pedra; a foto original (ja em memoria) e reenviada pelo proprio app.
test('fluxo de regeneracao troca a pedra sem reenviar a foto', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/token$/)

  await page.getByRole('textbox').fill('e2e-key')
  await page.getByRole('button', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/captura$/)

  await page.locator('.seletor-pedra').click()
  await page.getByRole('option', { name: 'Verde Ubatuba' }).click()
  await expect(page.getByAltText('Amostra da pedra')).toBeVisible()

  await page.setInputFiles('input[type="file"]:not([capture])', {
    name: 'foto.png',
    mimeType: 'image/png',
    buffer: PNG_1PX,
  })

  await page.getByRole('button', { name: 'Gerar bancada' }).click()
  await expect(page.getByAltText('Ambiente editado')).toBeVisible()

  await page.getByRole('button', { name: 'Ajustar e gerar outra versão' }).click()

  await page.locator('.seletor-pedra').click()
  await page.getByRole('option', { name: 'Preto São Gabriel' }).click()
  await expect(page.getByAltText('Amostra da pedra')).toBeVisible()

  await page.getByRole('button', { name: 'Gerar bancada' }).click()
  await expect(page.getByAltText('Ambiente editado')).toBeVisible()

  expect(pedidosEdicao).toHaveLength(2)
  expect(await parteTextoMultipart(pedidosEdicao[0], 'pedra')).toBe('verde_ubatuba')
  expect(await parteTextoMultipart(pedidosEdicao[1], 'pedra')).toBe('preto_sao_gabriel')
})
