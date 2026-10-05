export const BLOCKS = [
  "bg-block-yellow",
  "bg-block-blue",
  "bg-block-green",
  "bg-block-pink",
  "bg-block-red",
] as const;

export function blockClass(i: number): string {
  return BLOCKS[i % BLOCKS.length] ?? BLOCKS[0];
}
