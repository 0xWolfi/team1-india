import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.lu.ma',
      },
      {
        protocol: 'https',
        hostname: 'images.lu.ma',
      },
    ],
  },
};

export default nextConfig;
