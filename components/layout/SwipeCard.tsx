"use client";

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import ReactCountryFlag from "react-country-flag";
import {
  ArrowLeft,
  ArrowRight,
  X,
  TrendingUp,
  ArrowDown,
  Info,
} from "lucide-react";
import type { DerivativeNews } from "@/components/types/derivativenews";

if (typeof window !== "undefined") {
  gsap.registerPlugin(Draggable);
}

type SwipeAction = "long" | "short" | "skip";

interface SwipeCardProps {
  newsList: DerivativeNews[];
  onLong?: (news: DerivativeNews, tradeAmount: number) => void;
  onShort?: (news: DerivativeNews, tradeAmount: number) => void;
  onSkip?: (news: DerivativeNews) => void;
}

function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getCountryCode(country: string | undefined | null): string | null {
  if (!country) return null;
  const c = country.toLowerCase().trim();
  if (["us", "usa", "united states"].some((k) => c.includes(k))) return "US";
  if (["uk", "gb", "britain", "united kingdom"].some((k) => c.includes(k)))
    return "GB";
  if (["eu", "euro"].some((k) => c.includes(k))) return "EU";
  if (["japan", "jp"].some((k) => c.includes(k))) return "JP";
  if (["china", "cn"].some((k) => c.includes(k))) return "CN";
  if (["indonesia", "id"].some((k) => c.includes(k))) return "ID";
  if (["india", "in "].some((k) => c.includes(k))) return "IN";
  if (["singapore", "sg"].some((k) => c.includes(k))) return "SG";
  return null;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  newsList,
  onLong,
  onShort,
  onSkip,
}) => {
  const [shuffledNews, setShuffledNews] = useState<DerivativeNews[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [filterCountry, setFilterCountry] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<SwipeAction | null>(null);

  const tradeAmounts = [1, 5, 10] as const;
  const [tradeIndex, setTradeIndex] = useState(1);
  const tradeAmount = tradeAmounts[tradeIndex];

  const cardRef = useRef<HTMLDivElement | null>(null);
  const draggableInstance = useRef<globalThis.Draggable[] | null>(null);

  useEffect(() => {
    setShuffledNews(shuffleArray(newsList));
    setActiveIndex(0);
  }, [newsList]);

  const countries = useMemo(
    () =>
      Array.from(
        new Set(
          newsList
            .map((n) => n.country)
            .filter((c): c is string => Boolean(c && c.trim().length > 0))
        )
      ),
    [newsList]
  );

  const displayedNews = useMemo(() => {
    const base = shuffledNews;
    if (!filterCountry) return base;
    return base.filter((n) => n.country === filterCountry);
  }, [shuffledNews, filterCountry]);

  useEffect(() => {
    setActiveIndex(0);
  }, [filterCountry, shuffledNews]);

  const currentNews = displayedNews[activeIndex] ?? null;
  const hasCard = !!currentNews;

  const handleSwipeComplete = useCallback(
    (action: SwipeAction) => {
      const current = displayedNews[activeIndex];
      const cardElement = cardRef.current;
      if (!current || !cardElement) return;

      setLastAction(action);

      const screenWidth =
        typeof window !== "undefined" ? window.innerWidth : 400;
      const screenHeight =
        typeof window !== "undefined" ? window.innerHeight : 800;

      let tweenVars: gsap.TweenVars;

      if (action === "long") {
        tweenVars = { x: screenWidth * 1.5, y: 100, rotation: 30, opacity: 0 };
      } else if (action === "short") {
        tweenVars = {
          x: -screenWidth * 1.5,
          y: 100,
          rotation: -30,
          opacity: 0,
        };
      } else {
        tweenVars = { y: -screenHeight * 1.5, rotation: 0, opacity: 0 };
      }

      gsap.to(cardElement, {
        ...tweenVars,
        duration: 0.4,
        ease: "power1.in",
        onComplete: () => {
          if (action === "long") onLong?.(current, tradeAmount);
          if (action === "short") onShort?.(current, tradeAmount);
          if (action === "skip") onSkip?.(current);

          setLastAction(null);
          setActiveIndex((prev) => prev + 1);
          gsap.set(cardElement, {
            x: 0,
            y: 0,
            rotation: 0,
            opacity: 1,
            clearProps: "all",
          });
        },
      });
    },
    [activeIndex, displayedNews, onLong, onShort, onSkip, tradeAmount]
  );

  useLayoutEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement || !currentNews) return;

    if (draggableInstance.current && draggableInstance.current[0]) {
      draggableInstance.current[0].kill();
    }

    const longBadge = cardElement.querySelector("[data-swipe-long]");
    const shortBadge = cardElement.querySelector("[data-swipe-short]");
    const overlay = cardElement.querySelector("[data-overlay]");

    gsap.set(cardElement, { x: 0, y: 0, rotation: 0, opacity: 1 });
    gsap.set([longBadge, shortBadge, overlay], { opacity: 0 });

    draggableInstance.current = Draggable.create(cardElement, {
      type: "x,y",
      edgeResistance: 0.65,
      bounds: { minX: -1000, maxX: 1000, minY: -500, maxY: 500 },

      onDrag: function () {
        const x = this.x;
        const rotation = x / 20;
        const intensity = Math.min(Math.abs(x) / 150, 1);

        gsap.set(cardElement, { rotation: rotation });

        if (x > 0) {
          gsap.to(longBadge, {
            opacity: intensity,
            scale: 1 + intensity * 0.1,
            duration: 0.1,
          });
          gsap.to(shortBadge, { opacity: 0, duration: 0.1 });
          gsap.to(overlay, {
            backgroundColor: `rgba(16, 185, 129, ${intensity * 0.4})`,
            opacity: 1,
            duration: 0.1,
          });
        } else {
          gsap.to(shortBadge, {
            opacity: intensity,
            scale: 1 + intensity * 0.1,
            duration: 0.1,
          });
          gsap.to(longBadge, { opacity: 0, duration: 0.1 });
          gsap.to(overlay, {
            backgroundColor: `rgba(244, 63, 94, ${intensity * 0.4})`,
            opacity: 1,
            duration: 0.1,
          });
        }
      },
      onRelease: function () {
        const x = this.x;
        const y = this.y;
        const threshold = 100;

        if (x > threshold) handleSwipeComplete("long");
        else if (x < -threshold) handleSwipeComplete("short");
        else if (y < -threshold) handleSwipeComplete("skip");
        else {
          gsap.to(cardElement, {
            x: 0,
            y: 0,
            rotation: 0,
            duration: 0.5,
            ease: "elastic.out(1, 0.75)",
          });
          gsap.to([longBadge, shortBadge, overlay], {
            opacity: 0,
            duration: 0.3,
          });
        }
      },
    });

    return () => {
      if (draggableInstance.current && draggableInstance.current[0]) {
        draggableInstance.current[0].kill();
      }
    };
  }, [activeIndex, currentNews, handleSwipeComplete]);

  const handleCountryClick = (country: string | null) => {
    setFilterCountry((curr) => (curr === country ? null : country));
  };

  if (!hasCard) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-140px)] text-neutral-500 animate-in fade-in">
        <div className="w-16 h-16 mb-4 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center">
          <span className="text-2xl">🎉</span>
        </div>
        <p className="text-sm">You've caught up with all the news!</p>
        <button
          onClick={() => {
            setFilterCountry(null);
            setShuffledNews(shuffleArray(newsList));
            setActiveIndex(0);
          }}
          className="mt-6 px-4 py-2 text-xs font-semibold text-emerald-500 hover:bg-emerald-500/10 rounded-full transition"
        >
          Refresh Feed
        </button>
      </div>
    );
  }

  const code = getCountryCode(currentNews.country);

  return (
    // MAIN CONTAINER
    <div className="flex flex-col items-center justify-between w-full max-w-md mx-auto h-[calc(100vh-100px)] mt-5 mb-2 overflow-hidden">
      {/* 1. FILTER BAR (Top) */}
      <div className="w-full overflow-x-auto no-scrollbar py-2 px-1 shrink-0 z-10">
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => handleCountryClick(null)}
            className={classNames(
              "px-4 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 border",
              !filterCountry
                ? "bg-white text-black border-white"
                : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700"
            )}
          >
            All
          </button>
          {countries.map((c) => {
            const isActive = filterCountry === c;
            const cCode = getCountryCode(c);
            return (
              <button
                key={c}
                onClick={() => handleCountryClick(c)}
                className={classNames(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 border",
                  isActive
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50"
                    : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700"
                )}
              >
                {cCode && (
                  <ReactCountryFlag
                    countryCode={cCode}
                    svg
                    className="rounded-full w-3 h-3"
                  />
                )}
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CARD AREA (Middle - Flexible) */}
      <div className="relative flex-1 w-full flex justify-center items-center perspective-1000 min-h-0 my-4">
        <div
          ref={cardRef}
          className="relative w-[90%] sm:w-[360px] aspect-[3/4.2] max-h-full bg-[#000000] border border-neutral-800/80 rounded-[2rem] shadow-2xl overflow-hidden cursor-grab active:cursor-grabbing will-change-transform"
        >
          <div
            data-overlay
            className="absolute inset-0 pointer-events-none z-20 mix-blend-overlay transition-opacity"
          />

          {/* STAMP BADGES */}
          <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
            <div
              data-swipe-long
              className="border-4 border-emerald-500 text-emerald-500 rounded-2xl px-6 py-2 text-5xl font-black uppercase tracking-widest -rotate-12 opacity-0 shadow-xl bg-black/60 backdrop-blur-md"
            >
              LONG
            </div>
            <div
              data-swipe-short
              className="border-4 border-rose-500 text-rose-500 rounded-2xl px-6 py-2 text-5xl font-black uppercase tracking-widest rotate-12 opacity-0 shadow-xl bg-black/60 backdrop-blur-md"
            >
              SHORT
            </div>
          </div>

          {/* AMOUNT SELECTOR */}
          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setTradeIndex((i) => (i + 1) % tradeAmounts.length)}
            className="absolute top-4 right-4 z-40 bg-black/40 backdrop-blur-md border border-white/10 rounded-full h-9 min-w-[3rem] px-3 flex items-center justify-center gap-1 hover:bg-neutral-800 transition active:scale-95"
          >
            <span className="text-emerald-400 font-bold text-xs">$</span>
            <span className="text-white font-bold text-sm">{tradeAmount}</span>
          </button>

          {/* IMAGE */}
          <div className="relative h-[55%] w-full">
            <img
              src={currentNews.imageUrl}
              alt="News"
              className="w-full h-full object-cover pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-[#000000]" />
            <div className="absolute top-4 left-4 z-40 bg-black/40 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 flex items-center gap-2">
              {code && (
                <ReactCountryFlag
                  countryCode={code}
                  svg
                  className="w-4 h-4 rounded-full"
                />
              )}
              <span className="text-[10px] font-bold text-white tracking-wide uppercase">
                {currentNews.country}
              </span>
            </div>
          </div>

          {/* CONTENT */}
          <div className="relative h-[45%] w-full px-6 pt-2 pb-6 flex flex-col justify-between bg-[#000000]">
            <div className="flex flex-col gap-2">
              <h2 className="text-lg font-bold text-white leading-snug line-clamp-3">
                {currentNews.title}
              </h2>
              <p className="text-xs text-neutral-400 leading-relaxed line-clamp-4">
                {currentNews.description}
              </p>
            </div>

            {/* Hint Arrows */}
            <div className="flex justify-between items-center opacity-40">
              <ArrowLeft className="w-4 h-4 text-rose-500 animate-pulse" />
              <ArrowRight className="w-4 h-4 text-emerald-500 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. CIRCULAR ACTION BUTTONS (Bottom - Fixed) */}
      <div className="flex items-center gap-6 pb-2 shrink-0 z-20">
        {/* SHORT (Left) */}
        <button
          onClick={() => handleSwipeComplete("short")}
          className="group w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-lg transition-all active:scale-90 hover:bg-rose-950/30 hover:border-rose-500/50"
        >
          <ArrowLeft className="w-6 h-6 text-rose-500 group-hover:text-rose-400 transition-colors" />
        </button>

        {/* SKIP (Center - Smaller) */}
        <button
          onClick={() => handleSwipeComplete("skip")}
          className="group w-10 h-10 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-md transition-all active:scale-90 hover:bg-neutral-800 hover:border-neutral-600"
        >
          <X className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
        </button>

        {/* LONG (Right) */}
        <button
          onClick={() => handleSwipeComplete("long")}
          className="group w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-lg transition-all active:scale-90 hover:bg-emerald-950/30 hover:border-emerald-500/50"
        >
          <ArrowRight className="w-6 h-6 text-emerald-500 group-hover:text-emerald-400 transition-colors" />
        </button>
      </div>
    </div>
  );
};
