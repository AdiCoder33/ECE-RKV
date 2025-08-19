export function getProfileImageSrc(key?: string) {
  if (!key) return undefined;
  if (/^https?:\/\//.test(key)) return key;
  const api = import.meta.env.VITE_API_URL;
  return api ? `${api}/uploads/profile/${encodeURIComponent(key)}` : key;
}
