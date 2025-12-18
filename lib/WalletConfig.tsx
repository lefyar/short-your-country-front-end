"use client";

import "@rainbow-me/rainbowkit/styles.css";
import {
  getDefaultConfig,
  RainbowKitProvider,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import {
  mainnet,
  base,
  sepolia,
  baseSepolia,
  mantleSepoliaTestnet,
} from "wagmi/chains";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import type { ReactNode } from "react";

const queryClient = new QueryClient();

// sesuaikan chains sama kebutuhan kamu (misal cuma baseSepolia)
export const wagmiConfig = getDefaultConfig({
  appName: "Nation Index",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
  chains: [baseSepolia, base, sepolia, mainnet, mantleSepoliaTestnet],
  ssr: true,
  // optiona  l: custom RPC
  // transports: {
  //   [baseSepolia.id]: http("https://base-sepolia.g.alchemy.com/v2/XXX"),
  // },
});

type Web3ProviderProps = {
  children: ReactNode;
};

export function Web3Provider({ children }: Web3ProviderProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}