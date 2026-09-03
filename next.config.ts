import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.31.250"],
};

export default nextConfig;
