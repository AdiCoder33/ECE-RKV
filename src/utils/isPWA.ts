export function isPWAStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ((window.navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}