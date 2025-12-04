// hooks/useContract.ts
import { useMemo, useState } from "react";
import { ethers } from "ethers";
import { toast } from "react-toastify";
import DonorContractABI from "../artifacts/DonorContract.sol/DonorContract.json";
import { TOKEN_BY_ADDRESS } from "../../config/tokens";
import {
  defineChain,
  getContract,
  prepareContractCall,
  readContract,
  sendTransaction,
} from "thirdweb";
import { useActiveAccount } from "thirdweb/react";
import { client } from "../services/client";

const donorContractABI = DonorContractABI.abi;
const DONOR_CONTRACT_ADDRESS =
  import.meta.env.VITE_DONATE_CONTRACT_ADDRESS || "";

export function useContract() {
  const [isLoading, setIsLoading] = useState(false);
  const account = useActiveAccount();
  const address = account?.address || "";
  const isConnected = !!account;

  /// Contract should be created once
  const contract = useMemo(() => {
    if (!DONOR_CONTRACT_ADDRESS) return null;
    return getContract({
      client,
      address: DONOR_CONTRACT_ADDRESS,
      chain: defineChain(11155111),
      abi: donorContractABI,
    });
  }, []);

  // Create a new campaign
  const createCampaign = async (campaignData, tokenAddress) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      throw new Error("Wallet not connected");
    }

    if (!contract) {
      toast.error("Contract not initialized");
      throw new Error("Contract not initialized");
    }

    setIsLoading(true);
    const toastId = toast.loading("Creating campaign...");

    try {
      // Validate input
      if (!campaignData.name.trim()) {
        toast.update(toastId, {
          render: "Campaign name is required",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        throw new Error("Campaign name is required");
      }

      if (
        !campaignData.goalAmount ||
        parseFloat(campaignData.goalAmount) <= 0
      ) {
        toast.update(toastId, {
          render: "Goal amount must be greater than 0",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        throw new Error("Goal amount must be greater than 0");
      }

      if (
        campaignData.durationInDays <= 0 ||
        campaignData.durationInDays > 365
      ) {
        toast.update(toastId, {
          render: "Duration must be between 1 and 365 days",
          type: "error",
          isLoading: false,
          autoClose: 3000,
        });
        throw new Error("Duration must be between 1 and 365 days");
      }

      // Convert goal amount to token smallest units using token decimals (fallback to 18)
      const tokenInfo = tokenAddress
        ? TOKEN_BY_ADDRESS[tokenAddress.toLowerCase()]
        : undefined;
      const decimals = tokenInfo?.decimals ?? 18;
      const goalAmountWei = ethers.parseUnits(
        campaignData.goalAmount,
        decimals
      );

      console.log("Creating campaign with data:", {
        name: campaignData.name,
        description: campaignData.description,
        goalAmount: campaignData.goalAmount,
        goalAmountWei: goalAmountWei.toString(),
        durationInDays: campaignData.durationInDays,
      });

      toast.update(toastId, {
        render: "Confirming transaction in your wallet...",
      });

      // Execute the transaction
      const transaction = await prepareContractCall({
        contract,
        method: "createCampaign",
        params: [
          campaignData.name,
          campaignData.description,
          goalAmountWei,
          campaignData.durationInDays,
        ],
      });

      toast.update(toastId, {
        render: "Transaction submitted. Waiting for confirmation...",
      });

      await sendTransaction({ transaction, account });

      toast.update(toastId, {
        render: "Campaign created successfully! 🎉",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      return {
        success: true,
      };
    } catch (err) {
      console.error("Error creating campaign:", err);

      let errorMessage = "Failed to create campaign";
      if (err.code === "ACTION_REJECTED") {
        errorMessage = "Transaction was rejected by user";
      } else if (err.reason) {
        errorMessage = err.reason;
      } else if (err.message) {
        errorMessage = err.message;
      }

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Donate to a campaign
  const donateToCampaign = async (tokenAddress, campaignId, amount) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      throw new Error("Wallet not connected");
    }

    if (!contract) {
      toast.error("Contract not initialized");
      throw new Error("Contract not initialized");
    }

    setIsLoading(true);
    const toastId = toast.loading("Processing donation...");

    try {
      const tokenInfo = TOKEN_BY_ADDRESS[tokenAddress?.toLowerCase()];
      const decimals = tokenInfo?.decimals ?? 18;
      const amountWei = ethers.parseUnits(amount, decimals);

      toast.update(toastId, {
        render: "Confirming donation in your wallet...",
      });

      const transaction = await prepareContractCall({
        contract,
        method: "donateToCampaign",
        params: [tokenAddress, campaignId, amountWei],
      });

      toast.update(toastId, {
        render: "Donation submitted. Waiting for confirmation...",
      });

      await sendTransaction({ transaction, account });

      toast.update(toastId, {
        render: "Donation successful! Thank you for your support! 💝",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      return {
        success: true,
      };
    } catch (err) {
      console.error("Error donating to campaign:", err);

      let errorMessage = "Failed to process donation";
      if (err.code === "ACTION_REJECTED") {
        errorMessage = "Transaction was rejected by user";
      } else if (err.reason) {
        errorMessage = err.reason;
      }

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Withdraw funds from campaign
  const withdrawFunds = async (campaignId, tokenAddress) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      throw new Error("Wallet not connected");
    }

    if (!contract) {
      toast.error("Contract not initialized");
      throw new Error("Contract not initialized");
    }

    setIsLoading(true);
    const toastId = toast.loading("Withdrawing funds...");

    try {
      toast.update(toastId, {
        render: "Confirming withdrawal in your wallet...",
      });

      const transaction = await prepareContractCall({
        contract,
        method: "withdrawFunds",
        params: [tokenAddress, campaignId],
      });

      toast.update(toastId, {
        render: "Withdrawal submitted. Waiting for confirmation...",
      });

      await sendTransaction({ transaction, account });

      toast.update(toastId, {
        render: "Funds withdrawn successfully! 💰",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      return {
        success: true,
      };
    } catch (err) {
      console.error("Error withdrawing funds:", err);

      let errorMessage = "Failed to withdraw funds";
      if (err.code === "ACTION_REJECTED") {
        errorMessage = "Transaction was rejected by user";
      } else if (err.reason) {
        errorMessage = err.reason;
      }

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  //setToken allowed
  const setTokenAllowed = async (tokenAddress, allowed) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      throw new Error("Wallet not connected");
    }

    setIsLoading(true);
    const toastId = toast.loading("Updating token allowance...");

    try {
      toast.update(toastId, { render: "Confirming update in your wallet..." });

      const transaction = await prepareContractCall({
        contract,
        method: "setAllowedToken",
        params: [tokenAddress, allowed],
      });

      toast.update(toastId, {
        render: "Update submitted. Waiting for confirmation...",
      });

      await sendTransaction({ transaction, account });

      toast.update(toastId, {
        render: "Token allowance updated successfully! ✅",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      return {
        success: true,
      };
    } catch (err) {
      console.error("Error updating token allowance:", err);

      let errorMessage = "Failed to update token allowance";
      if (err.code === "ACTION_REJECTED") {
        errorMessage = "Transaction was rejected by user";
      } else if (err.reason) {
        errorMessage = err.reason;
      }

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Cancel a campaign
  const cancelCampaign = async (campaignId) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      throw new Error("Wallet not connected");
    }

    if (!contract) {
      toast.error("Contract not initialized");
      throw new Error("Contract not initialized");
    }

    setIsLoading(true);
    const toastId = toast.loading("Cancelling campaign...");

    try {
      toast.update(toastId, {
        render: "Confirming cancellation in your wallet...",
      });

      const transaction = await prepareContractCall({
        contract,
        method: "cancelCampaign",
        params: [campaignId],
      });

      toast.update(toastId, {
        render: "Cancellation submitted. Waiting for confirmation...",
      });

      await sendTransaction({ transaction, account });

      toast.update(toastId, {
        render: "Campaign cancelled successfully",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      return {
        success: true,
      };
    } catch (err) {
      console.error("Error cancelling campaign:", err);

      let errorMessage = "Failed to cancel campaign";
      if (err.code === "ACTION_REJECTED") {
        errorMessage = "Transaction was rejected by user";
      } else if (err.reason) {
        errorMessage = err.reason;
      }

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Refund donation
  const refundDonation = async (campaignId, tokenAddress) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet first");
      throw new Error("Wallet not connected");
    }

    if (!contract) {
      toast.error("Contract not initialized");
      throw new Error("Contract not initialized");
    }

    setIsLoading(true);
    const toastId = toast.loading("Processing refund...");

    try {
      toast.update(toastId, { render: "Confirming refund in your wallet..." });

      const transaction = await prepareContractCall({
        contract,
        method: "refundDonation",
        params: [campaignId, tokenAddress],
      });

      toast.update(toastId, {
        render: "Refund submitted. Waiting for confirmation...",
      });

      await sendTransaction({ transaction, account });

      toast.update(toastId, {
        render: "Refund processed successfully! 🔄",
        type: "success",
        isLoading: false,
        autoClose: 5000,
      });

      return {
        success: true,
      };
    } catch (err) {
      console.error("Error processing refund:", err);

      let errorMessage = "Failed to process refund";
      if (err.code === "ACTION_REJECTED") {
        errorMessage = "Transaction was rejected by user";
      } else if (err.reason) {
        errorMessage = err.reason;
      }

      toast.update(toastId, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000,
      });

      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Read functions (no toasts for read operations)
  const getAllCampaigns = async () => {
    try {
      const campaigns = await readContract({
        contract,
        method: "getAllCampaigns",
      });
      return campaigns;
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      throw err;
    }
  };

  //check role
  const hasRole = async (role) => {
    try {
      const roleBytes = ethers.keccak256(ethers.toUtf8Bytes(role));
      const hasRole = await readContract({
        contract,
        method: "hasRole",
        params: [roleBytes, address],
      });
      return hasRole;
    } catch (err) {
      console.error("Error checking role:", err);
      return false;
    }
  };

  const getCampaignById = async (campaignId) => {
    try {
      const campaign = await readContract({
        contract,
        method: "getCampaignById",
        params: [campaignId],
      });
      return campaign;
    } catch (err) {
      console.error("Error fetching campaign:", err);
      throw err;
    }
  };

  const getCampaignDonations = async (campaignId) => {
    try {
      const donations = await readContract({
        contract,
        method: "getCampaignDonations",
        params: [campaignId],
      });
      return donations;
    } catch (err) {
      console.error("Error fetching donations:", err);
      throw err;
    }
  };

  const isCampaignSuccessful = async (campaignId) => {
    try {
      const isSuccessful = await readContract({
        contract,
        method: "isCampaignSuccessful",
        params: [campaignId],
      });
      return isSuccessful;
    } catch (err) {
      console.error("Error checking campaign success:", err);
      throw err;
    }
  };

  const getCampaignFundsByToken = async (campaignId, tokenAddress) => {
    try {
      const funds = await readContract({
        contract,
        method: "getCampaignFundsByToken",
        params: [campaignId, tokenAddress],
      });
      return funds;
    } catch (err) {
      console.error("Error fetching campaign funds:", err);
      throw err;
    }
  };

  const getTokenByAddress = (tokenAddress) => {
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

    return (
      tokenMap[tokenAddress.toLowerCase()] || {
        symbol: "UNKNOWN",
        decimals: 18,
      }
    );
  };

  const getCampaignTokenBalances = async (campaignId) => {
    const campaignTokenBalances = await readContract({
      contract,
      method: "getCampaignTokenBalances",
      params: [campaignId],
    });
    return campaignTokenBalances;
  };

  // Improved reasonable amount checker
  const isReasonableAmount = (amount, symbol) => {
    // These are reasonable ranges for each token type
    const reasonableRanges = {
      USDC: { min: 0.01, max: 10000000 }, // $0.01 to $10M
      WETH: { min: 0.0001, max: 10000 }, // 0.0001 to 10,000 ETH
      WBTC: { min: 0.000001, max: 1000 }, // 0.000001 to 1,000 BTC
    };

    const range = reasonableRanges[symbol] || { min: 0, max: Infinity };
    return amount >= range.min && amount <= range.max;
  };

  const getCampaignDonationsWithTokens = async (campaignId) => {
    try {
      const donations = await getCampaignDonations(campaignId);
      const [tokenAddresses, tokenBalances] = await getCampaignTokenBalances(
        campaignId
      );

      console.log("🔍 Token Matching Debug:", {
        campaignId,
        donationsCount: donations.length,
        tokenAddresses,
        tokenBalances: tokenBalances.map((b) => b?.toString() || "null"),
      });

      // Validate donations data
      const validDonations = donations.filter(
        (donation) =>
          donation && donation.amount !== undefined && donation.amount !== null
      );

      if (validDonations.length !== donations.length) {
        console.warn("⚠️ Filtered out invalid donations:", {
          original: donations.length,
          valid: validDonations.length,
        });
      }

      // Create token map from environment variables
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

      // Map donations to tokens
      const donationsWithTokens = validDonations.map((donation, index) => {
        // Default to USDC as fallback
        let tokenInfo =
          tokenMap[import.meta.env.VITE_USDC_CONTRACT_ADDRESS.toLowerCase()];

        // Try to find which token this donation belongs to
        for (const [tokenAddress, info] of Object.entries(tokenMap)) {
          const formattedAmount = parseFloat(
            ethers.formatUnits(donation.amount, info.decimals)
          );

          // Simple check: if amount is reasonable for this token type
          if (isReasonableAmount(formattedAmount, info.symbol)) {
            tokenInfo = info;
            console.log(
              `✅ Donation ${index + 1} matched to ${
                info.symbol
              }: ${formattedAmount}`
            );
            break;
          }
        }

        const matchedEntry = Object.entries(tokenMap).find(
          ([, info]) => info.symbol === tokenInfo.symbol
        );
        const selectedAddress = matchedEntry
          ? matchedEntry[0]
          : import.meta.env.VITE_USDC_CONTRACT_ADDRESS;

        return {
          ...donation,
          tokenAddress: selectedAddress,
          symbol: tokenInfo.symbol,
          decimals: tokenInfo.decimals,
        };
      });

      console.log("🎯 Final mapped donations:", donationsWithTokens);
      return donationsWithTokens;
    } catch (error) {
      console.error("❌ Error in getCampaignDonationsWithTokens:", error);
      // Return empty array as fallback
      return [];
    }
  };

  // Also add this helper function to your useContract hook:
  const getTokenIcon = (symbol) => {
    const icons = {
      USDC: "💵",
      WETH: "🔷",
      WBTC: "🟡",
    };
    return icons[symbol] || "🪙";
  };

  const getTokenInfo = (tokenAddress) => {
    if (!tokenAddress) return { symbol: "UNKNOWN", decimals: 18 };
    const info = TOKEN_BY_ADDRESS[tokenAddress.toLowerCase()];
    return info ?? { symbol: "UNKNOWN", decimals: 18 };
  };

  return {
    // Write functions
    createCampaign,
    donateToCampaign,
    withdrawFunds,
    cancelCampaign,
    refundDonation,
    setTokenAllowed,

    // Read functions
    getAllCampaigns,
    getCampaignById,
    getCampaignDonations,
    isCampaignSuccessful,
    getCampaignFundsByToken,
    hasRole,
    getCampaignTokenBalances,
    getTokenInfo,
    getCampaignDonationsWithTokens,
    getTokenIcon,

    // State
    isLoading,
    isConnected,
  };
}
