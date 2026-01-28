import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useActiveAccount } from "thirdweb/react";
import { toast } from "react-toastify";
import DonationModal from "./DonationModal.jsx";
import WithdrawalModal from "./WithdrawalModal.jsx";
import { useContract } from "../hooks/useContract.jsx";
import { useTokenConversion } from "../hooks/useTokenConversion.js";
import CampaignProgress from "./CampaignProgress.jsx";
import PortfolioSummary from "./PortfolioSummary.jsx";
import { useDarkMode } from "../contexts/themeContext.jsx";

import CampaignAnalytics from "./CampaignAnalytics";

export default function CampaignDetails({ campaign, onBack }) {
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!address;
  const [activeTab, setActiveTab] = useState("overview");
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [campaignDonations, setCampaignDonations] = useState([]);
  const [isLoadingDonations, setIsLoadingDonations] = useState(false);
  const { getCampaignDonations } = useContract();
  const [portfolio, setPortfolio] = useState(null);
  const [isLoadingPortfolio, setIsLoadingPortfolio] = useState(false);
  const { calculatePortfolioValue, convertToUSD, getTokenConfig } =
    useTokenConversion();
  const {
    getCampaignDonationsWithTokens,
    getTokenIcon,
    getCampaignTokenBalances,
  } = useContract();
  const { darkMode } = useDarkMode();

  // console.log("Rendering CampaignDetails for campaign:", campaign);

  // Removed local safeConvertToUSD and priceMap to use shared hook logic

  useEffect(() => {
    const fetchDonations = async () => {
      if (activeTab === "transactions") {
        setIsLoadingDonations(true);
        try {
          // Always use the robust method if available
          if (getCampaignDonationsWithTokens) {
            const enriched = await getCampaignDonationsWithTokens(campaign.id);
            setCampaignDonations(enriched);
          } else {
            // Fallback to basic if main method missing (shouldn't happen with updated hooks)
            const rawDonations = await getCampaignDonations(campaign.id);
            setCampaignDonations(
              rawDonations.map((d) => ({
                ...d,
                symbol: "Unknown",
                decimals: 18,
                tokenAddress: "",
              })),
            );
          }
        } catch (error) {
          console.error("Error fetching donations:", error);
          toast.error("Failed to load transaction history");
        } finally {
          setIsLoadingDonations(false);
        }
      }
    };

    fetchDonations();
  }, [activeTab, campaign?.id]);

  useEffect(() => {
    const loadPortfolio = async () => {
      if (activeTab === "portfolio") {
        setIsLoadingPortfolio(true);
        try {
          const portfolioData = await calculatePortfolioValue(
            campaign.id,
            campaign.goalAmount.toString(),
            getCampaignTokenBalances,
          );
          setPortfolio(portfolioData);
        } catch (error) {
          console.error("Error loading portfolio:", error);
          toast.error("Failed to load portfolio data");
        } finally {
          setIsLoadingPortfolio(false);
        }
      }
    };

    loadPortfolio();
  }, [activeTab, campaign?.id, campaign?.goalAmount]);

  const formatDate = (timestamp) => {
    return new Date(Number(timestamp) * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const daysLeft = Math.max(
    0,
    Math.ceil(
      (Number(campaign?.deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24),
    ),
  );
  const isActive =
    campaign.active && !campaign.cancelled && !campaign.withdrawalComplete;
  const isExpired = Date.now() > Number(campaign.deadline) * 1000;
  const isOwner =
    address &&
    campaign.creator &&
    address.toLowerCase() === campaign.creator.toLowerCase();
  const goalReached =
    portfolio?.raisedUSD >=
    (parseFloat(ethers.formatUnits(campaign.goalAmount, 6)) || 0);
  const showWithdrawButton =
    isOwner && (isExpired || (isActive && goalReached));
  const showDonateButton = isActive && !isExpired && !isOwner;

  const recentDonations = [...campaignDonations]
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    .filter(
      (d) => Number(d.timestamp) * 1000 >= Date.now() - 24 * 60 * 60 * 1000,
    )
    .slice(0, 5);

  return (
    <div
      className={`h-auto lg:h-[75vh] lg:overflow-y-auto rounded-2xl ${
        darkMode
          ? "bg-gradient-to-b from-slate-900 to-gray-900"
          : "bg-gradient-to-b from-red-50 to-white"
      }`}
    >
      {/* Header */}
      <div
        className={`sticky top-0 z-10 backdrop-blur-sm border-b ${
          darkMode
            ? "bg-gradient-to-b from-slate-900/95 to-slate-900/80 border-red-900/30"
            : "bg-gradient-to-b from-white/95 to-white/80 border-red-200"
        }`}
      >
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
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
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </button>
              <div className="min-w-0">
                <h1
                  className={`text-2xl sm:text-3xl font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {campaign.name}
                </h1>
                <p
                  className={`text-sm ${
                    darkMode ? "text-red-300" : "text-red-700"
                  }`}
                >
                  by {campaign.creator.slice(0, 8)}...
                  {campaign.creator.slice(-6)}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
              {showWithdrawButton && (
                <button
                  onClick={() => setShowWithdrawalModal(true)}
                  className={`w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 relative overflow-hidden ${
                    darkMode
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-900/30"
                      : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white shadow-lg shadow-purple-200"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="text-lg">🏦</span>
                    Withdraw Funds
                  </span>
                </button>
              )}
              {showDonateButton && (
                <button
                  onClick={() => setShowDonationModal(true)}
                  className={`w-full sm:w-auto px-6 sm:px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 relative overflow-hidden ${
                    darkMode
                      ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-lg shadow-red-900/30"
                      : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white shadow-lg shadow-red-200"
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center gap-2">
                    {isConnected ? (
                      <>
                        <span className="text-lg">💝</span>
                        Donate Now
                      </>
                    ) : (
                      <>
                        <span className="text-lg">🔗</span>
                        Connect Wallet
                      </>
                    )}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {[
              { key: "overview", label: "Overview", icon: "📊" },
              { key: "portfolio", label: "Portfolio", icon: "💼" },
              { key: "analytics", label: "Analytics", icon: "📈" },
              { key: "transactions", label: "Transactions", icon: "📋" },
              { key: "withdrawal", label: "Withdrawal", icon: "🏦" },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center space-x-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-medium transition-all mb-3 duration-300 text-sm sm:text-base ${
                  activeTab === key
                    ? darkMode
                      ? "bg-gradient-to-r from-red-900/40 to-pink-900/40 border border-red-800/40 text-white shadow-lg shadow-red-900/20"
                      : "bg-gradient-to-r from-red-100 to-pink-100 border border-red-300 text-red-700 shadow-lg shadow-red-200"
                    : darkMode
                      ? "text-red-300 hover:text-white hover:bg-red-900/20"
                      : "text-red-600 hover:text-red-700 hover:bg-red-50"
                }`}
              >
                <span className="text-lg">{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 sm:p-6">
        {activeTab === "overview" && (
          <div className="space-y-6">
            <CampaignProgress campaign={campaign} />

            {/* Description */}
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
                  <span className="text-xl">📖</span>
                </div>
                <h3
                  className={`text-xl font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  About this Campaign
                </h3>
              </div>
              <p
                className={`leading-relaxed ${
                  darkMode ? "text-red-300/80" : "text-red-700/80"
                }`}
              >
                {campaign.description ||
                  "No description provided for this campaign."}
              </p>
            </div>

            {/* Campaign Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    <span className="text-xl">⚡</span>
                  </div>
                  <h3
                    className={`text-xl font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Campaign Details
                  </h3>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      label: "Status",
                      value: campaign.cancelled
                        ? "Cancelled"
                        : campaign.withdrawalComplete
                          ? "Funded"
                          : isExpired
                            ? "Ended"
                            : "Active",
                      color: darkMode
                        ? campaign.cancelled
                          ? "text-red-400"
                          : campaign.withdrawalComplete
                            ? "text-green-400"
                            : isExpired
                              ? "text-gray-400"
                              : "text-blue-400"
                        : campaign.cancelled
                          ? "text-red-600"
                          : campaign.withdrawalComplete
                            ? "text-green-600"
                            : isExpired
                              ? "text-gray-600"
                              : "text-blue-600",
                    },
                    {
                      label: "Created",
                      value: formatDate(campaign.createdAt),
                      color: darkMode ? "text-white" : "text-gray-900",
                    },
                    {
                      label: "Deadline",
                      value: formatDate(campaign.deadline),
                      color: darkMode ? "text-white" : "text-gray-900",
                    },
                    {
                      label: "Campaign ID",
                      value: `#${campaign.id}`,
                      color: darkMode ? "text-red-300" : "text-red-700",
                    },
                    {
                      label: "Goal Amount",
                      value: `$${parseFloat(
                        ethers.formatUnits(campaign.goalAmount, 6),
                      ).toFixed(2)} USDC`,
                      color: darkMode ? "text-white" : "text-gray-900",
                    },
                    {
                      label: "Total Raised",
                      value: portfolio?.raisedUSD
                        ? `$${portfolio.raisedUSD.toFixed(2)} (USD equiv)`
                        : `${parseFloat(
                            ethers.formatUnits(campaign.totalRaised, 6),
                          ).toFixed(2)} USDC`,
                      color: darkMode ? "text-green-300" : "text-green-700",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-3 border-b last:border-0"
                      style={{
                        borderColor: darkMode
                          ? "rgba(220, 38, 38, 0.2)"
                          : "rgba(239, 68, 68, 0.2)",
                      }}
                    >
                      <span
                        className={`text-sm font-medium ${
                          darkMode ? "text-red-300" : "text-red-700"
                        }`}
                      >
                        {item.label}
                      </span>
                      <span className={`text-sm font-semibold ${item.color}`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className={`rounded-2xl p-6 backdrop-blur-sm border ${
                  darkMode
                    ? "bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-800/30"
                    : "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200"
                }`}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div
                    className={`p-2 rounded-xl ${
                      darkMode
                        ? "bg-purple-900/30 text-purple-400"
                        : "bg-purple-100 text-purple-600"
                    }`}
                  >
                    <span className="text-xl">👤</span>
                  </div>
                  <h3
                    className={`text-xl font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Campaign Creator
                  </h3>
                </div>
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                      darkMode
                        ? "bg-gradient-to-br from-red-600 to-pink-600"
                        : "bg-gradient-to-br from-red-500 to-pink-500"
                    }`}
                  >
                    <span className="text-white text-xl font-bold">
                      {campaign.creator.slice(2, 4).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div
                      className={`font-mono text-lg font-bold mb-1 ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {campaign.creator.slice(0, 8)}...
                      {campaign.creator.slice(-6)}
                    </div>
                    <div
                      className={`text-sm ${
                        darkMode ? "text-purple-300" : "text-purple-700"
                      }`}
                    >
                      Campaign Owner
                    </div>
                    {isActive && (
                      <div
                        className={`text-xs mt-2 px-3 py-1 rounded-full inline-block ${
                          darkMode
                            ? "bg-green-900/30 text-green-300"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        Active Campaign Manager
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <CampaignAnalytics
            campaign={campaign}
            donations={campaignDonations}
            portfolio={portfolio}
          />
        )}

        {activeTab === "transactions" && (
          <div className="space-y-6">
            {isLoadingDonations ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-center space-y-4">
                  <div
                    className={`relative mx-auto w-20 h-20 ${
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
                        darkMode ? "border-red-400" : "border-red-500"
                      } border-t-transparent animate-spin`}
                    ></div>
                  </div>
                  <p
                    className={`text-lg font-medium ${
                      darkMode ? "text-red-300" : "text-red-700"
                    }`}
                  >
                    Loading transaction history...
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h3
                      className={`text-2xl font-bold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Transaction History
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        darkMode ? "text-red-300" : "text-red-700"
                      }`}
                    >
                      {(campaignDonations?.length || 0) +
                        (campaign.withdrawalComplete ? 1 : 0)}{" "}
                      transaction
                      {(campaignDonations?.length || 0) +
                        (campaign.withdrawalComplete ? 1 : 0) !==
                      1
                        ? "s"
                        : ""}{" "}
                      • Donations & Withdrawals
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsLoadingDonations(true);
                      if (getCampaignDonationsWithTokens) {
                        getCampaignDonationsWithTokens(campaign.id)
                          .then((enriched) => setCampaignDonations(enriched))
                          .catch((err) => {
                            console.error("Error refreshing donations:", err);
                            toast.error("Failed to refresh transactions");
                          })
                          .finally(() => setIsLoadingDonations(false));
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                      darkMode
                        ? "bg-red-900/30 text-red-300 hover:bg-red-900/50"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    🔄 Refresh
                  </button>
                </div>

                {/* Transaction Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    {
                      value: `$${portfolio?.raisedUSD?.toFixed(2) || "0.00"}`,
                      label: "Total Raised",
                      icon: "💰",
                      color: darkMode
                        ? "from-blue-900/30 to-cyan-900/30 border-blue-800/40"
                        : "from-blue-50 to-cyan-50 border-blue-200",
                    },
                    {
                      value: campaignDonations?.length || 0,
                      label: "Donations",
                      icon: "💝",
                      color: darkMode
                        ? "from-red-900/30 to-pink-900/30 border-red-800/40"
                        : "from-red-50 to-pink-50 border-red-200",
                    },
                    {
                      value: campaign.withdrawalComplete ? "✅" : "❌",
                      label: "Withdrawn",
                      icon: "🏦",
                      color: campaign.withdrawalComplete
                        ? darkMode
                          ? "from-green-900/30 to-emerald-900/30 border-green-800/40"
                          : "from-green-50 to-emerald-50 border-green-200"
                        : darkMode
                          ? "from-gray-900/30 to-slate-900/30 border-gray-800/40"
                          : "from-gray-50 to-slate-50 border-gray-200",
                    },
                    {
                      value: new Set(campaignDonations?.map((d) => d.symbol))
                        .size,
                      label: "Tokens Used",
                      icon: "🪙",
                      color: darkMode
                        ? "from-amber-900/30 to-yellow-900/30 border-amber-800/40"
                        : "from-amber-50 to-yellow-50 border-amber-200",
                    },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className={`rounded-xl p-4 backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${stat.color}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-sm font-medium ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {stat.label}
                        </span>
                        <span className="text-lg">{stat.icon}</span>
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {stat.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Timeline View */}
                <div
                  className={`rounded-2xl border overflow-hidden ${
                    darkMode
                      ? "bg-gradient-to-b from-red-900/10 to-transparent border-red-800/30"
                      : "bg-gradient-to-b from-red-50 to-transparent border-red-200"
                  }`}
                >
                  {campaignDonations && campaignDonations.length > 0 ? (
                    <div className="space-y-0">
                      {/* Withdrawal transaction if completed */}
                      {campaign.withdrawalComplete &&
                        campaign.fundsWithdrawnAt && (
                          <div
                            className={`p-5 border-b transition-all duration-300 hover:bg-opacity-50 ${
                              darkMode
                                ? "border-red-800/20 hover:bg-green-900/10"
                                : "border-red-200 hover:bg-green-50"
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-4">
                                <div
                                  className={`p-3 rounded-xl mt-1 flex-shrink-0 ${
                                    darkMode
                                      ? "bg-green-900/30 text-green-400"
                                      : "bg-green-100 text-green-600"
                                  }`}
                                >
                                  <span className="text-lg">🏦</span>
                                </div>
                                <div>
                                  <div
                                    className={`font-bold ${
                                      darkMode ? "text-white" : "text-gray-900"
                                    }`}
                                  >
                                    Withdrawal
                                  </div>
                                  <div
                                    className={`text-sm ${
                                      darkMode
                                        ? "text-green-300/80"
                                        : "text-green-700/80"
                                    }`}
                                  >
                                    $
                                    {parseFloat(
                                      ethers.formatUnits(
                                        campaign.amountWithdrawn || 0,
                                        6,
                                      ),
                                    ).toFixed(2)}{" "}
                                    USDC
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div
                                  className={`text-sm font-medium ${
                                    darkMode
                                      ? "text-green-300"
                                      : "text-green-700"
                                  }`}
                                >
                                  {new Date(
                                    Number(campaign.fundsWithdrawnAt) * 1000,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </div>
                                <div
                                  className={`text-xs ${
                                    darkMode
                                      ? "text-green-400/60"
                                      : "text-green-600/60"
                                  }`}
                                >
                                  Completed
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                      {/* Donations */}
                      {campaignDonations.map((donation, index) => (
                        <div
                          key={index}
                          className={`p-5 border-b last:border-0 transition-all duration-300 hover:bg-opacity-50 ${
                            darkMode
                              ? "border-red-800/20 hover:bg-red-900/10"
                              : "border-red-200 hover:bg-red-50"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start space-x-4 min-w-0">
                              <div
                                className={`p-3 rounded-xl mt-1 flex-shrink-0 ${
                                  darkMode
                                    ? "bg-red-900/30 text-red-400"
                                    : "bg-red-100 text-red-600"
                                }`}
                              >
                                <span className="text-lg">💝</span>
                              </div>
                              <div className="min-w-0">
                                <div
                                  className={`font-bold ${
                                    darkMode ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  Donation
                                </div>
                                <div
                                  className={`text-sm ${
                                    darkMode
                                      ? "text-red-300/80"
                                      : "text-red-700/80"
                                  }`}
                                >
                                  {parseFloat(
                                    ethers.formatUnits(
                                      donation.amount,
                                      donation.decimals || 6,
                                    ),
                                  ).toFixed(4)}{" "}
                                  {donation.symbol}
                                </div>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div
                                className={`text-sm font-semibold ${
                                  darkMode ? "text-red-300" : "text-red-700"
                                }`}
                              >
                                {donation.usdValue
                                  ? `$${donation.usdValue.toFixed(2)}`
                                  : "—"}
                              </div>
                              <div
                                className={`text-xs ${
                                  darkMode
                                    ? "text-red-400/60"
                                    : "text-red-600/60"
                                }`}
                              >
                                {new Date(
                                  Number(donation.timestamp) * 1000,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className={`text-center py-16 ${
                        darkMode ? "text-red-300" : "text-red-700"
                      }`}
                    >
                      <div className="text-4xl mb-4">🎯</div>
                      <p className="font-medium">No transactions yet</p>
                      <p className="text-sm mt-1">
                        Donations will appear here once received
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "portfolio" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h3
                  className={`text-2xl font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Campaign Portfolio
                </h3>
                <p
                  className={`text-sm mt-1 ${
                    darkMode ? "text-red-300" : "text-red-700"
                  }`}
                >
                  Multi-asset distribution and performance metrics
                </p>
              </div>
            </div>

            <CampaignProgress campaign={campaign} showTokenBreakdown={true} />

            {isLoadingPortfolio ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-center space-y-4">
                  <div
                    className={`relative mx-auto w-20 h-20 ${
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
                        darkMode ? "border-red-400" : "border-red-500"
                      } border-t-transparent animate-spin`}
                    ></div>
                  </div>
                  <p
                    className={`text-lg font-medium ${
                      darkMode ? "text-red-300" : "text-red-700"
                    }`}
                  >
                    Loading portfolio data...
                  </p>
                </div>
              </div>
            ) : portfolio ? (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    {
                      value: `$${portfolio.totalUSDValue.toFixed(2)}`,
                      label: "Total Value",
                      icon: "💰",
                      color: darkMode
                        ? "from-blue-900/30 to-cyan-900/30"
                        : "from-blue-50 to-cyan-50",
                      border: darkMode
                        ? "border-blue-800/40"
                        : "border-blue-200",
                    },
                    {
                      value: `${portfolio.progress.toFixed(1)}%`,
                      label: "Funded",
                      icon: "📈",
                      color: darkMode
                        ? "from-green-900/30 to-emerald-900/30"
                        : "from-green-50 to-emerald-50",
                      border: darkMode
                        ? "border-green-800/40"
                        : "border-green-200",
                    },
                    {
                      value: portfolio.tokenBalances.length,
                      label: "Assets",
                      icon: "🪙",
                      color: darkMode
                        ? "from-purple-900/30 to-indigo-900/30"
                        : "from-purple-50 to-indigo-50",
                      border: darkMode
                        ? "border-purple-800/40"
                        : "border-purple-200",
                    },
                    {
                      value: daysLeft,
                      label: "Days Left",
                      icon: "⏳",
                      color: darkMode
                        ? "from-amber-900/30 to-yellow-900/30"
                        : "from-amber-50 to-yellow-50",
                      border: darkMode
                        ? "border-amber-800/40"
                        : "border-amber-200",
                    },
                  ].map((stat, index) => (
                    <div
                      key={index}
                      className={`rounded-xl p-5 backdrop-blur-sm border transition-all duration-300 hover:scale-105 bg-gradient-to-br ${stat.color} ${stat.border}`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`text-sm font-medium ${
                            darkMode ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {stat.label}
                        </span>
                        <span className="text-xl">{stat.icon}</span>
                      </div>
                      <div
                        className={`text-2xl font-bold ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {stat.value}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          darkMode ? "text-gray-400/60" : "text-gray-600/60"
                        }`}
                      >
                        USD Equivalent
                      </div>
                    </div>
                  ))}
                </div>

                <PortfolioSummary portfolio={portfolio} daysLeft={daysLeft} />
              </>
            ) : (
              <div
                className={`text-center py-16 rounded-2xl backdrop-blur-sm border ${
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
                  <span className="text-4xl">📊</span>
                </div>
                <h4
                  className={`text-2xl font-bold mb-3 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Portfolio Data Unavailable
                </h4>
                <p
                  className={`text-lg max-w-md mx-auto ${
                    darkMode ? "text-red-300" : "text-red-700"
                  }`}
                >
                  Unable to load portfolio data at this time. Please try again
                  later.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === "withdrawal" && (
          <div className="space-y-6">
            {/* Withdrawal Summary */}
            <div
              className={`rounded-2xl p-6 backdrop-blur-sm border ${
                darkMode
                  ? "bg-gradient-to-br from-purple-900/20 to-indigo-900/20 border-purple-800/30"
                  : "bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200"
              }`}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div
                  className={`p-2.5 rounded-lg flex-shrink-0 ${
                    darkMode
                      ? "bg-purple-900/30 text-purple-400"
                      : "bg-purple-100 text-purple-600"
                  }`}
                >
                  <span className="text-xl">🏦</span>
                </div>
                <h3
                  className={`text-xl font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Withdrawal Summary
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Total Raised */}
                <div
                  className={`p-4 rounded-lg border ${
                    darkMode
                      ? "bg-purple-900/10 border-purple-700/30"
                      : "bg-white/50 border-purple-200"
                  }`}
                >
                  <div
                    className={`text-xs font-semibold mb-1 uppercase tracking-wide ${
                      darkMode ? "text-purple-300" : "text-purple-700"
                    }`}
                  >
                    Total Raised
                  </div>
                  <div
                    className={`text-md font-bold truncate ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    $
                    {portfolio?.raisedUSD
                      ? portfolio.raisedUSD.toFixed(2)
                      : parseFloat(
                          ethers.formatUnits(campaign.totalRaised, 6),
                        ).toFixed(2)}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      darkMode ? "text-purple-400/60" : "text-purple-600/60"
                    }`}
                  >
                    USD Equivalent
                  </div>
                </div>

                {/* Amount Withdrawn */}
                <div
                  className={`p-4 rounded-lg border ${
                    darkMode
                      ? "bg-green-900/10 border-green-700/30"
                      : "bg-white/50 border-green-200"
                  }`}
                >
                  <div
                    className={`text-xs font-semibold mb-1 uppercase tracking-wide ${
                      darkMode ? "text-green-300" : "text-green-700"
                    }`}
                  >
                    Withdrawn
                  </div>
                  <div
                    className={`text-md font-bold truncate ${
                      campaign.amountWithdrawn > 0
                        ? darkMode
                          ? "text-green-400"
                          : "text-green-600"
                        : darkMode
                          ? "text-gray-400"
                          : "text-gray-500"
                    }`}
                  >
                    $
                    {campaign.amountWithdrawn > 0
                      ? parseFloat(
                          ethers.formatUnits(campaign.amountWithdrawn, 6),
                        ).toFixed(2)
                      : "0.00"}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      darkMode ? "text-green-400/60" : "text-green-600/60"
                    }`}
                  >
                    USDC
                  </div>
                </div>

                {/* Current Balance */}
                <div
                  className={`p-4 rounded-lg border ${
                    darkMode
                      ? "bg-blue-900/10 border-blue-700/30"
                      : "bg-white/50 border-blue-200"
                  }`}
                >
                  <div
                    className={`text-xs font-semibold mb-1 uppercase tracking-wide ${
                      darkMode ? "text-blue-300" : "text-blue-700"
                    }`}
                  >
                    Remaining
                  </div>
                  <div
                    className={`text-md font-bold truncate ${
                      darkMode ? "text-blue-400" : "text-blue-600"
                    }`}
                  >
                    $
                    {portfolio?.raisedUSD && campaign.amountWithdrawn > 0
                      ? (
                          portfolio.raisedUSD -
                          parseFloat(
                            ethers.formatUnits(campaign.amountWithdrawn, 6),
                          )
                        ).toFixed(2)
                      : portfolio?.raisedUSD
                        ? portfolio.raisedUSD.toFixed(2)
                        : (
                            parseFloat(
                              ethers.formatUnits(campaign.totalRaised, 6),
                            ) -
                            parseFloat(
                              ethers.formatUnits(
                                campaign.amountWithdrawn || 0,
                                6,
                              ),
                            )
                          ).toFixed(2)}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      darkMode ? "text-blue-400/60" : "text-blue-600/60"
                    }`}
                  >
                    Not Withdrawn
                  </div>
                </div>
              </div>
            </div>

            {/* Withdrawal Status */}
            <div
              className={`rounded-2xl p-6 backdrop-blur-sm border ${
                darkMode
                  ? "bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-800/30"
                  : "bg-gradient-to-br from-red-50 to-pink-50 border-red-200"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center space-x-3 min-w-0">
                  <div
                    className={`p-2.5 rounded-lg flex-shrink-0 ${
                      campaign.withdrawalComplete
                        ? darkMode
                          ? "bg-green-900/30 text-green-400"
                          : "bg-green-100 text-green-600"
                        : darkMode
                          ? "bg-amber-900/30 text-amber-400"
                          : "bg-amber-100 text-amber-600"
                    }`}
                  >
                    <span className="text-lg">
                      {campaign.withdrawalComplete ? "✅" : "⏳"}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h4
                      className={`font-bold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {campaign.withdrawalComplete
                        ? "Withdrawal Complete"
                        : "Withdrawal Pending"}
                    </h4>
                    <p
                      className={`text-sm truncate ${
                        darkMode ? "text-red-300" : "text-red-700"
                      }`}
                    >
                      {campaign.withdrawalComplete && campaign.fundsWithdrawnAt
                        ? `Withdrawn on ${new Date(
                            Number(campaign.fundsWithdrawnAt) * 1000,
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}`
                        : campaign.withdrawalComplete
                          ? "All available funds have been withdrawn"
                          : "Waiting for withdrawal transaction"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Token Breakdown */}
            {portfolio?.tokenBalances && portfolio.tokenBalances.length > 0 && (
              <div
                className={`rounded-2xl p-6 backdrop-blur-sm border ${
                  darkMode
                    ? "bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-800/30"
                    : "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200"
                }`}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div
                    className={`p-3 rounded-xl ${
                      darkMode
                        ? "bg-blue-900/30 text-blue-400"
                        : "bg-blue-100 text-blue-600"
                    }`}
                  >
                    <span className="text-2xl">💰</span>
                  </div>
                  <h4
                    className={`text-xl font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Token Distribution
                  </h4>
                </div>

                <div className="space-y-4">
                  {portfolio.tokenBalances.map((token, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border ${
                        darkMode
                          ? "bg-blue-900/10 border-blue-700/30"
                          : "bg-white/50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`text-2xl p-2 rounded-lg ${
                              darkMode ? "bg-blue-900/20" : "bg-blue-100"
                            }`}
                          >
                            {token.symbol === "USDC"
                              ? "💵"
                              : token.symbol === "WETH"
                                ? "🔷"
                                : token.symbol === "WBTC"
                                  ? "🟡"
                                  : "🪙"}
                          </div>
                          <div>
                            <div
                              className={`font-bold ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {token.symbol}
                            </div>
                            <div
                              className={`text-sm ${
                                darkMode
                                  ? "text-blue-300/60"
                                  : "text-blue-600/60"
                              }`}
                            >
                              {token.balanceFormatted}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-bold text-lg ${
                              darkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            ${token.usdValue.toFixed(2)}
                          </div>
                          <div
                            className={`text-sm ${
                              darkMode ? "text-blue-300/60" : "text-blue-600/60"
                            }`}
                          >
                            {(
                              (token.usdValue / portfolio.totalUSDValue) *
                              100
                            ).toFixed(1)}
                            %
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div
              className={`rounded-2xl p-6 backdrop-blur-sm border ${
                darkMode
                  ? "bg-gradient-to-br from-gray-900/40 to-slate-900/40 border-gray-800/30"
                  : "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`p-3 rounded-xl mt-1 flex-shrink-0 ${
                    darkMode
                      ? "bg-blue-900/30 text-blue-400"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  <span className="text-xl">ℹ️</span>
                </div>
                <div>
                  <h4
                    className={`font-bold mb-2 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Withdrawal Information
                  </h4>
                  <ul
                    className={`text-sm space-y-2 ${
                      darkMode ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    <li>
                      • Withdrawals can only be made after the goal is reached
                      or deadline passes
                    </li>
                    <li>
                      • All tokens are withdrawn together in a single
                      transaction
                    </li>
                    <li>
                      • The "Total Raised" amount never changes, even after
                      withdrawal
                    </li>
                    <li>
                      • Remaining balance shows funds not yet withdrawn from the
                      contract
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <DonationModal
        campaign={campaign}
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
        onDonationSuccess={() => {
          toast.success("Donation completed successfully!");
        }}
      />

      <WithdrawalModal
        campaign={campaign}
        isOpen={showWithdrawalModal}
        onClose={() => setShowWithdrawalModal(false)}
        onWithdrawalSuccess={() => {
          toast.success("Withdrawal completed successfully!");
        }}
      />
    </div>
  );
}
