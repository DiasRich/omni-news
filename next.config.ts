import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  // Allow nodemailer and jsonwebtoken to run in Node.js runtime (not edge)
  serverExternalPackages: ["nodemailer", "jsonwebtoken"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
