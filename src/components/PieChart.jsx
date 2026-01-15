import React, { useState } from "react";

export default function PieChart({
  data,
  size = 200,
  showTooltip = true,
  darkMode = false,
}) {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const isDarkMode = darkMode;

  if (!data || data.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-full backdrop-blur-xl border-2 ${
          isDarkMode
            ? "bg-gradient-to-br from-slate-900/40 to-red-950/40 border-red-800/20"
            : "bg-gradient-to-br from-white/60 to-red-50/60 border-red-100/50"
        }`}
        style={{ width: size, height: size }}
      >
        <div className="text-center">
          <div
            className={`text-5xl mb-3 ${
              isDarkMode ? "opacity-30" : "opacity-40"
            }`}
          >
            📊
          </div>
          <div
            className={`text-sm font-semibold tracking-wide ${
              isDarkMode ? "text-red-400/50" : "text-red-600/50"
            }`}
          >
            No data available
          </div>
        </div>
      </div>
    );
  }

  const totalValue = data.reduce((sum, item) => sum + item.usdValue, 0);
  const segmentCount = data.length;

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

  const createSegments = () => {
    let currentAngle = 0;
    return data.map((item) => {
      const angle = (item.percentage / 100) * 360;
      const segment = {
        symbol: item.symbol,
        color: item.color,
        hoverColor: item.hoverColor || adjustColor(item.color, 1.3),
        usdValue: item.usdValue,
        percentage: item.percentage,
        startAngle: currentAngle,
        endAngle: currentAngle + angle,
      };
      currentAngle += angle;
      return segment;
    });
  };

  const segments = createSegments();

  const createPieSlice = (startAngle, endAngle, radius = 15.9155) => {
    const start = polarToCartesian(21, 21, radius, endAngle);
    const end = polarToCartesian(21, 21, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M",
      21,
      21,
      "L",
      start.x,
      start.y,
      "A",
      radius,
      radius,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      "Z",
    ].join(" ");
  };

  function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  }

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
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer glow on hover */}
      {hoveredSegment !== null && (
        <div className="absolute inset-0 transition-all duration-500">
          <div
            className="w-full h-full rounded-full"
            style={{
              background: `radial-gradient(circle, ${segments[hoveredSegment].color}40 0%, ${segments[hoveredSegment].color}10 40%, transparent 70%)`,
              filter: "blur(20px)",
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
        </div>
      )}

      <svg
        width={size}
        height={size}
        viewBox="0 0 42 42"
        className="relative z-10"
        style={{ filter: "drop-shadow(0 4px 20px rgba(0, 0, 0, 0.15))" }}
      >
        <defs>
          {segments.map((seg, index) => (
            <React.Fragment key={`defs-${index}`}>
              <linearGradient
                id={`segment-gradient-${index}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={seg.color} stopOpacity="1" />
                <stop
                  offset="100%"
                  stopColor={adjustColor(seg.color, 0.7)}
                  stopOpacity="1"
                />
              </linearGradient>
              <filter id={`glow-${index}`}>
                <feGaussianBlur stdDeviation="0.5" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </React.Fragment>
          ))}

          <radialGradient id="innerGradientDark">
            <stop offset="0%" stopColor="rgba(15, 23, 42, 0.95)" />
            <stop offset="100%" stopColor="rgba(30, 41, 59, 0.95)" />
          </radialGradient>
          <radialGradient id="innerGradientLight">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.98)" />
            <stop offset="100%" stopColor="rgba(254, 242, 242, 0.98)" />
          </radialGradient>
        </defs>

        {/* Outer ring decoration */}
        <circle
          cx="21"
          cy="21"
          r="17"
          fill="transparent"
          stroke={
            isDarkMode ? "rgba(220, 38, 38, 0.15)" : "rgba(239, 68, 68, 0.1)"
          }
          strokeWidth="0.5"
          strokeDasharray="1 2"
        />

        {/* Pie segments */}
        <g>
          {segments.map((seg, index) => (
            <g key={index}>
              {/* Shadow layer */}
              <path
                d={createPieSlice(seg.startAngle, seg.endAngle, 16.1)}
                fill={isDarkMode ? "rgba(0, 0, 0, 0.3)" : "rgba(0, 0, 0, 0.1)"}
                transform="translate(0.3, 0.3)"
                className="blur-[0.5px]"
              />

              {/* Main segment */}
              <path
                d={createPieSlice(seg.startAngle, seg.endAngle)}
                fill={`url(#segment-gradient-${index})`}
                className="transition-all duration-500 ease-out cursor-pointer"
                style={{
                  filter:
                    hoveredSegment === index
                      ? `url(#glow-${index}) brightness(1.2) saturate(1.3)`
                      : "brightness(1) saturate(1)",
                  transform:
                    hoveredSegment === index ? "scale(1.05)" : "scale(1)",
                  transformOrigin: "center",
                }}
                onMouseEnter={() => setHoveredSegment(index)}
                onMouseLeave={() => setHoveredSegment(null)}
              />

              {/* Highlight edge */}
              <path
                d={createPieSlice(seg.startAngle, seg.endAngle, 16)}
                fill="transparent"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="0.2"
                className="pointer-events-none"
              />
            </g>
          ))}
        </g>

        {/* Inner circle with glassmorphism */}
        <circle
          cx="21"
          cy="21"
          r="11"
          fill={
            isDarkMode ? "url(#innerGradientDark)" : "url(#innerGradientLight)"
          }
        />

        <circle
          cx="21"
          cy="21"
          r="11"
          fill="transparent"
          stroke={
            isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)"
          }
          strokeWidth="0.3"
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div
            className={`text-3xl font-bold mb-1 tracking-tight ${
              isDarkMode
                ? "text-transparent bg-clip-text bg-gradient-to-br from-white to-red-200"
                : "text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-red-600"
            }`}
          >
            {segmentCount}
          </div>
          <div
            className={`text-xs font-semibold uppercase tracking-wider ${
              isDarkMode ? "text-red-400/80" : "text-red-600/80"
            }`}
          >
            Assets
          </div>
          <div
            className={`text-sm mt-2 font-bold ${
              isDarkMode ? "text-red-300/70" : "text-red-700/70"
            }`}
          >
            ${totalValue.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Tooltip - only shows when hovering and showTooltip is true */}
      {showTooltip && hoveredSegment !== null && (
        <div
          className={`absolute z-50 rounded-xl p-4 backdrop-blur-sm border shadow-2xl transition-all duration-300 pointer-events-none ${
            isDarkMode
              ? "bg-gradient-to-br from-red-900/90 to-pink-900/90 border-red-800/50"
              : "bg-gradient-to-br from-white/95 to-red-50/95 border-red-300"
          }`}
          style={{
            top: "50%",
            left: size + 20,
            transform: "translateY(-50%)",
            minWidth: "200px",
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
              transform: "translateY(-50%) rotate(45deg)",
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

      <style jsx>{`
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

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
