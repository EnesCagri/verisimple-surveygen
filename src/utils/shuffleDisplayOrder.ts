/** Fisher–Yates; yalnızca görüntüleme sırası için (orijinal dizi değiştirilmez). */
export function shuffleDisplayOrder<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
