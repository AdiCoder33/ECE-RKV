export async function getProfileImageSrc(profileImage?: string): Promise<string | undefined> {
  if (!profileImage) return undefined;
  if (/^https?:\/\//.test(profileImage)) return profileImage;

  if (import.meta.env.VITE_B2_PRIVATE === 'true') {
    const api = import.meta.env.VITE_API_URL;
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (api && token) {
      try {
        const res = await fetch(`${api}/uploads/profile/${encodeURIComponent(profileImage)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          return data.url as string;
        }
      } catch {
        // ignore fetch errors and fall through
      }
    }
    return undefined;
  }

  const endpoint = import.meta.env.VITE_B2_PUBLIC_ENDPOINT;
  if (endpoint) {
    return `${endpoint}/${profileImage}`;
  }

  return profileImage;
}
