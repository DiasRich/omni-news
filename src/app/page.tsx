"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { NewsCard } from "@/components/NewsCard";
import { VideoPreloader } from "@/components/VideoPreloader";
import { CATEGORIES, type CategoryId } from "@/constants/categories";
import { isCleanNewsText } from "@/lib/content-filter";
import { GOLD, LOGO_SRC } from "@/constants/site";
import type { AuthUser, CryptoPrices, NewsItem } from "@/types/news";

const PAGE_SIZE       = 10;
const CACHE_TTL_MS    = 3 * 60 * 1000;
const AUTO_REFRESH_MS = 5 * 60 * 1000;

const categoryCache = new Map<string, { items: NewsItem[]; ts: number }>();

// ─────────────────────────────── Feeds ───────────────────────────────────────
const FEEDS: Record<CategoryId, string[]> = {
  main:     [
    "https://lenta.ru/rss/news",
    "https://ria.ru/export/rss2/index.xml",
    "https://www.kommersant.ru/RSS/news.xml",
    "https://www.interfax.ru/rss.asp",
    "https://tass.ru/rss/v2.xml",
  ],
  world:    [
    "https://lenta.ru/rss/news/world",
    "https://ria.ru/export/rss2/world/index.xml",
    "https://www.kommersant.ru/RSS/world.xml",
    "https://rg.ru/xml/index.xml",
  ],
  russia:   [
    "https://lenta.ru/rss/news/russia",
    "https://ria.ru/export/rss2/russia/index.xml",
    "https://www.kommersant.ru/RSS/russia.xml",
    "https://rg.ru/xml/index.xml",
  ],
  crimea:   [
    "https://crimea.ria.ru/export/rss2/index.xml",
    "https://lenta.ru/rss/news/russia",
    "https://ria.ru/export/rss2/russia/index.xml",
    "https://www.kommersant.ru/RSS/russia.xml",
  ],
  economy:  [
    "https://lenta.ru/rss/news/economy",
    "https://ria.ru/export/rss2/economy/index.xml",
    "https://www.kommersant.ru/RSS/economics.xml",
    "https://www.vedomosti.ru/rss/rubric/economics",
    "https://www.gazeta.ru/export/rss/business.xml",
  ],
  science:  [
    "https://lenta.ru/rss/news/science",
    "https://ria.ru/export/rss2/science/index.xml",
    "https://www.kommersant.ru/RSS/science.xml",
    "https://www.gazeta.ru/export/rss/science.xml",
  ],
  politics: [
    "https://lenta.ru/rss/news/politics",
    "https://ria.ru/export/rss2/politics/index.xml",
    "https://www.kommersant.ru/RSS/politics.xml",
    "https://www.gazeta.ru/export/rss/politics.xml",
  ],
};

const GENERAL_FEEDS = [
  "https://lenta.ru/rss/news",
  "https://ria.ru/export/rss2/index.xml",
  "https://www.interfax.ru/rss.asp",
];

