'use client';

import { SwipeCard } from '@/components/layout/SwipeCard';
import type { DerivativeNews } from '@/components/types/derivativenews';
import { useTrade } from '@/hooks/useTrade';

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

export default function SwipeCardClient({
  newsList,
}: {
  newsList: DerivativeNews[];
}) {
  const { openLong, openShort } = useTrade();

  const handleLong = async (news: DerivativeNews, amount: number) => {
    console.log('LONG from client:', getCountryCode(news.country));
    const countryCode = getCountryCode(news.country);
    if (countryCode === null) {
      console.error('Invalid country code');
      return;
    }
    await openLong(amount.toString(), countryCode);
  };

  const handleShort = async (news: DerivativeNews, amount: number) => {
    console.log('SHORT from client:', getCountryCode(news.country));
    const countryCode = getCountryCode(news.country);
    if (countryCode === null) {
      console.error('Invalid country code');
      return;
    }
    await openShort(amount.toString(), countryCode);
  };

  return (
    <SwipeCard newsList={newsList} onLong={handleLong} onShort={handleShort} />
  );
}
