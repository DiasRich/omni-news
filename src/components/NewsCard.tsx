"use client";

import { useState } from "react";
import { GOLD } from "@/constants/site";
import { getThematicImg } from "@/lib/thematic-image";
import { timeAgo } from "@/lib/time-ago";
import type { NewsItem } from "@/types/news";

export function NewsCard({
  item,
  featured,
}: {
  item: NewsItem;
  featured?: boolean;
}) {
  const thematic = getThematicImg(item.title);
  const [imgSrc, setImgSrc] = useState(() =>
    item.thumbnail?.startsWith("http") ? item.thumbnail : thematic
  );
  const [imgReady, setImgReady] = useState(false);
  const imgH = featured ? "clamp(220px,26vw,340px)" : "168px";

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`group block rounded-2xl overflow-hidden ${featured ? "sm:col-span-2 lg:row-span-2" : ""}`}
      style={{
        background:     "rgba(20,16,10,0.94)",
        border:         "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(18px)",
        boxShadow:      "0 2px 20px rgba(0,0,0,0.45)",
        transition:     "transform 280ms ease, box-shadow 280ms ease, border-color 280ms ease",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.transform   = "translateY(-4px)";
        el.style.boxShadow   = "0 0 0 1px rgba(212,175,55,0.35), 0 16px 48px rgba(0,0,0,0.65)";
        el.style.borderColor = "rgba(212,175,55,0.32)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLAnchorElement;
        el.style.transform   = "translateY(0)";
        el.style.boxShadow   = "0 2px 20px rgba(0,0,0,0.45)";
        el.style.borderColor = "rgba(255,255,255,0.08)";
      }}
    >
      <div className="relative overflow-hidden" style={{ height: imgH, background: "#0c0a06" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: imgReady ? 1 : 0, transition: "opacity 500ms ease" }}
          onLoad={() => setImgReady(true)}
          onError={() => { if (imgSrc !== thematic) setImgSrc(thematic); }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#100e08] via-[#100e08]/20 to-transparent" />
      </div>
      <div className="p-4 flex flex-col gap-2">
        {item.source && (
          <span className="text-[9px] font-black tracking-[0.24em] uppercase" style={{ color: GOLD }}>
            {item.source}
          </span>
        )}
        <h3
          className={`leading-snug text-white/90 group-hover:text-white transition-colors ${featured ? "text-[15px] sm:text-lg font-bold" : "text-[13px] font-semibold"}`}
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          {item.title}
        </h3>
        {item.description && (
          <p className="text-[11px] text-white/38 line-clamp-2 leading-relaxed">{item.description}</p>
        )}
        <div className="flex items-center justify-between mt-1">
          <span className="text-[10px] text-white/20">{timeAgo(item.pubDate)}</span>
          <span
            className="text-[9px] font-semibold tracking-[0.15em] opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: GOLD }}
          >
            ЧИТАТЬ →
          </span>
        </div>
      </div>
    </a>
  );
}
