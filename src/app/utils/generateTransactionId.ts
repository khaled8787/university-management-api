export const generateTransactionId = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();

  const randomValue = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();

  return `PAY-${timestamp}-${randomValue}`;
};