'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { mainNav } from '@/config/Navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight text-slate-50">
            Geo<span className="text-emerald-400">Bit</span>
          </span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-1">
          {mainNav.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                  isActive
                    ? 'bg-white font-semibold text-slate-950'
                    : 'text-slate-100 hover:bg-slate-800 hover:text-slate-50',
                ].join(' ')}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Wallet - Mobile */}
        <div className="md:hidden">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              if (!mounted) return null;

              // Not connected
              if (!account || !chain) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black"
                  >
                    Connect
                  </button>
                );
              }

              // Wrong network
              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="rounded-full border border-rose-500 px-3 py-1 text-xs font-semibold text-rose-400"
                  >
                    Wrong
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-1.5">
                  {/* Network */}
                  <button
                    onClick={openChainModal}
                    className="flex items-center gap-1 rounded-full border border-slate-700 px-2 py-1 text-[10px] text-slate-200"
                  >
                    {chain.hasIcon && chain.iconUrl && (
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundImage: `url(${chain.iconUrl})`,
                          backgroundSize: 'cover',
                        }}
                      />
                    )}
                    {chain.name}
                  </button>

                  {/* Wallet */}
                  <button
                    onClick={openAccountModal}
                    className="rounded-full bg-white px-2 py-1 font-semibold text-[10px] text-black"
                  >
                    {account.displayName}
                  </button>
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>

        {/* Wallet - Desktop */}
        <div className="hidden md:flex items-center gap-2">
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              if (!mounted) return null;

              if (!account || !chain) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold bg-white text-black hover:bg-emerald-500"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="rounded-full border border-rose-500 px-3 py-1.5 text-xs text-rose-300"
                  >
                    Wrong Network
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-2">
                  <button
                    onClick={openChainModal}
                    className="rounded-full border border-slate-700 px-2 py-1 text-[11px] text-slate-200"
                  >
                    {chain.name}
                  </button>
                  <button
                    onClick={openAccountModal}
                    className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-emerald-400"
                  >
                    {account.displayName}
                  </button>
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </nav>
    </header>
  );
}
