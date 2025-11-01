export const convertVNDToUSD = (amountVND: number): number => {
  const exchangeRate = 25000; // 1 USD = 25,000 VND
  return +(amountVND / exchangeRate).toFixed(2) * 100; // Return amount in cents
};
