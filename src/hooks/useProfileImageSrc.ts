import { useEffect, useState } from 'react';
import { getProfileImageSrc } from '@/lib/profileImage';

export function useProfileImageSrc(profileImage?: string) {
  const [src, setSrc] = useState<string | undefined>();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const url = await getProfileImageSrc(profileImage);
      if (!cancelled) {
        setSrc(url);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileImage]);

  return src;
}
