import React, { useState } from "react";
import { useCampaigns } from "../contexts/campaignsContext";
import { ethers } from "ethers";
import CampaignProgress from "./CampaignProgress";
import { useDarkMode } from "../contexts/themeContext";

export default function CampaignsSidebar({
  selectedCampaign,
  onSelectCampaign,
  darkMode: propDarkMode,
}) {
  const { campaigns, loading, error, refreshCampaigns } = useCampaigns();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [portfolioData, setPortfolioData] = useState({}); // Track portfolio values by campaign ID
  const { darkMode: contextDarkMode } = useDarkMode();
  const darkMode = propDarkMode !== undefined ? propDarkMode : contextDarkMode;

  // Filter and search campaigns
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (campaign.description &&
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase()));

    const deadlineMs = Number(campaign.deadline) * 1000;
    const isExpired = Date.now() > deadlineMs;
    const isSuccessful =
      Number(campaign.totalRaised) >= Number(campaign.goalAmount);

    const matchesFilter =
      filter === "all"
        ? true
        : filter === "active"
          ? campaign.active &&
            !campaign.cancelled &&
            !campaign.withdrawalComplete &&
            !isExpired
          : filter === "successful"
            ? isSuccessful && campaign.active
            : filter === "ended"
              ? !campaign.active ||
                campaign.cancelled ||
                campaign.withdrawalComplete ||
                isExpired
              : true;

    return matchesSearch && matchesFilter;
  });

  const formatUSDC = (amount) => {
    try {
      return parseFloat(ethers.formatUnits(amount, 6)).toFixed(2); // USDC has 6 decimals
    } catch (error) {
      return "0.00";
    }
  };

  // Get status color with theme support
  const getStatusColor = (campaign) => {
    const deadlineMs = Number(campaign.deadline) * 1000;
    const isExpired = Date.now() > deadlineMs;
    const isSuccessful =
      Number(campaign.totalRaised) >= Number(campaign.goalAmount);

    if (campaign.cancelled)
      return darkMode ? "from-red-700 to-red-800" : "from-red-500 to-red-600";
    if (campaign.withdrawalComplete)
      return darkMode
        ? "from-green-700 to-green-800"
        : "from-green-500 to-green-600";
    if (!campaign.active || isExpired)
      return darkMode
        ? "from-gray-600 to-gray-700"
        : "from-gray-400 to-gray-500";
    if (isSuccessful)
      return darkMode
        ? "from-purple-600 to-purple-700"
        : "from-purple-500 to-purple-600";
    return darkMode ? "from-red-600 to-pink-600" : "from-red-500 to-pink-500";
  };

  // Get status icon
  const getStatusIcon = (campaign) => {
    const deadlineMs = Number(campaign.deadline) * 1000;
    const isExpired = Date.now() > deadlineMs;
    const isSuccessful =
      Number(campaign.totalRaised) >= Number(campaign.goalAmount);

    if (campaign.cancelled) return "✖️";
    if (campaign.withdrawalComplete) return "✅";
    if (!campaign.active || isExpired) return "⏰";
    if (isSuccessful) return "🎯";
    return "🔥";
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <div
            className={`relative mx-auto w-16 h-16 ${
              darkMode ? "text-red-400" : "text-red-600"
            }`}
          >
            <div
              className={`absolute inset-0 rounded-full border-4 ${
                darkMode ? "border-red-900/30" : "border-red-200"
              }`}
            ></div>
            <div
              className={`absolute inset-0 rounded-full border-4 ${
                darkMode ? "border-red-500" : "border-red-400"
              } border-t-transparent animate-spin`}
            ></div>
          </div>
          <p
            className={`text-lg font-medium ${
              darkMode ? "text-red-300" : "text-red-700"
            }`}
          >
            Loading campaigns...
          </p>
          <p
            className={`text-sm ${
              darkMode ? "text-red-400/60" : "text-red-600/60"
            }`}
          >
            Powered by Moonbase Alpha
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div
          className={`text-center max-w-sm rounded-2xl p-6 backdrop-blur-sm border ${
            darkMode
              ? "bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-800/30"
              : "bg-gradient-to-br from-red-50/80 to-pink-50/80 border-red-200"
          }`}
        >
          <div
            className={`inline-flex p-4 rounded-2xl mb-4 ${
              darkMode
                ? "bg-red-900/30 text-red-400"
                : "bg-red-100 text-red-600"
            }`}
          >
            <span className="text-3xl">⚠️</span>
          </div>
          <p
            className={`text-lg font-medium mb-4 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Failed to load campaigns
          </p>
          <p
            className={`text-sm mb-6 ${
              darkMode ? "text-red-300" : "text-red-700"
            }`}
          >
            {error}
          </p>
          <button
            onClick={refreshCampaigns}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              darkMode
                ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-lg shadow-red-900/30"
                : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white shadow-lg shadow-red-200"
            }`}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div
        className={`p-6 border-b ${
          darkMode ? "border-red-800/30" : "border-red-200"
        }`}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-xl ${
                darkMode
                  ? "bg-gradient-to-br from-red-900/30 to-pink-900/30"
                  : "bg-gradient-to-br from-red-100 to-pink-100"
              }`}
            >
              <span className="text-xl">📋</span>
            </div>
            <div>
              <h1
                className={`text-2xl font-bold ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Campaigns
              </h1>
              <p
                className={`text-sm ${
                  darkMode ? "text-red-300" : "text-red-700"
                }`}
              >
                Browse and select campaigns
              </p>
            </div>
          </div>
          <button
            onClick={refreshCampaigns}
            className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
              darkMode
                ? "text-red-400 hover:text-red-300 hover:bg-red-900/30"
                : "text-red-600 hover:text-red-700 hover:bg-red-100"
            }`}
          >
            <span className="text-xl">🔄</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6 group">
          <div
            className={`absolute inset-0 rounded-xl blur transition-all duration-300 group-hover:blur-sm ${
              darkMode
                ? "bg-gradient-to-r from-red-900/20 to-pink-900/20"
                : "bg-gradient-to-r from-red-100 to-pink-100"
            }`}
          ></div>
          <div
            className={`relative rounded-xl border transition-all duration-300 ${
              darkMode ? "border-red-900/50" : "border-red-200"
            }`}
          >
            <div className="flex items-center px-4">
              <span
                className={`text-lg mr-3 ${
                  darkMode ? "text-red-400" : "text-red-600"
                }`}
              >
                🔍
              </span>
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`flex-1 py-3 bg-transparent focus:outline-none ${
                  darkMode
                    ? "text-white placeholder-red-400/50"
                    : "text-gray-900 placeholder-red-400/50"
                }`}
              />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {[
            { key: "all", label: "All", icon: "🌐" },
            { key: "active", label: "Active", icon: "🔥" },
            { key: "successful", label: "Successful", icon: "🎯" },
            { key: "ended", label: "Ended", icon: "⏰" },
          ].map(({ key, label, icon }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-1 px-3 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                filter === key
                  ? darkMode
                    ? "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-900/30"
                    : "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-200"
                  : darkMode
                    ? "bg-red-900/20 text-red-300 hover:bg-red-900/30 border border-red-800/30"
                    : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-sm">{icon}</span>
                <span className="text-xs">{label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {filteredCampaigns.map((campaign) => {
            const statusColor = getStatusColor(campaign);
            const statusIcon = getStatusIcon(campaign);

            return (
              <div
                key={campaign.id}
                onClick={() => onSelectCampaign(campaign)}
                className={`group relative rounded-2xl backdrop-blur-sm border transition-all duration-300 cursor-pointer overflow-hidden ${
                  selectedCampaign?.id === campaign.id
                    ? darkMode
                      ? "border-red-500 shadow-2xl shadow-red-900/30 scale-[1.02]"
                      : "border-red-400 shadow-2xl shadow-red-200 scale-[1.02]"
                    : darkMode
                      ? "border-red-800/30 hover:border-red-700/50 hover:shadow-xl"
                      : "border-red-200 hover:border-red-300 hover:shadow-xl"
                }`}
              >
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${statusColor} transition-opacity duration-300 ${
                    selectedCampaign?.id === campaign.id
                      ? "opacity-10"
                      : "opacity-5"
                  }`}
                />

                {/* Selected indicator */}
                {selectedCampaign?.id === campaign.id && (
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 ${
                      darkMode
                        ? "bg-gradient-to-b from-red-500 to-pink-500"
                        : "bg-gradient-to-b from-red-500 to-pink-500"
                    }`}
                  />
                )}

                <div className="relative p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-full backdrop-blur-sm border ${
                        darkMode
                          ? "bg-red-900/20 border-red-800/40"
                          : "bg-red-100/80 border-red-300"
                      }`}
                    >
                      <span className="text-sm">{statusIcon}</span>
                      <span
                        className={`text-xs font-semibold ${
                          darkMode ? "text-red-300" : "text-red-700"
                        }`}
                      >
                        {campaign.cancelled
                          ? "Cancelled"
                          : campaign.withdrawalComplete
                            ? "Funded"
                            : !campaign.active ||
                                Date.now() > Number(campaign.deadline) * 1000
                              ? "Ended"
                              : Number(campaign.totalRaised) >=
                                  Number(campaign.goalAmount)
                                ? "Successful"
                                : "Active"}
                      </span>
                    </div>
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

                  {/* Campaign Name */}
                  <h3
                    className={`text-lg font-bold mb-2 line-clamp-1 transition-colors duration-300 ${
                      selectedCampaign?.id === campaign.id
                        ? darkMode
                          ? "text-white"
                          : "text-gray-900"
                        : darkMode
                          ? "text-white group-hover:text-red-300"
                          : "text-gray-900 group-hover:text-red-700"
                    }`}
                  >
                    {campaign.name}
                  </h3>

                  {/* Description */}
                  <p
                    className={`text-sm mb-4 line-clamp-2 leading-relaxed ${
                      darkMode ? "text-red-300/80" : "text-red-700/80"
                    }`}
                  >
                    {campaign.description || "No description available"}
                  </p>

                  {/* Progress */}
                  <CampaignProgress
                    campaign={campaign}
                    compact={true}
                    showDetails={false}
                    className="mb-4"
                    onPortfolioUpdate={(portfolio) =>
                      setPortfolioData((prev) => ({
                        ...prev,
                        [campaign.id]: portfolio,
                      }))
                    }
                  />

                  {/* Stats */}
                  <div className="flex justify-between text-sm">
                    <div
                      className={`font-semibold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      $
                      {portfolioData[campaign.id]
                        ? portfolioData[campaign.id].totalUSDValue.toFixed(0)
                        : formatUSDC(campaign.totalRaised)}
                      <span
                        className={`text-xs font-normal ml-1 ${
                          darkMode ? "text-red-300/60" : "text-red-600/60"
                        }`}
                      >
                        raised
                      </span>
                    </div>
                    <div
                      className={`font-semibold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      ${formatUSDC(campaign.goalAmount)}
                      <span
                        className={`text-xs font-normal ml-1 ${
                          darkMode ? "text-red-300/60" : "text-red-600/60"
                        }`}
                      >
                        goal
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredCampaigns.length === 0 && (
            <div
              className={`text-center py-12 rounded-2xl backdrop-blur-sm border ${
                darkMode
                  ? "bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-800/30"
                  : "bg-gradient-to-br from-red-50 to-pink-50 border-red-200"
              }`}
            >
              <div
                className={`inline-flex p-4 rounded-2xl mb-6 ${
                  darkMode
                    ? "bg-red-900/30 text-red-400"
                    : "bg-red-100 text-red-600"
                }`}
              >
                <span className="text-4xl">📭</span>
              </div>
              <h3
                className={`text-xl font-bold mb-3 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                No campaigns found
              </h3>
              <p
                className={`text-sm mb-6 max-w-xs mx-auto ${
                  darkMode ? "text-red-300/80" : "text-red-700/80"
                }`}
              >
                {searchTerm
                  ? `No campaigns match "${searchTerm}"`
                  : filter !== "all"
                    ? `No ${filter} campaigns at the moment`
                    : "No campaigns available"}
              </p>
              {(searchTerm || filter !== "all") && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setFilter("all");
                  }}
                  className={`px-6 py-2 rounded-xl font-medium transition-all duration-300 ${
                    darkMode
                      ? "border border-red-700 text-red-300 hover:bg-red-900/30"
                      : "border border-red-400 text-red-600 hover:bg-red-50"
                  }`}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div
        className={`p-4 border-t ${
          darkMode ? "border-red-800/30" : "border-red-200"
        }`}
      >
        <div className="flex justify-between items-center">
          <div>
            <div
              className={`text-sm font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {filteredCampaigns.length} campaign
              {filteredCampaigns.length !== 1 ? "s" : ""}
            </div>
            <div
              className={`text-xs ${
                darkMode ? "text-red-400/60" : "text-red-600/60"
              }`}
            >
              {searchTerm
                ? "Search results"
                : filter === "all"
                  ? "Total"
                  : filter + " campaigns"}
            </div>
          </div>
          <div
            className={`text-xs px-3 py-1.5 rounded-full ${
              darkMode
                ? "bg-red-900/30 text-red-300"
                : "bg-red-100 text-red-700"
            }`}
          >
            {campaigns.length} total
          </div>
        </div>
      </div>
    </div>
  );
}
