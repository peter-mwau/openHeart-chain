import { useState } from "react";
import CreateCampaign from "../components/CreateCampaign";
import CampaignsGrid from "../components/CampaignGrid.jsx";
import DonationModal from "../components/DonationModal.jsx";
import { useDarkMode } from "../contexts/themeContext.jsx";

export default function Home({ setCurrentPage }) {
  const [openCreateCampaign, setOpenCreateCampaign] = useState(false);
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const { darkMode } = useDarkMode();

  const handleViewDetails = (campaign) => {
    // Navigate to campaign explorer page where user can view details
    setCurrentPage("campaignPage");
  };

  const handleDonate = (campaign) => {
    setSelectedCampaign(campaign);
    setShowDonationModal(true);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Gradient Overlay */}
      <div
        className={`absolute inset-0 z-0 transition-all duration-500 ${
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

      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32">
          {/* Floating Elements */}
          <div className="absolute -top-10 -left-10 w-72 h-72 bg-red-500/5 rounded-full blur-3xl" />
          <div className="absolute top-40 -right-20 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl" />

          <div className="relative text-center max-w-4xl mx-auto space-y-8">
            {/* Logo/Brand */}
            <div className="flex items-center justify-center space-x-3 mb-12">
              <div
                className={`p-3 rounded-2xl ${
                  darkMode
                    ? "bg-gradient-to-br from-red-900/30 to-pink-900/30 backdrop-blur-sm border border-red-800/30"
                    : "bg-gradient-to-br from-red-100 to-pink-100 backdrop-blur-sm border border-red-200"
                }`}
              >
                <div
                  className={`text-2xl font-bold ${
                    darkMode ? "text-white" : "text-red-700"
                  }`}
                >
                  💝
                </div>
              </div>
              <h1
                className={`text-2xl font-bold tracking-tight ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                OpenHeart
                <span
                  className={`block text-sm font-normal ${
                    darkMode ? "text-red-300" : "text-red-600"
                  }`}
                >
                  Decentralized Giving
                </span>
              </h1>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              <span
                className={`block ${darkMode ? "text-white" : "text-gray-900"}`}
              >
                Revolutionize
              </span>
              <span className="bg-gradient-to-r from-red-500 via-pink-500 to-red-600 bg-clip-text text-transparent animate-gradient">
                Charitable Giving
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className={`text-xl lg:text-2xl max-w-3xl mx-auto leading-relaxed ${
                darkMode ? "text-red-300" : "text-red-700"
              }`}
            >
              Launch transparent campaigns, donate securely, and track impact in
              real-time. Powered by blockchain technology for complete trust and
              accountability.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-12 max-w-2xl mx-auto">
              {[
                { value: "100%", label: "Transparent", icon: "🔍" },
                { value: "$0", label: "Platform Fees", icon: "💸" },
                { value: "24/7", label: "Global Access", icon: "🌐" },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
                    darkMode
                      ? "bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-800/30 hover:border-red-700/50"
                      : "bg-gradient-to-br from-white/80 to-red-50/80 border-red-200 hover:border-red-300"
                  }`}
                >
                  <div className="text-2xl mb-3">{stat.icon}</div>
                  <div
                    className={`text-3xl font-bold mb-2 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {stat.value}
                  </div>
                  <div
                    className={`text-sm font-medium ${
                      darkMode ? "text-red-300" : "text-red-600"
                    }`}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-12">
              <button
                onClick={() => setOpenCreateCampaign(true)}
                className="group px-10 py-5 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 hover:shadow-2xl relative overflow-hidden"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-r from-red-500 via-pink-500 to-red-600 transition-all duration-300 group-hover:from-red-600 group-hover:via-pink-600 group-hover:to-red-700`}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative flex items-center justify-center gap-3 text-white">
                  <span>Launch Campaign</span>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </span>
              </button>

              <button
                className={`px-10 py-5 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 border-2 backdrop-blur-sm ${
                  darkMode
                    ? "border-red-800 text-red-300 hover:bg-red-900/20 hover:text-red-200 hover:border-red-700"
                    : "border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
                }`}
              >
                <span className="flex items-center justify-center gap-3">
                  <span>How It Works</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="text-center mb-16">
            <h2
              className={`text-4xl lg:text-5xl font-bold mb-6 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Why <span className="text-red-500">OpenHeart</span>?
            </h2>
            <p
              className={`text-xl max-w-2xl mx-auto ${
                darkMode ? "text-red-300" : "text-red-700"
              }`}
            >
              We're redefining charitable giving with blockchain technology
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Smart Contract Security",
                description:
                  "Funds are held in secure smart contracts that only release when campaign goals are met, eliminating fraud risk.",
                icon: "🛡️",
                gradient: "from-red-500/20 to-pink-500/20",
              },
              {
                title: "Real-time Transparency",
                description:
                  "Every donation is recorded on-chain, providing complete visibility into fund allocation and campaign progress.",
                icon: "📊",
                gradient: "from-pink-500/20 to-purple-500/20",
              },
              {
                title: "Global Accessibility",
                description:
                  "Anyone with a crypto wallet can participate, breaking down geographic and financial barriers to giving.",
                icon: "🌍",
                gradient: "from-purple-500/20 to-red-500/20",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className={`group relative rounded-3xl p-8 backdrop-blur-sm border transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl ${
                  darkMode
                    ? "bg-gradient-to-br from-gray-900/50 to-slate-900/50 border-red-800/30 hover:border-red-700/50"
                    : "bg-gradient-to-br from-white/90 to-red-50/90 border-red-200 hover:border-red-300"
                }`}
              >
                {/* Background gradient */}
                <div
                  className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-500`}
                />

                <div className="relative">
                  <div
                    className={`inline-flex p-4 rounded-2xl mb-6 ${
                      darkMode
                        ? "bg-gradient-to-br from-red-900/30 to-pink-900/30"
                        : "bg-gradient-to-br from-red-100 to-pink-100"
                    }`}
                  >
                    <span className="text-3xl">{feature.icon}</span>
                  </div>
                  <h3
                    className={`text-2xl font-bold mb-4 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className={`leading-relaxed ${
                      darkMode ? "text-red-300/80" : "text-red-700/80"
                    }`}
                  >
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Live Campaigns Section */}
        <section className="py-24">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8 mb-12">
            <div>
              <h2
                className={`text-4xl lg:text-5xl font-bold mb-4 ${
                  darkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Live <span className="text-red-500">Campaigns</span>
              </h2>
              <p
                className={`text-xl ${
                  darkMode ? "text-red-300" : "text-red-700"
                }`}
              >
                Discover and support causes that matter
              </p>
            </div>
            <button
              onClick={() => setOpenCreateCampaign(true)}
              className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 border-2 ${
                darkMode
                  ? "border-red-700 text-red-300 hover:bg-red-900/30 hover:border-red-600"
                  : "border-red-400 text-red-600 hover:bg-red-50 hover:border-red-500"
              }`}
            >
              Start Your Campaign
            </button>
          </div>

          <CampaignsGrid
            onViewDetails={handleViewDetails}
            onDonate={handleDonate}
          />
        </section>

        {/* Testimonial/CTA Section */}
        <section
          className={`py-24 rounded-3xl mb-12 ${
            darkMode
              ? "bg-gradient-to-br from-red-900/10 via-pink-900/10 to-transparent border border-red-800/20"
              : "bg-gradient-to-br from-red-50 via-pink-50 to-transparent border border-red-200"
          }`}
        >
          <div className="max-w-3xl mx-auto text-center px-4">
            <div
              className={`text-6xl mb-6 ${
                darkMode ? "text-red-400" : "text-red-500"
              }`}
            >
              ❤️
            </div>
            <blockquote
              className={`text-2xl lg:text-3xl font-medium italic mb-8 leading-relaxed ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              "OpenHeart has transformed how we approach charitable giving.
              Complete transparency and security built into every campaign."
            </blockquote>
            <div
              className={`mb-12 ${darkMode ? "text-red-300" : "text-red-600"}`}
            >
              <div className="font-bold">Sarah Chen</div>
              <div className="text-sm">Director, Global Health Initiative</div>
            </div>
            <button
              onClick={() => setOpenCreateCampaign(true)}
              className={`px-12 py-5 rounded-2xl font-bold transition-all duration-300 ${
                darkMode
                  ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-lg shadow-red-900/30"
                  : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white shadow-lg shadow-red-200"
              }`}
            >
              Join the Movement
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        className={`relative border-t py-12 ${
          darkMode
            ? "border-red-900/30 bg-gradient-to-b from-slate-900/50 to-gray-900"
            : "border-red-200 bg-gradient-to-b from-red-50/50 to-white"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-xl ${
                  darkMode
                    ? "bg-gradient-to-br from-red-900/30 to-pink-900/30"
                    : "bg-gradient-to-br from-red-100 to-pink-100"
                }`}
              >
                <div className="text-xl">💝</div>
              </div>
              <div>
                <div
                  className={`font-bold text-lg ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  OpenHeart
                </div>
                <div
                  className={`text-sm ${
                    darkMode ? "text-red-300" : "text-red-600"
                  }`}
                >
                  Decentralized Charitable Platform
                </div>
              </div>
            </div>
            <div
              className={`text-sm ${
                darkMode ? "text-red-400" : "text-red-500"
              }`}
            >
              © {new Date().getFullYear()} OpenHeart. All rights reserved.
            </div>
          </div>
        </div>
      </footer>

      {/* Create Campaign Modal */}
      {openCreateCampaign && (
        <CreateCampaign onClose={() => setOpenCreateCampaign(false)} />
      )}

      {/* Donation Modal */}
      {showDonationModal && selectedCampaign && (
        <DonationModal
          campaign={selectedCampaign}
          isOpen={showDonationModal}
          onClose={() => {
            setShowDonationModal(false);
            setSelectedCampaign(null);
          }}
          onDonationSuccess={() => {
            setShowDonationModal(false);
            setSelectedCampaign(null);
          }}
        />
      )}
    </div>
  );
}
