import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getProfileImageSrc } from '@/lib/profileImage';

export function useProfileImageSrc(profileImage?: string) {
  const { user } = useAuth();
  const [src, setSrc] = useState<string | undefined>(() => {
    if (profileImage && profileImage === user?.profileImage) {
      const cached = localStorage.getItem('profileImageCache');
      if (cached) {
        return cached;
      }
    }
    return undefined;
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (profileImage && profileImage === user?.profileImage) {
        const cached = localStorage.getItem('profileImageCache');
        if (cached) {
          setSrc(cached);
          return;
        }
      }
      const url = await getProfileImageSrc(profileImage);
      if (!cancelled) {
        setSrc(url);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [profileImage, user?.profileImage]);

  return src;
}
