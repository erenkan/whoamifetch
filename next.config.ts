import type { NextConfig } from "next";

// Fully static site: no server runtime, deployable to Cloudflare Pages (`out/`).
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
