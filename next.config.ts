import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.r2.dev',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.kie.ai',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'filles.siifre.com',
        port: '',
        pathname: '/**'
      },
    ],
    unoptimized:true
  },
  // api: {
  //   bodyParser: {
  //     sizeLimit: '10mb',
  //   },
  // },
};

export default nextConfig;
