import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useActiveAccount } from "thirdweb/react";
import { toast } from "react-toastify";
import { useContract } from "../hooks/useContract.jsx";
import { useDarkMode } from "../contexts/themeContext.jsx";
import { useTokenConversion } from "../hooks/useTokenConversion";

export default function WithdrawalModal({
  campaign,
  isOpen,
  onClose,
  onWithdrawalSuccess,
}) {
  const account = useActiveAccount();
  const address = account?.address;
  const [isProcessing, setIsProcessing] = useState(false);
  const [portfolio, setPortfolio] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { darkMode } = useDarkMode();
  const { withdrawFunds, getCampaignTokenBalances } = useContract();
  const { calculatePortfolioValue, loading: pricesLoading } =
    useTokenConversion();

  useEffect(() => {
    if (!isOpen) setShowConfirm(false);
  }, [isOpen]);

  const handleWithdraw = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsProcessing(true);
    try {
      // Call the withdrawal function from your contract hook
      if (withdrawFunds) {
        const result = await withdrawFunds(campaign.id);

        // Log withdrawal success with token details
        if (portfolio && portfolio.tokenBalances) {
          console.log("💰 Withdrawal Details:", {
            tokensWithdrawn: result.tokensWithdrawn,
            tokenDetails: portfolio.tokenBalances.map((t) => ({
              symbol: t.symbol,
              amount: t.balanceFormatted,
              usdValue: t.usdValue.toFixed(2),
            })),
          });
        }

        onWithdrawalSuccess?.();
        onClose();
      } else {
        toast.error("Withdrawal function not available");
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error(
        error?.message || "Failed to withdraw funds. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (!isOpen || pricesLoading) return;

    const loadPortfolio = async () => {
      try {
        const portfolioData = await calculatePortfolioValue(
          campaign.id,
          campaign.goalAmount.toString(),
          getCampaignTokenBalances,
        );
        setPortfolio(portfolioData);
      } catch (error) {
        console.error("Withdrawal modal portfolio error:", error);
        setPortfolio(null);
      }
    };

    loadPortfolio();
  }, [
    campaign.goalAmount,
    campaign.id,
    calculatePortfolioValue,
    getCampaignTokenBalances,
    isOpen,
    pricesLoading,
  ]);

  const detectDecimals = (goal, donated) => {
    const candidates = [6, 8, 18];
    const scores = [];

    for (const dec of candidates) {
      try {
        const g = parseFloat(ethers.formatUnits(goal, dec));
        const d = parseFloat(ethers.formatUnits(donated, dec));
        let score = 0;
        if (isFinite(g) && g > 0 && g < 1e7) score++;
        if (isFinite(d) && d >= 0 && d < 1e9) score++;
        if (g > 0 && d / Math.max(g, 1) < 1000) score++;
        scores.push({ dec, score, goalVal: g, donatedVal: d });
      } catch {
        scores.push({ dec, score: 0, goalVal: 0, donatedVal: 0 });
      }
    }

    scores.sort((a, b) => {
      if (b.score === a.score)
        return a.dec - b.dec === 0
          ? 0
          : a.dec === 6
            ? -1
            : b.dec === 6
              ? 1
              : a.dec - b.dec;
      return b.score - a.score;
    });
    return scores[0] || { dec: 6, score: 0, goalVal: 0, donatedVal: 0 };
  };

  const computeMaxDonatedAcrossCandidates = (donated) => {
    const candidates = [6, 8, 18];
    let maxVal = 0;
    for (const dec of candidates) {
      try {
        const v = parseFloat(ethers.formatUnits(donated, dec));
        if (isFinite(v) && v > maxVal) maxVal = v;
      } catch {
        continue;
      }
    }
    return maxVal;
  };

  const detected = detectDecimals(campaign.goalAmount, campaign.totalDonated);
  const fallbackRaisedValue = detected.donatedVal;

  const computedGoalUSD = parseFloat(
    ethers.formatUnits(campaign.goalAmount, 6),
  );

  let computedRaisedUSD = 0;

  if (portfolio && portfolio.totalUSDValue > 0) {
    computedRaisedUSD = portfolio.totalUSDValue;
  } else if (
    portfolio &&
    portfolio.totalUSDValue === 0 &&
    portfolio.tokenBalances.length > 0
  ) {
    computedRaisedUSD = fallbackRaisedValue;
  } else {
    computedRaisedUSD = fallbackRaisedValue;
  }

  if (
    (computedRaisedUSD === 0 || !isFinite(computedRaisedUSD)) &&
    campaign.totalDonated > 0n
  ) {
    const attempted = computeMaxDonatedAcrossCandidates(campaign.totalDonated);
    if (attempted > 0) {
      computedRaisedUSD = attempted;
    }
  }

  const raisedAmount = Number.isFinite(computedRaisedUSD)
    ? computedRaisedUSD.toFixed(2)
    : "0.00";

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      } transition-opacity duration-300`}
      style={{
        backgroundColor: isOpen ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0)",
      }}
      onClick={onClose}
    >
      <div
        className={`rounded-3xl shadow-2xl max-w-md w-full transform transition-all duration-300 ${
          isOpen ? "scale-100" : "scale-95"
        } ${
          darkMode
            ? "bg-gradient-to-b from-slate-900 to-gray-900"
            : "bg-gradient-to-b from-white to-gray-50"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-6 border-b ${
            darkMode ? "border-red-900/30" : "border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <h2
              className={`text-2xl font-bold flex items-center gap-2 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <span className="text-2xl">🏦</span>
              Withdraw Funds
            </h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                darkMode
                  ? "hover:bg-red-900/30 text-red-400"
                  : "hover:bg-red-100 text-red-600"
              }`}
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Campaign Info */}
          <div
            className={`rounded-2xl p-4 backdrop-blur-sm border ${
              darkMode
                ? "bg-purple-900/20 border-purple-800/30"
                : "bg-purple-50 border-purple-200"
            }`}
          >
            <p
              className={`text-sm font-medium mb-2 ${
                darkMode ? "text-purple-300" : "text-purple-700"
              }`}
            >
              Campaign
            </p>
            <h3
              className={`text-lg font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {campaign.name}
            </h3>
          </div>

          {/* Amount Info */}
          <div
            className={`rounded-2xl p-4 backdrop-blur-sm border ${
              darkMode
                ? "bg-green-900/20 border-green-800/30"
                : "bg-green-50 border-green-200"
            }`}
          >
            <p
              className={`text-sm font-medium mb-2 ${
                darkMode ? "text-green-300" : "text-green-700"
              }`}
            >
              Total Raised
            </p>
            <h3
              className={`text-2xl font-bold ${
                darkMode ? "text-green-400" : "text-green-600"
              }`}
            >
              ${raisedAmount} USDC
            </h3>
          </div>

          {/* Warning Message */}
          <div
            className={`rounded-2xl p-4 backdrop-blur-sm border ${
              darkMode
                ? "bg-amber-900/20 border-amber-800/30"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <p
              className={`text-sm ${
                darkMode ? "text-amber-300" : "text-amber-700"
              }`}
            >
              ⚠️ You are about to withdraw all funds raised for this campaign.
              Please ensure you have verified all transactions before
              proceeding.
            </p>
          </div>

          {/* Asset Breakdown Disclaimer */}
          {portfolio && portfolio.tokenBalances?.length > 0 && (
            <div
              className={`rounded-2xl p-4 backdrop-blur-sm border ${
                darkMode
                  ? "bg-blue-900/20 border-blue-800/30"
                  : "bg-blue-50 border-blue-200"
              }`}
            >
              <p
                className={`text-sm font-semibold mb-3 ${
                  darkMode ? "text-blue-200" : "text-blue-800"
                }`}
              >
                You will receive these assets (original tokens, not converted):
              </p>
              <div className="space-y-2">
                {portfolio.tokenBalances.map((token, index) => {
                  const parsed = parseFloat(token.balanceFormatted);
                  const amount = Number.isFinite(parsed)
                    ? parsed.toFixed(4)
                    : token.balanceFormatted;
                  return (
                    <div
                      key={`${token.symbol}-${index}`}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        darkMode ? "bg-blue-900/40" : "bg-blue-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white">
                          {amount} {token.symbol}
                        </span>
                      </div>
                      <span
                        className={`text-xs ${
                          darkMode ? "text-blue-300" : "text-blue-700"
                        }`}
                      >
                        ≈ ${token.usdValue.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p
                className={`text-xs mt-3 ${
                  darkMode ? "text-blue-200/70" : "text-blue-800/80"
                }`}
              >
                📝 Withdrawals transfer the exact token balances held by the
                campaign contract; all {portfolio.tokenBalances.length} token
                {portfolio.tokenBalances.length > 1 ? "s" : ""} will be sent in
                a single batch transaction to save gas.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-900"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancel
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isProcessing}
              className={`flex-1 px-6 hover:cursor-pointer py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                darkMode
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:from-purple-900 disabled:to-indigo-900"
                  : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white disabled:from-purple-300 disabled:to-indigo-300"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <span>🏦</span>
                  Withdraw Now
                </>
              )}
            </button>
          </div>
        </div>
        {showConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => !isProcessing && setShowConfirm(false)}
          >
            <div className="absolute inset-0 bg-black/50" />
            <div
              className={`relative max-w-sm w-full rounded-2xl shadow-xl p-6 border ${
                darkMode
                  ? "bg-slate-900 border-slate-700 text-white"
                  : "bg-white border-gray-200 text-gray-900"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-2">Confirm withdrawal</h3>
              <p className="text-sm mb-4 opacity-80">
                This action will withdraw all raised funds in their original
                token forms to your connected wallet. Continue?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => !isProcessing && setShowConfirm(false)}
                  disabled={isProcessing}
                  className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-colors ${
                    darkMode
                      ? "bg-gray-800 hover:bg-gray-700 text-white"
                      : "bg-gray-200 hover:bg-gray-300 text-gray-900"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfirm(false);
                    handleWithdraw();
                  }}
                  disabled={isProcessing}
                  className={`flex-1 px-4 py-2 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                    darkMode
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white"
                      : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Confirm</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
