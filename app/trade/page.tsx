import { Suspense } from 'react';
import { fetchDerivativeNews } from '@/lib/newsClient';
import SwipeCardClient from '@/components/SwipeCardClient';

async function NewsSwipeContent() {
  const newsList = await fetchDerivativeNews();

  if (newsList.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto text-center py-12 text-slate-200">
        No news available yet.
      </div>
    );
  }

  return <SwipeCardClient newsList={newsList} />;
}

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="flex justify-center">
        <NewsSwipeContent />
      </main>
    </Suspense>
  );
}
