// Tasas de cambio fijas para la conversión a EUR
// En una aplicación real, estas tasas se obtendrían de una API externa
const exchangeRates = {
  EUR: 1,      // Euro (base)
  USD: 0.96,   // Dólar estadounidense a Euro (1 USD = 0.96 EUR) - Actualizado 28/02/2024
  JPY: 0.0064, // Yen japonés a Euro (1 JPY = 0.0064 EUR) - Actualizado 01/03/2024
  GBP: 1.21,   // Libra esterlina a Euro (1 GBP = 1.21 EUR) - Actualizado 01/03/2024
  CNY: 0.13,   // Yuan chino a Euro (1 CNY = 0.13 EUR) - Actualizado 01/03/2024
  KRW: 0.00066 // Won coreano a Euro (1 KRW = 0.00066 EUR) - Actualizado 28/02/2024
};

export type Currency = 'EUR' | 'USD' | 'JPY' | 'GBP' | 'CNY' | 'KRW';

/**
 * Convierte un valor de una moneda a otra
 */
export function convertCurrency(
  amount: number, 
  fromCurrency: Currency, 
  toCurrency: Currency = 'EUR'
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Primero convertimos a EUR (nuestra moneda base)
  const amountInEUR = amount * exchangeRates[fromCurrency];
  
  // Si la moneda objetivo es EUR, ya tenemos el resultado
  if (toCurrency === 'EUR') {
    return amountInEUR;
  }
  
  // Si no, convertimos de EUR a la moneda objetivo
  return amountInEUR / exchangeRates[toCurrency];
}

/**
 * Formatea un valor monetario según la moneda especificada
 */
export function formatCurrency(amount: number, currency: Currency): string {
  const formatter = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: ['JPY', 'KRW'].includes(currency) ? 0 : 2,
    maximumFractionDigits: ['JPY', 'KRW'].includes(currency) ? 0 : 2,
  });
  
  return formatter.format(amount);
}

/**
 * Convierte y formatea un valor de una moneda a otra
 */
export function convertAndFormatCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency = 'EUR'
): string {
  const convertedAmount = convertCurrency(amount, fromCurrency, toCurrency);
  return formatCurrency(convertedAmount, toCurrency);
} 