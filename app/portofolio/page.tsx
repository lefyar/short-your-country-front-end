"use client";

import { useState, useMemo } from "react";
import { usePublicClient } from "wagmi";
import {
  ArrowDown,
  ArrowUp,
  X,
  Loader2,
  Wallet,
  TrendingUp,
  Box,
} from "lucide-react";
import { usePortfolioStats } from "@/hooks/usePortfolioStats";
import { useMyPositions } from "@/hooks/useMyPositions";
import { usePortfolioActions } from "@/hooks/usePortfolioActions";

// --- COMPONENTS ---

// Action Modal
const ActionModal = ({
  isOpen,
  type,
  onClose,
  balance,
  onConfirm,
  isPending,
  feedback,
}: {
  isOpen: boolean;
  type: "deposit" | "withdraw";
  onClose: () => void;
  balance: string;
  onConfirm: (amount: string) => void;
  isPending: boolean;
  feedback: { type: string; message: string; hash?: string } | null;
}) => {
  const [amount, setAmount] = useState("");
  if (!isOpen) return null;

  return (
    // Overlay
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      {/* Modal Content */}
      <div className="w-full max-w-sm rounded-3xl border border-neutral-800 bg-[#0A0A0A] p-6 shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold capitalize text-white">
            {type} USDT
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-800 transition text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mb-4 p-3 rounded-xl border text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300 ${
              feedback.type === "success"
                ? "bg-emerald-900/20 border-emerald-500/30 text-emerald-400"
                : feedback.type === "error"
                ? "bg-rose-900/20 border-rose-500/30 text-rose-400"
                : "bg-neutral-800 border-neutral-700 text-neutral-300"
            }`}
          >
            {feedback.type === "loading" && (
              <Loader2 className="w-4 h-4 animate-spin mt-0.5" />
            )}
            <div>
              <p>{feedback.message}</p>
              {feedback.hash && (
                <a
                  href={`https://explorer.sepolia.mantle.xyz/tx/${feedback.hash}`}
                  target="_blank"
                  className="underline text-xs mt-1 block opacity-70 hover:opacity-100"
                >
                  View on Explorer
                </a>
              )}
            </div>
          </div>
        )}

        {/* Input Form */}
        {!feedback?.hash && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-neutral-900 p-4 border border-neutral-800 transition-colors focus-within:border-neutral-700">
              <div className="flex justify-between text-xs mb-2 text-neutral-500">
                <span>Amount</span>
                <span>Max: {parseFloat(balance).toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-transparent text-2xl font-bold text-white placeholder:text-neutral-700 focus:outline-none"
                />
                <button
                  onClick={() => setAmount(balance)}
                  className="text-xs font-bold text-emerald-500 hover:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md transition-colors hover:bg-emerald-500/20"
                >
                  MAX
                </button>
              </div>
            </div>

            <button
              onClick={() => onConfirm(amount)}
              disabled={!amount || isPending || parseFloat(amount) <= 0}
              className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all duration-200 active:scale-[0.98] ${
                isPending
                  ? "bg-neutral-800 text-neutral-500 cursor-not-allowed"
                  : type === "deposit"
                  ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40"
                  : "bg-white hover:bg-neutral-200 text-black shadow-lg shadow-white/10"
              }`}
            >
              {isPending ? "Processing..." : `Confirm ${type}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
export default function PortfolioPage() {
  const publicClient = usePublicClient();

  // Hooks
  const { walletBalance, protocolCollateral, refetchStats } =
    usePortfolioStats();
  const { positions, isLoading: loadingPositions } = useMyPositions();
  const { deposit, withdraw, isPending } = usePortfolioActions();

  // State
  const [modalOpen, setModalOpen] = useState(false);
  const [txType, setTxType] = useState<"deposit" | "withdraw">("deposit");
  const [feedback, setFeedback] = useState<any>(null);

  // Computed Values
  const collateralVal = parseFloat(protocolCollateral || "0");
  const hasVaultBalance = collateralVal > 0;

  // Total Net Worth
  const totalVaultValue = useMemo(() => {
    const totalPnL = positions.reduce((acc, pos) => {
      if (pos && pos.pnl) {
        return acc + parseFloat(pos.pnl);
      }
      return acc;
    }, 0);
    return collateralVal + totalPnL;
  }, [collateralVal, positions]);

  // Handlers
  const openModal = (type: "deposit" | "withdraw") => {
    setTxType(type);
    setFeedback(null);
    setModalOpen(true);
  };

  const handleTransaction = async (amount: string) => {
    setFeedback(null);
    try {
      setFeedback({
        type: "loading",
        message: "Please sign in your wallet...",
      });
      const txHash =
        txType === "deposit" ? await deposit(amount) : await withdraw(amount);

      if (txHash) {
        setFeedback({
          type: "loading",
          message: "Transaction sent...",
          hash: txHash,
        });
        if (publicClient)
          await publicClient.waitForTransactionReceipt({ hash: txHash });

        setFeedback({
          type: "success",
          message: "Transaction confirmed!",
          hash: txHash,
        });
        refetchStats();
      }
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message?.split("\n")[0] || "Failed.",
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans rounded-lg">
      <div className="mx-auto pt-8 px-5">
        
        {/* Header */}
        <header className="mb-6 flex items-center gap-2 animate-in fade-in slide-in-from-top-4 duration-500 ease-out">
          <Wallet className="w-5 h-5 text-emerald-500" />
          <h1 className="text-xl font-bold tracking-tight">Portfolio</h1>
        </header>

        {/* Balance Card */}
        <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-[#0A0A0A] p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-backwards delay-100">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none animate-pulse duration-[3000ms]" />

          <div className="relative z-10">
            <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1">
              Total Value
            </p>
            <h2 className="text-4xl font-bold text-white tracking-tight">
              $
              {totalVaultValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h2>

            {/* Collateral Detail */}
            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-neutral-900 border border-neutral-800 px-3 py-1.5 transition-colors hover:bg-neutral-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <span className="text-xs text-neutral-400">Collateral:</span>
                <span className="text-xs font-bold text-white">
                  ${collateralVal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                onClick={() => openModal("deposit")}
                className="group relative flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-black transition-all duration-200 hover:bg-neutral-200 active:scale-95 shadow-lg shadow-white/5"
              >
                <ArrowDown className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" />
                Deposit
              </button>

              {/* Withdraw Button */}
              {hasVaultBalance ? (
                <button
                  onClick={() => openModal("withdraw")}
                  className="group flex items-center justify-center gap-2 rounded-xl border border-neutral-800 bg-neutral-900 py-3 text-sm font-bold text-white transition-all duration-200 hover:bg-neutral-800 hover:border-neutral-700 active:scale-95"
                >
                  <ArrowUp className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" /> 
                  Withdraw
                </button>
              ) : (
                <div className="flex items-center justify-center rounded-xl border border-neutral-900 bg-neutral-900/50 py-3 text-sm font-medium text-neutral-600 cursor-not-allowed">
                  No funds
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Positions Section */}
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out fill-mode-backwards delay-200">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-sm font-bold text-neutral-400">
              Open Positions
            </h3>
            {positions.length > 0 && (
              <span className="bg-neutral-900 text-white text-[10px] px-2 py-0.5 rounded-full border border-neutral-800 animate-in zoom-in duration-300">
                {positions.length} Active
              </span>
            )}
          </div>

          {loadingPositions ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-neutral-800 bg-[#0A0A0A]">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin mb-2" />
              <p className="text-xs text-neutral-500">Syncing positions...</p>
            </div>
          ) : positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-neutral-800 border-dashed bg-[#0A0A0A]/50 transition-colors hover:border-neutral-700 hover:bg-[#0A0A0A]">
              <Box className="w-10 h-10 text-neutral-700 mb-3" />
              <p className="text-sm font-medium text-neutral-400">
                No active positions
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                Start trading to see activity here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((pos, index) => {
                if (!pos) return null;
                const pnl = parseFloat(pos.pnl || "0");
                const isWin = pnl >= 0;
                return (
                  // Staggered animation delay
                  <div
                    key={pos.id}
                    style={{ animationDelay: `${index * 100}ms` }}
                    className="group relative overflow-hidden rounded-2xl border border-neutral-800 bg-[#0A0A0A] p-4 transition-all duration-300 hover:border-neutral-700 hover:bg-neutral-900/50 animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Flag Icon */}
                        <div className="h-10 w-10 flex items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-neutral-400 border border-neutral-800 group-hover:border-neutral-700 transition-colors">
                          {pos.countryCode.substring(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white group-hover:text-emerald-400 transition-colors">
                              {pos.countryCode}
                            </span>
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                                pos.isLong
                                  ? "bg-emerald-500/10 text-emerald-500"
                                  : "bg-rose-500/10 text-rose-500"
                              }`}
                            >
                              {pos.isLong ? "Long" : "Short"}
                            </span>
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5">
                            Entry: ${parseFloat(pos.entryPrice).toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`flex items-center justify-end gap-1 font-bold ${
                            isWin ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {isWin ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )}
                          <span>
                            {isWin ? "+" : ""}
                            {pnl.toFixed(2)}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5 group-hover:text-neutral-400 transition-colors">
                          Unrealized PnL
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Portal */}
      <ActionModal
        isOpen={modalOpen}
        type={txType}
        onClose={() => setModalOpen(false)}
        balance={txType === "deposit" ? walletBalance : protocolCollateral}
        onConfirm={handleTransaction}
        isPending={isPending}
        feedback={feedback}
      />
    </div>
  );
}