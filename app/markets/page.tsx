"use client";

import { useState, useEffect, useCallback } from "react";
import { useReadContract } from "wagmi";
import { formatUnits } from "viem";
import { NationMarketChart } from "@/components/charts/NationMarketChart"; 
import { useMarkets, Market } from "@/hooks/useMarkets";
import {
  CountryRegistryAbi,
  COUNTRY_REGISTRY_ADDRESS,
} from "@/config/contracts"; 

type Timeframe = "1m" | "5m" | "1h" | "1d";
type ChartType = "area" | "candlestick";

const MarketPriceFetcher = ({
  marketId,
  onPriceUpdate,
}: {
  marketId: string;
  onPriceUpdate: (price: number) => void;
}) => {
  const { data } = useReadContract({
    address: COUNTRY_REGISTRY_ADDRESS,
    abi: CountryRegistryAbi,
    functionName: "getCountryPrice",
    args: [marketId as `0x${string}`],
    query: {
      refetchInterval: 2000, 
    },
  });

  useEffect(() => {
    if (data) {
      const priceFloat = parseFloat(formatUnits(data[0], 18));
      onPriceUpdate(priceFloat);
    }
  }, [data, onPriceUpdate]);

  return null;
};

export default function MarketsPage() {
  const { markets: contractMarkets, isLoading } = useMarkets();

  const [selected, setSelected] = useState<Market | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [timeframe, setTimeframe] = useState<Timeframe>("1m");
  const [chartType, setChartType] = useState<ChartType>("area");

  useEffect(() => {
    if (contractMarkets.length > 0 && !selected) {
      setSelected(contractMarkets[0]);
    }
  }, [contractMarkets, selected]);

  const handlePriceUpdate = useCallback((id: string, price: number) => {
    setPrices((prev) => {
      if (prev[id] === price) {
        return prev;
      }

      return { ...prev, [id]: price };
    });
  }, []);

  const timeframes: Timeframe[] = ["1m", "5m", "1h", "1d"];

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-slate-400">
        <div className="text-center">
          <p className="animate-pulse text-xl font-semibold">
            Loading On-Chain Data...
          </p>
        </div>
      </div>
    );
  }

  const activeMarket = selected || contractMarkets[0];
  const activePrice = activeMarket ? prices[activeMarket.id] || 0 : 0;

  return (
    <div className="min-h-[70vh] px-4 py-6 md:px-8 lg:py-10">

      {contractMarkets.map((mkt) => (
        <MarketPriceFetcher
          key={mkt.id}
          marketId={mkt.id}
          onPriceUpdate={(p) => handlePriceUpdate(mkt.id, p)}
        />
      ))}

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row">

        <div className="w-full lg:w-1/3">
          <h1 className="text-lg font-semibold text-slate-50">Markets</h1>
          <div className="mt-4 space-y-2">
            {contractMarkets.map((mkt) => {
              const isActive = selected?.id === mkt.id;
              const currentPrice = prices[mkt.id] || 0;
              const isPositive = mkt.change24h >= 0;

              return (
                <button
                  key={mkt.id}
                  onClick={() => setSelected(mkt)}
                  className={[
                    "w-full rounded-2xl border px-3 py-3 text-left text-xs transition-colors",
                    isActive
                      ? "border-emerald-500/60 bg-emerald-500/10"
                      : "border-slate-800 bg-slate-950/60 hover:border-slate-700",
                  ].join(" ")}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-100">{mkt.name}</p>
                      <p className="text-[11px] text-slate-400">{mkt.symbol}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-100">
                        $
                        {currentPrice.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>
                      <p
                        className={`text-[11px] ${
                          isPositive ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {mkt.change24h.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full space-y-4 lg:w-2/3">
          {activeMarket && (
            <>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {activeMarket.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Oracle Price Feed
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-slate-50">
                    $
                    {activePrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>

              <NationMarketChart
                symbol={activeMarket.symbol}
                basePrice={activePrice}
                timeframe={timeframe}
                chartType={chartType}
              />

              {/* Dummy Info Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/50">
                  <p className="text-xs text-slate-400">Leverage</p>
                  <p className="text-sm font-bold text-white">1x</p>
                </div>
                <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/50">
                  <p className="text-xs text-slate-400">Fee</p>
                  <p className="text-sm font-bold text-white">0.1%</p>
                </div>
                <div className="p-3 border border-slate-800 rounded-xl bg-slate-950/50">
                  <p className="text-xs text-slate-400">Liquidation</p>
                  <p className="text-sm font-bold text-white">85%</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
