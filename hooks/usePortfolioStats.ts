import { useAccount, useReadContracts } from "wagmi";
import {
  COLLATERAL_TOKEN_ADDRESS,
  COUNTRY_TRADING_ADDRESS,
  countryTradingAbi,
  erc20Abi,
} from "@/config/contracts";
import { formatUnits } from "viem";

export function usePortfolioStats() {
  const { address } = useAccount();

  const { data, isPending, refetch } = useReadContracts({
    contracts: [
      {
        address: COLLATERAL_TOKEN_ADDRESS,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address!],
      },
      {
        address: COUNTRY_TRADING_ADDRESS,
        abi: countryTradingAbi,
        functionName: "getCollateralBalance",
        args: [address!],
      },
    ],
    query: {
      enabled: !!address,
      refetchInterval: 5000,
    },
  });

  const walletBalance =
    data?.[0]?.status === "success"
      ? formatUnits(data[0].result as bigint, 18)
      : "0";

  const protocolCollateral =
    data?.[1]?.status === "success"
      ? formatUnits(data[1].result as bigint, 18)
      : "0";

  return {
    walletBalance,
    protocolCollateral,
    isLoading: isPending,
    refetchStats: refetch,
  };
}