/** null = «главная»: без ключевых слов, только общие ленты. Иначе статья попадает в категорию только при совпадении с темой. */
const CATEGORY_KEYWORDS: Record<CategoryId, string[] | null> = {
  main: null,
  world: [
    "миров", "международн", "зарубеж", "иностранн", "глобальн",
    "оон", "нато", "ес ", "ес,", "евросоюз", "европ", "ази", "африк", "америк",
    "сша", "украин", "киев", "китай", "пекин", "япон", "герман", "франц", "британ",
    "ирак", "иран", "израил", "палестин", "сирия", "афган", "коре", "индия",
    "латинск", "ближневосточн", "африканск",
    "дипломат", "посол", "переговор", "саммит", "g7", "g20",
    "мид ", "мид,", "генассамбле", "совбез",
  ],
  russia: [
    "россия", "россии", "россий", "российск", "рф ", "рф,", "рф.", "москв", "петербург", "спб",
    "кремль", "госдум", "совфед", "федерац", "президент росси", "путин",
    "област", "край ", "республик", "губернатор", "мэр ",
    "урал", "сибир", "дальневосточн", "поволж", "кавказ", "ростов", "казань",
    "минобороны", "минздрав", "правительств росси", "фсб ", "сво ", "донбасс",
  ],
  crimea: [
    "крым", "симферополь", "севастополь", "ялт", "керч", "евпатор", "феодоси",
    "байдарск", "алушт", "крымск", "черноморск", "крымскотатар", "бахчисарай", "армянск",
  ],
  economy: [
    "экономик", "финанс", "банк", "банковск", "рубл", "доллар", "евро", "валют",
    "инфляц", "цб ", "цб,", "центробанк", "ключев", "ставка", "стагфляц", "рецесс",
    "бирж", "акци", "облигац", "инвест", "капитал", "прибыл", "убытк",
    "нефт", "газ", "экспорт", "импорт", "санкци", "таможн", "налог", "бюджет",
    "ввп", "валов", "компани", "рынок", "мосбирж", "ртс", "втб", "сбер",
    "торговл", "контракт", "закупк", "логистик", "ipo",
  ],
  science: [
    "наук", "учен", "исследован", "открыти", "технолог", "изобретен",
    "космос", "роскосмос", "спутник", "мкс", "nasa",
    "космодром", "ракетостро", "телескоп", "астроном", "марс", "лун",
    "робот", "ии ", "ии,", "искусственн интеллект", "нейросет",
    "квант", "физик", "хими", "биолог", "ген ", "днк ",
    "медицин", "здоров", "вакцин", "лечен", "врач", "клиник", "больниц",
    "университет", "институт", "лабор", "эксперимент",
    "климат", "эколог", "энергетик", "атомн", "ядерн", "космическ",
  ],
  politics: [
    "политик", "госдум", "совфед", "депутат", "парламент", "партия",
    "выбор", "кампани", "голосован", "оппозиц", "правительств", "министр",
    "президент", "закон ", "законопроект", "указ ", "реформ",
    "кремль", "администрац президента", "силовик",
    "геополит", "дипломат", "мид ",
    "беспилотник", "пво ", "пво,", "военн", "арми", "оборон", "нато ", "нато,",
  ],
};

/** Военные темы не попадают в «Науку» и «Экономику», даже при случайном совпадении слова. */
const CATEGORY_EXCLUDE: Partial<Record<CategoryId, string[]>> = {
  science: [
    "беспилотник", "бпла", "дрон", "дронов",
    "артиллер", "миномет", "рсзо", "фронт", "наступлен", "контрнаступ",
    "всу ", "всу,", "сво ", "сво,", "сво.",
    "специальн военн", "военн операц", "военнослужащ",
    "украинск арм", "российск войск", "оккупацион",
    "ракетн удар", "ракетн обстрел", "ракетами по", "крылатых ракет",
    "херсон", "запорож", "донецк", "луганск", "одесс", "николаев",
    "мобилизован", "частичн мобилизац",
  ],
  economy: [
    "беспилотник", "бпла", "дрон", "артиллер", "всу ", "специальн военн",
    "наступлен", "фронт", "ракетн удар", "ракетн обстрел",
  ],
};

// ─────────────────────────────── Utilities ────────────────────────────────────
function matchesAny(item: NewsItem, kws: string[]): boolean {
  const text = `${item.title} ${item.description}`.toLowerCase();
  return kws.some((k) => text.includes(k));
}

function categoryAcceptsItem(item: NewsItem, cat: CategoryId): boolean {
  const kws = CATEGORY_KEYWORDS[cat];
  if (kws === null) return true;
  if (!matchesAny(item, kws)) return false;
  const ex = CATEGORY_EXCLUDE[cat];
  if (ex && matchesAny(item, ex)) return false;
  return true;
}
function isCleanItem(item: Pick<NewsItem, "title" | "description">): boolean {
  return isCleanNewsText(item.title, item.description);
}
function dedupe(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  return items.filter(({ title }) => title && !seen.has(title) && seen.add(title));
}

