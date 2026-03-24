/** Плейсхолдер только по заголовку — одна и та же новость не «меняет» картинку при смене вкладки. */
export function getThematicImg(title: string): string {
  const hash = [...title].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
  const seed = `omni-${hash.toString(36)}-${(hash & 0xfff).toString(16)}`;
  return `https://picsum.photos/seed/${seed}/800/500`;
}
