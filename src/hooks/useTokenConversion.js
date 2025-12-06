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

    const convertToUSD = (amount, tokenAddress) => {
        if (!amount || !prices) {
            console.log('convertToUSD: No amount or prices', { amount, prices });
            return 0;
        }

        try {
            const tokenConfig = getTokenConfig(tokenAddress);
            console.log('🚀 convertToUSD Debug Start:', {
                tokenAddress,
                symbol: tokenConfig.symbol,
                decimals: tokenConfig.decimals,
                coingeckoId: tokenConfig.coingeckoId,
                rawAmount: amount.toString()
            });

            const formattedAmount = parseFloat(
                typeof amount === 'bigint'
                    ? ethers.formatUnits(amount, tokenConfig.decimals)
                    : ethers.formatUnits(amount, tokenConfig.decimals)
            );

            console.log('📊 Amount Conversion:', {
                formattedAmount,
                calculation: `${amount.toString()} / 10^${tokenConfig.decimals} = ${formattedAmount}`
            });

            // Debug: Check all available price keys
            console.log('💰 Available Prices:', Object.keys(prices).map(key => ({
                key,
                price: prices[key]?.usd
            })));

            let tokenPrice;

            // Method 1: Coingecko ID
            if (tokenConfig.coingeckoId) {
                tokenPrice = prices[tokenConfig.coingeckoId]?.usd;
                console.log('🔍 Price Check - Coingecko ID:', {
                    coingeckoId: tokenConfig.coingeckoId,
                    price: tokenPrice,
                    found: !!prices[tokenConfig.coingeckoId]
                });
            }

            // Method 2: Symbol lookup
            if (!tokenPrice && tokenConfig.symbol) {
                const symbolKey = tokenConfig.symbol.toLowerCase();
                tokenPrice = prices[symbolKey]?.usd;
                console.log('🔍 Price Check - Symbol:', {
                    symbol: symbolKey,
                    price: tokenPrice,
                    found: !!prices[symbolKey]
                });
            }

            // Method 3: Manual mapping fallback
            if (!tokenPrice) {
                const symbolMapping = {
                    'USDC': 'usd-coin',
                    'WETH': 'weth',
                    'WBTC': 'wrapped-bitcoin',
                };

                const mappedId = symbolMapping[tokenConfig.symbol];
                if (mappedId) {
                    tokenPrice = prices[mappedId]?.usd;
                    console.log('🔍 Price Check - Mapped ID:', {
                        symbol: tokenConfig.symbol,
                        mappedId,
                        price: tokenPrice,
                        found: !!prices[mappedId]
                    });
                }
            }

            // Method 4: Hardcoded fallback for testing
            if (!tokenPrice) {
                const fallbackPrices = {
                    'USDC': 1,
                    'WETH': 3213,
                    'WBTC': 110464,
                };
                tokenPrice = fallbackPrices[tokenConfig.symbol];
                console.log('🆘 Using Fallback Price:', {
                    symbol: tokenConfig.symbol,
                    price: tokenPrice
                });
            }

            console.log('🎯 Final Price:', { tokenPrice });

            if (!tokenPrice) {
                console.log('❌ No price found for token:', tokenConfig.symbol);
                return 0;
            }

            const result = formattedAmount * tokenPrice;
            console.log('✅ Final Calculation:', {
                formattedAmount,
                tokenPrice,
                result,
                calculation: `${formattedAmount} ${tokenConfig.symbol} × $${tokenPrice} = $${result}`
            });

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
            const [tokenAddresses, balances] = await getCampaignTokenBalances(campaignId);

            let totalUSDValue = 0;
            const tokenBalances = [];

            for (let i = 0; i < tokenAddresses.length; i++) {
                const tokenAddress = tokenAddresses[i];
                const balance = balances[i];
                if (!balance || balance === BigInt(0)) continue;

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
                                // Try to find a matching token config by symbol
                                const match = Object.values(TOKENS).find((t) => t.symbol === onchainSymbol);
                                if (match) {
                                    tokenConfig = { ...match, address: tokenAddress };
                                } else {
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

                const usdValue = convertToUSD(balance, tokenConfig.address ?? tokenAddress);

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
            }

            // Calculate progress
            const goalUSD = parseFloat(ethers.formatUnits(goalAmount, 6)); // USDC has 6 decimals
            const progress = goalUSD > 0 ? (totalUSDValue / goalUSD) * 100 : 0;

            return {
                totalUSDValue,
                tokenBalances,
                progress: Math.min(progress, 100),
                goalUSD,
                raisedUSD: totalUSDValue
            };
        } catch (error) {
            console.error('Error calculating portfolio:', error);
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