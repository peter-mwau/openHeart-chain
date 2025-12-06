import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useContract } from "../hooks/useContract";
import { useTokenConversion } from "../hooks/useTokenConversion";

const CampaignsContext = createContext(undefined);

export function CampaignsProvider({ children }) {
  const { getAllCampaigns, getCampaignTokenBalances } = useContract();
  const { calculatePortfolioValue } = useTokenConversion();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to transform the raw campaign array into a proper Campaign object
  const transformCampaign = (rawCampaign) => {
    // If the contract returns an array (tuple-like), map by index.
    if (Array.isArray(rawCampaign)) {
      return {
        id: Number(rawCampaign[0]), // id
        name: rawCampaign[1], // name
        description: rawCampaign[2], // description
        creator: rawCampaign[3], // creator
        goalAmount: rawCampaign[4], // goalAmount
        totalDonated: rawCampaign[5], // totalDonated
        createdAt: rawCampaign[6], // createdAt
        deadline: rawCampaign[7], // deadline
        active: rawCampaign[8], // active
        exists: rawCampaign[9], // exists
        funded: rawCampaign[10], // funded
        cancelled: rawCampaign[11], // cancelled
      };
    }

    // If the data is already returned as an object (e.g. decoded mapping), map by keys.
    if (rawCampaign && typeof rawCampaign === "object") {
      // Helpful debug log to inspect incoming object keys during development
      // (comment out or remove in production)
      console.debug(
        "transformCampaign - object keys:",
        Object.keys(rawCampaign)
      );

      return {
        id: Number(
          rawCampaign.id ??
            rawCampaign._id ??
            rawCampaign.identifier ??
            rawCampaign.index ??
            NaN
        ),
        name: rawCampaign.name ?? rawCampaign.title ?? "",
        description: rawCampaign.description ?? rawCampaign.details ?? "",
        creator:
          rawCampaign.creator ??
          rawCampaign.owner ??
          rawCampaign.creatorAddress ??
          "",
        goalAmount:
          rawCampaign.goalAmount ?? rawCampaign.goal ?? rawCampaign.target ?? 0,
        totalDonated:
          rawCampaign.totalDonated ??
          rawCampaign.raised ??
          rawCampaign.collected ??
          0,
        createdAt: rawCampaign.createdAt ?? rawCampaign.timestamp ?? null,
        deadline: rawCampaign.deadline ?? rawCampaign.endsAt ?? null,
        active: rawCampaign.active ?? true,
        exists: rawCampaign.exists ?? true,
        funded: rawCampaign.funded ?? false,
        cancelled: rawCampaign.cancelled ?? false,
      };
    }

    // Fallback: return minimal object so downstream code won't crash.
    return {
      id: NaN,
      name: undefined,
      description: undefined,
      creator: undefined,
      goalAmount: 0,
      totalDonated: 0,
      createdAt: null,
      deadline: null,
      active: false,
      exists: false,
      funded: false,
      cancelled: false,
    };
  };

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rawCampaigns = await getAllCampaigns();

      console.log("Raw campaigns data:", rawCampaigns); // For debugging

      if (!Array.isArray(rawCampaigns)) {
        throw new Error("Invalid campaigns data format");
      }

      // Transform each raw campaign array into a proper Campaign object
      const processedCampaigns = rawCampaigns.map(transformCampaign);

      // For each campaign compute USDC-equivalent portfolio (goalUSD, raisedUSD, progress)
      const enrichedCampaigns = await Promise.all(
        processedCampaigns.map(async (c) => {
          try {
            const portfolio = await calculatePortfolioValue(
              c.id,
              c.goalAmount.toString(),
              getCampaignTokenBalances
            );

            return {
              ...c,
              goalUSD: portfolio.goalUSD,
              raisedUSD: portfolio.raisedUSD,
              progress: portfolio.progress,
              tokenBalances: portfolio.tokenBalances,
            };
          } catch (error) {
            // If portfolio calculation fails, return original campaign
            console.error(
              "Portfolio enrichment failed for campaign",
              c.id,
              error
            );
            return c;
          }
        })
      );

      console.log("Processed campaigns:", enrichedCampaigns); // For debugging

      setCampaigns(enrichedCampaigns);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
    // Intentionally only depend on calculatePortfolioValue here. getAllCampaigns and
    // getCampaignTokenBalances come from `useContract` and may change identity
    // across renders which would cause this effect to refetch repeatedly. The
    // functions themselves are stable in practice; if you change the contract
    // implementation to memoize those functions, you can add them back to the
    // dependency list. For now we disable the exhaustive-deps rule for those
    // two values to avoid an infinite refetch loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calculatePortfolioValue]);

  const getCampaignById = (id) => {
    return campaigns.find((campaign) => campaign.id === id);
  };

  // Load campaigns on mount
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const contextValue = {
    campaigns,
    loading,
    error,
    refreshCampaigns: fetchCampaigns,
    getCampaignById,
  };

  return (
    <CampaignsContext.Provider value={contextValue}>
      {children}
    </CampaignsContext.Provider>
  );
}

export function useCampaigns() {
  const context = useContext(CampaignsContext);
  if (context === undefined) {
    throw new Error("useCampaigns must be used within a CampaignsProvider");
  }
  return context;
}
