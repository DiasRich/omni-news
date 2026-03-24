"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const PRELOADER_SHOW_MS = 3000;
const PRELOADER_FADE_MS = 500;

const src = "/video.mp4";

function primePlayback(el: HTMLVideoElement | null) {
  if (!el) return;
  el.muted = true;
  el.defaultMuted = true;
  el.setAttribute("playsinline", "");
  el.setAttribute("webkit-playsinline", "");
  const p = el.play();
  if (p !== undefined) void p.catch(() => {});
}

/**
 * Один экземпляр <video> (iOS WebKit часто не рисует второй слой поверх backdrop-filter / двух декодеров).
 * «Люкс» по краям — CSS-градиенты, без второго ролика и без filter/backdrop поверх видео.
 */
export function VideoPreloader({ onDone }: { onDone: () => void }) {
  const [fade, setFade] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useLayoutEffect(() => {
    primePlayback(videoRef.current);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const kick = () => primePlayback(v);
    v.addEventListener("loadedmetadata", kick);
    v.addEventListener("loadeddata", kick);
    v.addEventListener("canplay", kick);
    return () => {
      v.removeEventListener("loadedmetadata", kick);
      v.removeEventListener("loadeddata", kick);
      v.removeEventListener("canplay", kick);
    };
  }, []);

  useEffect(() => {
    const startFade = setTimeout(() => {
      videoRef.current?.pause();
      setFade(true);
    }, PRELOADER_SHOW_MS);
    const finish = setTimeout(onDone, PRELOADER_SHOW_MS + PRELOADER_FADE_MS);
    return () => {
      clearTimeout(startFade);
      clearTimeout(finish);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[9999] min-h-[100dvh] w-full bg-[#030303] transition-opacity duration-500 ease-in-out ${
        fade ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 h-full min-h-[100dvh] w-full overflow-hidden bg-[#030303]">
        {/* Фон: золото + глубина, без blur над видео (совместимость iOS / in-app browser) */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          aria-hidden
          style={{
            background: `
              radial-gradient(ellipse 130% 85% at 50% 36%, rgba(212, 175, 55, 0.2) 0%, transparent 52%),
              radial-gradient(ellipse 90% 55% at 50% 88%, rgba(212, 175, 55, 0.08) 0%, transparent 45%),
              linear-gradient(180deg, #060605 0%, #020202 42%, #050504 100%)
            `,
          }}
        />
        {/* Тонкая «сетка» как на ролике — чистый CSS */}
        <div
          className="pointer-events-none absolute inset-0 z-0 opacity-[0.12]"
          aria-hidden
          style={{
            backgroundImage: `
              linear-gradient(115deg, transparent 48%, rgba(212,175,55,0.35) 49%, rgba(212,175,55,0.35) 51%, transparent 52%),
              linear-gradient(295deg, transparent 48%, rgba(212,175,55,0.2) 49%, rgba(212,175,55,0.2) 51%, transparent 52%)
            `,
            backgroundSize: "120% 120%",
            backgroundPosition: "center",
          }}
        />

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
          src={src}
          className="absolute inset-0 z-[1] h-full w-full object-contain object-center"
        />
      </div>
    </div>
  );
}
