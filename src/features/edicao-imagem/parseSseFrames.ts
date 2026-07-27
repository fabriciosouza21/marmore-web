export function parseSseFrames(input: string): string[] {
  return [input.slice(5, -2)]
}
