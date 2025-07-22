import { useEffect } from "react";

export function useOnRefresh(callback: () => void) {
  useEffect(() => {
    const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    const navType = navEntries[0]?.type;

    // Modern check (PerformanceNavigationTiming)
    if (navType === "reload") {
      callback();
      return;
    }

    // Legacy fallback for older browsers
    const legacyNav = (performance as unknown as { navigation?: { type?: number } }).navigation;
    if (legacyNav?.type === 1) {
      callback();
    }
  }, [callback]);
}

export function isPageRefresh(): boolean {
  const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  const navType = navEntries[0]?.type;
  return navType === "reload";
}
