export function parseSseFrames(input: string): { frames: string[]; restante: string } {
  const partes = input.split('\n\n')
  const restante = partes.pop() ?? ''

  const frames = partes.filter((frame) => frame.startsWith('data:')).map((frame) => frame.slice(5))

  return { frames, restante }
}