function hostOf(it: NewsItem): string {
  try {
    return new URL(it.link).hostname.replace(/^www\./, "");
  } catch {
    return "unknown";
  }
}

/** Чередование доменов, чтобы не доминировала одна лента. */
function diversifyByDomain(items: NewsItem[]): NewsItem[] {
  if (items.length < 4) return items;
  const sorted = [...items].sort(
    (a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
  );
  const buckets = new Map<string, NewsItem[]>();
  for (const it of sorted) {
    const h = hostOf(it);
    if (!buckets.has(h)) buckets.set(h, []);
    buckets.get(h)!.push(it);
  }
  const hosts = [...buckets.keys()].sort(
    (a, b) => buckets.get(b)!.length - buckets.get(a)!.length
  );
  const out: NewsItem[] = [];
  const pos = new Map<string, number>(hosts.map((h) => [h, 0]));
  let added = true;
  while (added) {
    added = false;
    for (const h of hosts) {
      const b = buckets.get(h)!;
      const i = pos.get(h)!;
      if (i < b.length) {
        out.push(b[i]);
        pos.set(h, i + 1);
        added = true;
      }
    }
  }
  return out;
}

// ─────────────────────────────── Fetch layer ─────────────────────────────────
async function fetchFeed(url: string): Promise<NewsItem[]> {
  try {
    const res = await fetch(`/api/feed?url=${encodeURIComponent(url)}`, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    if (!Array.isArray(json.items)) return [];
    return (json.items as NewsItem[]).filter((it) => isCleanItem(it));
  } catch {
    return [];
  }
}

async function fetchCategory(cat: CategoryId): Promise<NewsItem[]> {
  const kws = CATEGORY_KEYWORDS[cat];
  const results = await Promise.allSettled(FEEDS[cat].map((u) => fetchFeed(u)));
  const collected: NewsItem[] = [];

  results.forEach((r) => {
    if (r.status !== "fulfilled") return;
    r.value.forEach((item) => {
      if (!isCleanItem(item)) return;
      if (kws === null) {
        collected.push(item);
        return;
      }
      if (categoryAcceptsItem(item, cat)) collected.push(item);
    });
  });

  let pool = dedupe(collected);

  if (pool.length < 12 && kws) {
    const genRes = await Promise.allSettled(GENERAL_FEEDS.map((u) => fetchFeed(u)));
    genRes.forEach((r) => {
      if (r.status !== "fulfilled") return;
      r.value.forEach((item) => {
        if (!isCleanItem(item)) return;
        if (categoryAcceptsItem(item, cat)) collected.push(item);
      });
    });
    pool = dedupe(collected);
  }

  return diversifyByDomain(pool);
}

// ─────────────────────────────── UI: Skeleton ────────────────────────────────
function SkeletonCard({ featured }: { featured?: boolean }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden animate-pulse ${featured ? "sm:col-span-2 lg:row-span-2" : ""}`}
      style={{ background: "rgba(24,20,14,0.8)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div style={{ height: featured ? "clamp(220px,26vw,340px)" : 168, background: "rgba(255,255,255,0.04)" }} />
      <div className="p-4 flex flex-col gap-3">
        <div className="h-2 w-16 rounded bg-white/10" />
        <div className="h-3 w-full rounded bg-white/8" />
        <div className="h-3 w-4/5 rounded bg-white/6" />
        <div className="h-2 w-20 rounded bg-white/5 mt-1" />
      </div>
    </div>
  );
}

// ─────────────────────────────── UI: LoadMore ────────────────────────────────
function LoadMoreButton({ onClick, busy }: { onClick: () => void; busy: boolean }) {
  return (
    <div className="flex justify-center mt-12 mb-4">
      <button
        onClick={onClick}
        disabled={busy}
        className="px-12 py-3.5 rounded-full text-[11px] font-black tracking-[0.3em] disabled:cursor-not-allowed"
        style={{
          background: busy ? "rgba(212,175,55,0.12)" : GOLD,
          color:      busy ? GOLD : "#080600",
          border:     `1.5px solid ${GOLD}`,
          transition: "background 250ms, box-shadow 250ms, transform 200ms",
        }}
        onMouseEnter={(e) => {
          if (!busy) {
            const el = e.currentTarget as HTMLButtonElement;
            el.style.boxShadow = "0 0 32px rgba(212,175,55,0.45)";
            el.style.transform = "scale(1.03)";
          }
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLButtonElement;
          el.style.boxShadow = "none";
          el.style.transform = "scale(1)";
        }}
      >
        {busy ? (
          <span className="flex items-center gap-2.5">
            <span className="w-3 h-3 rounded-full border-[1.5px] border-transparent animate-spin" style={{ borderTopColor: GOLD }} />
            ЗАГРУЗКА…
          </span>
        ) : "ЗАГРУЗИТЬ ЕЩЁ"}
      </button>
    </div>
  );
}

// ─────────────────────────────── UI: AuthModal ───────────────────────────────
type AuthStep = "email" | "code" | "done";
type AuthMode = "login" | "register";

function AuthModal({ onClose, onLogin }: { onClose: () => void; onLogin: (u: AuthUser) => void }) {
  const [step, setStep]             = useState<AuthStep>("email");
  const [authMode, setAuthMode]     = useState<AuthMode>("login");
  const [flowIntent, setFlowIntent] = useState<AuthMode>("login");
  const [email, setEmail]           = useState("");
  const [digits, setDigits]         = useState<string[]>(Array(6).fill(""));
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [timer, setTimer]           = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend countdown
  useEffect(() => {
    if (timer <= 0) return;
    const id = setTimeout(() => setTimer((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timer]);

  const sendCode = useCallback(async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      setError("Введите корректный email");
      return;
    }
    setLoading(true);
    setError("");
    const intentForApi = step === "code" ? flowIntent : authMode;
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, intent: intentForApi }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      if (step === "email") setFlowIntent(authMode);
      setStep("code");
      setTimer(60);
      setDigits(Array(6).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 80);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось отправить код");
    } finally {
      setLoading(false);
    }
  }, [email, authMode, step, flowIntent]);

  const verifyCode = useCallback(async (code: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setStep("done");
      onLogin({ email: d.email });
      setTimeout(onClose, 1400);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Неверный код");
      setDigits(Array(6).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 80);
    } finally {
      setLoading(false);
    }
  }, [email, onLogin, onClose]);

  const handleDigit = (idx: number, val: string) => {
    const only = val.replace(/\D/g, "");
    if (only.length > 1) {
      const six = only.slice(0, 6);
      const arr = six.split("").concat(Array(6 - six.length).fill(""));
      setDigits(arr);
      if (six.length === 6 && !loading) verifyCode(six);
      else inputRefs.current[Math.min(six.length, 5)]?.focus();
      return;
    }
    if (!/^\d?$/.test(only)) return;
    const next = [...digits];
    next[idx] = only;
    setDigits(next);
    if (only && idx < 5) inputRefs.current[idx + 1]?.focus();
    if (next.every((d) => d !== "") && !loading) verifyCode(next.join(""));
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      const next = [...digits];
      next[idx - 1] = "";
      setDigits(next);
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const raw = e.clipboardData.getData("text/plain").replace(/\D/g, "").slice(0, 6);
    if (raw.length !== 6) return;
    setDigits(raw.split(""));
    inputRefs.current[5]?.focus();
    if (!loading) verifyCode(raw);
  };

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(24px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-[380px] rounded-2xl p-8"
        style={{
          background: "#0a0806",
          border:     "1px solid rgba(212,175,55,0.22)",
          boxShadow:  "0 32px 80px rgba(0,0,0,0.85)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-9">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={LOGO_SRC}
            alt="OmniNews"
            style={{ width: 32, height: 32, borderRadius: "50%", border: `1.5px solid ${GOLD}`, objectFit: "cover" }}
          />
          <span style={{ color: GOLD, fontWeight: 700, fontSize: 15, letterSpacing: "0.12em", fontFamily: "Inter, sans-serif" }}>
            OmniNews
          </span>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[13px] transition-colors"
          style={{ color: "rgba(255,255,255,0.28)", background: "rgba(255,255,255,0.04)" }}
        >
          ✕
        </button>

        {/* ── Step: email (вход / регистрация) ── */}
        {step === "email" && (
          <>
            <h2 className="text-white text-[20px] font-bold mb-3" style={{ fontFamily: "Inter, sans-serif" }}>
              {authMode === "login" ? "Вход" : "Регистрация"}
            </h2>
            <p className="text-[13px] mb-7 leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>
              {authMode === "login" ? (
                <>
                  Нет аккаунта?{" "}
                  <button
                    type="button"
                    onClick={() => { setAuthMode("register"); setError(""); }}
                    className="underline underline-offset-[3px] transition-opacity hover:opacity-90"
                    style={{ color: GOLD, fontWeight: 600 }}
                  >
                    Зарегистрироваться
                  </button>
                </>
              ) : (
                <>
                  Уже есть аккаунт?{" "}
                  <button
                    type="button"
                    onClick={() => { setAuthMode("login"); setError(""); }}
                    className="underline underline-offset-[3px] transition-opacity hover:opacity-90"
                    style={{ color: GOLD, fontWeight: 600 }}
                  >
                    Войти
                  </button>
                </>
              )}
            </p>

            <label className="block text-[10px] tracking-[0.22em] mb-2" style={{ color: "rgba(212,175,55,0.55)" }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              autoFocus
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              onKeyDown={(e) => e.key === "Enter" && sendCode()}
              placeholder="name@example.com"
              className="w-full h-11 rounded-xl px-4 text-[14px] text-white placeholder-white/20 outline-none mb-5"
              style={{
                background:   "rgba(255,255,255,0.05)",
                border:       "1px solid rgba(255,255,255,0.1)",
                fontFamily:   "Inter, sans-serif",
                transition:   "border-color 200ms",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.5)")}
              onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />

            {error && (
              <p className="text-[12px] mb-4" style={{ color: "#f87171" }}>{error}</p>
            )}

            <button
              onClick={sendCode}
              disabled={loading}
              className="w-full h-11 rounded-xl text-[11px] font-black tracking-[0.18em] transition-all"
              style={{
                background: loading ? "rgba(212,175,55,0.12)" : GOLD,
                color:      loading ? GOLD : "#080600",
                border:     `1px solid ${GOLD}`,
              }}
            >
              {loading
                ? "ОТПРАВЛЯЕМ…"
                : authMode === "login"
                  ? "ПОЛУЧИТЬ КОД ДЛЯ ВХОДА →"
                  : "ОТПРАВИТЬ КОД НА ПОЧТУ →"}
            </button>
          </>
        )}

        {/* ── Step: code (6 равных ячеек, сетка) ── */}
        {step === "code" && (
          <>
            <h2 className="text-white text-[20px] font-bold mb-1.5" style={{ fontFamily: "Inter, sans-serif" }}>
              Введите код из письма
            </h2>
            <p className="text-[13px] mb-6 break-all" style={{ color: "rgba(255,255,255,0.32)" }}>
              Отправили на{" "}
              <span style={{ color: "rgba(212,175,55,0.85)" }}>{email}</span>
            </p>

            <div
              className="mb-5 w-full"
              onPaste={handleCodePaste}
              role="group"
              aria-label="Код из 6 цифр"
            >
              <div
                className="grid w-full gap-2"
                style={{ gridTemplateColumns: "repeat(6, minmax(0, 1fr))" }}
              >
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    value={d}
                    onChange={(e) => handleDigit(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    maxLength={6}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    disabled={loading}
                    className="box-border h-11 w-full min-w-0 rounded-lg text-center text-lg font-bold tabular-nums outline-none sm:h-[52px] sm:rounded-xl sm:text-2xl"
                    style={{
                      background:  "rgba(255,255,255,0.04)",
                      border:      `1.5px solid ${d ? GOLD : "rgba(255,255,255,0.12)"}`,
                      color:       d ? GOLD : "rgba(255,255,255,0.35)",
                      fontFamily:  "ui-monospace, SFMono-Regular, Menlo, monospace",
                      transition:  "border-color 150ms, color 150ms",
                    }}
                    onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.65)")}
                    onBlur={(e)  => (e.target.style.borderColor = digits[i] ? GOLD : "rgba(255,255,255,0.12)")}
                  />
                ))}
              </div>
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <span className="w-3.5 h-3.5 rounded-full border-[1.5px] border-transparent animate-spin" style={{ borderTopColor: GOLD }} />
                <span className="text-[12px]" style={{ color: "rgba(212,175,55,0.6)" }}>Проверяем…</span>
              </div>
            )}

            {error && (
              <p className="text-[12px] mb-4 text-center" style={{ color: "#f87171" }}>{error}</p>
            )}

            <div className="text-center mb-4">
              {timer > 0 ? (
                <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                  Повторный код через {timer} с
                </span>
              ) : (
                <button
                  onClick={() => { setDigits(Array(6).fill("")); sendCode(); }}
                  className="text-[11px] underline"
                  style={{ color: "rgba(212,175,55,0.55)" }}
                >
                  Отправить код повторно
                </button>
              )}
            </div>

            <button
              onClick={() => { setStep("email"); setError(""); setDigits(Array(6).fill("")); }}
              className="w-full text-center text-[11px]"
              style={{ color: "rgba(255,255,255,0.22)" }}
            >
              ← Изменить email
            </button>
          </>
        )}

        {/* ── Step: done ── */}
        {step === "done" && (
          <div className="text-center py-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(212,175,55,0.12)", border: `1.5px solid ${GOLD}` }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" className="w-8 h-8">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-white text-[20px] font-bold mb-2" style={{ fontFamily: "Inter, sans-serif" }}>
              {flowIntent === "register" ? "Регистрация завершена" : "С возвращением!"}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>{email}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────── Page ────────────────────────────────────────
export default function Page() {
  const [preloaderDone, setPreloaderDone]   = useState(false);
  const [activeCategory, setActiveCategory] = useState<CategoryId>("main");
  const [news, setNews]             = useState<NewsItem[]>([]);
  const [loading, setLoading]       = useState(false);
  const [busy, setBusy]             = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [poolLen, setPoolLen]           = useState(0);
  const [query, setQuery]           = useState("");
  const [prices, setPrices]         = useState<CryptoPrices | null>(null);
  const [freshCount, setFreshCount] = useState(0);

  // ── Auth state ─────────────────────────────────────────────────────────────
  const [user, setUser]           = useState<AuthUser | null>(null);
  const [showAuth, setShowAuth]   = useState(false);
  const [showMenu, setShowMenu]   = useState(false);

  const poolRef      = useRef<NewsItem[]>([]);
  const freshRef     = useRef<NewsItem[]>([]);
  const activeCatRef = useRef<CategoryId>("main");
  const fetchBusy    = useRef(false);
  const menuRef      = useRef<HTMLDivElement>(null);

  // ── Restore session on mount ───────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.user) setUser(d.user); })
      .catch(() => {});
  }, []);

  // ── Close menu on outside click ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Crypto prices ──────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana,ripple&vs_currencies=usd"
        );
        if (!res.ok) return;
        const d = await res.json();
        setPrices({ btc: d.bitcoin?.usd ?? 0, eth: d.ethereum?.usd ?? 0, sol: d.solana?.usd ?? 0, xrp: d.ripple?.usd ?? 0 });
      } catch { /* silent */ }
    };
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Load category ──────────────────────────────────────────────────────────
  const loadCat = useCallback(async (cat: CategoryId) => {
    if (fetchBusy.current) return;
    fetchBusy.current = true;
    setLoading(true);
    setFetchError(false);

    const cached = categoryCache.get(cat);
    if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
      poolRef.current = cached.items;
    } else {
      const items = await fetchCategory(cat);
      poolRef.current = items;
      if (items.length > 0) categoryCache.set(cat, { items, ts: Date.now() });
      else setFetchError(true);
    }

    if (cat !== activeCatRef.current) { fetchBusy.current = false; setLoading(false); return; }

    const count = Math.min(PAGE_SIZE, poolRef.current.length);
    setNews(poolRef.current.slice(0, count));
    setVisibleCount(count);
    setPoolLen(poolRef.current.length);
    setLoading(false);
    fetchBusy.current = false;
  }, []);

  // ── Category switch ────────────────────────────────────────────────────────
  useEffect(() => {
    activeCatRef.current = activeCategory;
    poolRef.current = [];
    freshRef.current = [];
    setNews([]);
    setPoolLen(0);
    setVisibleCount(PAGE_SIZE);
    setFetchError(false);
    setFreshCount(0);
    setQuery("");
    loadCat(activeCategory);
  }, [activeCategory, loadCat]);

  // ── Background auto-refresh (every 5 min) ─────────────────────────────────
  useEffect(() => {
    const id = setInterval(async () => {
      if (fetchBusy.current) return;
      const cat = activeCatRef.current;
      const freshItems = await fetchCategory(cat);
      const existingIds = new Set(poolRef.current.map((i) => i.id));
      const newOnes = freshItems.filter((i) => !existingIds.has(i.id));
      if (newOnes.length > 0) {
        freshRef.current = newOnes;
        setFreshCount(newOnes.length);
      }
    }, AUTO_REFRESH_MS);
    return () => clearInterval(id);
  }, []);

  // ── Apply fresh articles ───────────────────────────────────────────────────
  const handleApplyFresh = useCallback(() => {
    if (!freshRef.current.length) return;
    const combined = dedupe([...freshRef.current, ...poolRef.current]);
    combined.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    poolRef.current = combined;
    setPoolLen(combined.length);
    categoryCache.set(activeCatRef.current, { items: combined, ts: Date.now() });
    const count = Math.min(PAGE_SIZE, combined.length);
    setNews(combined.slice(0, count));
    setVisibleCount(count);
    freshRef.current = [];
    setFreshCount(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // ── Load more ─────────────────────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    setBusy(true);
    setTimeout(() => {
      const nextCount = Math.min(visibleCount + PAGE_SIZE, poolRef.current.length);
      setNews(poolRef.current.slice(0, nextCount));
      setVisibleCount(nextCount);
      setBusy(false);
    }, 350);
  }, [visibleCount]);

  // ── Auth handlers ─────────────────────────────────────────────────────────
  const handleLogin = useCallback((u: AuthUser) => setUser(u), []);
  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setShowMenu(false);
  }, []);

  const hasMore = visibleCount < poolLen && !query.trim();

  const filtered = query.trim()
    ? news.filter((i) =>
        i.title.toLowerCase().includes(query.toLowerCase()) ||
        i.description.toLowerCase().includes(query.toLowerCase())
      )
    : news;

  const catLabel = CATEGORIES.find((c) => c.id === activeCategory)?.label ?? "";

  return (
    <>
      {!preloaderDone && <VideoPreloader onDone={() => setPreloaderDone(true)} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={handleLogin} />}

      {/* New articles notification */}
      {freshCount > 0 && !loading && (
        <button
          onClick={handleApplyFresh}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2.5 rounded-full text-[11px] font-bold tracking-[0.18em]"
          style={{
            background:    "rgba(12,10,6,0.96)",
            border:        `1px solid ${GOLD}`,
            color:         GOLD,
            backdropFilter:"blur(16px)",
            boxShadow:     "0 4px 24px rgba(212,175,55,0.25)",
          }}
        >
          ↑ {freshCount} новых {freshCount === 1 ? "материал" : freshCount < 5 ? "материала" : "материалов"}
        </button>
      )}

      {/* Контент под прелоадером: при fade-out за 0.5 с проступает лента (без второго «мигания» opacity) */}
      <div className="min-h-screen">
        <Navbar
          prices={prices}
          query={query}
          onQueryChange={setQuery}
          user={user}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          menuRef={menuRef}
          onOpenAuth={() => setShowAuth(true)}
          onLogout={handleLogout}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          categoryCache={categoryCache}
        />

        {/* ── Main ───────────────────────────────────────────────────────── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="w-4 h-px" style={{ background: GOLD }} />
            <h1 className="text-[11px] font-black tracking-[0.3em] text-white/28">{catLabel}</h1>
          </div>

          {loading && news.length === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} featured={i === 0} />)}
            </div>
          )}

          {!loading && fetchError && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-36 gap-5">
              <span className="text-5xl" style={{ color: "rgba(212,175,55,0.18)" }}>◈</span>
              <p className="text-[10px] tracking-[0.3em] text-white/18">НЕТ ДАННЫХ — КАНАЛ НЕДОСТУПЕН</p>
              <button
                onClick={() => { categoryCache.delete(activeCategory); loadCat(activeCategory); }}
                className="px-6 py-2 rounded-full text-[10px] tracking-[0.2em] transition-colors"
                style={{ border: `1px solid rgba(212,175,55,0.28)`, color: "rgba(212,175,55,0.55)" }}
                onMouseEnter={(e) => ((e.target as HTMLElement).style.color = GOLD)}
                onMouseLeave={(e) => ((e.target as HTMLElement).style.color = "rgba(212,175,55,0.55)")}
              >
                ПОВТОРИТЬ
              </button>
            </div>
          )}

          {!loading && !fetchError && filtered.length === 0 && news.length > 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-white/15">
              <span className="text-4xl mb-4">◈</span>
              <p className="text-[10px] tracking-[0.3em]">НИЧЕГО НЕ НАЙДЕНО</p>
            </div>
          )}

          {filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 auto-rows-auto">
              {filtered.map((item, idx) => (
                <NewsCard key={item.id} item={item} featured={idx === 0} category={activeCategory} />
              ))}
            </div>
          )}

          {!loading && !fetchError && hasMore && (
            <LoadMoreButton onClick={handleLoadMore} busy={busy} />
          )}

          {!loading && !hasMore && news.length > 0 && !query.trim() && (
            <p className="text-center py-10 text-[9px] tracking-[0.38em] text-white/10">
              ◆ &nbsp;КОНЕЦ ЛЕНТЫ&nbsp; ◆
            </p>
          )}
        </main>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <footer className="mt-8 py-8" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <a href="/" className="flex items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={LOGO_SRC} alt="OmniNews" style={{ width: 26, height: 26, borderRadius: "50%", border: `1px solid ${GOLD}`, objectFit: "cover" }} />
              <span className="text-[11px] tracking-[0.18em]" style={{ color: GOLD, fontWeight: 700 }}>OmniNews</span>
            </a>
            <div className="flex gap-6 text-[10px] tracking-widest text-white/18">
              <Link href="/o-nas"            className="hover:text-white/50 transition-colors">О НАС</Link>
              <Link href="/kontakty"         className="hover:text-white/50 transition-colors">КОНТАКТЫ</Link>
              <Link href="/konfidencialnost" className="hover:text-white/50 transition-colors">КОНФИДЕНЦИАЛЬНОСТЬ</Link>
            </div>
            <span className="text-[9px] tracking-widest text-white/10">© 2026 OMNINEWS</span>
          </div>
        </footer>
      </div>
    </>
  );
}
