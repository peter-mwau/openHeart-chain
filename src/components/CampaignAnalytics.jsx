import React from "react";
import { useDarkMode } from "../contexts/themeContext";
import PieChart from "./PieChart";
import { ethers } from "ethers";

export default function CampaignAnalytics({ campaign, donations, portfolio }) {
  const { darkMode } = useDarkMode();

  // --- Data Processing ---

  // 1. Donation Volume Over Time (Grouped by Day)
  const processDonationHistory = () => {
    if (!donations || donations.length === 0) return [];

    const volumeByDate = {};
    const sortedDonations = [...donations].sort(
      (a, b) => Number(a.timestamp) - Number(b.timestamp)
    );

    sortedDonations.forEach((d) => {
      const date = new Date(Number(d.timestamp) * 1000).toLocaleDateString();
      const rawAmount = d.amount ? parseFloat(ethers.formatUnits(d.amount, d.decimals || 18)) : 0;
      // Note: In a real app we would convert this exact amount to USD at the time of donation
      // For now, we use current portfolio value ratio or just raw amounts if USD not available
      // To keep it simple and consistent with Portfolio, let's just sum the raw counts for "Activity"
      // or try to estimate USD if we have price data.
      volumeByDate[date] = (volumeByDate[date] || 0) + 1; // Count donations per day
    });

    return Object.entries(volumeByDate).map(([date, count]) => ({
      date,
      count,
    })).slice(-7); // Last 7 active days
  };

  const activityData = processDonationHistory();

  // 2. Token Distribution (from Portfolio)
  const tokenDistribution = portfolio?.tokenBalances?.map((t, i) => ({
    name: t.symbol,
    value: t.usdValue,
    color: [
      "#3B82F6", // Blue
      "#8B5CF6", // Purple
      "#F59E0B", // Amber
      "#10B981", // Emerald
      "#EF4444", // Red
    ][i % 5],
  })) || [];

  // 3. Key Metrics
  const totalRaised = portfolio?.totalUSDValue || 0;
  const donationCount = donations?.length || 0;
  const avgDonation = donationCount > 0 ? totalRaised / donationCount : 0;

  // Find top donor (by frequency in this simpler view, or amount if we had USD history per tx)
  const donorCounts = {};
  donations?.forEach(d => {
      donorCounts[d.donor] = (donorCounts[d.donor] || 0) + 1;
  });
  const topDonor = Object.entries(donorCounts).sort((a,b) => b[1] - a[1])[0];


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Metric Cards */}
        <MetricCard
          label="Avg. Donation Size"
          value={`$${avgDonation.toFixed(2)}`}
          icon="📊"
          darkMode={darkMode}
          color="blue"
        />
        <MetricCard
          label="Donation Frequency"
          value={`${(donationCount / Math.max(1, activityData.length)).toFixed(1)}/day`}
          subtext="Last 7 active days"
          icon="⚡"
          darkMode={darkMode}
          color="purple"
        />
        <MetricCard
          label="Top Supporter"
          value={topDonor ? `${topDonor[0].slice(0,6)}...${topDonor[0].slice(-4)}` : "None"}
          subtext={topDonor ? `${topDonor[1]} donations` : "No donations yet"}
          icon="🏆"
          darkMode={darkMode}
          color="amber"
          isAddress
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <div
          className={`p-6 rounded-2xl border backdrop-blur-sm ${
            darkMode
              ? "bg-slate-900/50 border-slate-800"
              : "bg-white/80 border-slate-200"
          }`}
        >
            <h3 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-slate-900"}`}>
                Donation Activity
            </h3>
            <div className="h-64 flex items-end space-x-2">
                {activityData.length > 0 ? activityData.map((d, i) => {
                    const height = Math.max(10, (d.count / Math.max(...activityData.map(x=>x.count))) * 100);
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center group">
                             <div className="relative w-full flex items-end justify-center h-52">
                                 <div
                                    className={`w-full max-w-[30px] rounded-t-lg transition-all duration-500 ${
                                        darkMode ? "bg-red-500" : "bg-red-500"
                                    } opacity-80 group-hover:opacity-100`}
                                    style={{ height: `${height}%` }}
                                 >
                                     <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs py-1 px-2 rounded">
                                         {d.count}
                                     </div>
                                 </div>
                             </div>
                             <div className={`text-xs mt-2 truncate w-full text-center ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                 {d.date.split('/')[0]}/{d.date.split('/')[1]}
                             </div>
                        </div>
                    )
                }) : (
                    <div className="w-full h-full flex items-center justify-center italic opacity-50">
                        No recent activity
                    </div>
                )}
            </div>
        </div>

        {/* Allocation Chart */}
        <div
          className={`p-6 rounded-2xl border backdrop-blur-sm ${
            darkMode
              ? "bg-slate-900/50 border-slate-800"
              : "bg-white/80 border-slate-200"
          }`}
        >
             <h3 className={`text-lg font-bold mb-4 ${darkMode ? "text-white" : "text-slate-900"}`}>
                Funds Distribution
            </h3>
            <div className="flex items-center justify-center">
                <PieChart data={tokenDistribution.map(t => ({ // Map to expected format for PieChart
                    symbol: t.name,
                    value: t.value,
                    color: t.color,
                    percentage: t.value / totalRaised * 100
                }))} size={200} darkMode={darkMode} />
            </div>
             <div className="mt-6 space-y-2">
                {tokenDistribution.map((t, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                        <div className="flex items-center space-x-2">
                             <div className="w-3 h-3 rounded-full" style={{backgroundColor: t.color}}></div>
                             <span className={darkMode ? "text-slate-300" : "text-slate-600"}>{t.name}</span>
                        </div>
                        <span className={`font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>
                            ${t.value.toFixed(2)} ({((t.value/totalRaised)*100).toFixed(1)}%)
                        </span>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subtext, icon, darkMode, color, isAddress }) {
  const getColors = () => {
    switch(color) {
      case 'purple': return darkMode ? "text-purple-400 bg-purple-900/20" : "text-purple-600 bg-purple-100";
      case 'amber': return darkMode ? "text-amber-400 bg-amber-900/20" : "text-amber-600 bg-amber-100";
      default: return darkMode ? "text-blue-400 bg-blue-900/20" : "text-blue-600 bg-blue-100";
    }
  }

  return (
    <div className={`p-5 rounded-2xl border backdrop-blur-sm ${
        darkMode ? "bg-slate-900/50 border-slate-800" : "bg-white/80 border-slate-200"
    }`}>
      <div className="flex items-center justify-between mb-2">
         <span className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
             {label}
         </span>
         <div className={`p-2 rounded-lg ${getColors()}`}>
             {icon}
         </div>
      </div>
      <div className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-900"} ${isAddress ? "font-mono" : ""}`}>
          {value}
      </div>
      {subtext && (
          <div className={`text-xs mt-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
              {subtext}
          </div>
      )}
    </div>
  )
}
