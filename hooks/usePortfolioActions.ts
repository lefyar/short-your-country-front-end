import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from "wagmi";
import {
  COLLATERAL_TOKEN_ADDRESS,
  COUNTRY_TRADING_ADDRESS,
  countryTradingAbi,
  erc20Abi,
} from "@/config/contracts";
import { parseUnits, maxUint256 } from "viem";
import { useState } from "react";

export function usePortfolioActions() {
  const { address } = useAccount();
  const [isApproving, setIsApproving] = useState(false);
  const [isPending, setIspending] = useState(false);

  const { writeContractAsync } = useWriteContract();

  const { data: currentAllowance, refetch: refetchAllowance } = useReadContract(
    {
      address: COLLATERAL_TOKEN_ADDRESS,
      abi: erc20Abi,
      functionName: "allowance",
      args: [address!, COUNTRY_TRADING_ADDRESS],
    }
  );

  const parseError = (error: any) => {
    const msg = error?.message || "Unknown error";
    if (msg.includes("User rejected") || msg.includes("User denied")) {
      return "Transaction rejected by user.";
    }
    if (msg.includes("Insufficient funds") || msg.includes("exceeds balance")) {
      return "Insufficient wallet balance (ETH/USDT).";
    }
    if (msg.includes("CountryTrading:")) {
       return msg.split("CountryTrading:")[1].split("\n")[0];
    }
    return "Transaction failed. Please try again.";
  };

  const handleDeposit = async (amountStr: string) => {
    try {
      const amount = parseUnits(amountStr, 18);

      if (
        currentAllowance === undefined ||
        (currentAllowance as bigint) < amount
      ) {
        setIsApproving(true);
        const approveTx = await writeContractAsync({
          address: COLLATERAL_TOKEN_ADDRESS,
          abi: erc20Abi,
          functionName: "approve",
          args: [COUNTRY_TRADING_ADDRESS, maxUint256],
        });

        console.log("Approving...", approveTx);
      }
      setIsApproving(false);

      const tx = await writeContractAsync({
        address: COUNTRY_TRADING_ADDRESS,
        abi: countryTradingAbi,
        functionName: "deposit",
        args: [amount],
      });

      return tx;
    } catch (error) {
      console.error("Deposit Error:", error);
      setIsApproving(false);
      throw error;
    }
  };

  const handleWithdraw = async (amountStr: string) => {
    try {
      const amount = parseUnits(amountStr, 18);
      const tx = await writeContractAsync({
        address: COUNTRY_TRADING_ADDRESS,
        abi: countryTradingAbi,
        functionName: "withdraw",
        args: [amount],
      });
      return tx;
    } catch (error) {
      console.error("Withdraw Error:", error);
      throw error;
    }
  };

  return {
    deposit: handleDeposit,
    withdraw: handleWithdraw,
    isApproving,
    isPending,
  };
}
