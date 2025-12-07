import React, { useState } from "react";
import { useDarkMode } from "../contexts/themeContext";

export default function PieChart({
  data,
  size = 200,
  showTooltip = true,
  darkMode,
}) {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const themeDarkMode = useDarkMode();
  const isDarkMode = darkMode !== undefined ? darkMode : themeDarkMode.darkMode;

  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-full backdrop-blur-sm border ${
          isDarkMode
            ? "bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-800/30"
            : "bg-gradient-to-br from-red-50 to-pink-50 border-red-200"
        }`}
        style={{ width: size, height: size }}
      >
        <div className="text-center">
          <div
            className={`text-4xl mb-2 ${
              isDarkMode ? "text-red-400/40" : "text-red-600/40"
            }`}
          >
            📊
          </div>
          <div
            className={`text-sm font-medium ${
              isDarkMode ? "text-red-300/60" : "text-red-600/60"
            }`}
          >
            No data
          </div>
        </div>
      </div>
    );
  }

  // Calculate total value for center display
  const totalValue = data.reduce((sum, item) => sum + item.usdValue, 0);
  const segmentCount = data.length;

  // Precompute segments with start positions
  const circumference = 2 * Math.PI * 15.9155;
  const segments = (() => {
    const list = [];
    let acc = 0;
    for (const item of data) {
      const segmentPercentage = Math.max(0, Math.min(100, item.percentage));
      const startPercent = acc;
      const segmentLength = (segmentPercentage / 100) * circumference;

      // Add subtle gradient effect to colors
      const baseColor = item.color;

      list.push({
        symbol: item.symbol,
        color: baseColor,
        hoverColor: item.hoverColor || adjustColor(baseColor, 1.2),
        usdValue: item.usdValue,
        percentage: segmentPercentage,
        segmentLength,
        startPercent,
      });
      acc += segmentPercentage;
    }
    return list;
  })();

  // Helper function to adjust color brightness
  function adjustColor(color, factor) {
    if (color.startsWith("#")) {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);

      const newR = Math.min(255, Math.floor(r * factor));
      const newG = Math.min(255, Math.floor(g * factor));
      const newB = Math.min(255, Math.floor(b * factor));

      return `#${newR.toString(16).padStart(2, "0")}${newG
        .toString(16)
        .padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
    }
    return color;
  }

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

  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Outer glow effect */}
      {hoveredSegment !== null && (
        <div className="absolute inset-0 animate-pulse">
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `radial-gradient(circle, ${adjustColor(
                segments[hoveredSegment].color,
                0.3
              )}20 0%, transparent 70%)`,
              filter: "blur(8px)",
            }}
          />
        </div>
      )}

      <svg
        width={size}
        height={size}
        viewBox="0 0 42 42"
        className="transform -rotate-90 relative z-10"
      >
        {/* Background circle */}
        <circle
          cx="21"
          cy="21"
          r="16"
          fill="transparent"
          stroke={
            isDarkMode ? "rgba(220, 38, 38, 0.1)" : "rgba(239, 68, 68, 0.1)"
          }
          strokeWidth="4"
        />

        {/* Shadow effect */}
        <circle
          cx="21"
          cy="21"
          r="15.9155"
          fill="transparent"
          stroke={
            isDarkMode ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.3)"
          }
          strokeWidth="3.5"
          strokeDasharray="100 0"
          className="blur-[1px]"
        />

        {segments.map((seg, index) => {
          const gap = Math.max(0, circumference - seg.segmentLength);
          const strokeDasharray = `${seg.segmentLength} ${gap}`;
          const cumulativePercent = seg.startPercent + seg.percentage;
          const strokeDashoffset =
            circumference * (1 - cumulativePercent / 100);

          // Add subtle gradient to segment
          const segmentId = `segment-gradient-${index}`;

          return (
            <g key={index}>
              {/* Gradient definition */}
              <defs>
                <linearGradient
                  id={segmentId}
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="100%"
                >
                  <stop offset="0%" stopColor={seg.color} stopOpacity="0.9" />
                  <stop
                    offset="100%"
                    stopColor={adjustColor(seg.color, 0.8)}
                    stopOpacity="0.9"
                  />
                </linearGradient>
              </defs>

              {/* Segment with gradient */}
              <circle
                cx="21"
                cy="21"
                r="15.9155"
                fill="transparent"
                stroke={`url(#${segmentId})`}
                strokeWidth="3"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out cursor-pointer drop-shadow-lg"
                style={{
                  filter:
                    hoveredSegment === index
                      ? `drop-shadow(0 0 8px ${adjustColor(
                          seg.color,
                          0.5
                        )}) brightness(1.15)`
                      : "drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))",
                  transform:
                    hoveredSegment === index
                      ? "scale(1.03) rotate(1deg)"
                      : "scale(1)",
                  transformOrigin: "center",
                }}
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
              />
            </g>
          );
        })}

        {/* Inner circle for depth */}
        <circle
          cx="21"
          cy="21"
          r="13"
          fill="transparent"
          stroke={
            isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"
          }
          strokeWidth="0.5"
        />
      </svg>

      {/* Center display */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className={`text-center rounded-2xl p-4 backdrop-blur-sm border ${
            isDarkMode
              ? "bg-gradient-to-br from-red-900/30 to-pink-900/30 border-red-800/40"
              : "bg-gradient-to-br from-red-50/80 to-pink-50/80 border-red-200"
          }`}
          style={{ width: size * 0.5, height: size * 0.5 }}
        >
          <div className="flex flex-col items-center justify-center h-full">
            <div
              className={`text-2xl font-bold mb-1 ${
                isDarkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {segmentCount}
            </div>
            <div
              className={`text-xs font-medium ${
                isDarkMode ? "text-red-300" : "text-red-700"
              }`}
            >
              Assets
            </div>
            <div
              className={`text-xs mt-2 ${
                isDarkMode ? "text-red-400/60" : "text-red-600/60"
              }`}
            >
              ${totalValue.toFixed(0)}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tooltip */}
      {showTooltip && hoveredSegment !== null && (
        <div
          className={`absolute z-50 rounded-xl p-4 backdrop-blur-sm border shadow-2xl transition-all duration-300 ${
            isDarkMode
              ? "bg-gradient-to-br from-red-900/90 to-pink-900/90 border-red-800/50"
              : "bg-gradient-to-br from-white/95 to-red-50/95 border-red-300"
          }`}
          style={{
            top: "50%",
            left: "110%",
            transform: "translateY(-50%)",
            minWidth: "160px",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          {/* Tooltip arrow */}
          <div
            className={`absolute w-3 h-3 rotate-45 ${
              isDarkMode
                ? "bg-gradient-to-br from-red-900/90 to-pink-900/90 border-l border-t border-red-800/50"
                : "bg-gradient-to-br from-white/95 to-red-50/95 border-l border-t border-red-300"
            }`}
            style={{
              left: "-6px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />

          <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-3">
              <div
                className="w-3 h-3 rounded-full shadow-sm"
                style={{ backgroundColor: segments[hoveredSegment].color }}
              />
              <div
                className={`text-lg font-bold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                {getTokenIcon(data[hoveredSegment].symbol)}{" "}
                {data[hoveredSegment].symbol}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span
                  className={`text-sm ${
                    isDarkMode ? "text-red-300" : "text-red-700"
                  }`}
                >
                  Value:
                </span>
                <span
                  className={`font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  ${data[hoveredSegment].usdValue.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span
                  className={`text-sm ${
                    isDarkMode ? "text-red-300" : "text-red-700"
                  }`}
                >
                  Share:
                </span>
                <span
                  className={`font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {data[hoveredSegment].percentage.toFixed(1)}%
                </span>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div
                  className={`text-xs mb-1 ${
                    isDarkMode ? "text-red-400/60" : "text-red-600/60"
                  }`}
                >
                  Portfolio Allocation
                </div>
                <div
                  className={`w-full h-1.5 rounded-full overflow-hidden ${
                    isDarkMode ? "bg-red-900/30" : "bg-red-200"
                  }`}
                >
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${data[hoveredSegment].percentage}%`,
                      backgroundColor: segments[hoveredSegment].color,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add fadeIn animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-50%) translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(-50%) translateX(0);
          }
        }
      `}</style>
    </div>
  );
}
