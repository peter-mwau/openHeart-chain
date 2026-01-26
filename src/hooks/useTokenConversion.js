// hooks/useTokenConversion.ts
import { ethers } from 'ethers';
import { useTokenPrices } from './useTokenPrices';
import { TOKENS, TOKEN_BY_ADDRESS } from '../config/tokens';


export function useTokenConversion() {
    // Build a deduplicated list of coingecko ids from configured tokens
    const COINGECKO_IDS = Array.from(
        new Set(
            Object.values(TOKENS)
                .map((t) => t.coingeckoId)
                .filter((id) => !!id)
        )
    );

    const { prices, loading: pricesLoading, error: pricesError } = useTokenPrices(COINGECKO_IDS);

    const getTokenConfig = (tokenAddress) => {
        if (!tokenAddress) return { name: 'Unknown', symbol: 'UNKNOWN', decimals: 18 };
        const info = TOKEN_BY_ADDRESS[tokenAddress.toLowerCase()];
        if (info) return info;
        return { name: 'Unknown', symbol: 'UNKNOWN', decimals: 18, address: tokenAddress };
    };

    const convertToUSD = (amount, tokenAddress, providedTokenConfig = null) => {
        if (!amount) {
            // console.log('⚠️ convertToUSD: No amount provided');
            return 0;
        }

        if (!prices || Object.keys(prices).length === 0) {
            // console.log('⚠️ convertToUSD: Prices not loaded yet', { prices, pricesLoading });
            return 0;
        }

        try {
            // Use provided token config if available, otherwise look it up
            const tokenConfig = providedTokenConfig || getTokenConfig(tokenAddress);
            // console.log('🚀 convertToUSD Debug Start:', {
            //     tokenAddress,
            //     symbol: tokenConfig.symbol,
            //     decimals: tokenConfig.decimals,
            //     coingeckoId: tokenConfig.coingeckoId,
            //     rawAmount: amount.toString()
            // });

            const formattedAmount = parseFloat(
                typeof amount === 'bigint'
                    ? ethers.formatUnits(amount, tokenConfig.decimals)
                    : ethers.formatUnits(amount, tokenConfig.decimals)
            );

            // console.log('📊 Amount Conversion:', {
            //     symbol: tokenConfig.symbol,
            //     formattedAmount,
            //     calculation: `${amount.toString()} / 10^${tokenConfig.decimals} = ${formattedAmount}`
            // });

            // Debug: Check all available price keys
            // console.log('💰 Available Prices:', Object.keys(prices).map(key => ({
            //     key,
            //     price: prices[key]?.usd
            // })));

            let tokenPrice;

            // Method 1: Coingecko ID (PRIMARY)
            if (tokenConfig.coingeckoId && prices[tokenConfig.coingeckoId]) {
                tokenPrice = prices[tokenConfig.coingeckoId]?.usd;
                console.log('✅ Price found via Coingecko ID:', {
                    coingeckoId: tokenConfig.coingeckoId,
                    price: tokenPrice
                });
            }

            // Method 2: Symbol lookup (SECONDARY)
            if (!tokenPrice && tokenConfig.symbol) {
                const symbolKey = tokenConfig.symbol.toLowerCase();
                if (prices[symbolKey]) {
                    tokenPrice = prices[symbolKey]?.usd;
                    console.log('✅ Price found via Symbol:', {
                        symbol: symbolKey,
                        price: tokenPrice
                    });
                }
            }

            // Method 3: Manual mapping fallback (TERTIARY)
            if (!tokenPrice) {
                const symbolMapping = {
                    'USDC': 'usd-coin',
                    'WETH': 'weth',
                    'WBTC': 'wrapped-bitcoin',
                };

                const mappedId = symbolMapping[tokenConfig.symbol];
                if (mappedId && prices[mappedId]) {
                    tokenPrice = prices[mappedId]?.usd;
                    console.log('✅ Price found via Manual Mapping:', {
                        symbol: tokenConfig.symbol,
                        mappedId,
                        price: tokenPrice
                    });
                }
            }

            if (!tokenPrice) {
                console.error('❌ NO PRICE FOUND for token:', {
                    symbol: tokenConfig.symbol,
                    coingeckoId: tokenConfig.coingeckoId,
                    availablePrices: Object.keys(prices)
                });
                return 0;
            }

            const result = formattedAmount * tokenPrice;
            // console.log('✅ Final USD Conversion:', {
            //     token: tokenConfig.symbol,
            //     amount: formattedAmount,
            //     price: tokenPrice,
            //     result: result,
            //     calculation: `${formattedAmount} ${tokenConfig.symbol} × $${tokenPrice} = $${result}`
            // });

            return result;

        } catch (error) {
            console.error('💥 Error converting to USD:', error);
            return 0;
        }
    };

    const calculatePortfolioValue = async (
        campaignId,
        goalAmount, // USDC goal amount (6 decimals)
        getCampaignTokenBalances) => {
        try {
            console.log('🔍 calculatePortfolioValue: Starting for campaign', campaignId);
            const [tokenAddresses, balances] = await getCampaignTokenBalances(campaignId);

            console.log('📦 Raw token data:', {
                tokenCount: tokenAddresses.length,
                tokens: tokenAddresses.map((addr, i) => ({
                    address: addr,
                    balance: balances[i].toString()
                }))
            });

            let totalUSDValue = 0;
            const tokenBalances = [];

            for (let i = 0; i < tokenAddresses.length; i++) {
                const tokenAddress = tokenAddresses[i];
                const balance = balances[i];

                // console.log(`\n--- Processing token ${i + 1}/${tokenAddresses.length} ---`);
                // console.log('Token address:', tokenAddress);
                // console.log('Balance:', balance.toString());

                if (!balance || balance === BigInt(0)) {
                    console.log('⏭️ Skipping token with zero balance');
                    continue;
                }

                // Resolve token config: try canonical mapping first, otherwise
                // attempt an on-chain lookup for symbol/decimals and match by symbol
                let tokenConfig = getTokenConfig(tokenAddress);
                if (!tokenConfig.coingeckoId) {
                    try {
                        // Try to read symbol/decimals from the token contract in the browser
                        if (typeof window !== 'undefined' && (window).ethereum) {
                            const provider = new ethers.BrowserProvider((window).ethereum);
                            const signerOrProvider = await provider.getSigner().catch(() => provider);
                            const tokenContract = new ethers.Contract(
                                tokenAddress,
                                [
                                    'function symbol() view returns (string)',
                                    'function decimals() view returns (uint8)'
                                ],
                                signerOrProvider
                            );

                            const [onchainSymbol, onchainDecimals] = await Promise.all([
                                tokenContract.symbol().catch(() => undefined),
                                tokenContract.decimals().catch(() => undefined),
                            ]);

                            if (onchainSymbol) {
                                console.log('🔍 On-chain token symbol:', onchainSymbol);
                                // Try to find a matching token config by symbol
                                const match = Object.values(TOKENS).find((t) => t.symbol === onchainSymbol);
                                if (match) {
                                    console.log('✅ Matched token config:', match.symbol, match.coingeckoId);
                                    tokenConfig = { ...match, address: tokenAddress };
                                } else {
                                    console.log('⚠️ No config match for symbol:', onchainSymbol);
                                    tokenConfig = {
                                        name: onchainSymbol,
                                        symbol: onchainSymbol,
                                        decimals: typeof onchainDecimals === 'number' ? onchainDecimals : tokenConfig.decimals,
                                        address: tokenAddress,
                                    };
                                }
                            }
                        }
                    } catch (e) {
                        // Silent fallback; we'll continue with whatever tokenConfig we have
                        console.warn('Failed to enrich token info on-chain for', tokenAddress, e);
                    }
                }

                // Pass the resolved tokenConfig to avoid redundant lookups
                const usdValue = convertToUSD(balance, tokenAddress, tokenConfig);
                // console.log(`💵 Token ${tokenConfig.symbol} USD value: $${usdValue.toFixed(2)}`);

                totalUSDValue += usdValue;

                tokenBalances.push({
                    tokenAddress,
                    symbol: tokenConfig.symbol,
                    balance: balance.toString(),
                    balanceFormatted: ethers.formatUnits(balance, tokenConfig.decimals),
                    usdValue,
                    decimals: tokenConfig.decimals,
                    usdEquivalent: usdValue.toFixed(6),
                });

                // console.log(`Running total USD: $${totalUSDValue.toFixed(2)}`);
            }

            // Calculate progress
            const goalUSD = parseFloat(ethers.formatUnits(goalAmount, 6)); // USDC has 6 decimals
            const progress = goalUSD > 0 ? (totalUSDValue / goalUSD) * 100 : 0;

            // console.log('\n✅ Portfolio calculation complete:', {
            //     totalUSDValue: totalUSDValue.toFixed(2),
            //     goalUSD: goalUSD.toFixed(2),
            //     progress: progress.toFixed(2) + '%',
            //     tokenCount: tokenBalances.length
            // });

            return {
                totalUSDValue,
                tokenBalances,
                progress: Math.min(progress, 100),
                goalUSD,
                raisedUSD: totalUSDValue
            };
        } catch (error) {
            console.error('❌ Error calculating portfolio:', error);
            return {
                totalUSDValue: 0,
                tokenBalances: [],
                progress: 0,
                goalUSD: parseFloat(ethers.formatUnits(goalAmount, 6)),
                raisedUSD: 0
            };
        }
    };

    // Convert any token amount to USDC equivalent
    const toUSDCEquivalent = (amount, tokenAddress) => {
        const usdValue = convertToUSD(amount, tokenAddress);
        // Convert USD value back to USDC (1 USDC = 1 USD)
        return usdValue.toFixed(6); // USDC has 6 decimals
    };

    return {
        convertToUSD,
        calculatePortfolioValue,
        toUSDCEquivalent,
        getTokenConfig,
        prices,
        loading: pricesLoading,
        error: pricesError
    };
}