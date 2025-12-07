import React from "react";
import PieChart from "./PieChart";
import { useDarkMode } from "../contexts/themeContext";

export default function PortfolioSummary({ portfolio, daysLeft }) {
  const { darkMode } = useDarkMode();

  // Get token icon
  const getTokenIcon = (symbol) => {
    const icons = {
      USDC: "💵",
      WETH: "🔷",
      WBTC: "🟡",
      DAI: "🟣",
      USDT: "💎",
    };
    return icons[symbol] || "🪙";
  };

  // Get token color based on symbol and dark mode
  const getTokenColor = (symbol, darkMode) => {
    const colors = {
      USDC: darkMode
        ? "from-blue-600 to-cyan-500"
        : "from-blue-500 to-cyan-400",
      WETH: darkMode
        ? "from-purple-600 to-pink-500"
        : "from-purple-500 to-pink-400",
      WBTC: darkMode
        ? "from-amber-600 to-yellow-500"
        : "from-amber-500 to-yellow-400",
      DAI: darkMode
        ? "from-yellow-600 to-amber-500"
        : "from-yellow-500 to-amber-400",
      USDT: darkMode
        ? "from-emerald-600 to-teal-500"
        : "from-emerald-500 to-teal-400",
    };
    return (
      colors[symbol] ||
      (darkMode ? "from-red-600 to-pink-500" : "from-red-500 to-pink-400")
    );
  };

  // Get background color for pie chart segments based on token and dark mode
  const getPieSegmentColor = (symbol, index) => {
    const colors = {
      USDC: "#3B82F6", // blue-500
      WETH: "#8B5CF6", // purple-500
      WBTC: "#F59E0B", // amber-500
      DAI: "#84CC16", // lime-500
      USDT: "#10B981", // emerald-500
    };

    const fallbackColors = [
      "#3B82F6", // blue
      "#10B981", // green
      "#8B5CF6", // purple
      "#F59E0B", // amber
      "#EF4444", // red
      "#06B6D4", // cyan
    ];

    return colors[symbol] || fallbackColors[index % fallbackColors.length];
  };

  const pieData = portfolio.tokenBalances.map((token, index) => {
    const percentage =
      portfolio.totalUSDValue > 0
        ? (token.usdValue / portfolio.totalUSDValue) * 100
        : 0;

    return {
      symbol: token.symbol,
      value: token.usdValue,
      color: getPieSegmentColor(token.symbol, index),
      percentage,
      usdValue: token.usdValue,
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Pie Chart Section */}
      <div
        className={`rounded-2xl p-6 backdrop-blur-sm border ${
          darkMode
            ? "bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-800/30"
            : "bg-gradient-to-br from-red-50 to-pink-50 border-red-200"
        }`}
      >
        <div className="flex items-center space-x-3 mb-6">
          <div
            className={`p-2 rounded-xl ${
              darkMode
                ? "bg-red-900/30 text-red-400"
                : "bg-red-100 text-red-600"
            }`}
          >
            <span className="text-xl">📊</span>
          </div>
          <h4
            className={`text-xl font-bold ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Asset Distribution
          </h4>
        </div>

        <div className="flex flex-col items-center">
          {/* Pie Chart with custom styling */}
          <div className="relative">
            <PieChart data={pieData} size={200} darkMode={darkMode} />
            <div
              className={`absolute inset-0 flex items-center justify-center ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <div className="text-center">
                <div className="text-3xl font-bold">{pieData.length}</div>
                <div className="text-sm opacity-70">Assets</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-8 space-y-3 w-full">
            {portfolio.tokenBalances.map((token, index) => {
              const percentage =
                portfolio.totalUSDValue > 0
                  ? (token.usdValue / portfolio.totalUSDValue) * 100
                  : 0;

              const segmentColor = getPieSegmentColor(token.symbol, index);

              return (
                <div
                  key={token.tokenAddress}
                  className={`flex items-center justify-between p-3 rounded-xl transition-all duration-300 hover:scale-105 ${
                    darkMode ? "hover:bg-red-900/30" : "hover:bg-red-50"
                  }`}
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: segmentColor }}
                    ></div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">
                        {getTokenIcon(token.symbol)}
                      </span>
                      <span
                        className={`text-sm font-medium ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {token.symbol}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-sm font-bold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {percentage.toFixed(1)}%
                    </div>
                    <div
                      className={`text-xs ${
                        darkMode ? "text-red-300" : "text-red-600"
                      }`}
                    >
                      ${token.usdValue.toFixed(2)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Asset Details */}
      <div className="lg:col-span-2 space-y-4">
        {portfolio.tokenBalances.map((token, index) => {
          const percentage =
            portfolio.totalUSDValue > 0
              ? (token.usdValue / portfolio.totalUSDValue) * 100
              : 0;

          const gradientColor = getTokenColor(token.symbol, darkMode);

          return (
            <div
              key={token.tokenAddress}
              className={`rounded-xl p-5 backdrop-blur-sm border transition-all duration-300 hover:scale-[1.02] ${
                darkMode
                  ? "bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-red-800/30 hover:border-red-700/50"
                  : "bg-gradient-to-br from-white/90 to-red-50/90 border-red-200 hover:border-red-300"
              }`}
            >
              {/* Header with gradient */}
              <div
                className={`flex items-center justify-between mb-4 p-3 rounded-xl bg-gradient-to-r ${gradientColor}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getTokenIcon(token.symbol)}</div>
                  <div>
                    <div
                      className={`text-xl font-bold ${
                        darkMode ? "text-white" : "text-white"
                      }`}
                    >
                      {token.symbol}
                    </div>
                    <div
                      className={`text-xs ${
                        darkMode ? "text-white/80" : "text-white/90"
                      }`}
                    >
                      {token.tokenAddress.slice(0, 8)}...
                      {token.tokenAddress.slice(-6)}
                    </div>
                  </div>
                </div>
                <div
                  className={`text-right ${
                    darkMode ? "text-white" : "text-white"
                  }`}
                >
                  <div className="text-2xl font-bold">
                    ${token.usdValue.toFixed(2)}
                  </div>
                  <div className="text-sm opacity-90">
                    {percentage.toFixed(1)}% of portfolio
                  </div>
                </div>
              </div>

              {/* Token Details */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`rounded-xl p-4 ${
                    darkMode
                      ? "bg-red-900/20 border border-red-800/30"
                      : "bg-red-50 border border-red-200"
                  }`}
                >
                  <div
                    className={`text-sm font-medium mb-2 ${
                      darkMode ? "text-red-300" : "text-red-700"
                    }`}
                  >
                    Balance
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {parseFloat(token.balanceFormatted).toFixed(6)}
                  </div>
                  <div
                    className={`text-sm ${
                      darkMode ? "text-red-400/60" : "text-red-600/60"
                    }`}
                  >
                    {token.symbol}
                  </div>
                </div>

                <div
                  className={`rounded-xl p-4 ${
                    darkMode
                      ? "bg-green-900/20 border border-green-800/30"
                      : "bg-green-50 border border-green-200"
                  }`}
                >
                  <div
                    className={`text-sm font-medium mb-2 ${
                      darkMode ? "text-green-300" : "text-green-700"
                    }`}
                  >
                    USD Value
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    ${token.usdValue.toFixed(2)}
                  </div>
                  <div
                    className={`text-sm ${
                      darkMode ? "text-green-400/60" : "text-green-600/60"
                    }`}
                  >
                    Equivalent
                  </div>
                </div>

                <div
                  className={`rounded-xl p-4 ${
                    darkMode
                      ? "bg-blue-900/20 border border-blue-800/30"
                      : "bg-blue-50 border border-blue-200"
                  }`}
                >
                  <div
                    className={`text-sm font-medium mb-2 ${
                      darkMode ? "text-blue-300" : "text-blue-700"
                    }`}
                  >
                    USDC Equivalent
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {parseFloat(token.usdEquivalent).toFixed(2)}
                  </div>
                  <div
                    className={`text-sm ${
                      darkMode ? "text-blue-400/60" : "text-blue-600/60"
                    }`}
                  >
                    USDC
                  </div>
                </div>

                <div
                  className={`rounded-xl p-4 ${
                    darkMode
                      ? "bg-purple-900/20 border border-purple-800/30"
                      : "bg-purple-50 border border-purple-200"
                  }`}
                >
                  <div
                    className={`text-sm font-medium mb-2 ${
                      darkMode ? "text-purple-300" : "text-purple-700"
                    }`}
                  >
                    Portfolio Share
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {percentage.toFixed(1)}%
                  </div>
                  <div
                    className={`text-sm ${
                      darkMode ? "text-purple-400/60" : "text-purple-600/60"
                    }`}
                  >
                    of total
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1">
                  <span
                    className={`font-medium ${
                      darkMode ? "text-red-300" : "text-red-700"
                    }`}
                  >
                    Portfolio Allocation
                  </span>
                  <span
                    className={`font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {percentage.toFixed(1)}%
                  </span>
                </div>
                <div
                  className={`w-full h-2 rounded-full overflow-hidden ${
                    darkMode ? "bg-red-900/30" : "bg-red-200"
                  }`}
                >
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: getPieSegmentColor(token.symbol, index),
                    }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
