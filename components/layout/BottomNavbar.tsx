'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { bottomNav } from '@/config/Navigation';
import clsx from 'clsx';

export default function BottomNavbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/80 backdrop-blur-md md:hidden">
      <div className="mx-auto flex max-w-md justify-around px-6 py-3">
        {bottomNav.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              href={item.href}
              className={clsx(
                'flex flex-col items-center gap-1 text-xs transition',
                isActive ? 'text-cyan-400' : 'text-gray-400 hover:text-white'
              )}
            >
              {Icon && (
                <Icon
                  size={22}
                  className={clsx(
                    isActive && 'drop-shadow-[0_0_6px_rgba(34,211,238,0.8)]'
                  )}
                />
              )}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
