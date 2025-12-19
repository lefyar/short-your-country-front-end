"use client";

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  AreaSeries,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type Time,
} from "lightweight-charts";

export type Timeframe = "1m" | "5m" | "1h" | "1d";
export type ChartType = "area" | "candlestick";

type NationMarketChartProps = {
  symbol: string;
  basePrice: number;
  timeframe: Timeframe;
  chartType: ChartType;
};

function generateFakeHistory(endPrice: number, count: number = 100) {
  const data = [];
  const now = Math.floor(Date.now() / 1000);

  for (let i = count; i > 0; i--) {
    const timePoint = (now - (i * 60)) as Time;
    const noise = (Math.random() - 0.5) * (endPrice * 0.02);
    const val = endPrice + noise;

    data.push({
      time: timePoint,
      value: val,
      open: val - 1,
      high: val + 2,
      low: val - 2,
      close: val,
    });
  }

  data.push({
    time: now as Time,
    value: endPrice,
    open: endPrice - 0.5,
    high: endPrice + 0.5,
    low: endPrice - 0.5,
    close: endPrice
  });

  return data;
}

export function NationMarketChart({
  symbol,
  basePrice,
  timeframe,
  chartType,
}: NationMarketChartProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Area"> | ISeriesApi<"Candlestick"> | null>(null);
  
  const lastPriceRef = useRef<number>(basePrice);

  const isDataReady = basePrice > 0;

  useEffect(() => {
    if (!containerRef.current || !isDataReady) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#020617" },
        textColor: "#e2e8f0",
      },
      grid: {
        vertLines: { color: "#1e293b", style: 2 },
        horzLines: { color: "#1e293b", style: 2 },
      },
      width: containerRef.current.clientWidth,
      height: 360,
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        borderColor: "#1e293b",
      },
      rightPriceScale: {
        borderColor: "#1e293b",
      },
      crosshair: { mode: 1 },
    });

    let initialData = generateFakeHistory(basePrice);
    
    initialData = initialData.filter((item, index, self) => 
        index === self.findIndex((t) => t.time === item.time)
    );
    initialData.sort((a, b) => (a.time as number) - (b.time as number));

    let newSeries;
    
    if (chartType === "area") {
      newSeries = chart.addSeries(AreaSeries, {
        lineColor: "#22c55e",
        topColor: "rgba(34, 197, 94, 0.4)",
        bottomColor: "rgba(15, 23, 42, 0.0)",
        lineWidth: 2,
      });
      newSeries.setData(initialData.map(d => ({ time: d.time, value: d.value })));
    } else {
      newSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#22c55e",
        downColor: "#ef4444",
        borderVisible: false,
        wickUpColor: "#22c55e",
        wickDownColor: "#ef4444",
      });
      newSeries.setData(initialData);
    }

    chart.timeScale().fitContent();

    chartRef.current = chart;
    seriesRef.current = newSeries;
    lastPriceRef.current = basePrice;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove(); 
        chartRef.current = null;   
        seriesRef.current = null;
      }
    };

  }, [symbol, chartType, isDataReady]); 

  useEffect(() => {
    if (!seriesRef.current || !isDataReady) return;
    if (basePrice === lastPriceRef.current) return;

    const now = Math.floor(Date.now() / 1000) as Time;
    const newPoint = {
      time: now,
      value: basePrice,
      open: lastPriceRef.current,
      high: Math.max(lastPriceRef.current, basePrice),
      low: Math.min(lastPriceRef.current, basePrice),
      close: basePrice
    };

    try {
      seriesRef.current.update(newPoint);
    } catch (err) {
      console.warn("Chart update warning:", err);
    }
    
    lastPriceRef.current = basePrice;
  }, [basePrice, isDataReady]); 

  return (
    <div className="relative h-[360px] w-full rounded-2xl border border-slate-800 bg-slate-950/60 p-2">
       
       {!isDataReady && (
         <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 z-20 rounded-2xl">
            <p className="text-sm text-slate-400 animate-pulse">Waiting for Oracle Price...</p>
         </div>
       )}

       {isDataReady && (
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 pointer-events-none">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider shadow-sm">
              Live
            </span>
        </div>
       )}

      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}