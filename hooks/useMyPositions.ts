import { useAccount, useReadContract, useReadContracts } from "wagmi";
import { COUNTRY_TRADING_ADDRESS, countryTradingAbi } from "@/config/contracts";
import { formatUnits, hexToString } from "viem";

type PositionStruct = {
  countryCode: `0x${string}`;
  isLong: boolean;
  collateralAmount: bigint;
  positionSize: bigint;
  entryPrice: bigint;
  entryTimestamp: bigint;
  lastFundingTimestamp: bigint;
};

type ContractCallResult = {
    result?: unknown;
    status: "success" | "failure" | "pending"; 
    error?: unknown;
};

export function useMyPositions() {
  const { address } = useAccount();

  const { data: rawPositionIds } = useReadContract({
    address: COUNTRY_TRADING_ADDRESS,
    abi: countryTradingAbi,
    functionName: "getUserPositions",
    args: [address!],
    query: { enabled: !!address, refetchInterval: 5000 }
  });

  const positionIds = rawPositionIds as bigint[] | undefined;

  const positionDetailsCalls = positionIds?.map((id) => ({
    address: COUNTRY_TRADING_ADDRESS,
    abi: countryTradingAbi,
    functionName: "getPosition",
    args: [address!, id],
  })) || [];

  const positionPnLCalls = positionIds?.map((id) => ({
    address: COUNTRY_TRADING_ADDRESS,
    abi: countryTradingAbi,
    functionName: "getPositionPnL",
    args: [address!, id],
  })) || [];

  const { data: detailsData, isLoading: isLoadingDetails } = useReadContracts({
    contracts: [...positionDetailsCalls, ...positionPnLCalls],
    query: { enabled: !!positionIds && positionIds.length > 0, refetchInterval: 5000 }
  });

  const formattedPositions = positionIds?.map((id, index) => {
    const detailItem = detailsData?.[index] as ContractCallResult | undefined;
    const pnlItem = detailsData?.[index + positionIds.length] as ContractCallResult | undefined;

    if (!detailItem || detailItem.status !== "success" || !detailItem.result) return null;
    
    const detailResult = detailItem.result as unknown as PositionStruct;

    let pnlResult: [bigint, bigint] | undefined = undefined;
    if (pnlItem?.status === "success" && pnlItem.result) {
        pnlResult = pnlItem.result as unknown as [bigint, bigint];
    }

    let countryName = "Unknown";
    try {
        countryName = hexToString(detailResult.countryCode, { size: 32 }).replace(/\0/g, '');
    } catch (e) { 
        console.error("Error parsing country code", e); 
    }

    return {
      id: id.toString(),
      countryCode: countryName,
      isLong: detailResult.isLong,
      collateral: formatUnits(detailResult.collateralAmount, 18),
      size: formatUnits(detailResult.positionSize, 18),
      entryPrice: formatUnits(detailResult.entryPrice, 18),
      
      pnl: pnlResult ? formatUnits(pnlResult[0], 18) : "0",
      currentPrice: pnlResult ? formatUnits(pnlResult[1], 18) : "0",
      
      entryTime: new Date(Number(detailResult.entryTimestamp) * 1000).toLocaleString(),
    };
  }).filter(Boolean) || [];

  return {
    positions: formattedPositions,
    isLoading: isLoadingDetails,
    isEmpty: !positionIds || positionIds.length === 0
  };
}