export function parseSseFrames(input: string): string[] {
  return input
    .split('\n\n')
    .filter((frame) => frame.startsWith('data:'))
    .map((frame) => frame.slice(5))
}
