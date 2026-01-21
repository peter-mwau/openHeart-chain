import React, { useState } from "react";
import { ethers } from "ethers";
import { useActiveAccount } from "thirdweb/react";
import { toast } from "react-toastify";
import { useContract } from "../hooks/useContract.jsx";
import { useDarkMode } from "../contexts/themeContext.jsx";

export default function WithdrawalModal({
  campaign,
  isOpen,
  onClose,
  onWithdrawalSuccess,
}) {
  const account = useActiveAccount();
  const address = account?.address;
  const [isProcessing, setIsProcessing] = useState(false);
  const { darkMode } = useDarkMode();
  const { withdrawFromCampaign } = useContract();

  if (!isOpen) return null;

  const handleWithdraw = async () => {
    if (!address) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsProcessing(true);
    try {
      // Call the withdrawal function from your contract hook
      if (withdrawFromCampaign) {
        await withdrawFromCampaign(campaign.id);
        onWithdrawalSuccess?.();
        onClose();
      } else {
        toast.error("Withdrawal function not available");
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast.error(
        error?.message || "Failed to withdraw funds. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const raisedAmount = campaign.totalDonated
    ? parseFloat(ethers.formatUnits(campaign.totalDonated, 6)).toFixed(2)
    : "0.00";

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      } transition-opacity duration-300`}
      style={{
        backgroundColor: isOpen ? "rgba(0, 0, 0, 0.5)" : "rgba(0, 0, 0, 0)",
      }}
      onClick={onClose}
    >
      <div
        className={`rounded-3xl shadow-2xl max-w-md w-full transform transition-all duration-300 ${
          isOpen ? "scale-100" : "scale-95"
        } ${
          darkMode
            ? "bg-gradient-to-b from-slate-900 to-gray-900"
            : "bg-gradient-to-b from-white to-gray-50"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={`p-6 border-b ${
            darkMode ? "border-red-900/30" : "border-red-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <h2
              className={`text-2xl font-bold flex items-center gap-2 ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              <span className="text-2xl">🏦</span>
              Withdraw Funds
            </h2>
            <button
              onClick={onClose}
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Campaign Info */}
          <div
            className={`rounded-2xl p-4 backdrop-blur-sm border ${
              darkMode
                ? "bg-purple-900/20 border-purple-800/30"
                : "bg-purple-50 border-purple-200"
            }`}
          >
            <p
              className={`text-sm font-medium mb-2 ${
                darkMode ? "text-purple-300" : "text-purple-700"
              }`}
            >
              Campaign
            </p>
            <h3
              className={`text-lg font-bold ${
                darkMode ? "text-white" : "text-gray-900"
              }`}
            >
              {campaign.name}
            </h3>
          </div>

          {/* Amount Info */}
          <div
            className={`rounded-2xl p-4 backdrop-blur-sm border ${
              darkMode
                ? "bg-green-900/20 border-green-800/30"
                : "bg-green-50 border-green-200"
            }`}
          >
            <p
              className={`text-sm font-medium mb-2 ${
                darkMode ? "text-green-300" : "text-green-700"
              }`}
            >
              Total Raised
            </p>
            <h3
              className={`text-2xl font-bold ${
                darkMode ? "text-green-400" : "text-green-600"
              }`}
            >
              ${raisedAmount} USDC
            </h3>
          </div>

          {/* Warning Message */}
          <div
            className={`rounded-2xl p-4 backdrop-blur-sm border ${
              darkMode
                ? "bg-amber-900/20 border-amber-800/30"
                : "bg-amber-50 border-amber-200"
            }`}
          >
            <p
              className={`text-sm ${
                darkMode ? "text-amber-300" : "text-amber-700"
              }`}
            >
              ⚠️ You are about to withdraw all funds raised for this campaign.
              Please ensure you have verified all transactions before
              proceeding.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              disabled={isProcessing}
              className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-300 ${
                darkMode
                  ? "bg-gray-700 hover:bg-gray-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300 text-gray-900"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={isProcessing}
              className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 ${
                darkMode
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white disabled:from-purple-900 disabled:to-indigo-900"
                  : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white disabled:from-purple-300 disabled:to-indigo-300"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <span>🏦</span>
                  Withdraw Now
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
