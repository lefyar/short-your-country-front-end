import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ReactNode } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Web3Provider } from '../lib/WalletConfig';
import BottomNavbar from '@/components/layout/BottomNavbar';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Geo Bet',
  description: 'On-chain long/short index of nations',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-950 text-slate-100`}>
        <Web3Provider>
          <Navbar />
          <main className="mx-auto max-w-5xl px-4">{children}</main>
          <BottomNavbar />
        </Web3Provider>
      </body>
    </html>
  );
}