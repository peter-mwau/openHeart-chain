import React from "react";
import { ethers } from "ethers";
import { useTokenConversion } from "../hooks/useTokenConversion";
import { useContract } from "../hooks/useContract";
import { useDarkMode } from "../contexts/themeContext.jsx";

export default function CampaignProgress({
  campaign,
  className = "",
  showDetails = true,
  compact = false,
  showTokenBreakdown = false,
  onPortfolioUpdate = null, // Optional callback to pass portfolio data to parent
}) {
  const [portfolio, setPortfolio] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const {
    calculatePortfolioValue,
    prices,
    loading: pricesLoading,
  } = useTokenConversion();
  const { getCampaignTokenBalances } = useContract();
  const { darkMode } = useDarkMode();

  React.useEffect(() => {
    // Skip if prices are still loading
    if (pricesLoading) {
      console.log("⏳ CampaignProgress: Waiting for prices to load...");
      return;
    }

    const loadPortfolio = async () => {
      if (!prices || Object.keys(prices).length === 0) {
        console.error("❌ CampaignProgress: Prices object is empty!", prices);
        setLoading(false);
        return;
      }

      console.log(
        "✅ CampaignProgress: Prices loaded, calculating portfolio...",
        prices
      );

      setLoading(true);
      try {
        const portfolioData = await calculatePortfolioValue(
          campaign.id,
          campaign.goalAmount.toString(),
          getCampaignTokenBalances
        );
        setPortfolio(portfolioData);
        console.log("✅ CampaignProgress: Loaded portfolio data:", {
          totalUSDValue: portfolioData.totalUSDValue,
          tokenCount: portfolioData.tokenBalances.length,
          tokens: portfolioData.tokenBalances.map((t) => ({
            symbol: t.symbol,
            balance: t.balanceFormatted,
            usdValue: t.usdValue,
          })),
        });
        // Notify parent of portfolio update
        if (onPortfolioUpdate) {
          onPortfolioUpdate(portfolioData);
        }
      } catch (error) {
        console.error("❌ CampaignProgress: Error loading portfolio:", error);
        setPortfolio(null);
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
    // Only re-run when campaign data changes or when pricesLoading becomes false
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.id, campaign.goalAmount, pricesLoading]);

  // Calculate progress using on-chain USDC data as fallback
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

  const detected = detectDecimals(campaign.goalAmount, campaign.totalDonated);
  const detectedDecimals = detected.dec;
  const fallbackRaisedValue = detected.donatedVal;

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

  const computedGoalUSD = parseFloat(
    ethers.formatUnits(campaign.goalAmount, 6) // Force 6 decimals for USDC goal as per standard
  );

  // Use portfolio value if available and valid, otherwise fall back to on-chain USDC data
  let computedRaisedUSD = 0;

  if (portfolio && portfolio.totalUSDValue > 0) {
    // Portfolio calculation succeeded - use the accurate multi-token USD value
    computedRaisedUSD = portfolio.totalUSDValue;
    console.log("💰 Using portfolio USD value:", computedRaisedUSD);
  } else if (
    portfolio &&
    portfolio.totalUSDValue === 0 &&
    portfolio.tokenBalances.length > 0
  ) {
    // Portfolio exists but USD value is 0 - might be a pricing issue
    console.warn(
      "⚠️ Portfolio has tokens but USD value is 0. Token balances:",
      portfolio.tokenBalances
    );
    computedRaisedUSD = fallbackRaisedValue;
  } else {
    // No portfolio data yet or empty portfolio - use fallback
    computedRaisedUSD = fallbackRaisedValue;
    console.log("📊 Using fallback raised value:", fallbackRaisedValue);
  }

  // Final safety check - try to parse totalDonated if all else fails
  if (
    (computedRaisedUSD === 0 || !isFinite(computedRaisedUSD)) &&
    campaign.totalDonated > 0n
  ) {
    const attempted = computeMaxDonatedAcrossCandidates(campaign.totalDonated);
    if (attempted > 0) {
      computedRaisedUSD = attempted;
      console.log("🔄 Using computed max donated value:", computedRaisedUSD);
    }
  }

  const progress =
    computedGoalUSD > 0 ? (computedRaisedUSD / computedGoalUSD) * 100 : 0;

  const raisedUSD = computedRaisedUSD;
  const goalUSD = computedGoalUSD;
  const overfundedAmount = Math.max(0, raisedUSD - goalUSD);
  const isOverfunded = progress > 100;

  const daysLeft = campaign.deadline
    ? Math.max(
        0,
        Math.ceil(
          (Number(campaign.deadline) * 1000 - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  // Get progress bar color based on progress
  const getProgressColor = () => {
    if (isOverfunded) {
      return darkMode
        ? "from-amber-400 via-yellow-300 to-amber-500" // Golden/Amber for overfunded
        : "from-amber-400 via-yellow-300 to-amber-500";
    }
    if (progress >= 100) {
      return darkMode
        ? "from-green-500 via-emerald-400 to-green-600"
        : "from-green-500 via-emerald-400 to-green-600";
    } else if (progress >= 75) {
      return darkMode
        ? "from-blue-500 via-cyan-400 to-blue-600"
        : "from-blue-500 via-cyan-400 to-blue-600";
    } else if (progress >= 50) {
      return darkMode
        ? "from-purple-500 via-pink-400 to-purple-600"
        : "from-purple-500 via-pink-400 to-purple-600";
    } else {
      return darkMode
        ? "from-red-500 via-pink-400 to-red-600"
        : "from-red-500 via-pink-400 to-red-600";
    }
  };

  if (loading && !compact) {
    return (
      <div className={`rounded-2xl ${className} overflow-hidden`}>
        <div
          className={`animate-pulse rounded-2xl ${
            darkMode
              ? "bg-gradient-to-br from-red-900/20 to-pink-900/20"
              : "bg-gradient-to-br from-red-50 to-pink-50"
          } ${compact ? "h-16" : "h-32"}`}
        >
          {!compact && (
            <div className="p-6">
              <div
                className={`h-4 rounded-lg mb-4 ${
                  darkMode ? "bg-red-800/40" : "bg-red-200"
                }`}
              ></div>
              <div
                className={`h-6 rounded-lg mb-6 ${
                  darkMode ? "bg-red-800/40" : "bg-red-200"
                }`}
              ></div>
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`h-16 rounded-xl ${
                    darkMode ? "bg-red-800/40" : "bg-red-200"
                  }`}
                ></div>
                <div
                  className={`h-16 rounded-xl ${
                    darkMode ? "bg-red-800/40" : "bg-red-200"
                  }`}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex justify-between items-center">
          <span
            className={`text-sm font-medium ${
              darkMode ? "text-red-300" : "text-red-700"
            }`}
          >
            Progress
          </span>
          <span
            className={`text-lg font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            {progress.toFixed(1)}%
          </span>
        </div>
        <div
          className={`w-full rounded-full h-2.5 overflow-hidden ${
            darkMode ? "bg-red-900/30" : "bg-red-200"
          }`}
        >
          <div
            className={`h-full rounded-full bg-gradient-to-r ${getProgressColor()} transition-all duration-1000 ease-out`}
            style={{ width: `${Math.min(progress, 150)}%` }} // Allow bar to go a bit over if needed visual effect, but capping for UI sanity
          ></div>
        </div>
        {isOverfunded && (
          <div
            className={`text-xs font-bold mt-1 ${
              darkMode ? "text-amber-300" : "text-amber-600"
            }`}
          >
            🔥 Overfunded by ${overfundedAmount.toFixed(0)} (
            {(progress - 100).toFixed(1)}%)
          </div>
        )}
        {showDetails && (
          <div className="flex justify-between text-xs">
            <span
              className={`font-medium ${
                darkMode ? "text-red-300" : "text-red-600"
              }`}
            >
              ${raisedUSD.toFixed(0)} raised
            </span>
            <span
              className={`font-medium ${
                darkMode ? "text-red-300" : "text-red-600"
              }`}
            >
              ${goalUSD.toFixed(0)} goal
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl backdrop-blur-sm overflow-hidden ${className}`}
    >
      {/* Main Container */}
      <div
        className={`relative rounded-2xl border ${
          darkMode
            ? "bg-gradient-to-br from-red-900/20 via-pink-900/20 to-transparent border-red-800/30"
            : "bg-gradient-to-br from-red-50 via-pink-50 to-transparent border-red-200"
        }`}
      >
        {/* Header */}
        <div className="px-6 pt-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-xl ${
                  darkMode
                    ? "bg-gradient-to-br from-red-900/30 to-pink-900/30"
                    : "bg-gradient-to-br from-red-100 to-pink-100"
                }`}
              >
                <span
                  className={`text-xl ${
                    darkMode ? "text-red-400" : "text-red-600"
                  }`}
                >
                  📈
                </span>
              </div>
              <div>
                <h3
                  className={`text-xl font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Funding Progress
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    darkMode ? "text-red-300" : "text-red-700"
                  }`}
                >
                  {campaign.deadline && daysLeft > 0
                    ? `${daysLeft} days remaining`
                    : "Track campaign funding in real-time"}
                </p>
              </div>
            </div>
            <div
              className={`text-right p-3 rounded-xl backdrop-blur-sm ${
                darkMode
                  ? "bg-gradient-to-br from-red-900/30 to-pink-900/30"
                  : "bg-gradient-to-br from-red-100 to-pink-100"
              }`}
            >
              <div
                className={`text-3xl font-bold mb-1 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {progress.toFixed(1)}%
              </div>
              <div
                className={`text-xs font-medium ${
                  darkMode ? "text-red-300" : "text-red-600"
                }`}
              >
                of goal
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div
            className={`w-full rounded-full h-3 overflow-hidden ${
              darkMode ? "bg-red-900/30" : "bg-red-200"
            }`}
          >
            <div
              className={`h-full rounded-full bg-gradient-to-r ${getProgressColor()} transition-all duration-1000 ease-out shadow-lg`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>

          {/* Overfunding Indicator */}
          {isOverfunded && (
            <div
              className={`mt-2 mb-4 p-3 rounded-xl border flex items-center justify-between ${
                darkMode
                  ? "bg-amber-900/20 border-amber-800/30"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-xl">🔥</span>
                <div>
                  <div
                    className={`text-sm font-bold ${
                      darkMode ? "text-amber-300" : "text-amber-700"
                    }`}
                  >
                    Incredible! This campaign is overfunded.
                  </div>
                  <div
                    className={`text-xs ${
                      darkMode ? "text-amber-400/80" : "text-amber-700/80"
                    }`}
                  >
                    Has raised {(progress - 100).toFixed(1)}% more than the
                    original goal.
                  </div>
                </div>
              </div>
              <div
                className={`text-right font-bold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                +${overfundedAmount.toFixed(2)}
              </div>
            </div>
          )}

          {/* Progress Markers */}
          <div className="flex justify-between mt-1">
            {[0, 25, 50, 75, 100].map((marker) => (
              <div key={marker} className="relative">
                <div
                  className={`w-1 h-3 mx-auto ${
                    darkMode ? "bg-red-800/40" : "bg-red-300/60"
                  }`}
                ></div>
                <span
                  className={`text-xs absolute -bottom-5 left-1/2 transform -translate-x-1/2 ${
                    darkMode ? "text-red-400/60" : "text-red-600/60"
                  }`}
                >
                  {marker}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 px-6 pb-6">
          {/* Raised Amount */}
          <div
            className={`rounded-xl p-4 backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
              darkMode
                ? "bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-800/30"
                : "bg-gradient-to-br from-red-50 to-pink-50 border-red-200"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-sm font-medium ${
                  darkMode ? "text-red-300" : "text-red-700"
                }`}
              >
                Raised (USD)
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  darkMode
                    ? "bg-red-900/40 text-red-300"
                    : "bg-red-100 text-red-600"
                }`}
              >
                💝
              </span>
            </div>
            <div
              className={`text-2xl font-bold mb-1 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              ${raisedUSD.toFixed(2)}
            </div>
            <div
              className={`text-xs ${
                darkMode ? "text-red-400/60" : "text-red-600/60"
              }`}
            >
              Total contributions
            </div>
          </div>

          {/* Goal Amount */}
          <div
            className={`rounded-xl p-4 backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
              darkMode
                ? "bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-800/30"
                : "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className={`text-sm font-medium ${
                  darkMode ? "text-purple-300" : "text-purple-700"
                }`}
              >
                Goal (USD)
              </span>
              <span
                className={`text-xs px-2 py-1 rounded-full ${
                  darkMode
                    ? "bg-purple-900/40 text-purple-300"
                    : "bg-purple-100 text-purple-600"
                }`}
              >
                🎯
              </span>
            </div>
            <div
              className={`text-2xl font-bold mb-1 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              ${goalUSD.toFixed(2)}
            </div>
            <div
              className={`text-xs ${
                darkMode ? "text-purple-400/60" : "text-purple-600/60"
              }`}
            >
              Target amount
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div
          className={`px-6 pb-6 pt-4 border-t ${
            darkMode ? "border-red-900/30" : "border-red-200"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Days Left */}
            {campaign.deadline && daysLeft > 0 && (
              <div
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                  darkMode
                    ? "bg-red-900/30 text-red-300"
                    : "bg-red-100 text-red-600"
                }`}
              >
                <span className="text-sm">⏳</span>
                <span className="text-sm font-medium">
                  {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
                </span>
              </div>
            )}

            {/* Portfolio Info */}
            {portfolio && portfolio.totalUSDValue > 0 ? (
              <div
                className={`text-sm ${
                  darkMode ? "text-red-300/80" : "text-red-700/80"
                }`}
              >
                Includes multi-token portfolio
              </div>
            ) : (
              portfolio &&
              portfolio.totalUSDValue === 0 && (
                <div
                  className={`text-sm ${
                    darkMode ? "text-amber-400/80" : "text-amber-600/80"
                  }`}
                >
                  Using on-chain USDC data
                </div>
              )
            )}
          </div>

          {/* Token Breakdown */}
          {showTokenBreakdown &&
            portfolio &&
            portfolio.tokenBalances.length > 0 && (
              <div
                className={`mt-4 p-3 rounded-lg ${
                  darkMode
                    ? "bg-red-900/20 border border-red-800/30"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <div
                  className={`text-xs font-medium mb-2 ${
                    darkMode ? "text-red-300" : "text-red-700"
                  }`}
                >
                  Token Composition:
                </div>
                <div className="flex flex-wrap gap-2">
                  {portfolio.tokenBalances.map((token, index) => (
                    <div
                      key={index}
                      className={`px-2 py-1 rounded-full text-xs ${
                        darkMode
                          ? "bg-red-900/40 text-red-300"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {parseFloat(token.balanceFormatted).toFixed(4)}{" "}
                      {token.symbol}
                    </div>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* Success Badge */}
        {progress >= 100 && (
          <div
            className={`absolute top-4 right-4 ${
              darkMode
                ? "bg-gradient-to-r from-green-900/40 to-emerald-900/40"
                : "bg-gradient-to-r from-green-100 to-emerald-100"
            } border ${
              darkMode ? "border-green-800/40" : "border-green-300"
            } px-4 py-2 rounded-full backdrop-blur-sm animate-pulse`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm">🎉</span>
              <span
                className={`text-xs font-bold ${
                  darkMode ? "text-green-300" : "text-green-700"
                }`}
              >
                GOAL ACHIEVED!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
