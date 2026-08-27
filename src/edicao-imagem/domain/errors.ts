export class EdicaoFalhouError extends Error {
  constructor(
    mensagem: string,
    readonly latencyMs: number,
  ) {
    super(mensagem)
    this.name = 'EdicaoFalhouError'
  }
}

export class HttpError extends Error {
  constructor(readonly status: number) {
    super(`HTTP ${status}`)
    this.name = 'HttpError'
  }
}
