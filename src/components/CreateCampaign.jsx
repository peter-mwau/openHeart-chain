import React, { useMemo, useState } from "react";
import { useActiveAccount } from "thirdweb/react";
import { useContract } from "../hooks/useContract";
import { TOKENS } from "../config/tokens";
import { useDarkMode } from "../contexts/themeContext.jsx";

export default function CreateCampaign({ onCreate, initial, onClose }) {
  const account = useActiveAccount();
  const address = account?.address;
  const isConnected = !!address;
  const { createCampaign, isLoading } = useContract();
  const { darkMode } = useDarkMode();

  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [goalAmount, setGoalAmount] = useState(initial?.goalAmount || "");
  const USDC_ADDRESS =
    TOKENS.USDC.address || import.meta.env.VITE_USDC_CONTRACT_ADDRESS || "";
  const [durationInDays, setDurationInDays] = useState(
    initial?.durationInDays || 7
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  const deadlineTs = useMemo(() => {
    const secs = Math.floor(Date.now() / 1000) + durationInDays * 24 * 60 * 60;
    return secs;
  }, [durationInDays]);

  const validate = () => {
    if (!name || name.trim().length === 0) return "Name cannot be empty";
    if (name.trim().length < 3) return "Name must be at least 3 characters";
    const amt = Number(goalAmount);
    if (!goalAmount || isNaN(amt) || !(amt > 0))
      return "Goal amount must be a number greater than 0";
    if (
      !Number.isInteger(durationInDays) ||
      durationInDays <= 0 ||
      durationInDays > 365
    )
      return "Duration must be an integer between 1 and 365 days";
    return null;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setFormError(null);

    if (!isConnected) {
      setFormError("Please connect your wallet first");
      return;
    }

    const v = validate();
    if (v) {
      setFormError(v);
      return;
    }

    const payload = {
      name: name.trim(),
      description: description.trim(),
      goalAmount: goalAmount.trim(),
      durationInDays,
    };

    try {
      setSubmitting(true);
      const result = await createCampaign(payload, USDC_ADDRESS || undefined);

      console.log("Campaign created successfully:", result);

      if (onCreate) {
        await onCreate({
          ...payload,
          deadlineTs,
        });
      }

      onClose?.();
    } catch (err) {
      console.error("Error in handleSubmit:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setName("");
    setDescription("");
    setGoalAmount("");
    setDurationInDays(7);
    setFormError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-[100px]">
      {/* Backdrop with Vanta-inspired gradient */}
      <div
        className={`absolute inset-0 transition-opacity duration-500 ${
          darkMode
            ? "bg-gradient-to-br from-gray-900/95 via-slate-900/95 to-red-950/95"
            : "bg-gradient-to-br from-red-50/95 via-pink-50/95 to-white/95"
        } backdrop-blur-sm`}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`relative z-10 w-full max-w-2xl transform transition-all duration-300 ${
          darkMode
            ? "bg-gradient-to-br from-slate-900 to-gray-900"
            : "bg-gradient-to-br from-white to-red-50"
        } rounded-2xl shadow-2xl overflow-hidden border ${
          darkMode
            ? "border-red-900/30 shadow-red-900/20"
            : "border-red-200 shadow-red-100"
        }`}
      >
        {/* Header with gradient */}
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
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.58-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83z" />
                </svg>
              </div>
              <div>
                <h2
                  className={`text-2xl font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Create Campaign
                </h2>
                <p
                  className={`mt-1 ${
                    darkMode ? "text-red-300" : "text-red-600"
                  }`}
                >
                  Start a new crowdfunding campaign on Moonbase Alpha
                </p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                  darkMode
                    ? "text-red-400 hover:text-red-300 hover:bg-red-900/30"
                    : "text-red-500 hover:text-red-700 hover:bg-red-100"
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
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {formError && (
            <div
              className={`rounded-xl p-4 border backdrop-blur-sm ${
                darkMode
                  ? "bg-red-900/20 border-red-800/50 text-red-300"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}
            >
              <div className="flex items-center">
                <div
                  className={`p-2 rounded-lg mr-3 ${
                    darkMode ? "bg-red-900/40" : "bg-red-100"
                  }`}
                >
                  <svg
                    className="w-5 h-5 text-red-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="font-medium">{formError}</span>
              </div>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Campaign Name */}
            <div>
              <label
                className={`block text-sm font-semibold mb-3 ${
                  darkMode ? "text-red-300" : "text-red-700"
                }`}
              >
                Campaign Name *
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
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`relative w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:outline-none ${
                    darkMode
                      ? "bg-gray-800/70 border-red-900/50 text-white placeholder-red-400/50 focus:ring-red-500 focus:border-red-500 focus:ring-offset-gray-900"
                      : "bg-white/80 border-red-200 text-gray-900 placeholder-red-400/50 focus:ring-red-400 focus:border-red-300 focus:ring-offset-red-50"
                  }`}
                  placeholder="Enter campaign title"
                  required
                  maxLength={100}
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                className={`block text-sm font-semibold mb-3 ${
                  darkMode ? "text-red-300" : "text-red-700"
                }`}
              >
                Description
              </label>
              <div className="relative group">
                <div
                  className={`absolute inset-0 rounded-xl blur transition-all duration-300 group-hover:blur-sm ${
                    darkMode
                      ? "bg-gradient-to-r from-red-900/20 to-pink-900/20"
                      : "bg-gradient-to-r from-red-100 to-pink-100"
                  }`}
                ></div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={`relative w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:outline-none resize-none ${
                    darkMode
                      ? "bg-gray-800/70 border-red-900/50 text-white placeholder-red-400/50 focus:ring-red-500 focus:border-red-500 focus:ring-offset-gray-900"
                      : "bg-white/80 border-red-200 text-gray-900 placeholder-red-400/50 focus:ring-red-400 focus:border-red-300 focus:ring-offset-red-50"
                  }`}
                  rows={4}
                  placeholder="Describe your campaign goals and purpose..."
                  maxLength={500}
                />
              </div>
            </div>

            {/* Goal Amount */}
            <div>
              <label
                className={`block text-sm font-semibold mb-3 ${
                  darkMode ? "text-red-300" : "text-red-700"
                }`}
              >
                Goal Amount (USDC) *
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
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                      className={`flex-1 px-4 py-3 bg-transparent focus:outline-none rounded-l-xl ${
                        darkMode
                          ? "text-white placeholder-red-400/50"
                          : "text-gray-900 placeholder-red-400/50"
                      }`}
                      placeholder="0.00"
                      inputMode="decimal"
                      required
                    />
                    <div
                      className={`flex items-center px-4 border-l ${
                        darkMode
                          ? "border-red-900/50 text-red-400"
                          : "border-red-200 text-red-600"
                      }`}
                    >
                      <span className="font-semibold">USDC</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label
                className={`block text-sm font-semibold mb-3 ${
                  darkMode ? "text-red-300" : "text-red-700"
                }`}
              >
                Duration (days) *
              </label>
              <div className="relative group w-32">
                <div
                  className={`absolute inset-0 rounded-xl blur transition-all duration-300 group-hover:blur-sm ${
                    darkMode
                      ? "bg-gradient-to-r from-red-900/20 to-pink-900/20"
                      : "bg-gradient-to-r from-red-100 to-pink-100"
                  }`}
                ></div>
                <input
                  value={durationInDays}
                  onChange={(e) => setDurationInDays(Number(e.target.value))}
                  type="number"
                  min={1}
                  max={365}
                  className={`relative w-full px-4 py-3 rounded-xl border transition-all duration-300 focus:ring-2 focus:ring-offset-2 focus:outline-none ${
                    darkMode
                      ? "bg-gray-800/70 border-red-900/50 text-white focus:ring-red-500 focus:border-red-500 focus:ring-offset-gray-900"
                      : "bg-white/80 border-red-200 text-gray-900 focus:ring-red-400 focus:border-red-300 focus:ring-offset-red-50"
                  }`}
                  required
                />
              </div>
            </div>
          </div>

          {/* Deadline Info Card */}
          <div
            className={`rounded-xl p-4 border backdrop-blur-sm ${
              darkMode
                ? "bg-gradient-to-r from-red-900/10 to-pink-900/10 border-red-800/30"
                : "bg-gradient-to-r from-red-50 to-pink-50 border-red-200"
            }`}
          >
            <div className="flex items-center">
              <div
                className={`p-2 rounded-lg mr-3 ${
                  darkMode ? "bg-red-900/30" : "bg-red-100"
                }`}
              >
                <svg
                  className="w-5 h-5 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${
                    darkMode ? "text-red-300" : "text-red-700"
                  }`}
                >
                  Campaign will end on:
                </p>
                <p
                  className={`font-bold ${
                    darkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  {new Date(deadlineTs * 1000).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              disabled={submitting || isLoading || !isConnected}
              className={`flex-1 px-6 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-[1.02] disabled:transform-none disabled:cursor-not-allowed relative overflow-hidden group ${
                darkMode
                  ? "bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 disabled:from-gray-700 disabled:to-gray-800 text-white shadow-lg shadow-red-900/30"
                  : "bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-400 hover:to-pink-400 disabled:from-gray-300 disabled:to-gray-400 text-white shadow-lg shadow-red-200"
              }`}
            >
              <div
                className={`absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              ></div>
              <span className="relative flex items-center justify-center">
                {submitting || isLoading ? (
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
                    Creating on Blockchain...
                  </>
                ) : (
                  "Launch Campaign"
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={submitting || isLoading}
              className={`px-6 py-4 rounded-xl font-medium transition-all duration-300 border ${
                darkMode
                  ? "border-red-800 text-red-300 hover:bg-red-900/30 hover:text-red-200 disabled:border-gray-700 disabled:text-gray-500"
                  : "border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:border-gray-300 disabled:text-gray-400"
              }`}
            >
              Reset Form
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
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium">
                  Please connect your wallet to create a campaign
                </span>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
