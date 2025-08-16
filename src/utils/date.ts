export const formatIST = (
  date: string | number | Date,
  options?: Intl.DateTimeFormatOptions,
) =>
  new Date(date).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', ...options });
