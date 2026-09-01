import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Bible/search routes read src/data/amharic.db + crossrefs.json via fs/
  // node:sqlite rather than `import`, so Next's per-route output tracing
  // won't pick them up automatically — list them explicitly.
  outputFileTracingIncludes: {
    "/api/chapter": ["./src/data/amharic.db", "./src/data/crossrefs.json"],
    "/api/verse-text": ["./src/data/amharic.db"],
    "/api/search": ["./src/data/amharic.db"],
  },
};

export default nextConfig;
