import React, { useState } from "react";
import { useContract } from "../hooks/useContract";
import { useActiveAccount } from "thirdweb/react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import { TOKENS_ARRAY } from "../config/tokens";
import { useDarkMode } from "../contexts/themeContext";

const USDC_ADDRESS = import.meta.env.VITE_USDC_CONTRACT_ADDRESS || "";

export default function DonationModal({
  campaign,
  isOpen,
  onClose,
  onDonationSuccess,
}) {
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!address;
  const { donateToCampaign } = useContract();
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsApproval, setNeedsApproval] = useState(false);
  const supportedTokens = TOKENS_ARRAY.filter((t) => !!t.address);
  const defaultToken =
    supportedTokens.find((t) => t.symbol === "USDC") || supportedTokens[0];
  const [selectedToken, setSelectedToken] = useState(defaultToken);
  const { darkMode } = useDarkMode();

  const checkAllowance = async () => {
    if (!address || !amount || parseFloat(amount) <= 0) return false;

    try {
      if (!selectedToken || !selectedToken.address) return false;
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(
        selectedToken.address,
        [
          "function allowance(address owner, address spender) view returns (uint256)",
          "function approve(address spender, uint256 amount) returns (bool)",
        ],
        signer
      );

      const donationContractAddress = import.meta.env
        .VITE_DONATE_CONTRACT_ADDRESS;
      const currentAllowance = await tokenContract.allowance(
        address,
        donationContractAddress
      );
      const amountInWei = ethers.parseUnits(amount, selectedToken.decimals);

      return currentAllowance < amountInWei;
    } catch (error) {
      console.error("Error checking allowance:", error);
      return false;
    }
  };

  const approveTokens = async () => {
    if (!address) return false;

    const toastId = toast.loading("Approving tokens...");

    try {
      if (!selectedToken || !selectedToken.address) {
        throw new Error("No token selected for approval");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(
        selectedToken.address,
        ["function approve(address spender, uint256 amount) returns (bool)"],
        signer
      );

      const amountInWei = ethers.parseUnits(amount, selectedToken.decimals);
      const donationContractAddress = import.meta.env
        .VITE_DONATE_CONTRACT_ADDRESS;

      const tx = await tokenContract.approve(
        donationContractAddress,
        amountInWei
      );

      toast.update(toastId, {
        render: "Approval submitted. Waiting for confirmation...",
        type: "info",
        isLoading: true,
      });

      await tx.wait();

      toast.update(toastId, {
        render: `${selectedToken.symbol} tokens approved successfully!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });

      return true;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Approval error:", errMsg);

      let errorMessage = "Failed to approve tokens";
      if (errMsg.includes("rejected")) {
        errorMessage = "Approval was rejected";
      }

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });

      return false;
    }
  };

  const handleDonate = async (e) => {
    e.preventDefault();

    if (!isConnected) {
      toast.error("Please connect your wallet first.");
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid donation amount.");
      return;
    }

    setIsLoading(true);

    try {
      const requiresApproval = await checkAllowance();

      if (requiresApproval) {
        setNeedsApproval(true);
        const approved = await approveTokens();
        if (!approved) {
          setIsLoading(false);
          return;
        }
        setNeedsApproval(false);
      }

      const toastId = toast.loading("Processing your donation...");

      const tokenAddr = selectedToken?.address || USDC_ADDRESS;
      await donateToCampaign(tokenAddr, campaign.id, amount);

      toast.update(toastId, {
        render: "Donation successful! Thank you for your support! 🎉",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      setAmount("");
      onDonationSuccess();
      onClose();
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      console.error("Donation error:", errMsg);

      let errorMessage = "Failed to process donation";
      if (errMsg.includes("rejected")) {
        errorMessage = "Transaction was rejected";
      } else if (errMsg.includes("insufficient")) {
        errorMessage = "Insufficient balance";
      } else if (errMsg.includes("allowance")) {
        errorMessage = "Token approval needed. Please try again.";
        setNeedsApproval(true);
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedAmounts = [10, 25, 50, 100];

  if (!isOpen) return null;

  // Calculate progress impact
  const calculateProgressImpact = () => {
    if (!amount || parseFloat(amount) <= 0) return 0;

    try {
      const decimals = selectedToken?.decimals ?? 6;
      const donationInSmallestUnit = Number(
        ethers.parseUnits(amount, decimals)
      );
      const newTotal = Number(campaign.totalDonated) + donationInSmallestUnit;
      const goal = Number(campaign.goalAmount);

      return goal > 0 ? Math.min((newTotal / goal) * 100, 100) : 0;
    } catch (e) {
      return 0;
    }
  };

  const progressImpact = calculateProgressImpact();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 h-screen ${
          darkMode
            ? "bg-gradient-to-br from-gray-900/95 via-slate-900/95 to-red-950/95"
            : "bg-gradient-to-br from-red-50/95 via-pink-50/95 to-white/95"
        } backdrop-blur-sm`}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative z-10 w-full max-w-md transform transition-all duration-300 mt-[200px] ${
          darkMode
            ? "bg-gradient-to-br from-slate-900 to-gray-900"
            : "bg-gradient-to-br from-white to-red-50"
        } rounded-2xl shadow-2xl overflow-hidden border ${
          darkMode
            ? "border-red-900/30 shadow-red-900/20"
            : "border-red-200 shadow-red-100"
        }`}
      >
        {/* Header */}
        <div
          className={`relative p-6 ${
            darkMode
              ? "bg-gradient-to-r from-red-900/20 via-pink-900/20 to-transparent border-b border-red-900/30"
              : "bg-gradient-to-r from-red-50 via-pink-50 to-transparent border-b border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`p-2 rounded-xl ${
                  darkMode
                    ? "bg-red-900/30 text-red-400"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {needsApproval ? (
                  <span className="text-xl">🔐</span>
                ) : (
                  <span className="text-xl">💝</span>
                )}
              </div>
              <div>
                <h2
                  className={`text-2xl font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {needsApproval
                    ? `Approve ${selectedToken?.symbol || "Tokens"}`
                    : "Support this Campaign"}
                </h2>
                <p
                  className={`mt-1 text-sm ${
                    darkMode ? "text-red-300" : "text-red-600"
                  }`}
                >
                  {campaign.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                darkMode
                  ? "text-red-400 hover:text-red-300 hover:bg-red-900/30"
                  : "text-red-500 hover:text-red-700 hover:bg-red-100"
              } disabled:opacity-50`}
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleDonate} className="p-6 space-y-6">
          {needsApproval ? (
            /* Approval Step */
            <div className="text-center space-y-6">
              <div
                className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center ${
                  darkMode
                    ? "bg-gradient-to-br from-yellow-900/30 to-amber-900/30 border border-yellow-800/40"
                    : "bg-gradient-to-br from-yellow-100 to-amber-100 border border-yellow-300"
                }`}
              >
                <span className="text-4xl">🔐</span>
              </div>
              <div>
                <h3
                  className={`text-xl font-bold mb-3 ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Token Approval Required
                </h3>
                <p
                  className={`text-sm leading-relaxed ${
                    darkMode ? "text-red-300/80" : "text-red-700/80"
                  }`}
                >
                  You need to approve the smart contract to spend your{" "}
                  {selectedToken?.symbol || "tokens"} before donating.
                </p>
              </div>
              <div
                className={`rounded-xl p-4 backdrop-blur-sm border ${
                  darkMode
                    ? "bg-gradient-to-br from-yellow-900/20 to-amber-900/20 border-yellow-800/30"
                    : "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`text-lg ${
                      darkMode ? "text-yellow-400" : "text-yellow-600"
                    }`}
                  >
                    💡
                  </span>
                  <p
                    className={`text-sm ${
                      darkMode ? "text-yellow-300" : "text-yellow-700"
                    }`}
                  >
                    This is a one-time approval for this amount. You won't need
                    to approve again for future donations of the same or smaller
                    amounts.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Donation Step */
            <>
              {/* Campaign Progress */}
              <div
                className={`rounded-xl p-4 backdrop-blur-sm border ${
                  darkMode
                    ? "bg-gradient-to-br from-blue-900/20 to-cyan-900/20 border-blue-800/30"
                    : "bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={`text-sm font-medium ${
                      darkMode ? "text-blue-300" : "text-blue-700"
                    }`}
                  >
                    Current Progress
                  </span>
                  <span
                    className={`text-lg font-bold ${
                      darkMode ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {(
                      (Number(campaign.totalDonated) /
                        Number(campaign.goalAmount)) *
                      100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div
                  className={`w-full rounded-full h-2.5 overflow-hidden ${
                    darkMode ? "bg-blue-900/30" : "bg-blue-200"
                  }`}
                >
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${
                      darkMode
                        ? "from-blue-500 via-cyan-400 to-blue-600"
                        : "from-blue-500 via-cyan-400 to-blue-600"
                    }`}
                    style={{
                      width: `${Math.min(
                        (Number(campaign.totalDonated) /
                          Number(campaign.goalAmount)) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs mt-2">
                  <span
                    className={`${
                      darkMode ? "text-blue-300/60" : "text-blue-600/60"
                    }`}
                  >
                    {ethers.formatUnits(campaign.totalDonated, 6)} USDC raised
                  </span>
                  <span
                    className={`${
                      darkMode ? "text-blue-300/60" : "text-blue-600/60"
                    }`}
                  >
                    {ethers.formatUnits(campaign.goalAmount, 6)} USDC goal
                  </span>
                </div>
              </div>

              {/* Token Selection */}
              <div>
                <label
                  className={`block text-sm font-semibold mb-3 ${
                    darkMode ? "text-red-300" : "text-red-700"
                  }`}
                >
                  Donate with
                </label>
                <div className="flex flex-wrap gap-2">
                  {supportedTokens.map((token) => (
                    <button
                      key={token.address}
                      type="button"
                      onClick={() => setSelectedToken(token)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                        selectedToken?.address === token.address
                          ? darkMode
                            ? `bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-900/30`
                            : `bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-200`
                          : darkMode
                          ? "bg-red-900/20 text-red-300 hover:bg-red-900/30 border border-red-800/30"
                          : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                      }`}
                    >
                      {token.symbol}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Amount Selection */}
              <div>
                <label
                  className={`block text-sm font-semibold mb-3 ${
                    darkMode ? "text-red-300" : "text-red-700"
                  }`}
                >
                  Quick Select Amount
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {suggestedAmounts.map((suggestedAmount) => (
                    <button
                      key={suggestedAmount}
                      type="button"
                      onClick={() => setAmount(suggestedAmount.toString())}
                      className={`p-3 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 ${
                        amount === suggestedAmount.toString()
                          ? darkMode
                            ? "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-900/30"
                            : "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg shadow-red-200"
                          : darkMode
                          ? "bg-red-900/20 text-red-300 hover:bg-red-900/30 border border-red-800/30"
                          : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                      }`}
                    >
                      {suggestedAmount} {selectedToken?.symbol || "TOKEN"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div>
                <label
                  className={`block text-sm font-semibold mb-3 ${
                    darkMode ? "text-red-300" : "text-red-700"
                  }`}
                >
                  Or Enter Custom Amount
                </label>
                <div className="relative group">
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
                    <div className="flex">
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        className={`flex-1 px-4 py-3 bg-transparent focus:outline-none rounded-l-xl ${
                          darkMode
                            ? "text-white placeholder-red-400/50"
                            : "text-gray-900 placeholder-red-400/50"
                        }`}
                        required
                      />
                      <div
                        className={`flex items-center px-4 border-l ${
                          darkMode
                            ? "border-red-900/50 text-red-400"
                            : "border-red-200 text-red-600"
                        }`}
                      >
                        <span className="font-bold">
                          {selectedToken?.symbol || "TOKEN"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Donation Impact */}
              {amount && parseFloat(amount) > 0 && (
                <div
                  className={`rounded-xl p-4 backdrop-blur-sm border transition-all duration-500 ${
                    darkMode
                      ? "bg-gradient-to-br from-green-900/20 to-emerald-900/20 border-green-800/30"
                      : "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200"
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <span
                      className={`text-xl ${
                        darkMode ? "text-green-400" : "text-green-600"
                      }`}
                    >
                      ✨
                    </span>
                    <div>
                      <div
                        className={`font-bold ${
                          darkMode ? "text-white" : "text-gray-900"
                        }`}
                      >
                        Your Donation Impact
                      </div>
                      <div
                        className={`text-sm ${
                          darkMode ? "text-green-300" : "text-green-700"
                        }`}
                      >
                        {amount} {selectedToken?.symbol || "TOKEN"}
                      </div>
                    </div>
                  </div>
                  <div
                    className={`text-sm leading-relaxed ${
                      darkMode ? "text-green-300/80" : "text-green-700/80"
                    }`}
                  >
                    Your contribution will help bring this campaign to{" "}
                    <span
                      className={`font-bold ${
                        darkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {progressImpact.toFixed(3)}%
                    </span>{" "}
                    of its funding goal.
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                darkMode
                  ? "border border-red-700 text-red-300 hover:bg-red-900/30 hover:text-red-200 disabled:border-gray-700 disabled:text-gray-500"
                  : "border border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:border-gray-300 disabled:text-gray-400"
              } disabled:transform-none disabled:cursor-not-allowed`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                !isConnected || isLoading || !amount || parseFloat(amount) <= 0
              }
              className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed relative overflow-hidden ${
                darkMode
                  ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:from-gray-700 disabled:to-gray-800 text-white shadow-lg shadow-red-900/30"
                  : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 disabled:from-gray-300 disabled:to-gray-400 text-white shadow-lg shadow-red-200"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
              <span className="relative z-10 flex items-center justify-center">
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {needsApproval ? "Approving..." : "Processing..."}
                  </>
                ) : needsApproval ? (
                  `Approve ${selectedToken?.symbol || "Tokens"}`
                ) : (
                  <>
                    <span className="mr-2 text-lg">💝</span>
                    Donate Now
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Wallet Connection Warning */}
          {!isConnected && (
            <div
              className={`rounded-xl p-4 text-center border ${
                darkMode
                  ? "bg-amber-900/20 border-amber-800/30 text-amber-300"
                  : "bg-amber-50 border-amber-200 text-amber-700"
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-sm">🔗</span>
                <span className="font-medium">
                  Please connect your wallet to make a donation
                </span>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
