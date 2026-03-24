/**
 * Лента и др. отдают в RSS «картинку» с логотипом — грузится успешно, но выглядит как заглушка.
 * В таких случаях сразу показываем тематический плейсхолдер.
 */
export function shouldUseThematicImage(url: string | undefined): boolean {
  if (!url?.trim().startsWith("http")) return true;
  const u = url.toLowerCase();
  if (u.endsWith(".svg")) return true;
  if (u.includes("icdn.lenta.ru/assets/")) return true;
  if (u.includes("icdn.lenta.ru") && /\/logo|og-|sharing|social|promo|default|brand|empty|stub/i.test(u))
    return true;
  if (/placeholder|no-?image|missing|1x1|pixel\.gif/i.test(u)) return true;
  return false;
}
