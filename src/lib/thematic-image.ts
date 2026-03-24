import type { CategoryId } from "@/constants/categories";

/** Семена для Picsum по теме вкладки — когда нет нормального превью из RSS. */
const CAT_SEEDS: Record<CategoryId, string[]> = {
  main:     ["press", "newsdesk", "paper", "media", "headline", "report"],
  world:    ["globe", "earth", "atlas", "horizon", "nations", "oceans"],
  russia:   ["moscow", "taiga", "volga", "steppe", "aurora", "birch"],
  crimea:   ["seaside", "cliff", "harbor", "lighthouse", "coast", "bay"],
  economy:  ["finance", "market", "ledger", "vault", "trade", "chart"],
  science:  ["lab", "orbit", "atom", "genome", "telescope", "circuit"],
  politics: ["forum", "assembly", "capitol", "ballot", "treaty", "summit"],
};

/** Плейсхолдер по заголовку + категории — стабильный URL для одной карточки. */
export function getThematicImg(title: string, category: CategoryId): string {
  const seeds = CAT_SEEDS[category] ?? CAT_SEEDS.main;
  const hash = [...title].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
  const seed = `${seeds[hash % seeds.length]}-omni-${hash.toString(36)}`;
  return `https://picsum.photos/seed/${seed}/800/500`;
}
