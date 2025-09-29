/** @type {import('next').NextConfig} */
const nextConfig = {
  // Increase API timeout for long-running citation reports
  experimental: {
    serverComponentsExternalPackages: ['mysql2'],
  },
  // Configure API routes timeout
  async headers() {
    return [
      {
        source: '/api/citation-reports/:path*',
        headers: [
          {
            key: 'Keep-Alive',
            value: 'timeout=3000000000, max=1000'
          }
        ]
      }
    ]
  }
};

export default nextConfig;
