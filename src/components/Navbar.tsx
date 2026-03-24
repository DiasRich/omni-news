"use client";

import type { CSSProperties, Dispatch, RefObject, SetStateAction } from "react";
import { CATEGORIES } from "@/constants/categories";
import type { CategoryId } from "@/constants/categories";
import { GOLD, LOGO_SRC } from "@/constants/site";
import { formatPrice } from "@/lib/format-price";
import type { AuthUser, CryptoPrices, NewsItem } from "@/types/news";

function CryptoTicker({ prices }: { prices: CryptoPrices | null }) {
  const coins = [
    { sym: "BTC/USD", val: prices?.btc ?? null },
    { sym: "ETH/USD", val: prices?.eth ?? null },
    { sym: "SOL/USD", val: prices?.sol ?? null },
    { sym: "XRP/USD", val: prices?.xrp ?? null },
  ];
  const rows = [...coins, ...coins, ...coins, ...coins];
  return (
    <div
      className="w-full overflow-hidden"
      style={{ background: "rgba(4,4,6,0.97)", borderBottom: "1px solid rgba(212,175,55,0.12)", height: 28 }}
    >
      <div className="flex items-center h-full">
        <div className="flex animate-marquee-ticker whitespace-nowrap">
          {rows.map((c, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-2 mx-10 text-[11px] font-mono tracking-widest"
              style={{ color: "rgba(212,175,55,0.75)" }}
            >
              <span className="opacity-30">◆</span>
              <span>{c.sym}</span>
              <span style={{ color: "rgba(255,255,255,0.5)" }}>${c.val !== null ? formatPrice(c.val) : "···"}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function UserMenu({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  return (
    <div
      className="absolute top-full right-0 mt-2 w-52 rounded-xl p-2 z-50"
      style={{
        background:      "#0a0806",
        border:          `1px solid rgba(212,175,55,0.2)`,
        boxShadow:       "0 16px 48px rgba(0,0,0,0.6)",
        backdropFilter:  "blur(16px)",
      }}
    >
      <div className="px-3 py-2.5 border-b border-white/[0.06] mb-1">
        <p className="text-[10px] tracking-[0.15em] mb-0.5" style={{ color: "rgba(212,175,55,0.5)" }}>АККАУНТ</p>
        <p className="text-[12px] text-white/60 truncate">{user.email}</p>
      </div>
      <button
        onClick={onLogout}
        className="w-full text-left px-3 py-2 rounded-lg text-[12px] transition-colors hover:bg-white/5"
        style={{ color: "rgba(255,255,255,0.45)" }}
      >
        Выйти
      </button>
    </div>
  );
}

export type NavbarProps = {
  prices: CryptoPrices | null;
  query: string;
  onQueryChange: (q: string) => void;
  user: AuthUser | null;
  showMenu: boolean;
  setShowMenu: Dispatch<SetStateAction<boolean>>;
  menuRef: RefObject<HTMLDivElement | null>;
  onOpenAuth: () => void;
  onLogout: () => void;
  activeCategory: CategoryId;
  onSelectCategory: (id: CategoryId) => void;
  categoryCache: Map<string, { items: NewsItem[]; ts: number }>;
};

export function Navbar({
  prices,
  query,
  onQueryChange,
  user,
  showMenu,
  setShowMenu,
  menuRef,
  onOpenAuth,
  onLogout,
  activeCategory,
  onSelectCategory,
  categoryCache,
}: NavbarProps) {
  return (
    <>
      <CryptoTicker prices={prices} />
      <header className="glass-header sticky top-0 z-50">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 h-[62px] grid items-center gap-4"
          style={{ gridTemplateColumns: "auto 1fr auto" }}
        >
          <a href="/" className="flex items-center gap-3 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={LOGO_SRC}
              alt="OmniNews"
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                border: `1.5px solid ${GOLD}`,
                boxShadow: "0 0 14px rgba(212,175,55,0.28)",
                objectFit: "cover",
              }}
            />
            <span
              className="hidden sm:block text-[17px] tracking-[0.12em]"
              style={{ color: GOLD, fontWeight: 700, fontFamily: "Inter, sans-serif" }}
            >
              OmniNews
            </span>
          </a>

          <div className="flex justify-center">
            <input
              type="search"
              placeholder="Поиск новостей…"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="w-full max-w-md h-9 rounded-full px-5 text-[13px] text-white/80 placeholder-white/25 outline-none"
              style={{
                background:   "rgba(255,255,255,0.05)",
                border:       "1px solid rgba(255,255,255,0.1)",
                backdropFilter: "blur(14px)",
                transition:   "border-color 200ms",
              }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(212,175,55,0.45)")}
              onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          </div>

          <div className="relative" ref={menuRef}>
            {user ? (
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="flex items-center justify-center w-9 h-9 rounded-full text-[14px] font-bold transition-all"
                style={{
                  background: showMenu ? GOLD : "rgba(212,175,55,0.15)",
                  border:       `1.5px solid ${GOLD}`,
                  color:        showMenu ? "#080600" : GOLD,
                  boxShadow:    showMenu ? "0 0 20px rgba(212,175,55,0.3)" : "none",
                }}
              >
                {user.email[0].toUpperCase()}
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center justify-center w-9 h-9 rounded-full transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border:     "1px solid rgba(255,255,255,0.1)",
                  color:      "rgba(255,255,255,0.35)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(212,175,55,0.4)";
                  (e.currentTarget as HTMLElement).style.color       = GOLD;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                  (e.currentTarget as HTMLElement).style.color       = "rgba(255,255,255,0.35)";
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
                </svg>
              </button>
            )}
            {showMenu && user && <UserMenu user={user} onLogout={onLogout} />}
          </div>
        </div>

        <nav className="border-t border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div
              className="flex overflow-x-auto"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as CSSProperties}
            >
              {CATEGORIES.map((cat) => {
                const active = cat.id === activeCategory;
                const cached = categoryCache.has(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className="shrink-0 px-5 py-2.5 text-[10px] font-bold tracking-[0.18em] whitespace-nowrap relative transition-colors duration-200"
                    style={{
                      color:        active ? GOLD : "rgba(255,255,255,0.35)",
                      borderBottom: active ? `2px solid ${GOLD}` : "2px solid transparent",
                    }}
                  >
                    {cat.label}
                    {cached && !active && (
                      <span
                        className="absolute top-2 right-1.5 w-[5px] h-[5px] rounded-full"
                        style={{ background: GOLD, opacity: 0.45 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </header>
    </>
  );
}
