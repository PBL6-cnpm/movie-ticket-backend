export const convertVNDToUSD = (amountVND: number): number => {
  const exchangeRate = 25000; // 1 USD = 25,000 VND
  return Math.round((amountVND / exchangeRate) * 100);
};
