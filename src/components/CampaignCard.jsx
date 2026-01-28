import React, { useState } from "react";
import { useCampaigns } from "../contexts/campaignsContext.jsx";
import { useActiveAccount } from "thirdweb/react";
import { ethers } from "ethers";
import CampaignProgress from "./CampaignProgress";
import { useDarkMode } from "../contexts/themeContext.jsx";

export default function CampaignCard({
  campaign,
  onViewDetails,
  onDonate,
  index = 0,
  totalCards = 1,
  isGroupHovered = false,
  isStacked = false,
}) {
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!address;
  const [isHovered, setIsHovered] = useState(false);
  const [portfolioData, setPortfolioData] = useState(null);
  const { darkMode } = useDarkMode();

  const formatUSDC = (amount) => {
    try {
      return parseFloat(ethers.formatUnits(amount, 6)).toFixed(2); // USDC has 6 decimals
    } catch (error) {
      return "0.00";
    }
  };

  // Check if campaign is active
  const isActive =
    campaign.active && !campaign.cancelled && !campaign.withdrawalComplete;
  const isExpired = Date.now() > Number(campaign.deadline) * 1000;

  // Calculate progress percentage using portfolio data if available
  const progress = portfolioData
    ? portfolioData.progress
    : Number(campaign.totalRaised) > 0
      ? Math.min(
          (Number(campaign.totalRaised) / Number(campaign.goalAmount)) * 100,
          100,
        )
      : 0;

  // Check if goal is achieved using portfolio data
  const isSuccessful = progress >= 100;

  // Get raised amount - use portfolio value if available
  const raisedAmount = portfolioData
    ? portfolioData.totalUSDValue
    : parseFloat(ethers.formatUnits(campaign.totalRaised, 6));

  const goalAmount = parseFloat(ethers.formatUnits(campaign.goalAmount, 6));

  // Get status color based on theme
  const getStatusColor = () => {
    if (campaign.cancelled)
      return darkMode ? "from-red-700 to-red-800" : "from-red-500 to-red-600";
    if (campaign.withdrawalComplete)
      return darkMode
        ? "from-green-700 to-green-800"
        : "from-green-500 to-green-600";
    if (!isActive || isExpired)
      return darkMode
        ? "from-gray-600 to-gray-700"
        : "from-gray-400 to-gray-500";
    if (isSuccessful)
      return darkMode
        ? "from-purple-600 to-purple-700"
        : "from-purple-500 to-purple-600";
    return darkMode ? "from-red-600 to-pink-600" : "from-red-500 to-pink-500"; // Use theme colors
  };

  // Get status text
  const getStatusText = () => {
    if (campaign.cancelled) return "Cancelled";
    if (campaign.withdrawalComplete) return "Funded";
    if (!isActive || isExpired) return "Ended";
    if (isSuccessful) return "Successful";
    return "Active";
  };

  // Get status icon
  const getStatusIcon = () => {
    if (campaign.cancelled) return "✖️";
    if (campaign.withdrawalComplete) return "✅";
    if (!isActive || isExpired) return "⏰";
    if (isSuccessful) return "🎯";
    return "🔥";
  };

  // Truncate text
  const truncateText = (text, length) => {
    if (!text) return "";
    return text.length > length ? `${text.slice(0, length)}...` : text;
  };

  // Get days remaining
  const getDaysRemaining = () => {
    const now = Math.floor(Date.now() / 1000);
    const deadline = Number(campaign.deadline);
    const diff = deadline - now;
    return Math.max(0, Math.ceil(diff / (60 * 60 * 24)));
  };

  // Calculate spread transform for stacked view
  const getSpreadTransform = () => {
    if (!isStacked) {
      return {};
    }

    if (!isGroupHovered) {
      // Stacked state - cards pile on top of each other
      return {
        transform: `translateX(${index * 10}px) translateY(${
          index * 6
        }px) rotate(${index * -1.5}deg) scale(${1 - index * 0.015})`,
        zIndex: totalCards - index,
        opacity: 1 - index * 0.1,
      };
    }

    // Spread state - cards fan out with rotation
    const centerIndex = (totalCards - 1) / 2;
    const offsetFromCenter = index - centerIndex;
    const spreadDistance = 280;
    const rotationAngle = offsetFromCenter * 6;
    const verticalOffset = Math.abs(offsetFromCenter) * 15;

    return {
      transform: `translateX(${
        offsetFromCenter * spreadDistance
      }px) translateY(${verticalOffset}px) rotate(${rotationAngle}deg) scale(${
        isHovered ? 1.08 : 1
      })`,
      zIndex: isHovered ? 100 : totalCards - Math.abs(offsetFromCenter),
      opacity: 1,
    };
  };

  const spreadStyle = getSpreadTransform();

  return (
    <div
      className={`group relative ${
        isStacked ? "transition-all duration-700 ease-out" : ""
      }`}
      style={isStacked ? spreadStyle : {}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Card Container */}
      <div
        className={`relative rounded-2xl transition-all duration-500 ease-out backdrop-blur-sm overflow-hidden
          ${isHovered ? "shadow-2xl" : "shadow-lg"}
          ${!isStacked ? "hover:scale-[1.02]" : ""}
          ${
            darkMode
              ? "bg-gradient-to-br from-slate-900/90 to-gray-900/90 border border-red-900/30"
              : "bg-gradient-to-br from-white/95 to-red-50/95 border border-red-200"
          }
        `}
        style={{
          transformStyle: "preserve-3d",
          transform: isStacked
            ? "none"
            : isHovered
              ? "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1.02, 1.02, 1.02)"
              : "perspective(1000px) rotateX(1deg) rotateY(-0.5deg)",
        }}
      >
        {/* Theme Gradient Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${getStatusColor()} transition-opacity duration-500
            ${isHovered ? "opacity-10" : "opacity-5"}
          `}
        />

        {/* Header Section */}
        <div className="relative px-5 pt-5">
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-3">
            <div
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full backdrop-blur-sm border ${
                darkMode
                  ? "bg-red-900/20 border-red-800/40"
                  : "bg-red-100/80 border-red-300"
              }`}
            >
              <span className="text-sm">{getStatusIcon()}</span>
              <span
                className={`text-xs font-semibold ${
                  darkMode ? "text-red-300" : "text-red-700"
                }`}
              >
                {getStatusText()}
              </span>
            </div>

            {/* Campaign ID */}
            <div
              className={`px-2.5 py-1 rounded-lg ${
                darkMode
                  ? "bg-gray-800 text-gray-300"
                  : "bg-gray-100 text-gray-600"
              } text-xs font-mono`}
            >
              #{campaign.id}
            </div>
          </div>

          {/* Campaign Title */}
          <h3
            className={`text-xl font-bold mb-2 line-clamp-1 leading-tight transition-all duration-300 ${
              isHovered ? "translate-x-1" : ""
            } ${darkMode ? "text-white" : "text-gray-900"}`}
          >
            {truncateText(campaign.name, 50)}
          </h3>

          {/* Creator Info */}
          <div className="flex items-center space-x-2 mb-4">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center ${
                darkMode
                  ? "bg-red-900/40 text-red-400"
                  : "bg-red-100 text-red-600"
              } text-xs`}
            >
              👤
            </div>
            <span
              className={`text-sm ${
                darkMode ? "text-red-300" : "text-red-700"
              }`}
            >
              {campaign.creator.slice(0, 6)}...{campaign.creator.slice(-4)}
            </span>
          </div>

          {/* Description */}
          <p
            className={`mb-4 text-sm leading-relaxed line-clamp-2 ${
              darkMode ? "text-red-300/80" : "text-red-700/80"
            }`}
          >
            {campaign.description ||
              "No description provided for this campaign."}
          </p>
        </div>

        {/* Progress Section */}
        <div className="px-5 mb-5">
          <CampaignProgress
            campaign={campaign}
            compact={true}
            showDetails={false}
            darkMode={darkMode}
            onPortfolioUpdate={(portfolio) => setPortfolioData(portfolio)}
          />

          {/* Progress Stats */}
          <div className="flex items-center justify-between mt-2">
            <div
              className={`text-sm font-semibold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {progress.toFixed(1)}%
            </div>
            <div
              className={`text-sm ${
                darkMode ? "text-red-300" : "text-red-700"
              }`}
            >
              <span className="font-bold">${raisedAmount.toFixed(0)}</span>
              <span className="opacity-70"> / ${goalAmount.toFixed(0)}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className={`grid grid-cols-3 gap-2 px-5 mb-5`}>
          <div
            className={`text-center p-2 rounded-xl backdrop-blur-sm border transition-all duration-300 ${
              isHovered ? "scale-105" : ""
            } ${
              darkMode
                ? "bg-red-900/20 border-red-800/30"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div
              className={`text-lg font-bold mb-1 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {getDaysRemaining()}
            </div>
            <div
              className={`text-xs ${
                darkMode ? "text-red-300" : "text-red-600"
              }`}
            >
              Days left
            </div>
          </div>

          <div
            className={`text-center p-2 rounded-xl backdrop-blur-sm border transition-all duration-300 ${
              isHovered ? "scale-105" : ""
            } ${
              darkMode
                ? "bg-pink-900/20 border-pink-800/30"
                : "bg-pink-50 border-pink-200"
            }`}
          >
            <div
              className={`text-lg font-bold mb-1 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {portfolioData?.tokenBalances?.length || 0}
            </div>
            <div
              className={`text-xs ${
                darkMode ? "text-pink-300" : "text-pink-600"
              }`}
            >
              Tokens
            </div>
          </div>

          <div
            className={`text-center p-2 rounded-xl backdrop-blur-sm border transition-all duration-300 ${
              isHovered ? "scale-105" : ""
            } ${
              darkMode
                ? "bg-purple-900/20 border-purple-800/30"
                : "bg-purple-50 border-purple-200"
            }`}
          >
            <div
              className={`text-lg font-bold mb-1 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {isActive ? "Live" : "Closed"}
            </div>
            <div
              className={`text-xs ${
                darkMode ? "text-purple-300" : "text-purple-600"
              }`}
            >
              Status
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className={`px-5 pb-5 pt-2 border-t ${
            darkMode ? "border-red-900/30" : "border-red-200"
          }`}
        >
          <div className="flex gap-3">
            <button
              onClick={() => onViewDetails(campaign)}
              className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all duration-300 transform
                ${
                  darkMode
                    ? "bg-gradient-to-r from-red-900/40 to-pink-900/40 border border-red-800/40 text-red-300 hover:from-red-800/50 hover:to-pink-800/50 hover:text-red-200"
                    : "bg-gradient-to-r from-red-50 to-pink-50 border border-red-300 text-red-600 hover:from-red-100 hover:to-pink-100 hover:text-red-700"
                }
                hover:scale-105 active:scale-95 hover:shadow-lg
              `}
            >
              View Details
            </button>

            {isActive && !isExpired && (
              <button
                onClick={() => onDonate(campaign)}
                disabled={!isConnected}
                className={`flex-1 px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 transform relative overflow-hidden
                  ${
                    darkMode
                      ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-lg shadow-red-900/30"
                      : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white shadow-lg shadow-red-200"
                  }
                  hover:scale-105 active:scale-95 hover:shadow-xl
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                `}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isConnected ? (
                    <>
                      <span className="text-sm">💝</span>
                      Donate Now
                    </>
                  ) : (
                    <>
                      <span className="text-sm">🔗</span>
                      Connect Wallet
                    </>
                  )}
                </span>
              </button>
            )}
          </div>

          {/* Success Badge */}
          {isSuccessful && isActive && (
            <div
              className={`mt-3 flex items-center justify-center transition-all duration-300 ${
                isHovered ? "scale-110" : "scale-100"
              }`}
            >
              <div
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-full backdrop-blur-sm border ${
                  darkMode
                    ? "bg-gradient-to-r from-green-900/30 to-emerald-900/30 border-green-800/40 text-green-300"
                    : "bg-gradient-to-r from-green-100 to-emerald-100 border-green-300 text-green-700"
                }`}
              >
                <span className="text-sm animate-bounce">🎉</span>
                <span className="text-xs font-medium">Goal Achieved!</span>
              </div>
            </div>
          )}
        </div>

        {/* Hover Effects */}
        {isHovered && (
          <>
            {/* Glow Effect */}
            <div
              className={`absolute inset-0 pointer-events-none ${
                darkMode
                  ? "bg-gradient-to-br from-red-500/5 via-pink-500/5 to-purple-500/5"
                  : "bg-gradient-to-br from-red-300/5 via-pink-300/5 to-purple-300/5"
              }`}
            />

            {/* Animated Border */}
            <div
              className={`absolute inset-0 rounded-2xl pointer-events-none border-2 ${
                darkMode ? "border-red-500/30" : "border-red-400/30"
              }`}
            />
          </>
        )}

        {/* Bottom Accent */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${getStatusColor()} opacity-70`}
        />
      </div>

      {/* Floating Shadow */}
      <div
        className={`absolute inset-0 rounded-2xl -z-10 transition-all duration-500
          ${
            darkMode
              ? "bg-gradient-to-br from-red-900/20 via-pink-900/10 to-transparent"
              : "bg-gradient-to-br from-red-300/10 via-pink-300/5 to-transparent"
          }
          ${isHovered ? "opacity-80 blur-xl scale-105" : "opacity-50 blur-lg"}
        `}
      />
    </div>
  );
}
