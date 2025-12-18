import type { Metadata } from 'next';
import './globals.css';
import { ReactNode } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Web3Provider } from '../lib/WalletConfig';
export const metadata: Metadata = {
  title: 'Geo Bet',
  description: 'On-chain long/short index of nations',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100">
        <Web3Provider>
          <Navbar />
          <main className="mx-auto max-w-7xl px-4 pb-10 pt-6">{children}</main>
        </Web3Provider>
      </body>
    </html>
  );
}
