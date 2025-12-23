import { Wallet, BarChart3, TrendingUp } from 'lucide-react';
// config/navigation.ts
export type NavItem = {
  href: string;
  label: string;
  icon?: any;
};

export const bottomNav: NavItem[] = [
  { href: "/markets", label: "Markets", icon: BarChart3 },
  { href: "/trade", label: "Trade", icon: TrendingUp },
  { href: "/portofolio", label: "Portofolio", icon: Wallet },
];

export const mainNav: NavItem[] = [
  { href: "/", label: "Dashboard" },
  ...bottomNav,
  { href: "/strategies", label: "Strategies" },
  { href: "/docs", label: "Docs" },
];
