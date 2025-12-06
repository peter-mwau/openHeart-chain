import React, { useState, useEffect } from "react";
import { useCampaigns } from "../contexts/campaignsContext";
import CampaignCard from "./CampaignCard";
import { useDarkMode } from "../contexts/themeContext.jsx";

export default function CampaignsGrid({ onViewDetails, onDonate }) {
  const { campaigns, loading, error, refreshCampaigns } = useCampaigns();
  const [filter, setFilter] = useState("all");
  const [isSpread, setIsSpread] = useState(false);
  const [viewMode, setViewMode] = useState("stacked");
  const { darkMode } = useDarkMode();

  // Sort campaigns by creation date (newest first) for stacking
  const sortedCampaigns = [...campaigns].sort(
    (a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)
  );

  // Filter campaigns based on selected filter
  const filteredCampaigns = sortedCampaigns.filter((campaign) => {
    const deadlineMs = Number(campaign.deadline) * 1000;
    const isExpired = Date.now() > deadlineMs;
    const isSuccessful =
      Number(campaign.totalDonated) >= Number(campaign.goalAmount);

    switch (filter) {
      case "active":
        return (
          campaign.active &&
          !campaign.cancelled &&
          !campaign.funded &&
          !isExpired
        );
      case "successful":
        return isSuccessful && campaign.active;
      case "ended":
        return (
          !campaign.active || campaign.cancelled || campaign.funded || isExpired
        );
      default:
        return true;
    }
  });

  // Auto-show as grid after initial load if there are campaigns
  useEffect(() => {
    if (filteredCampaigns.length > 0 && !loading) {
      const timer = setTimeout(() => {
        setViewMode("grid");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [filteredCampaigns.length, loading]);

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === "stacked" ? "grid" : "stacked"));
    setIsSpread(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center space-y-4">
          {/* Loading Animation */}
          <div className="relative mx-auto w-24 h-24">
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
            <div className="absolute inset-6 rounded-full border-4 border-pink-500/30 animate-ping"></div>
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
      <div className="text-center py-16">
        <div
          className={`max-w-md mx-auto rounded-2xl p-8 backdrop-blur-sm border ${
            darkMode
              ? "bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-800/30"
              : "bg-gradient-to-br from-red-50/80 to-pink-50/80 border-red-200"
          }`}
        >
          <div
            className={`inline-flex p-4 rounded-2xl mb-6 ${
              darkMode
                ? "bg-red-900/30 text-red-400"
                : "bg-red-100 text-red-600"
            }`}
          >
            <svg
              className="w-12 h-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3
            className={`text-xl font-bold mb-3 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Failed to load campaigns
          </h3>
          <p className={`mb-6 ${darkMode ? "text-red-300" : "text-red-700"}`}>
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

  if (filteredCampaigns.length === 0) {
    return (
      <div className="text-center py-20">
        <div
          className={`max-w-md mx-auto rounded-2xl p-10 backdrop-blur-sm border ${
            darkMode
              ? "bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-800/30"
              : "bg-gradient-to-br from-red-50/80 to-pink-50/80 border-red-200"
          }`}
        >
          <div
            className={`inline-flex p-4 rounded-2xl mb-6 ${
              darkMode
                ? "bg-red-900/30 text-red-400"
                : "bg-red-100 text-red-600"
            }`}
          >
            <span className="text-3xl">📭</span>
          </div>
          <h3
            className={`text-2xl font-bold mb-3 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            No campaigns found
          </h3>
          <p
            className={`mb-6 ${
              darkMode ? "text-red-300/80" : "text-red-700/80"
            }`}
          >
            {filter === "all"
              ? "Be the first to create a campaign!"
              : `No ${filter} campaigns at the moment. Try a different filter.`}
          </p>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                darkMode
                  ? "border border-red-700 text-red-300 hover:bg-red-900/30"
                  : "border border-red-400 text-red-600 hover:bg-red-50"
              }`}
            >
              View All Campaigns
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header and Controls */}
      <div
        className={`p-6 rounded-2xl backdrop-blur-sm border ${
          darkMode
            ? "bg-gradient-to-r from-red-900/20 to-pink-900/20 border-red-800/30"
            : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
        }`}
      >
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h2
              className={`text-3xl lg:text-4xl font-bold mb-2 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Live Campaigns
            </h2>
            <p
              className={`text-lg ${
                darkMode ? "text-red-300" : "text-red-700"
              }`}
            >
              Discover and support meaningful causes
              <span
                className={`block text-sm mt-1 ${
                  darkMode ? "text-red-400/60" : "text-red-600/60"
                }`}
              >
                {filteredCampaigns.length} campaign
                {filteredCampaigns.length !== 1 ? "s" : ""} found
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {/* View Toggle */}
            <button
              onClick={toggleViewMode}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 relative overflow-hidden ${
                darkMode
                  ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-lg shadow-red-900/30"
                  : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white shadow-lg shadow-red-200"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center gap-2">
                {viewMode === "stacked" ? (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                      />
                    </svg>
                    Grid View
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                      />
                    </svg>
                    Stack View
                  </>
                )}
              </span>
            </button>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "All", color: "red" },
                { key: "active", label: "Active", color: "green" },
                { key: "successful", label: "Successful", color: "purple" },
                { key: "ended", label: "Ended", color: "gray" },
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                    filter === filterOption.key
                      ? darkMode
                        ? `bg-gradient-to-r from-${filterOption.color}-600 to-${
                            filterOption.color === "red"
                              ? "pink"
                              : filterOption.color
                          }-600 text-white shadow-lg shadow-${
                            filterOption.color
                          }-900/30`
                        : `bg-gradient-to-r from-${filterOption.color}-500 to-${
                            filterOption.color === "red"
                              ? "pink"
                              : filterOption.color
                          }-500 text-white shadow-lg shadow-${
                            filterOption.color
                          }-200`
                      : darkMode
                      ? `bg-red-900/20 text-red-300 hover:bg-red-900/30 border border-red-800/30`
                      : `bg-red-50 text-red-600 hover:bg-red-100 border border-red-200`
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cards Container */}
      {viewMode === "stacked" ? (
        /* Stacked View with Spread Animation */
        <div
          className="relative h-auto pt-24 flex justify-center items-center"
          style={{ perspective: "2000px" }}
          onMouseEnter={() => setIsSpread(true)}
          onMouseLeave={() => setIsSpread(false)}
        >
          <div className="relative w-full max-w-md">
            {filteredCampaigns.slice(0, 5).map((campaign, index) => (
              <div key={campaign.id} className="absolute top-0 left-0 w-full">
                <CampaignCard
                  campaign={campaign}
                  onViewDetails={onViewDetails}
                  onDonate={onDonate}
                  index={index}
                  totalCards={Math.min(filteredCampaigns.length, 5)}
                  isGroupHovered={isSpread}
                  isStacked={true}
                />
              </div>
            ))}
          </div>

          {/* Hint Text */}
          {!isSpread && (
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
              <div
                className={`flex items-center space-x-3 backdrop-blur-sm px-5 py-3 rounded-full border animate-pulse ${
                  darkMode
                    ? "bg-gradient-to-r from-red-900/30 to-pink-900/30 border-red-800/40 text-red-300 shadow-lg shadow-red-900/20"
                    : "bg-gradient-to-r from-red-100 to-pink-100 border-red-300 text-red-700 shadow-lg shadow-red-200"
                }`}
              >
                <span className="text-sm font-medium">
                  ✨ Hover to spread cards
                </span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 11l5-5m0 0l5 5m-5-5v12"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Show more campaigns indicator */}
          {filteredCampaigns.length > 5 && (
            <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2">
              <div
                className={`backdrop-blur-sm px-4 py-2 rounded-full border ${
                  darkMode
                    ? "bg-gradient-to-r from-red-900/20 to-pink-900/20 border-red-800/30 text-red-300"
                    : "bg-gradient-to-r from-red-50 to-pink-50 border-red-300 text-red-700"
                }`}
              >
                <span className="text-sm font-medium">
                  +{filteredCampaigns.length - 5} more campaigns
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {filteredCampaigns.map((campaign, index) => (
            <div
              key={campaign.id}
              className="transform transition-all duration-500 hover:scale-[1.02]"
              style={{
                animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`,
              }}
            >
              <CampaignCard
                campaign={campaign}
                onViewDetails={onViewDetails}
                onDonate={onDonate}
                isStacked={false}
              />
            </div>
          ))}
        </div>
      )}

      {/* Results Count */}
      <div
        className={`text-center pt-6 border-t ${
          darkMode ? "border-red-900/30" : "border-red-200"
        }`}
      >
        <p
          className={`text-sm ${
            darkMode ? "text-red-400/60" : "text-red-600/60"
          }`}
        >
          Showing {filteredCampaigns.length} campaign
          {filteredCampaigns.length !== 1 ? "s" : ""}
          {filter !== "all" && ` (${filter} campaigns)`}
        </p>
      </div>

      {/* Add keyframes for fade in animation */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
