"use client";

import { useEffect, useRef, useState } from "react";

const PRELOADER_SHOW_MS = 3000;
const PRELOADER_FADE_MS = 500;

/**
 * Два слоя одного ролика:
 * — фон: object-cover + blur + лёгкий scale — заполняет весь экран без «пустых» полос;
 * — передний план: object-cover + full-bleed (iOS: autoPlay, muted, playsInline, loop, preload).
 * Воспроизведение синхронизируется по времени.
 */
export function VideoPreloader({ onDone }: { onDone: () => void }) {
  const [fade, setFade] = useState(false);
  const mainRef = useRef<HTMLVideoElement>(null);
  const bgRef   = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const main = mainRef.current;
    const bg   = bgRef.current;
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

    main.addEventListener("timeupdate", syncTime);
    main.addEventListener("play", onPlay);
    main.addEventListener("pause", onPause);
    main.addEventListener("seeking", syncTime);

    const onMeta = () => {
      bg.currentTime = main.currentTime;
    };
    main.addEventListener("loadedmetadata", onMeta);

    return () => {
      main.removeEventListener("timeupdate", syncTime);
      main.removeEventListener("play", onPlay);
      main.removeEventListener("pause", onPause);
      main.removeEventListener("seeking", syncTime);
      main.removeEventListener("loadedmetadata", onMeta);
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

  const src = "/video.mp4";

  return (
    <div
      className={`fixed inset-0 z-[9999] min-h-[100dvh] w-full bg-black transition-opacity duration-500 ease-in-out ${
        fade ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="absolute inset-0 h-full w-full overflow-hidden bg-black">
        {/* Слой 1: размытое заполнение экрана (cover) */}
        <video
          ref={bgRef}
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover"
          style={{
            transform: "scale(1.18)",
            filter:    "blur(48px)",
            opacity:   0.88,
            willChange: "transform",
          }}
        >
          <source src={src} type="video/mp4" />
        </video>

        {/* Лёгкое затемнение между слоями — глубина */}
        <div
          className="pointer-events-none absolute inset-0 z-[1] bg-black/15"
          aria-hidden
        />

        {/* Слой 2: чёткий слой поверх размытого фона */}
        <video
          ref={mainRef}
          autoPlay
          muted
          playsInline
          loop
          preload="auto"
          className="high-quality absolute inset-0 z-[2] h-full w-full object-cover"
        >
          <source src={src} type="video/mp4" />
        </video>
      </div>
    </div>
  );
}
