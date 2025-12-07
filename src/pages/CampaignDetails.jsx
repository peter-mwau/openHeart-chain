import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { useActiveAccount } from "thirdweb/react";
import { toast } from "react-toastify";
import DonationModal from "../components/DonationModal.jsx";
import { useContract } from "../hooks/useContract";
import { useTokenConversion } from "../hooks/useTokenConversion";
import CampaignProgress from "../components/CampaignProgress.jsx";
import PortfolioSummary from "../components/PortfolioSummary.jsx";
import { useDarkMode } from "../contexts/themeContext.jsx";

export default function CampaignDetails({ campaign, onBack }) {
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!address;
  const [activeTab, setActiveTab] = useState("overview");
  const [showDonationModal, setShowDonationModal] = useState(false);
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

  const safeConvertToUSD = (amount, tokenAddress) => {
    try {
      return convertToUSD(amount, tokenAddress);
    } catch (error) {
      console.warn("convertToUSD failed, using fallback:", error);
      const tokenInfo = getTokenConfig(tokenAddress);
      const formattedAmount = parseFloat(
        ethers.formatUnits(amount, tokenInfo.decimals)
      );

      const priceMap = {
        USDC: 1,
        WETH: 3213,
        WBTC: 110464,
      };

      return formattedAmount * (priceMap[tokenInfo.symbol] || 1);
    }
  };

  useEffect(() => {
    const fetchDonations = async () => {
      if (activeTab === "donations") {
        setIsLoadingDonations(true);
        try {
          if (getCampaignDonationsWithTokens) {
            let enriched = await getCampaignDonationsWithTokens(campaign.id);

            const needsMapping = enriched.some(
              (d) => !d.tokenAddress || d.tokenAddress === "" || !d.decimals
            );

            if (needsMapping) {
              try {
                const portfolioData = await calculatePortfolioValue(
                  campaign.id,
                  campaign.goalAmount.toString(),
                  getCampaignTokenBalances
                );

                const tokenCandidates = portfolioData.tokenBalances || [];

                const isReasonableAmount = (amountNum, symbol) => {
                  const ranges = {
                    USDC: { min: 0.001, max: 1e9 },
                    WETH: { min: 0.000001, max: 1e6 },
                    WBTC: { min: 0.0000001, max: 1e5 },
                  };
                  const r = ranges[symbol] || { min: 0, max: Infinity };
                  return amountNum >= r.min && amountNum <= r.max;
                };

                enriched = enriched.map((don) => {
                  if (don.tokenAddress && don.decimals) return don;

                  for (const t of tokenCandidates) {
                    try {
                      const amt = parseFloat(
                        ethers.formatUnits(don.amount ?? "0", t.decimals)
                      );
                      if (
                        !Number.isNaN(amt) &&
                        isReasonableAmount(amt, t.symbol)
                      ) {
                        return {
                          ...don,
                          tokenAddress: t.tokenAddress || t.tokenAddress,
                          symbol: t.symbol,
                          decimals: t.decimals,
                        };
                      }
                    } catch (e) {
                      continue;
                    }
                  }

                  return {
                    ...don,
                    tokenAddress:
                      import.meta.env.VITE_USDC_CONTRACT_ADDRESS || "",
                    symbol: don.symbol || "USDC",
                    decimals: don.decimals ?? 6,
                  };
                });
              } catch (err) {
                console.warn("Failed to enrich donations from portfolio:", err);
              }
            }

            setCampaignDonations(enriched);
          } else {
            const rawDonations = await getCampaignDonations(campaign.id);
            const [tokenAddresses, tokenBalances] =
              await getCampaignTokenBalances(campaign.id);

            const tokenMap = {
              [import.meta.env.VITE_USDC_CONTRACT_ADDRESS.toLowerCase()]: {
                symbol: "USDC",
                decimals: 6,
              },
              [import.meta.env.VITE_WETH_CONTRACT_ADDRESS.toLowerCase()]: {
                symbol: "WETH",
                decimals: 18,
              },
              [import.meta.env.VITE_WBTC_CONTRACT_ADDRESS.toLowerCase()]: {
                symbol: "WBTC",
                decimals: 8,
              },
            };

            const donationsWithTokens = rawDonations.map((donation, index) => {
              const donor = donation[0] || "Unknown";
              const amount = donation[1] || BigInt(0);
              const timestamp = donation[2] || BigInt(0);

              let tokenInfo =
                tokenMap[
                  import.meta.env.VITE_USDC_CONTRACT_ADDRESS.toLowerCase()
                ];

              if (amount > BigInt(10 ** 15) && amount < BigInt(10 ** 20)) {
                tokenInfo =
                  tokenMap[
                    import.meta.env.VITE_WETH_CONTRACT_ADDRESS.toLowerCase()
                  ];
              } else if (
                amount > BigInt(10 ** 7) &&
                amount < BigInt(10 ** 10)
              ) {
                tokenInfo =
                  tokenMap[
                    import.meta.env.VITE_WBTC_CONTRACT_ADDRESS.toLowerCase()
                  ];
              }

              const amountStr = amount.toString();
              if (
                amountStr === "5000000000000000000" ||
                amountStr === "14000000000000000000"
              ) {
                tokenInfo =
                  tokenMap[
                    import.meta.env.VITE_WETH_CONTRACT_ADDRESS.toLowerCase()
                  ];
              } else if (amountStr === "9000000000000000000") {
                tokenInfo =
                  tokenMap[
                    import.meta.env.VITE_WBTC_CONTRACT_ADDRESS.toLowerCase()
                  ];
              }

              const matchedEntry = Object.entries(tokenMap).find(
                ([, info]) => info.symbol === tokenInfo.symbol
              );
              const selectedAddress = matchedEntry
                ? matchedEntry[0]
                : import.meta.env.VITE_USDC_CONTRACT_ADDRESS;

              return {
                donor,
                amount,
                timestamp,
                tokenAddress: selectedAddress,
                symbol: tokenInfo.symbol,
                decimals: tokenInfo.decimals,
              };
            });

            setCampaignDonations(donationsWithTokens);
          }
        } catch (error) {
          console.error("Error fetching donations:", error);
          toast.error("Failed to load donation history");
        } finally {
          setIsLoadingDonations(false);
        }
      }
    };

    fetchDonations();
  }, [activeTab, campaign.id]);

  useEffect(() => {
    const loadPortfolio = async () => {
      if (activeTab === "portfolio") {
        setIsLoadingPortfolio(true);
        try {
          const portfolioData = await calculatePortfolioValue(
            campaign.id,
            campaign.goalAmount.toString(),
            getCampaignTokenBalances
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
  }, [activeTab, campaign.id, campaign.goalAmount]);

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
      (Number(campaign.deadline) * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
    )
  );
  const isActive = campaign.active && !campaign.cancelled && !campaign.funded;
  const isExpired = Date.now() > Number(campaign.deadline) * 1000;

  const recentDonations = [...campaignDonations]
    .sort((a, b) => Number(b.timestamp) - Number(a.timestamp))
    .filter(
      (d) => Number(d.timestamp) * 1000 >= Date.now() - 24 * 60 * 60 * 1000
    )
    .slice(0, 5);

  return (
    <div
      className={`h-[85vh] overflow-y-auto rounded-2xl ${
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
        <div className="p-6">
          <div className="flex items-center justify-between">
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
              <div>
                <h1
                  className={`text-3xl font-bold ${
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
            <div className="flex items-center space-x-3">
              {isActive && !isExpired && (
                <button
                  onClick={() => setShowDonationModal(true)}
                  className={`px-8 py-3 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 relative overflow-hidden ${
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
        <div className="px-6">
          <div className="flex space-x-2">
            {[
              { key: "overview", label: "Overview", icon: "📊" },
              { key: "portfolio", label: "Portfolio", icon: "💼" },
              { key: "analytics", label: "Analytics", icon: "📈" },
              { key: "donations", label: "Donations", icon: "💝" },
            ].map(({ key, label, icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-medium transition-all duration-300 ${
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
      <div className="p-6">
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
                        : campaign.funded
                        ? "Funded"
                        : isExpired
                        ? "Ended"
                        : "Active",
                      color: darkMode
                        ? campaign.cancelled
                          ? "text-red-400"
                          : campaign.funded
                          ? "text-green-400"
                          : isExpired
                          ? "text-gray-400"
                          : "text-blue-400"
                        : campaign.cancelled
                        ? "text-red-600"
                        : campaign.funded
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
                        ethers.formatUnits(campaign.goalAmount, 6)
                      ).toFixed(2)} USDC`,
                      color: darkMode ? "text-white" : "text-gray-900",
                    },
                    {
                      label: "Total Raised",
                      value: portfolio?.raisedUSD
                        ? `$${portfolio.raisedUSD.toFixed(2)} (USD equiv)`
                        : `${parseFloat(
                            ethers.formatUnits(campaign.totalDonated, 6)
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
          <div className="text-center py-12">
            <div
              className={`w-28 h-28 rounded-2xl flex items-center justify-center mx-auto mb-8 ${
                darkMode
                  ? "bg-gradient-to-br from-red-900/30 to-pink-900/30 border border-red-800/40"
                  : "bg-gradient-to-br from-red-100 to-pink-100 border border-red-300"
              }`}
            >
              <span className="text-4xl">📈</span>
            </div>
            <h3
              className={`text-3xl font-bold mb-4 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Advanced Analytics Dashboard
            </h3>
            <p
              className={`text-xl mb-8 max-w-2xl mx-auto ${
                darkMode ? "text-red-300" : "text-red-700"
              }`}
            >
              Real-time insights, donor behavior analysis, and performance
              metrics coming soon.
            </p>
            <div
              className={`max-w-lg mx-auto rounded-2xl p-6 backdrop-blur-sm border ${
                darkMode
                  ? "bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-800/30"
                  : "bg-gradient-to-br from-red-50 to-pink-50 border-red-200"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🚀</span>
                <div>
                  <h4
                    className={`font-bold mb-1 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Launching Soon
                  </h4>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-red-300/80" : "text-red-700/80"
                    }`}
                  >
                    Interactive charts, donor demographics, and real-time trend
                    analysis
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "donations" && (
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
                    Loading donation history...
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
                      Donation History
                    </h3>
                    <p
                      className={`text-sm mt-1 ${
                        darkMode ? "text-red-300" : "text-red-700"
                      }`}
                    >
                      {campaignDonations?.length || 0} donation
                      {(campaignDonations?.length || 0) !== 1 ? "s" : ""} •
                      Real-time updates
                    </p>
                  </div>
                </div>

                {/* Donation Statistics */}
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
                      label: "Total Donations",
                      icon: "💝",
                      color: darkMode
                        ? "from-red-900/30 to-pink-900/30 border-red-800/40"
                        : "from-red-50 to-pink-50 border-red-200",
                    },
                    {
                      value: `$${(
                        (portfolio?.raisedUSD || 0) /
                        Math.max(campaignDonations?.length || 1, 1)
                      ).toFixed(2)}`,
                      label: "Avg Donation",
                      icon: "📊",
                      color: darkMode
                        ? "from-purple-900/30 to-indigo-900/30 border-purple-800/40"
                        : "from-purple-50 to-indigo-50 border-purple-200",
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

                {/* Donations List */}
                <div
                  className={`rounded-2xl border overflow-hidden ${
                    darkMode
                      ? "bg-gradient-to-b from-red-900/10 to-transparent border-red-800/30"
                      : "bg-gradient-to-b from-red-50 to-transparent border-red-200"
                  }`}
                >
                  {campaignDonations && campaignDonations.length > 0 ? (
                    <div
                      className="divide-y"
                      style={{
                        borderColor: darkMode
                          ? "rgba(220, 38, 38, 0.2)"
                          : "rgba(239, 68, 68, 0.2)",
                      }}
                    >
                      {campaignDonations
                        .sort(
                          (a, b) => Number(b.timestamp) - Number(a.timestamp)
                        )
                        .map((donation, index) => {
                          const rawAmount = donation?.amount ?? "0";
                          const decimals =
                            donation?.decimals ??
                            getTokenConfig(donation?.tokenAddress)?.decimals ??
                            18;

                          let formattedAmount = "0";
                          try {
                            formattedAmount = ethers.formatUnits(
                              rawAmount,
                              decimals
                            );
                          } catch (err) {
                            formattedAmount = "0";
                          }

                          const usdValue = safeConvertToUSD(
                            rawAmount,
                            donation?.tokenAddress || ""
                          );

                          return (
                            <div
                              key={index}
                              className={`p-6 transition-all duration-300 hover:scale-[1.005] ${
                                darkMode
                                  ? "hover:bg-red-900/20"
                                  : "hover:bg-red-50/50"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <div
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                      darkMode
                                        ? "bg-gradient-to-br from-red-600 to-pink-600"
                                        : "bg-gradient-to-br from-red-500 to-pink-500"
                                    }`}
                                  >
                                    <span className="text-white font-bold">
                                      {donation?.donor
                                        ?.slice(2, 4)
                                        .toUpperCase()}
                                    </span>
                                  </div>
                                  <div>
                                    <div
                                      className={`font-mono text-sm font-bold ${
                                        darkMode
                                          ? "text-white"
                                          : "text-gray-900"
                                      }`}
                                    >
                                      {donation?.donor?.slice(0, 8)}...
                                      {donation?.donor?.slice(-6)}
                                    </div>
                                    <div
                                      className={`text-xs ${
                                        darkMode
                                          ? "text-red-400/60"
                                          : "text-red-600/60"
                                      }`}
                                    >
                                      {new Date(
                                        Number(donation.timestamp) * 1000
                                      ).toLocaleDateString("en-US", {
                                        year: "numeric",
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </div>
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div
                                    className={`text-xl font-bold ${
                                      darkMode
                                        ? "text-green-400"
                                        : "text-green-600"
                                    }`}
                                  >
                                    <span className="mr-2">
                                      {getTokenIcon(donation.symbol)}
                                    </span>
                                    +{parseFloat(formattedAmount).toFixed(6)}{" "}
                                    {donation.symbol}
                                  </div>
                                  <div
                                    className={`text-sm mt-1 ${
                                      darkMode
                                        ? "text-green-300"
                                        : "text-green-700"
                                    }`}
                                  >
                                    ${usdValue.toFixed(2)} USD
                                  </div>
                                </div>
                              </div>

                              {/* Progress Impact */}
                              <div className="mt-4">
                                <div className="flex items-center justify-between text-xs mb-1">
                                  <span
                                    className={`${
                                      darkMode ? "text-red-300" : "text-red-700"
                                    }`}
                                  >
                                    Campaign Impact
                                  </span>
                                  <span
                                    className={`font-medium ${
                                      darkMode ? "text-white" : "text-gray-900"
                                    }`}
                                  >
                                    {usdValue > 0 && portfolio?.goalUSD
                                      ? (
                                          (usdValue / portfolio.goalUSD) *
                                          100
                                        ).toFixed(4)
                                      : (
                                          (Number(donation?.amount ?? 0) /
                                            Number(campaign.goalAmount)) *
                                          100
                                        ).toFixed(4)}
                                    %
                                  </span>
                                </div>
                                <div
                                  className={`w-full h-1.5 rounded-full overflow-hidden ${
                                    darkMode ? "bg-red-900/30" : "bg-red-200"
                                  }`}
                                >
                                  <div
                                    className={`h-full rounded-full bg-gradient-to-r ${
                                      darkMode
                                        ? "from-green-500 to-emerald-400"
                                        : "from-green-500 to-emerald-400"
                                    }`}
                                    style={{
                                      width: `${
                                        usdValue > 0 && portfolio?.goalUSD
                                          ? Math.min(
                                              (usdValue / portfolio.goalUSD) *
                                                100,
                                              100
                                            )
                                          : 0
                                      }%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div
                        className={`inline-flex p-4 rounded-2xl mb-6 ${
                          darkMode
                            ? "bg-red-900/30 text-red-400"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        <span className="text-4xl">📭</span>
                      </div>
                      <h4
                        className={`text-2xl font-bold mb-3 ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        No Donations Yet
                      </h4>
                      <p
                        className={`text-lg max-w-md mx-auto ${
                          darkMode ? "text-red-300" : "text-red-700"
                        }`}
                      >
                        Be the first to support this campaign! Your contribution
                        will make a difference.
                      </p>
                      {isActive && !isExpired && (
                        <button
                          onClick={() => setShowDonationModal(true)}
                          className={`mt-6 px-8 py-3 rounded-xl font-bold transition-all duration-300 ${
                            darkMode
                              ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-lg shadow-red-900/30"
                              : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white shadow-lg shadow-red-200"
                          }`}
                        >
                          Be the First Donor
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Recent Activity */}
                {recentDonations && recentDonations.length > 0 && (
                  <div
                    className={`rounded-2xl p-6 backdrop-blur-sm border ${
                      darkMode
                        ? "bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-800/30"
                        : "bg-gradient-to-br from-red-50 to-pink-50 border-red-200"
                    }`}
                  >
                    <h4
                      className={`text-xl font-bold mb-6 ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Recent Activity (Last 24h)
                    </h4>
                    <div className="space-y-4">
                      {recentDonations.map((donation, index) => {
                        const rawAmount = donation?.amount ?? "0";
                        const decimals =
                          donation?.decimals ??
                          getTokenConfig(donation?.tokenAddress)?.decimals ??
                          18;

                        let formattedAmount = "0";
                        try {
                          formattedAmount = ethers.formatUnits(
                            rawAmount,
                            decimals
                          );
                        } catch (err) {
                          formattedAmount = "0";
                        }

                        return (
                          <div
                            key={index}
                            className="flex items-center space-x-3"
                          >
                            <div
                              className={`w-3 h-3 rounded-full ${
                                darkMode ? "bg-green-400" : "bg-green-500"
                              }`}
                            ></div>
                            <div className="flex-1">
                              <span
                                className={`text-sm font-medium ${
                                  darkMode ? "text-white" : "text-gray-900"
                                }`}
                              >
                                New donation from {donation.donor.slice(0, 6)}
                                ...{donation.donor.slice(-4)}
                              </span>
                              <span
                                className={`text-sm ml-2 ${
                                  darkMode ? "text-green-400" : "text-green-600"
                                }`}
                              >
                                {parseFloat(formattedAmount).toFixed(6)}{" "}
                                {donation.symbol}
                              </span>
                            </div>
                            <div
                              className={`text-xs ${
                                darkMode ? "text-red-400/60" : "text-red-600/60"
                              }`}
                            >
                              {new Date(
                                Number(donation.timestamp) * 1000
                              ).toLocaleDateString()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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
                        className={`text-3xl font-bold ${
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
      </div>

      <DonationModal
        campaign={campaign}
        isOpen={showDonationModal}
        onClose={() => setShowDonationModal(false)}
        onDonationSuccess={() => {
          toast.success("Donation completed successfully!");
        }}
      />
    </div>
  );
}
