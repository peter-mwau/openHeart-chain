import { useState, useEffect } from 'react';

const COINGECKO_API = import.meta.env.VITE_COINGECKO_API_URL;

export function useTokenPrices(tokenIds) {
    const [prices, setPrices] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchPrices = async () => {
            try {
                setLoading(true);
                setError(null);

                const ids = tokenIds.join(',');
                const response = await fetch(
                    `${COINGECKO_API}?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_last_updated_at=true`
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch prices');
                }

                const data = await response.json();
                setPrices(data);
            } catch (err) {
                console.error('Error fetching token prices:', err);
                setError('Failed to fetch current prices');

                // Fallback to mock prices
                setPrices({
                    'usd-coin': { usd: 1, usd_24h_change: 0, last_updated_at: Date.now() / 1000 },
                    'weth': { usd: 3213, usd_24h_change: 2.5, last_updated_at: Date.now() / 1000 },
                    'wrapped-bitcoin': { usd: 110464, usd_24h_change: 1.2, last_updated_at: Date.now() / 1000 },
                });
            } finally {
                setLoading(false);
            }
        };

        fetchPrices();

        // Refresh every 30 seconds
        const interval = setInterval(fetchPrices, 30000);
        return () => clearInterval(interval);
    }, [tokenIds]);

    return { prices, loading, error };
}