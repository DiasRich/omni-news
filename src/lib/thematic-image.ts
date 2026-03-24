import type { CategoryId } from "@/constants/categories";

const CAT_SEEDS: Record<CategoryId, string[]> = {
  main:     ["press", "city", "news", "media", "office", "print"],
  world:    ["globe", "travel", "flag", "earth", "international", "map"],
  russia:   ["moscow", "snow", "forest", "russia", "winter", "kremlin"],
  crimea:   ["sea", "coast", "harbor", "beach", "sunset", "cliff"],
  economy:  ["finance", "money", "market", "chart", "bank", "trade"],
  science:  ["tech", "lab", "space", "robot", "science", "computer"],
  politics: ["parliament", "vote", "government", "meeting", "politics", "flag"],
};

export function getThematicImg(title: string, cat: CategoryId): string {
  const seeds = CAT_SEEDS[cat] ?? CAT_SEEDS.main;
  const hash  = [...title].reduce((a, c) => (a * 31 + c.charCodeAt(0)) & 0xFFFFF, 0);
  const seed  = seeds[hash % seeds.length] + (hash & 0xFFF).toString();
  return `https://picsum.photos/seed/${seed}/800/500`;
}
