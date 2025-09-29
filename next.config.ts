import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: __dirname,
  },
  // Increase API timeout for long-running citation reports
  experimental: {
    serverComponentsExternalPackages: ['mysql2'],
  },
  // Set default timeout for API routes
  serverRuntimeConfig: {
    // apiTimeout: 300000, // 5 minutes in milliseconds
    apiTimeout: 1800000, // 30 minutes in milliseconds
  },
  // Configure API routes timeout
  async headers() {
    return [
      {
        source: '/api/citation-reports/:path*',
        headers: [
          {
            key: 'Keep-Alive',
            value: 'timeout=300, max=1000'
          }
        ]
      }
    ]
  }
};

export default nextConfig;
