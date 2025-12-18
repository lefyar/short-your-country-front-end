"use client";

import { useState } from "react";
import { usePortfolioStats } from "@/hooks/usePortfolioStats";
import { useMyPositions } from "@/hooks/useMyPositions";
import { usePortfolioActions } from "@/hooks/usePortfolioActions";
import { MantleSepoliaBalance } from "@/components/portofolio/MantleSepoliaBalance";
import { usePublicClient } from "wagmi";

export default function PortfolioPage() {
  const { walletBalance, protocolCollateral, refetchStats } =
    usePortfolioStats();
  const { positions, isLoading: loadingPositions } = useMyPositions();
  const { deposit, withdraw, isApproving, isPending } = usePortfolioActions();
  
  const publicClient = usePublicClient();

  const [amount, setAmount] = useState("");
  
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "loading";
    message: string;
    hash?: string; // Opsional: simpan hash buat link ke explorer
  } | null>(null);

  const handleTransaction = async (actionType: "deposit" | "withdraw") => {
    setFeedback(null);
    
    if (!amount || parseFloat(amount) <= 0) {
      setFeedback({ type: "error", message: "Please enter a valid amount." });
      return;
    }

    try {
      setFeedback({ 
        type: "loading", 
        message: "Please sign the transaction in your wallet..." 
      });

      let txHash;

      if (actionType === "deposit") {
        txHash = await deposit(amount);
      } else {
        txHash = await withdraw(amount);
      }

      if (txHash) {
        setFeedback({ 
          type: "loading", 
          message: "Transaction sent! Waiting for confirmation...",
          hash: txHash
        });

        if (publicClient) {
            await publicClient.waitForTransactionReceipt({ 
                hash: txHash 
            });
        }

        setFeedback({
          type: "success",
          message: `${actionType === 'deposit' ? 'Deposit' : 'Withdraw'} confirmed successfully!`,
          hash: txHash
        });

        setAmount("");
        refetchStats();
      }

    } catch (err: any) {
      console.error(err);
      setFeedback({ 
        type: "error", 
        message: err.message || "Transaction failed or rejected." 
      });
    }
  };

  return (
    <div className="p-8 space-y-8 text-white bg-slate-900 min-h-screen">
      <h1 className="text-3xl font-bold">Portfolio</h1>

      {/* --- SECTION 1: BALANCES --- */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-slate-800 rounded-lg">
          <h3 className="text-gray-400">Wallet Balance (USDT)</h3>
          <p className="text-2xl font-mono">{walletBalance}</p>
        </div>
        <div className="p-4 bg-slate-800 rounded-lg border border-blue-500">
          <h3 className="text-blue-400">Collateral in Protocol</h3>
          <p className="text-2xl font-mono">{protocolCollateral}</p>
        </div>
      </div>

      {/* --- SECTION 2: ACTIONS --- */}
      <div className="p-6 bg-slate-800 rounded-lg space-y-4">
        <h3 className="text-xl font-semibold">Manage Collateral</h3>

        {/* FEEDBACK ALERT BOX */}
        {feedback && (
          <div
            className={`p-4 rounded border flex items-center gap-3 ${
              feedback.type === "success"
                ? "bg-green-900/30 border-green-500 text-green-200"
                : feedback.type === "error"
                ? "bg-red-900/30 border-red-500 text-red-200"
                : "bg-blue-900/30 border-blue-500 text-blue-200"
            }`}
          >
            {/* Logic Icon Loading */}
            {feedback.type === "loading" && (
                <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}
            
            <div className="flex flex-col">
                <span className="font-medium">{feedback.message}</span>
                {feedback.hash && (
                    <a 
                        href={`https://explorer.sepolia.mantle.xyz/tx/${feedback.hash}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs underline opacity-80 hover:opacity-100 mt-1"
                    >
                        View on Explorer
                    </a>
                )}
            </div>
          </div>
        )}

        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="text-sm text-gray-400 mb-1 block">
              Amount (USDT)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="p-3 rounded bg-slate-700 text-white w-full border border-slate-600 focus:border-blue-500 outline-none"
              placeholder="0.00"
              disabled={isPending || feedback?.type === "loading"}
            />
          </div>

          <button
            onClick={() => handleTransaction("deposit")}
            disabled={!amount || isPending || feedback?.type === "loading"}
            className={`px-6 py-3 rounded font-medium transition-colors ${
              isPending || feedback?.type === "loading"
                ? "bg-slate-600 cursor-not-allowed text-gray-400"
                : "bg-green-600 hover:bg-green-500 text-white cursor-pointer"
            }`}
          >
            {isPending && isApproving
              ? "Approving..."
              : feedback?.type === "loading"
              ? "Processing..."
              : "Deposit"}
          </button>

          <button
            onClick={() => handleTransaction("withdraw")}
            disabled={!amount || isPending || feedback?.type === "loading"}
            className={`px-6 py-3 rounded font-medium transition-colors ${
              isPending || feedback?.type === "loading"
                ? "bg-slate-600 cursor-not-allowed text-gray-400"
                : "bg-red-600 hover:bg-red-500 text-white"
            }`}
          >
            {feedback?.type === "loading" ? "Processing..." : "Withdraw"}
          </button>
        </div>
      </div>

      <div>
        <MantleSepoliaBalance />
      </div>

      {/* --- SECTION 3: POSITIONS --- */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Open Positions</h2>
        {loadingPositions ? (
          <p>Loading positions...</p>
        ) : positions.length === 0 ? (
          <p className="text-gray-500">No active positions.</p>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-gray-400 border-b border-slate-700">
                <th className="p-2">Country</th>
                <th className="p-2">Side</th>
                <th className="p-2">Size</th>
                <th className="p-2">Entry Price</th>
                <th className="p-2">Current Price</th>
                <th className="p-2">PnL</th>
              </tr>
            </thead>
            <tbody>
              {positions.map((pos) => {
                if (!pos) return null;
                return (
                  <tr
                    key={pos.id}
                    className="border-b border-slate-800 hover:bg-slate-800"
                  >
                    <td className="p-2 font-bold">{pos?.countryCode}</td>
                    <td
                      className={`p-2 ${
                        pos.isLong ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {pos.isLong ? "LONG" : "SHORT"}
                    </td>
                    <td className="p-2">{Number(pos.size).toFixed(2)}</td>
                    <td className="p-2">
                      ${Number(pos.entryPrice).toFixed(4)}
                    </td>
                    <td className="p-2">
                      ${Number(pos.currentPrice).toFixed(4)}
                    </td>
                    <td
                      className={`p-2 ${
                        Number(pos.pnl) >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {Number(pos.pnl).toFixed(4)} USDT
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}