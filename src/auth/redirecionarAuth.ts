export function redirecionarAuth(autenticado: boolean, path: string): string | undefined {
  if (!autenticado && path !== '/token') return '/token'
  if (autenticado && path === '/token') return '/captura'
}
