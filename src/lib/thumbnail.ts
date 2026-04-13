/**
 * Не показываем превью с CDN Ленты (часто логотип/бренд). Остальное — эвристики заглушек.
 */
export function shouldUseThematicImage(url: string | undefined): boolean {
  if (!url?.trim().startsWith("http")) return true;
  const u = url.toLowerCase();
  if (u.includes("lenta.ru") || u.includes("icdn.lenta.ru")) return true;
  if (u.endsWith(".svg")) return true;
  if (/placeholder|no-?image|missing|1x1|pixel\.gif/i.test(u)) return true;
  return false;
}
