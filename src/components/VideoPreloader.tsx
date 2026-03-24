"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const PRELOADER_SHOW_MS = 3000;
const PRELOADER_FADE_MS = 500;

const src = "/video.mp4";

function primeIosPlayback(el: HTMLVideoElement | null) {
  if (!el) return;
  el.muted = true;
  el.defaultMuted = true;
  el.setAttribute("playsinline", "");
  el.setAttribute("webkit-playsinline", "");
  const p = el.play();
  if (p !== undefined) void p.catch(() => {});
}

/**
 * Фон: video object-cover (без CSS filter на <video> — иначе Safari iOS часто даёт чёрный кадр).
 * Поверх фона: полноэкранный слой backdrop-blur — «премиальное» размытие без поломки декодера.
 * Передний план: тот же ролик object-contain — логотип целиком в портрете.
 */
export function VideoPreloader({ onDone }: { onDone: () => void }) {
  const [fade, setFade] = useState(false);
  const mainRef = useRef<HTMLVideoElement>(null);
  const bgRef = useRef<HTMLVideoElement>(null);

  useLayoutEffect(() => {
    primeIosPlayback(mainRef.current);
    primeIosPlayback(bgRef.current);
  }, []);

  useEffect(() => {
    const main = mainRef.current;
    const bg = bgRef.current;
    if (!main || !bg) return;

    const syncTime = () => {
      const diff = Math.abs(bg.currentTime - main.currentTime);
      if (diff > 0.12) bg.currentTime = main.currentTime;
    };

    const onPlay = () => {
      void bg.play().catch(() => {});
    };
    const onPause = () => {
      bg.pause();
    };

    const kick = () => {
      bg.currentTime = main.currentTime;
      primeIosPlayback(main);
      primeIosPlayback(bg);
    };

    main.addEventListener("timeupdate", syncTime);
    main.addEventListener("play", onPlay);
    main.addEventListener("pause", onPause);
    main.addEventListener("seeking", syncTime);
    main.addEventListener("loadedmetadata", kick);
    main.addEventListener("loadeddata", kick);
    main.addEventListener("canplay", kick);

    return () => {
      main.removeEventListener("timeupdate", syncTime);
      main.removeEventListener("play", onPlay);
      main.removeEventListener("pause", onPause);
      main.removeEventListener("seeking", syncTime);
      main.removeEventListener("loadedmetadata", kick);
      main.removeEventListener("loadeddata", kick);
      main.removeEventListener("canplay", kick);
    };
  }, []);

  useEffect(() => {
    const startFade = setTimeout(() => {
      mainRef.current?.pause();
      bgRef.current?.pause();
      setFade(true);
    }, PRELOADER_SHOW_MS);
    const finish = setTimeout(onDone, PRELOADER_SHOW_MS + PRELOADER_FADE_MS);
    return () => {
      clearTimeout(startFade);
      clearTimeout(finish);
    };
  }, [onDone]);

  const videoAttrs = {
    autoPlay: true,
    muted: true,
    playsInline: true,
    loop: true,
    preload: "auto" as const,
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] min-h-[100dvh] w-full bg-black transition-opacity duration-500 ease-in-out ${
        fade ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 h-full min-h-[100dvh] w-full overflow-hidden bg-black">
        {/* Фон: cover, масштаб на обёртке — не вешаем filter на <video> (iOS) */}
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          aria-hidden
        >
          <div className="absolute inset-0 scale-[1.14]">
            <video
              ref={bgRef}
              {...videoAttrs}
              tabIndex={-1}
              className="h-full w-full object-cover object-center"
            >
              <source src={src} type="video/mp4" />
            </video>
          </div>
        </div>

        {/* Размытие «сверху» кадра, не через filter на video */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-black/20 backdrop-blur-[44px] backdrop-saturate-125"
          style={{
            WebkitBackdropFilter: "blur(44px) saturate(1.15)",
          }}
          aria-hidden
        />

        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-black/10"
          aria-hidden
        />

        <video
          ref={mainRef}
          {...videoAttrs}
          className="high-quality absolute inset-0 z-[2] h-full w-full object-contain object-center"
        >
          <source src={src} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
