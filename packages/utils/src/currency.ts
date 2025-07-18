export const CURRENCY_CODES = ['EUR', 'PLN', 'UAH', 'USD', 'GBP', 'CZK'] as const;
export type CurrencyCode = typeof CURRENCY_CODES[number];

/**
 * Get exchange rate for seeding purposes from environment variables
 * @param from Source currency code
 * @param to Target currency code
 * @returns Exchange rate
 */
export function getSeedRate(from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return 1;
  
  // Check direct rate: SEED_RATE_EUR_PLN=4.35
  const key = `SEED_RATE_${from}_${to}`;
  const value = process.env[key];
  if (value) {
    const rate = Number(value);
    if (!isNaN(rate) && rate > 0) return rate;
  }
  
  // Check reverse rate: if EUR_PLN not found, try PLN_EUR and calculate 1/x
  const reverseKey = `SEED_RATE_${to}_${from}`;
  const reverseValue = process.env[reverseKey];
  if (reverseValue) {
    const reverseRate = Number(reverseValue);
    if (!isNaN(reverseRate) && reverseRate > 0) return 1 / reverseRate;
  }
  
  // Fallback to 1:1 rate
  return 1;
}

/**
 * Convert amount from one currency to another using seed rates
 * @param amount Amount to convert
 * @param from Source currency
 * @param to Target currency
 * @returns Converted amount rounded to 2 decimal places
 */
export function convertSeed(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  const rate = getSeedRate(from, to);
  return Math.round(amount * rate * 100) / 100;
}

/**
 * Determine base currency by country code
 * @param countryCode ISO country code (e.g., 'PL', 'UA', 'GB')
 * @returns Appropriate currency code
 */
export function getBaseCurrencyByCountry(countryCode?: string): CurrencyCode {
  if (!countryCode) return 'EUR';
  
  const countryMap: Record<string, CurrencyCode> = {
    'PL': 'PLN',
    'UA': 'UAH',
    'GB': 'GBP',
    'US': 'USD',
    'CZ': 'CZK',
  };
  
  return countryMap[countryCode.toUpperCase()] || 'EUR';
}
