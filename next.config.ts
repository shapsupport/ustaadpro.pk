import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.ustaadpro.pk",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
