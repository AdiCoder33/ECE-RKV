const toUTCDate = (d: string | number | Date) =>
  typeof d === 'string' && !/[zZ]|[+-]\d{2}:\d{2}$/.test(d)
    ? new Date(`${d}Z`) // assume server sent UTC
    : new Date(d);

export const formatIST = (
  date: string | number | Date,
  options?: Intl.DateTimeFormatOptions
) =>
  toUTCDate(date).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    ...options,
  });
