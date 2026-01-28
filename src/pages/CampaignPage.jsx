import React, { useState } from "react";
import CampaignsSidebar from "../components/CampaignSidebar";
import CampaignDetails from "../components/CampaignDetails";
import { useDarkMode } from "../contexts/themeContext";

export default function CampaignsExplorerPage() {
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const { darkMode } = useDarkMode();

  const handleSelectCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    console.log("Selected campaign:", campaign);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Gradient */}
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          darkMode
            ? "bg-gradient-to-br from-gray-900 via-slate-900 to-red-950/20"
            : "bg-gradient-to-br from-red-50 via-pink-50/30 to-white"
        }`}
      />

      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 z-0 opacity-20">
        <div
          className={`absolute inset-0 ${
            darkMode
              ? "bg-[radial-gradient(circle_at_1px_1px,rgba(220,38,38,0.15)_1px,transparent_1px)] bg-[length:40px_40px]"
              : "bg-[radial-gradient(circle_at_1px_1px,rgba(239,68,68,0.1)_1px,transparent_1px)] bg-[length:40px_40px]"
          }`}
        />
      </div>

      <div className="relative z-10 max-w-[95%] mx-auto pt-24 pb-8 px-4">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div
              className={`p-3 rounded-2xl ${
                darkMode
                  ? "bg-gradient-to-br from-red-900/30 to-pink-900/30 border border-red-800/40"
                  : "bg-gradient-to-br from-red-100 to-pink-100 border border-red-300"
              }`}
            >
              <span className="text-3xl">🔍</span>
            </div>
            <h1
              className={`text-5xl font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Campaign Explorer
            </h1>
          </div>
          <p
            className={`text-xl max-w-3xl mx-auto ${
              darkMode ? "text-red-300" : "text-red-700"
            }`}
          >
            Browse, analyze, and manage campaigns with detailed insights and
            real-time data
          </p>
        </div>

        {/* Main Explorer Container */}
        <div
          className={`rounded-3xl overflow-hidden border backdrop-blur-sm shadow-2xl ${
            darkMode
              ? "bg-gradient-to-br from-red-900/20 via-pink-900/10 to-transparent border-red-800/30 shadow-red-900/10"
              : "bg-gradient-to-br from-white/95 to-red-50/95 border-red-200 shadow-red-100"
          }`}
        >
          <div className="flex flex-col lg:flex-row h-auto lg:h-[75vh]">
            {/* Sidebar - Top on Mobile, Left on Desktop */}
            <div
              className={`w-full lg:w-96 min-w-0 border-b lg:border-b-0 lg:border-r ${
                darkMode ? "border-red-800/30" : "border-red-200"
              }`}
            >
              <div
                className={`h-full ${
                  darkMode
                    ? "bg-gradient-to-b from-slate-900/80 to-gray-900/80"
                    : "bg-gradient-to-b from-white/95 to-red-50/95"
                }`}
              >
                <div className="lg:hidden">
                  <CampaignsSidebar
                    variant="compact"
                    selectedCampaign={selectedCampaign}
                    onSelectCampaign={handleSelectCampaign}
                    darkMode={darkMode}
                  />
                </div>
                <div className="hidden lg:block h-full">
                  <CampaignsSidebar
                    selectedCampaign={selectedCampaign}
                    onSelectCampaign={handleSelectCampaign}
                    darkMode={darkMode}
                  />
                </div>
              </div>
            </div>

            {/* Main Content - Right Panel */}
            <div className="flex-1 overflow-hidden">
              {selectedCampaign ? (
                <div className="h-full animate-fadeIn">
                  <CampaignDetails
                    campaign={selectedCampaign}
                    onBack={() => setSelectedCampaign(null)}
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-12">
                  <div
                    className={`max-w-2xl mx-auto text-center rounded-3xl p-12 backdrop-blur-sm border ${
                      darkMode
                        ? "bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-800/30"
                        : "bg-gradient-to-br from-white/90 to-red-50/90 border-red-200"
                    }`}
                  >
                    <div
                      className={`inline-flex p-6 rounded-3xl mb-8 ${
                        darkMode
                          ? "bg-gradient-to-br from-red-900/30 to-pink-900/30"
                          : "bg-gradient-to-br from-red-100 to-pink-100"
                      }`}
                    >
                      <span className="text-6xl">📊</span>
                    </div>
                    <h2
                      className={`text-4xl font-bold mb-6 ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Explore Campaigns
                    </h2>
                    <p
                      className={`text-xl leading-relaxed mb-8 ${
                        darkMode ? "text-red-300" : "text-red-700"
                      }`}
                    >
                      Select a campaign from the sidebar to dive into detailed
                      analytics, funding progress, donation history, and
                      portfolio insights.
                    </p>
                    <div
                      className={`rounded-2xl p-6 backdrop-blur-sm border ${
                        darkMode
                          ? "bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-800/30"
                          : "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className={`text-2xl ${
                            darkMode ? "text-blue-400" : "text-blue-600"
                          }`}
                        >
                          💡
                        </span>
                        <div>
                          <h4
                            className={`text-lg font-bold mb-1 ${
                              darkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            Quick Navigation Tips
                          </h4>
                          <p
                            className={`text-sm ${
                              darkMode ? "text-blue-300/80" : "text-blue-700/80"
                            }`}
                          >
                            • Click on any campaign card to explore details
                            <br />
                            • Use filters to find specific campaigns
                            <br />
                            • View real-time funding progress
                            <br />• Analyze donation patterns
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Stats Preview */}
                    <div className="grid grid-cols-3 gap-4 mt-8">
                      {[
                        { icon: "📈", label: "Live Analytics", color: "green" },
                        { icon: "💝", label: "Donation Flow", color: "pink" },
                        {
                          icon: "🪙",
                          label: "Token Insights",
                          color: "purple",
                        },
                      ].map((stat, index) => (
                        <div
                          key={index}
                          className={`rounded-xl p-4 backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
                            darkMode
                              ? `bg-gradient-to-br from-${
                                  stat.color
                                }-900/20 to-${
                                  stat.color === "pink" ? "red" : stat.color
                                }-900/20 border-${stat.color}-800/30`
                              : `bg-gradient-to-br from-${stat.color}-50 to-${
                                  stat.color === "pink" ? "red" : stat.color
                                }-50 border-${stat.color}-200`
                          }`}
                        >
                          <div className="text-2xl mb-2">{stat.icon}</div>
                          <div
                            className={`text-sm font-medium ${
                              darkMode ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p
            className={`text-sm ${
              darkMode ? "text-red-400/60" : "text-red-600/60"
            }`}
          >
            Powered by Moonbase Alpha • Real-time blockchain data • Secure smart
            contracts
          </p>
        </div>
      </div>

      {/* Add fadeIn animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
