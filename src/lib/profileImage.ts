export function getProfileImageSrc(profileImage?: string): string | undefined {
  if (!profileImage) return undefined;
  if (profileImage.startsWith('http')) return profileImage;

  if (import.meta.env.VITE_B2_PRIVATE === 'true') {
    const api = import.meta.env.VITE_API_URL;
    if (api) {
      return `${api}/files/${encodeURIComponent(profileImage)}`;
    }
    return undefined;
  }

  const endpoint = import.meta.env.VITE_B2_PUBLIC_ENDPOINT;
  if (endpoint) {
    return `${endpoint}/${profileImage}`;
  }

  return profileImage;
}
