import { getProfileImageSrc } from './profileImage';

const CACHE_KEY = 'profileImageCache';

export async function cacheProfileImage(imageKeyOrUrl: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const url = await getProfileImageSrc(imageKeyOrUrl);
  if (!url) return;

  try {
    const res = await fetch(url);
    if (!res.ok) return;

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = `data:${contentType};base64,${btoa(binary)}`;
    localStorage.setItem(CACHE_KEY, base64);
  } catch {
    // ignore errors
  }
}

export function clearProfileImageCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(CACHE_KEY);
  }
}

