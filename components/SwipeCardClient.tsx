"use client";

import { SwipeCard } from "@/components/layout/SwipeCard";
import type { DerivativeNews } from "@/components/types/derivativenews";
import { useTrade } from "@/hooks/useTrade";

// Helper yang diperbarui (Sudah support Singapore & logic lebih aman)
function getCountryCode(country: string | undefined | null): string | null {
  if (!country) return null;
  const c = country.toLowerCase().trim();

  if (['us', 'usa', 'united states'].some((k) => c.includes(k))) return 'US';
  if (['uk', 'gb', 'britain', 'united kingdom'].some((k) => c.includes(k))) return 'GB';
  if (['eu', 'euro'].some((k) => c.includes(k))) return 'EU';
  if (['japan', 'jp'].some((k) => c.includes(k))) return 'JP';
  if (['china', 'cn'].some((k) => c.includes(k))) return 'CN';
  if (['indonesia', 'id'].some((k) => c.includes(k))) return 'ID';
  if (['india', 'in'].some((k) => c.includes(k))) return 'IN';
  // Tambahan Singapore yang sebelumnya hilang
  if (['singapore', 'sg'].some((k) => c.includes(k))) return 'SG';

  return null;
}

export default function SwipeCardClient({
  newsList,
}: {
  newsList: DerivativeNews[];
}) {
  const { openLong, openShort } = useTrade();

  const handleLong = async (news: DerivativeNews, amount: number) => {
    const countryCode = getCountryCode(news.country);
    
    // Debugging: Cek apa yang terbaca
    console.log(`[LONG] Country: ${news.country} -> Code: ${countryCode}`);

    if (!countryCode) {
      console.error(`Invalid country code for: ${news.country}`);
      return;
    }
    
    // Kirim amount sebagai string ke hook
    await openLong(amount.toString(), countryCode);
  };

  const handleShort = async (news: DerivativeNews, amount: number) => {
    const countryCode = getCountryCode(news.country);

    // Debugging
    console.log(`[SHORT] Country: ${news.country} -> Code: ${countryCode}`);

    if (!countryCode) {
      console.error(`Invalid country code for: ${news.country}`);
      return;
    }

    await openShort(amount.toString(), countryCode);
  };

  return (
    <SwipeCard 
      newsList={newsList} 
      onLong={handleLong} 
      onShort={handleShort} 
    />
  );
}