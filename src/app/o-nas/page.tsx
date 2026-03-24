import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "О нас",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-24 text-white/90">
      <Link
        href="/"
        className="mb-8 inline-block text-sm text-amber-400/90 hover:text-amber-300"
      >
        ← На главную
      </Link>
      <h1 className="mb-6 text-3xl font-semibold tracking-tight">О нас</h1>
      <p className="text-white/60">
        Раздел в разработке. Здесь появится информация о редакции OmniNews.
      </p>
    </main>
  );
}
