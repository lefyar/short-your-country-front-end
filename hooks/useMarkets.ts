"use client";

import { useReadContract } from "wagmi";
import { CountryRegistryAbi, COUNTRY_REGISTRY_ADDRESS } from "@/config/contracts";

export type Market = {
  id: string;
  name: string;
  symbol: string;
  basePrice: number;
  change24h: number;
  volume24h: number;
  isActive: boolean;
};

const COUNTRY_SYMBOL_MAP: Record<string, string> = {
  "United States": "USA",
  "Indonesia": "IDN",
  "Singapore": "SG",
  "Japan": "JPN",
  "China": "CN",
  // Tambahkan negara lain di sini jika ada
};

const getSymbolByName = (name: string): string => {
  if (COUNTRY_SYMBOL_MAP[name]) {
    return COUNTRY_SYMBOL_MAP[name];
  }
  
  return name.substring(0, 3).toUpperCase();
};

export function useMarkets() {
  const { data: countries, isLoading, error } = useReadContract({
    address: COUNTRY_REGISTRY_ADDRESS,
    abi: CountryRegistryAbi,
    functionName: "getAllCountries",
  });

  const markets: Market[] =
    countries?.map((c) => {
      const symbol = getSymbolByName(c.name);

      return {
        id: c.countryCode, 
        name: c.name,      
        symbol: symbol,    
        basePrice: 0,
        isActive: c.isActive,
        change24h: (Math.random() * 5) - 2.5,
        volume24h: Math.floor(Math.random() * 1_000_000) + 500_000,
      };
    }) || [];

  return { markets, isLoading, error };
}