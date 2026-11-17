import type { NextConfig } from "next";

/**
 * GitHub Pages project sites are served from /<repo-name>.
 * The deploy workflow sets NEXT_PUBLIC_BASE_PATH to that prefix.
 * Leave it empty for local development or a custom domain / user site.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH?.replace(/\/$/, "") ?? "";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath: basePath || undefined,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
