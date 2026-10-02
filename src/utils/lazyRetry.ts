import React from "react";

/**
 * Enhanced React.lazy wrapper with auto-retry and chunk stale handling.
 * Automatically recovers from network glitches or new deployments on Vercel.
 */
export function lazyRetry<T extends React.ComponentType<any>>(
  componentImport: () => Promise<{ default: T } | any>,
  retries = 3,
  intervalMs = 800
): React.LazyExoticComponent<T> {
  return React.lazy(async () => {
    for (let i = 0; i < retries; i++) {
      try {
        const module = await componentImport();
        return module && module.default ? module : { default: module };
      } catch (error: any) {
        const msg = String(error?.message || error);
        const isChunkError = 
          msg.includes("Failed to fetch dynamically imported module") || 
          msg.includes("Importing a module script failed") ||
          msg.includes("ERR_NAME_NOT_RESOLVED") ||
          msg.includes("ERR_CONNECTION_TIMED_OUT");

        if (i < retries - 1) {
          await new Promise(r => setTimeout(r, intervalMs));
        } else if (isChunkError) {
          // If chunk is missing due to a new Vercel deployment, reload once
          const key = `chunk_retry_${window.location.pathname}`;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, "1");
            window.location.reload();
          }
          throw error;
        } else {
          throw error;
        }
      }
    }
    return { default: (() => null) as unknown as T };
  });
}
