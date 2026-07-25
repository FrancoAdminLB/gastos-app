const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

let ratesCache: { timestamp: number; rates: Record<string, number> } | null = null;

export async function getExchangeRates(base: string = "USD"): Promise<Record<string, number>> {
  if (ratesCache && Date.now() - ratesCache.timestamp < CACHE_DURATION) {
    return ratesCache.rates;
  }

  const apiKey = process.env.EXCHANGE_RATE_API_KEY;

  try {
    let rates: Record<string, number>;

    if (apiKey) {
      const res = await fetch(
        `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${base}`,
        { next: { revalidate: 3600 } }
      );
      const data = await res.json();
      rates = data.conversion_rates || {};
    } else {
      // Fallback: free API without key
      const res = await fetch(
        `https://open.er-api.com/v6/latest/${base}`,
        { next: { revalidate: 3600 } }
      );
      const data = await res.json();
      rates = data.rates || {};
    }

    ratesCache = { timestamp: Date.now(), rates };
    return rates;
  } catch (error) {
    console.error("Failed to fetch exchange rates:", error);
    return {};
  }
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<{ converted: number; rate: number }> {
  if (from === to) return { converted: amount, rate: 1 };

  const rates = await getExchangeRates(from);
  const rate = rates[to];

  if (!rate) {
    return { converted: amount, rate: 1 };
  }

  return {
    converted: Math.round(amount * rate * 100) / 100,
    rate,
  };
}
