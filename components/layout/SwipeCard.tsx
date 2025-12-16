// components/layout/SwipeCard.tsx
'use client';

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import ReactCountryFlag from 'react-country-flag';
import type { DerivativeNews } from '@/components/types/derivativenews';

gsap.registerPlugin(Draggable);

type SwipeAction = 'long' | 'short' | 'skip';

interface SwipeCardProps {
  newsList: DerivativeNews[];
  onLong?: (news: DerivativeNews) => void;
  onShort?: (news: DerivativeNews) => void;
  onSkip?: (news: DerivativeNews) => void;
}

// util sederhana untuk gabung className
function classNames(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// fungsi untuk acak urutan kartu (shuffle)
// (komentar: untuk membuat urutan kartu tidak berurutan / random)
function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// mapping nama negara → kode ISO-2 untuk react-country-flag
function getCountryCode(country: string | undefined | null): string | null {
  if (!country) return null;
  const c = country.toLowerCase().trim();

  if (['us', 'usa', 'united states'].some((k) => c.includes(k))) return 'US';
  if (['uk', 'gb', 'britain', 'united kingdom'].some((k) => c.includes(k)))
    return 'GB';
  if (['eu', 'euro'].some((k) => c.includes(k))) return 'EU';
  if (['japan', 'jp'].some((k) => c.includes(k))) return 'JP';
  if (['china', 'cn'].some((k) => c.includes(k))) return 'CN';
  if (['indonesia', 'id'].some((k) => c.includes(k))) return 'ID';
  if (['india', 'in '].some((k) => c.includes(k))) return 'IN';

  return null;
}

export const SwipeCard: React.FC<SwipeCardProps> = ({
  newsList,
  onLong,
  onShort,
  onSkip,
}) => {
  // state untuk menyimpan kartu yang sudah diacak
  const [shuffledNews, setShuffledNews] = useState<DerivativeNews[]>([]);
  // index kartu yang sedang aktif
  const [activeIndex, setActiveIndex] = useState(0);
  // filter negara yang sedang dipilih (null = semua negara)
  const [filterCountry, setFilterCountry] = useState<string | null>(null);
  // action terakhir (untuk efek badge "LONG / SHORT / SKIP selesai")
  const [lastAction, setLastAction] = useState<SwipeAction | null>(null);

  // referensi ke elemen DOM kartu paling atas
  const cardRef = useRef<HTMLDivElement | null>(null);
  const draggableInstance = useRef<any>(null);

  // jika list berita berubah -> acak ulang dan reset index
  useEffect(() => {
    setShuffledNews(shuffleArray(newsList));
    setActiveIndex(0);
  }, [newsList]);

  // ambil daftar negara unik untuk filter + icon bendera
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

  // terapkan filter negara ke list yang sudah diacak
  const displayedNews = useMemo(() => {
    const base = shuffledNews;
    if (!filterCountry) return base;
    return base.filter((n) => n.country === filterCountry);
  }, [shuffledNews, filterCountry]);

  // setiap kali filter / shuffle berubah -> mulai lagi dari kartu pertama
  useEffect(() => {
    setActiveIndex(0);
  }, [filterCountry, shuffledNews]);

  // news yang sedang aktif (hanya satu)
  const currentNews = displayedNews[activeIndex] ?? null;
  const hasCard = !!currentNews;

  // handler ketika swipe sudah "commit" (long / short / skip)
  // (komentar: di sini kita buat animasi kartu keluar layar + panggil callback)
  const handleSwipeComplete = useCallback(
    (action: SwipeAction) => {
      const current = displayedNews[activeIndex];
      const cardElement = cardRef.current;
      if (!current || !cardElement) return;

      setLastAction(action);

      const screenWidth =
        typeof window !== 'undefined' ? window.innerWidth : 400;
      const screenHeight =
        typeof window !== 'undefined' ? window.innerHeight : 800;

      // warna glow sesuai action
      const isLong = action === 'long';
      const isShort = action === 'short';
      const glowColor = isLong
        ? 'rgba(34,197,94,0.75)' // hijau
        : isShort
        ? 'rgba(248,113,113,0.75)' // merah
        : 'rgba(148,163,184,0.7)'; // netral untuk skip

      let tweenVars: gsap.TweenVars;

      if (action === 'long') {
        tweenVars = {
          x: screenWidth * 1.1,
          y: 40,
          rotation: 26,
          opacity: 0.9,
          duration: 0.35,
          ease: 'power2.in',
        };
      } else if (action === 'short') {
        tweenVars = {
          x: -screenWidth * 1.1,
          y: 40,
          rotation: -26,
          opacity: 0.9,
          duration: 0.35,
          ease: 'power2.in',
        };
      } else {
        tweenVars = {
          y: -screenHeight * 1.1,
          rotation: -18,
          opacity: 0.9,
          duration: 0.35,
          ease: 'power2.in',
        };
      }

      const badge =
        action === 'long'
          ? cardElement.querySelector('[data-swipe-long]')
          : action === 'short'
          ? cardElement.querySelector('[data-swipe-short]')
          : null;

      if (badge) {
        gsap.to(badge, {
          opacity: 1,
          scale: 1.15,
          duration: 0.15,
        });
      }

      const glowOverlay = cardElement.querySelector(
        '[data-glow-overlay]'
      ) as HTMLElement | null;

      // saat confirm LONG / SHORT / SKIP kita tambah glow yang lebih kuat
      gsap.to(cardElement, {
        ...tweenVars,
        boxShadow: `0 0 18px ${glowColor}, 0 0 40px ${glowColor}`,
        borderColor: glowColor,
        borderWidth: 2,
        onComplete: () => {
          // panggil callback dari parent jika ada
          if (action === 'long') onLong?.(current);
          if (action === 'short') onShort?.(current);
          if (action === 'skip') onSkip?.(current);

          setLastAction(null);
          // maju ke kartu berikutnya
          setActiveIndex((prev) => prev + 1);
        },
      });

      if (glowOverlay) {
        gsap.to(glowOverlay, {
          opacity: 0.85,
          duration: 0.25,
        });
      }
    },
    [activeIndex, displayedNews, onLong, onShort, onSkip]
  );

  // setup GSAP Draggable untuk kartu paling atas
  useLayoutEffect(() => {
    const cardElement = cardRef.current;
    if (!cardElement || displayedNews.length === 0 || !currentNews) return;

    // kill instance lama supaya tidak double binding
    if (draggableInstance.current) {
      draggableInstance.current.kill();
      draggableInstance.current = null;
    }

    const baseShadow = '0 18px 60px rgba(0,0,0,0.7)';
    const baseBorderColor = 'rgba(51,65,85,0.8)'; // kira-kira slate-700/80

    // reset posisi & style kartu sebelum bisa di-drag
    gsap.set(cardElement, {
      x: 0,
      y: 0,
      rotation: 0,
      opacity: 1,
      scale: 1,
      boxShadow: baseShadow,
      borderColor: baseBorderColor,
      borderWidth: 1,
      outline: 'none',
    });

    const glowOverlay = cardElement.querySelector(
      '[data-glow-overlay]'
    ) as HTMLElement | null;

    const longBadge = cardElement.querySelector(
      '[data-swipe-long]'
    ) as HTMLElement | null;

    const shortBadge = cardElement.querySelector(
      '[data-swipe-short]'
    ) as HTMLElement | null;

    const thresholdX = 120;
    const thresholdY = -120;

    draggableInstance.current = Draggable.create(cardElement, {
      type: 'x,y',
      edgeResistance: 0.65,

      // (komentar: efek saat kartu di-drag)
      onDrag(this: any) {
        const x = this.x as number;
        const rotation = x / 10; // makin jauh geser, makin miring

        // intensitas 0 - 1, makin jauh makin besar
        const intensity = Math.min(Math.abs(x) / 160, 1);
        const isRight = x > 0;

        if (longBadge && shortBadge) {
          if (x > 0) {
            // swipe kanan → LONG
            gsap.to(longBadge, {
              opacity: Math.min(intensity, 1),
              scale: 0.9 + 0.2 * intensity,
              duration: 0.08,
            });

            gsap.to(shortBadge, {
              opacity: 0,
              scale: 0.9,
              duration: 0.08,
            });
          } else {
            // swipe kiri → SHORT
            gsap.to(shortBadge, {
              opacity: Math.min(intensity, 1),
              scale: 0.9 + 0.2 * intensity,
              duration: 0.08,
            });

            gsap.to(longBadge, {
              opacity: 0,
              scale: 0.9,
              duration: 0.08,
            });
          }
        }

        const glowColor = isRight
          ? 'rgba(34,197,94,1)' // hijau
          : 'rgba(248,113,113,1)'; // merah

        const borderColor = isRight
          ? `rgba(34,197,94,${0.4 + 0.4 * intensity})`
          : `rgba(248,113,113,${0.4 + 0.4 * intensity})`;

        const boxShadow = `
          0 0 ${10 + 10 * intensity}px rgba(0,0,0,0.6),
          0 0 ${14 + 26 * intensity}px ${glowColor}
        `;

        // (komentar: rotate + border & glow makin tebal saat drag)
        gsap.to(cardElement, {
          rotation,
          borderColor,
          borderWidth: 1 + 2 * intensity,
          boxShadow,
          duration: 0.08,
        });

        // (komentar: overlay "lampu hijau / merah" di permukaan card)
        if (glowOverlay) {
          const background = isRight
            ? 'radial-gradient(circle at 85% 15%, rgba(34,197,94,0.55) 0, transparent 55%)'
            : 'radial-gradient(circle at 15% 15%, rgba(248,113,113,0.55) 0, transparent 55%)';

          gsap.to(glowOverlay, {
            opacity: 0.35 + 0.35 * intensity,
            background,
            duration: 0.08,
          });
        }
      },

      onRelease(this: any) {
        const x = this.x as number;
        const y = this.y as number;

        if (x > thresholdX) {
          // swipe kanan = LONG
          handleSwipeComplete('long');
        } else if (x < -thresholdX) {
          // swipe kiri = SHORT
          handleSwipeComplete('short');
        } else if (y < thresholdY) {
          // swipe atas = SKIP
          handleSwipeComplete('skip');
        } else {
          // (komentar: kalau kurang threshold -> kartu kembali ke tengah dan efek di-reset)
          gsap.to(cardElement, {
            x: 0,
            y: 0,
            rotation: 0,
            boxShadow: baseShadow,
            borderColor: baseBorderColor,
            borderWidth: 1,
            outline: 'none',
            duration: 0.35,
            ease: 'power3.out',
          });

          if (longBadge && shortBadge) {
            gsap.to([longBadge, shortBadge], {
              opacity: 0,
              scale: 0.9,
              duration: 0.2,
            });
          }

          if (glowOverlay) {
            gsap.to(glowOverlay, {
              opacity: 0,
              duration: 0.25,
            });
          }
        }
      },
    })[0];

    return () => {
      if (draggableInstance.current) {
        draggableInstance.current.kill();
        draggableInstance.current = null;
      }
    };
  }, [activeIndex, displayedNews, currentNews, handleSwipeComplete]);

  // handler klik icon negara (toggle filter)
  const handleCountryClick = (country: string | null) => {
    setFilterCountry((current) => (current === country ? null : country));
  };

  if (newsList.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-12 text-slate-200">
        No news available.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* ==== COUNTRY FILTER BAR DENGAN ICON BENDERA ==== */}
      <div className="flex items-center gap-2 px-4 py-2 backdrop-blur-md">
        <span className="text-[11px] text-slate-400 mr-1"></span>

        {/* tombol ALL */}
        <button
          type="button"
          onClick={() => handleCountryClick(null)}
          className={classNames(
            'px-2.5 py-1 rounded-full text-[11px] border transition',
            !filterCountry
              ? 'bg-sky-500/90 border-sky-400 text-slate-950'
              : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800'
          )}
        >
          All
        </button>

        {/* tombol negara berdasarkan list country */}
        <div
          className={classNames(
            // mobile: bisa geser horizontal, scrollbar disembunyikan
            'flex items-center gap-1 max-w-[210px] overflow-x-auto no-scrollbar',
            // layar >= sm: wrap, no scroll (biar slider tidak kelihatan)
            'sm:max-w-none sm:flex-wrap sm:overflow-visible'
          )}
        >
          {countries.map((country) => {
            const isActive = filterCountry === country;
            const code = getCountryCode(country);

            return (
              <button
                key={country}
                type="button"
                onClick={() => handleCountryClick(country)}
                className={classNames(
                  'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] border whitespace-nowrap transition',
                  isActive
                    ? 'bg-emerald-500/90 border-emerald-400 text-slate-950'
                    : 'bg-slate-900/80 border-slate-700 text-slate-200 hover:bg-slate-800'
                )}
              >
                {code ? (
                  <ReactCountryFlag
                    countryCode={code}
                    svg
                    className="w-4 h-4 rounded-full shadow-sm"
                    style={{
                      width: '1rem',
                      height: '1rem',
                      borderRadius: '9999px',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <span className="text-base">🌍</span>
                )}
                <span className="hidden sm:inline-block max-w-[80px] truncate">
                  {country}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ==== KARTU SWIPE TUNGGAL ==== */}
      <div className="relative w-[320px] sm:w-[360px] ">
        {!currentNews ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-3xl border border-dashed border-slate-700/80 text-slate-400 text-sm">
            {filterCountry
              ? `No more cards for ${filterCountry}.`
              : 'No more cards.'}
          </div>
        ) : (
          (() => {
            const code = getCountryCode(currentNews.country);

            return (
              <article
                ref={cardRef}
                className={classNames(
                  'absolute inset-0 mx-auto w-full max-w-[360px]',
                  'flex flex-col rounded-3xl overflow-hidden',
                  'bg-slate-950/95 border border-slate-700/80 shadow-[0_18px_60px_rgba(0,0,0,0.7)]',
                  'backdrop-blur-xl touch-pan-y select-none',
                  'relative' // penting untuk overlay glow
                )}
              >
                {/* overlay glow hijau / merah saat drag */}
                <div
                  data-glow-overlay
                  className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen z-10"
                />

                {/* badge LONG / SHORT saat swipe */}
                <div className="pointer-events-none absolute inset-0">
                  {/* LONG */}
                  <div
                    data-swipe-long
                    className="absolute top-4 left-4 px-3 py-1.5
               border-2 border-emerald-400 text-emerald-400
               rounded-xl text-sm font-bold tracking-widest
               opacity-0 scale-90 
               bg-emerald-950/30 backdrop-blur z-30"
                  >
                    LONG
                  </div>

                  {/* SHORT */}
                  <div
                    data-swipe-short
                    className="absolute top-4 right-4 px-3 py-1.5
               border-2 border-rose-400 text-rose-400
               rounded-xl text-sm font-bold tracking-widest
               opacity-0 scale-90 
               bg-rose-950/30 backdrop-blur z-30"
                  >
                    SHORT
                  </div>
                </div>

                {/* gambar */}
                <div className="relative h-64 w-full overflow-hidden">
                  <img
                    src={currentNews.imageUrl}
                    alt={currentNews.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 flex items-center gap-2">
                    {code ? (
                      <ReactCountryFlag
                        countryCode={code}
                        svg
                        className="drop-shadow-sm"
                        style={{
                          width: '1.5rem',
                          height: '1.5rem',
                          borderRadius: '9999px',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <span className="text-xl drop-shadow-sm">🌍</span>
                    )}
                    <span className="text-[10px] uppercase tracking-[0.24em] text-slate-100/85">
                      {currentNews.country}
                    </span>
                  </div>
                </div>

                {/* konten berita */}
                <div className="flex-1 flex flex-col gap-3 px-4 pt-4 pb-3 bg-gradient-to-b from-slate-950/95 via-slate-950/90 to-slate-950">
                  <h2 className="text-base sm:text-lg font-semibold text-slate-50 leading-snug line-clamp-2">
                    {currentNews.title}
                  </h2>
                  <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-4">
                    {currentNews.description}
                  </p>

                  {/* hint swipe di bagian bawah */}
                  <div className="mt-auto pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                    <span>➡ Long • ⬅ Short • ⬆ Skip</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live idea
                    </span>
                  </div>
                </div>
              </article>
            );
          })()
        )}

        {/* badge animasi ketika action selesai */}
        {lastAction && (
          <div className="pointer-events-none absolute top-5 inset-x-0 flex justify-center">
            <span
              className={classNames(
                'px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide shadow-lg backdrop-blur',
                lastAction === 'long' && 'bg-emerald-500/95 text-emerald-950',
                lastAction === 'short' && 'bg-rose-500/95 text-rose-950',
                lastAction === 'skip' && 'bg-slate-400/95 text-slate-950'
              )}
            >
              {lastAction === 'long'
                ? 'Marked as LONG'
                : lastAction === 'short'
                ? 'Marked as SHORT'
                : 'Skipped'}
            </span>
          </div>
        )}
      </div>

      {/* ==== TOMBOL AKSI SEPERTI TINDER ==== */}
      <div className="flex w-[320px] sm:w-[360px] gap-3">
        {/* SHORT */}
        <button
          type="button"
          disabled={!hasCard}
          onClick={() => hasCard && handleSwipeComplete('short')}
          className={classNames(
            'flex-1 py-2 rounded-full text-xs font-semibold border transition',
            'border-rose-500/70 text-rose-100 bg-rose-950/40',
            'hover:bg-rose-500/90 hover:text-rose-950 hover:border-rose-400',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-rose-950/40 disabled:hover:text-rose-100'
          )}
        >
          Short
        </button>

        {/* SKIP */}
        <button
          type="button"
          disabled={!hasCard}
          onClick={() => hasCard && handleSwipeComplete('skip')}
          className={classNames(
            'flex-1 py-2 rounded-full text-xs font-semibold border transition',
            'border-slate-500/70 text-slate-100 bg-slate-900/60',
            'hover:bg-slate-300/90 hover:text-slate-900 hover:border-slate-200',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-900/60 disabled:hover:text-slate-100'
          )}
        >
          Skip
        </button>

        {/* LONG */}
        <button
          type="button"
          disabled={!hasCard}
          onClick={() => hasCard && handleSwipeComplete('long')}
          className={classNames(
            'flex-1 py-2 rounded-full text-xs font-semibold border transition',
            'border-emerald-500/70 text-emerald-100 bg-emerald-950/40',
            'hover:bg-emerald-500/90 hover:text-emerald-950 hover:border-emerald-400',
            'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-950/40 disabled:hover:text-emerald-100'
          )}
        >
          Long
        </button>
      </div>
    </div>
  );
};
