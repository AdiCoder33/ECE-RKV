import * as React from 'react';

export function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    const handler = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(mediaQuery.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}
