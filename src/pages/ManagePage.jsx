import { useState, useEffect } from "react";
import { useContract } from "../hooks/useContract";
import { useActiveAccount } from "thirdweb/react";
import { toast } from "react-toastify";
import { TOKENS, TOKENS_ARRAY } from "../config/tokens";
import { useDarkMode } from "../contexts/themeContext";

export default function Manage() {
  const { setTokenAllowed, hasRole } = useContract();
  const account = useActiveAccount();
  const isConnected = !!account?.address;
  const address = account?.address || "";
  const [activeTab, setActiveTab] = useState("tokens");
  const [hasAdminRole, setHasAdminRole] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const { darkMode } = useDarkMode();

  // Token Management State
  const [tokenAddress, setTokenAddress] = useState("");
  const [allowed, setAllowed] = useState(true);

  // Check if user has admin role
  useEffect(() => {
    const checkRole = async () => {
      if (isConnected && address) {
        try {
          setIsCheckingRole(true);
          const isAdmin = await hasRole("DEFAULT_ADMIN_ROLE");
          const isTokenManager = await hasRole("TOKEN_MANAGER_ROLE");
          setHasAdminRole(isAdmin || isTokenManager);
          console.log("Role: ", hasAdminRole);
        } catch (error) {
          console.error("Error checking role:", error);
          setHasAdminRole(false);
        } finally {
          setIsCheckingRole(false);
        }
      } else {
        setIsCheckingRole(false);
        setHasAdminRole(false);
      }
    };

    checkRole();
  }, [isConnected, address, hasRole]);

  const handleSetTokenAllowed = async (e) => {
    e.preventDefault();
    try {
      await setTokenAllowed(tokenAddress, allowed);
      toast.success(
        `Token ${allowed ? "allowed" : "disallowed"} successfully!`
      );
      setTokenAddress("");
    } catch (error) {
      toast.error("Failed to update token permission.");
      console.error("Error setting token allowed:", error);
    }
  };

  // Get token icon
  const getTokenIcon = (symbol) => {
    const icons = {
      USDC: "💵",
      WETH: "🔷",
      WBTC: "🟡",
      DAI: "🟣",
      USDT: "💎",
      DEV: "⚡",
    };
    return icons[symbol] || "🪙";
  };

  // Show loading while checking role
  if (isCheckingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* Background Gradient */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            darkMode
              ? "bg-gradient-to-br from-gray-900 via-slate-900 to-red-950/20"
              : "bg-gradient-to-br from-red-50 via-pink-50/30 to-white"
          }`}
        />

        <div className="relative z-10 text-center space-y-6">
          <div
            className={`relative mx-auto w-24 h-24 ${
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
            <div className="absolute inset-6 rounded-full border-4 border-pink-500/30 animate-ping"></div>
          </div>
          <div>
            <p
              className={`text-xl font-medium mb-2 ${
                darkMode ? "text-red-300" : "text-red-700"
              }`}
            >
              Verifying Permissions
            </p>
            <p
              className={`text-sm ${
                darkMode ? "text-red-400/60" : "text-red-600/60"
              }`}
            >
              Checking admin access...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show access denied if user doesn't have role
  if (!hasAdminRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        {/* Background Gradient */}
        <div
          className={`absolute inset-0 transition-all duration-500 ${
            darkMode
              ? "bg-gradient-to-br from-gray-900 via-slate-900 to-red-950/20"
              : "bg-gradient-to-br from-red-50 via-pink-50/30 to-white"
          }`}
        />

        <div
          className={`relative z-10 w-full max-w-md rounded-2xl p-8 backdrop-blur-sm border shadow-2xl ${
            darkMode
              ? "bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-800/30"
              : "bg-gradient-to-br from-white/95 to-red-50/95 border-red-200"
          }`}
        >
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
              darkMode
                ? "bg-gradient-to-br from-red-900/30 to-pink-900/30"
                : "bg-gradient-to-br from-red-100 to-pink-100"
            }`}
          >
            <span className="text-4xl">🔒</span>
          </div>
          <h2
            className={`text-3xl font-bold text-center mb-4 ${
              darkMode ? "text-white" : "text-gray-900"
            }`}
          >
            Access Restricted
          </h2>
          <p
            className={`text-lg text-center mb-6 ${
              darkMode ? "text-red-300" : "text-red-700"
            }`}
          >
            Administrative privileges required
          </p>
          <div
            className={`rounded-xl p-4 border ${
              darkMode
                ? "bg-red-900/20 border-red-800/30"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div className="flex items-center space-x-3">
              <span
                className={`text-lg ${
                  darkMode ? "text-red-400" : "text-red-600"
                }`}
              >
                ℹ️
              </span>
              <p
                className={`text-sm ${
                  darkMode ? "text-red-300" : "text-red-700"
                }`}
              >
                Only administrators and token managers can access this
                dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-32">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center space-x-3 mb-6">
            <div
              className={`p-3 rounded-2xl ${
                darkMode
                  ? "bg-gradient-to-br from-red-900/30 to-pink-900/30 border border-red-800/40"
                  : "bg-gradient-to-br from-red-100 to-pink-100 border border-red-300"
              }`}
            >
              <span className="text-3xl">⚙️</span>
            </div>
            <h1
              className={`text-5xl font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              Management Dashboard
            </h1>
          </div>
          <p
            className={`text-xl max-w-3xl mx-auto ${
              darkMode ? "text-red-300" : "text-red-700"
            }`}
          >
            Manage token permissions, configure platform settings, and monitor
            system health
          </p>
        </div>

        {/* Main Content Container */}
        <div
          className={`rounded-3xl backdrop-blur-sm border overflow-hidden ${
            darkMode
              ? "bg-gradient-to-br from-red-900/20 via-pink-900/10 to-transparent border-red-800/30 shadow-2xl shadow-red-900/10"
              : "bg-gradient-to-br from-white/95 to-red-50/95 border-red-200 shadow-2xl shadow-red-100"
          }`}
        >
          {/* Navigation Tabs */}
          <div
            className={`border-b ${
              darkMode ? "border-red-800/30" : "border-red-200"
            }`}
          >
            <nav className="flex space-x-2 px-6">
              {[
                { key: "tokens", label: "Token Management", icon: "🪙" },
                { key: "permissions", label: "Permissions", icon: "🔐" },
                { key: "admin", label: "Admin Tools", icon: "⚙️" },
              ].map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center space-x-3 py-5 px-6 font-medium transition-all duration-300 relative ${
                    activeTab === key
                      ? darkMode
                        ? "text-white"
                        : "text-gray-900"
                      : darkMode
                      ? "text-red-400 hover:text-red-300"
                      : "text-red-600 hover:text-red-700"
                  }`}
                >
                  {activeTab === key && (
                    <div
                      className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                        darkMode
                          ? "bg-gradient-to-r from-red-500 to-pink-500"
                          : "bg-gradient-to-r from-red-500 to-pink-500"
                      }`}
                    />
                  )}
                  <span className="text-xl">{icon}</span>
                  <span className="text-lg">{label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === "tokens" && (
              <div className="max-w-5xl">
                <div className="mb-8">
                  <h2
                    className={`text-3xl font-bold mb-3 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Token Management
                  </h2>
                  <p
                    className={`text-lg ${
                      darkMode ? "text-red-300" : "text-red-700"
                    }`}
                  >
                    Configure which tokens can be used for donations across all
                    campaigns
                  </p>
                </div>

                {/* Quick Add Test Tokens */}
                <div className="mb-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div
                      className={`p-2 rounded-xl ${
                        darkMode
                          ? "bg-gradient-to-br from-red-900/30 to-pink-900/30"
                          : "bg-gradient-to-br from-red-100 to-pink-100"
                      }`}
                    >
                      <span className="text-xl">⚡</span>
                    </div>
                    <h3
                      className={`text-xl font-bold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      Quick Add Test Tokens
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {TOKENS_ARRAY.map((token) => (
                      <button
                        key={token.symbol}
                        type="button"
                        onClick={() => {
                          if (!token.address) {
                            toast.error(
                              `${token.symbol} has no configured address`
                            );
                            return;
                          }
                          setTokenAddress(token.address);
                          setAllowed(true);
                          toast.info(`Added ${token.symbol} to form`);
                        }}
                        className={`p-5 rounded-xl backdrop-blur-sm border transition-all duration-300 transform hover:scale-105 ${
                          darkMode
                            ? "bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-800/30 hover:border-red-700/50"
                            : "bg-gradient-to-br from-red-50 to-pink-50 border-red-200 hover:border-red-300"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">
                            {getTokenIcon(token.symbol)}
                          </span>
                          <div className="text-left">
                            <div
                              className={`font-bold text-lg ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {token.symbol}
                            </div>
                            <div
                              className={`text-sm ${
                                darkMode ? "text-red-400/60" : "text-red-600/60"
                              }`}
                            >
                              {token.name}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`text-xs mt-3 px-3 py-1 rounded-full inline-block ${
                            darkMode
                              ? "bg-red-900/40 text-red-300"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          Click to add
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Token Permission Form */}
                <div
                  className={`rounded-2xl p-8 backdrop-blur-sm border mb-10 ${
                    darkMode
                      ? "bg-gradient-to-br from-red-900/20 to-pink-900/20 border-red-800/30"
                      : "bg-gradient-to-br from-red-50 to-pink-50 border-red-200"
                  }`}
                >
                  <h3
                    className={`text-2xl font-bold mb-6 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Set Token Permissions
                  </h3>

                  <form onSubmit={handleSetTokenAllowed} className="space-y-8">
                    <div>
                      <label
                        className={`block text-sm font-semibold mb-3 ${
                          darkMode ? "text-red-300" : "text-red-700"
                        }`}
                      >
                        Token Contract Address
                      </label>
                      <div className="relative group">
                        <div
                          className={`absolute inset-0 rounded-xl blur transition-all duration-300 group-hover:blur-sm ${
                            darkMode
                              ? "bg-gradient-to-r from-red-900/20 to-pink-900/20"
                              : "bg-gradient-to-r from-red-100 to-pink-100"
                          }`}
                        ></div>
                        <input
                          type="text"
                          value={tokenAddress}
                          onChange={(e) => setTokenAddress(e.target.value)}
                          placeholder="0x..."
                          className={`relative w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:outline-none font-mono text-sm ${
                            darkMode
                              ? "bg-gray-800/70 border-red-900/50 text-white placeholder-red-400/50 focus:ring-red-500 focus:border-red-500 focus:ring-offset-gray-900"
                              : "bg-white/80 border-red-200 text-gray-900 placeholder-red-400/50 focus:ring-red-400 focus:border-red-300 focus:ring-offset-red-50"
                          }`}
                          required
                        />
                      </div>
                      {tokenAddress && (
                        <p
                          className={`text-xs mt-2 font-mono ${
                            darkMode ? "text-red-400/60" : "text-red-600/60"
                          }`}
                        >
                          {tokenAddress}
                        </p>
                      )}
                    </div>

                    <div
                      className={`flex items-center space-x-4 p-4 rounded-xl ${
                        darkMode
                          ? "bg-red-900/20 border border-red-800/30"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        id="allowed"
                        checked={allowed}
                        onChange={(e) => setAllowed(e.target.checked)}
                        className={`w-5 h-5 rounded-lg ${
                          darkMode
                            ? "bg-gray-800 border-red-700 text-red-500 focus:ring-red-500 focus:ring-2"
                            : "bg-white border-red-300 text-red-500 focus:ring-red-400 focus:ring-2"
                        }`}
                      />
                      <label
                        htmlFor="allowed"
                        className={`text-lg font-medium ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Allow this token for donations across all campaigns
                      </label>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        className={`px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 relative overflow-hidden ${
                          darkMode
                            ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-lg shadow-red-900/30"
                            : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 text-white shadow-lg shadow-red-200"
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
                        <span className="relative z-10">
                          {allowed ? "Allow Token" : "Disallow Token"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTokenAddress("");
                          setAllowed(true);
                        }}
                        className={`px-8 py-4 rounded-xl font-semibold transition-all duration-300 border ${
                          darkMode
                            ? "border-red-700 text-red-300 hover:bg-red-900/30 hover:text-red-200"
                            : "border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                        }`}
                      >
                        Clear Form
                      </button>
                    </div>
                  </form>
                </div>

                {/* Information Panel */}
                <div
                  className={`rounded-2xl p-6 backdrop-blur-sm border ${
                    darkMode
                      ? "bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-800/30"
                      : "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200"
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div
                      className={`p-3 rounded-xl ${
                        darkMode
                          ? "bg-blue-900/30 text-blue-400"
                          : "bg-blue-100 text-blue-600"
                      }`}
                    >
                      <span className="text-2xl">💡</span>
                    </div>
                    <div>
                      <h4
                        className={`text-xl font-bold mb-3 ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Test Token Information
                      </h4>
                      <p
                        className={`text-lg mb-4 ${
                          darkMode ? "text-blue-300" : "text-blue-700"
                        }`}
                      >
                        Standard ERC-20 tokens pre-configured for Moonbase Alpha
                        testnet
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          {
                            symbol: "USDC/USDT/DAI",
                            desc: "Stablecoin test tokens",
                          },
                          { symbol: "WETH", desc: "Wrapped Ether test token" },
                          {
                            symbol: "WBTC",
                            desc: "Wrapped Bitcoin test token",
                          },
                          {
                            symbol: "DEV",
                            desc: "Native Moonbase Alpha token",
                          },
                        ].map((token, index) => (
                          <div
                            key={index}
                            className={`p-3 rounded-lg ${
                              darkMode
                                ? "bg-blue-900/30 border border-blue-800/30"
                                : "bg-blue-100/50 border border-blue-200"
                            }`}
                          >
                            <div
                              className={`font-bold mb-1 ${
                                darkMode ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {token.symbol}
                            </div>
                            <div
                              className={`text-sm ${
                                darkMode
                                  ? "text-blue-400/60"
                                  : "text-blue-600/60"
                              }`}
                            >
                              {token.desc}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "permissions" && (
              <div>
                <div className="mb-8">
                  <h2
                    className={`text-3xl font-bold mb-3 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Role Permissions
                  </h2>
                  <p
                    className={`text-lg ${
                      darkMode ? "text-red-300" : "text-red-700"
                    }`}
                  >
                    Manage access control and role-based permissions
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "DEFAULT_ADMIN_ROLE",
                      desc: "Full administrative access to all contract functions and settings",
                      icon: "👑",
                      color: darkMode
                        ? "from-red-900/30 to-pink-900/30"
                        : "from-red-50 to-pink-50",
                      border: darkMode ? "border-red-800/30" : "border-red-200",
                    },
                    {
                      title: "TOKEN_MANAGER_ROLE",
                      desc: "Can manage token permissions and allowed tokens for donations",
                      icon: "🪙",
                      color: darkMode
                        ? "from-purple-900/30 to-indigo-900/30"
                        : "from-purple-50 to-indigo-50",
                      border: darkMode
                        ? "border-purple-800/30"
                        : "border-purple-200",
                    },
                    {
                      title: "CAMPAIGN_CREATOR_ROLE",
                      desc: "Automatically granted to users who create campaigns. Allows withdrawal of funds",
                      icon: "🚀",
                      color: darkMode
                        ? "from-blue-900/30 to-cyan-900/30"
                        : "from-blue-50 to-cyan-50",
                      border: darkMode
                        ? "border-blue-800/30"
                        : "border-blue-200",
                    },
                  ].map((role, index) => (
                    <div
                      key={index}
                      className={`rounded-2xl p-6 backdrop-blur-sm border transition-all duration-300 hover:scale-105 bg-gradient-to-br ${role.color} ${role.border}`}
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <div
                          className={`p-3 rounded-xl ${
                            darkMode
                              ? "bg-white/10 text-white"
                              : "bg-white/60 text-gray-900"
                          }`}
                        >
                          <span className="text-2xl">{role.icon}</span>
                        </div>
                        <h3
                          className={`text-xl font-bold ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {role.title}
                        </h3>
                      </div>
                      <p
                        className={`leading-relaxed ${
                          darkMode ? "text-gray-300/80" : "text-gray-700/80"
                        }`}
                      >
                        {role.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "admin" && (
              <div>
                <div className="mb-8">
                  <h2
                    className={`text-3xl font-bold mb-3 ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    Admin Tools
                  </h2>
                  <p
                    className={`text-lg ${
                      darkMode ? "text-red-300" : "text-red-700"
                    }`}
                  >
                    Advanced platform configuration and monitoring
                  </p>
                </div>

                <div
                  className={`rounded-2xl p-6 backdrop-blur-sm border mb-8 ${
                    darkMode
                      ? "bg-gradient-to-br from-amber-900/20 to-yellow-900/20 border-amber-800/30"
                      : "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200"
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-2xl">🚧</span>
                    <p
                      className={`text-lg font-medium ${
                        darkMode ? "text-amber-300" : "text-amber-700"
                      }`}
                    >
                      Advanced admin tools and platform analytics coming soon
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      title: "Platform Analytics",
                      desc: "View platform statistics and performance metrics",
                      icon: "📊",
                      color: darkMode
                        ? "from-blue-900/20 to-cyan-900/20"
                        : "from-blue-50 to-cyan-50",
                      border: darkMode
                        ? "border-blue-800/30"
                        : "border-blue-200",
                    },
                    {
                      title: "User Management",
                      desc: "Manage user roles and permissions",
                      icon: "👥",
                      color: darkMode
                        ? "from-purple-900/20 to-indigo-900/20"
                        : "from-purple-50 to-indigo-50",
                      border: darkMode
                        ? "border-purple-800/30"
                        : "border-purple-200",
                    },
                    {
                      title: "System Health",
                      desc: "Monitor contract performance and gas usage",
                      icon: "❤️",
                      color: darkMode
                        ? "from-red-900/20 to-pink-900/20"
                        : "from-red-50 to-pink-50",
                      border: darkMode ? "border-red-800/30" : "border-red-200",
                    },
                    {
                      title: "Audit Logs",
                      desc: "Review transaction history and security events",
                      icon: "📝",
                      color: darkMode
                        ? "from-green-900/20 to-emerald-900/20"
                        : "from-green-50 to-emerald-50",
                      border: darkMode
                        ? "border-green-800/30"
                        : "border-green-200",
                    },
                  ].map((tool, index) => (
                    <button
                      key={index}
                      className={`rounded-2xl p-6 backdrop-blur-sm border transition-all duration-300 hover:scale-105 text-left bg-gradient-to-br ${tool.color} ${tool.border}`}
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        <span className="text-2xl">{tool.icon}</span>
                        <h3
                          className={`text-xl font-bold ${
                            darkMode ? "text-white" : "text-gray-900"
                          }`}
                        >
                          {tool.title}
                        </h3>
                      </div>
                      <p
                        className={`leading-relaxed ${
                          darkMode ? "text-gray-300/80" : "text-gray-700/80"
                        }`}
                      >
                        {tool.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
