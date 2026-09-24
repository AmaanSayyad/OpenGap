import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "prestocks.com" },
      { protocol: "https", hostname: "www.prestocks.com" },
    ],
  },
  transpilePackages: [
    "@solana/wallet-adapter-react",
    "@solana/wallet-adapter-react-ui",
    "@solana/wallet-adapter-base",
    "@meteora-ag/dynamic-bonding-curve-sdk",
  ],
};

export default nextConfig;
