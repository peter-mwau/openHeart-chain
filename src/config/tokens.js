export const TOKENS = {
    USDC: {
        name: "USD Coin",
        symbol: "USDC",
        decimals: 6,
        address: import.meta.env.VITE_USDC_CONTRACT_ADDRESS,
        coingeckoId: "usd-coin",
    },
    WETH: {
        name: "Wrapped Ether",
        symbol: "WETH",
        decimals: 18,
        address: import.meta.env.VITE_WETH_CONTRACT_ADDRESS,
        coingeckoId: "weth",
    },
    WBTC: {
        name: "Wrapped Bitcoin",
        symbol: "WBTC",
        decimals: 8,
        address: import.meta.env.VITE_WBTC_CONTRACT_ADDRESS,
        coingeckoId: "wrapped-bitcoin",
    },
};

// convenient helpers
export const TOKENS_ARRAY = Object.values(TOKENS);
export const TOKEN_ADDRESSES = Object.fromEntries(
    Object.entries(TOKENS).map(([k, v]) => [k, v.address])
);

export const TOKEN_BY_ADDRESS = Object.values(TOKENS)
    .filter((t) => !!t.address)
    .reduce((acc, t) => {
        acc[t.address.toLowerCase()] = t;
        return acc;
    }, {});