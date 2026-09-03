/**
 * For responses backed by static Bible text: no long-lived browser cache
 * (so a reseed isn't stuck client-side with no way to bust it), but the CDN
 * edge serves cached responses for a day and keeps serving stale content for
 * up to a week while it revalidates in the background. Vercel purges its
 * edge cache on every deployment, so a redeploy after reseeding invalidates
 * this immediately instead of waiting out the window.
 */
export const BIBLE_CACHE_CONTROL =
  "public, max-age=0, s-maxage=86400, stale-while-revalidate=604800";

/** Same window as `BIBLE_CACHE_CONTROL`'s `s-maxage`, for server-side caches (e.g. `unstable_cache`) backing the same static Bible text. */
export const BIBLE_CACHE_REVALIDATE_SECONDS = 86400;
