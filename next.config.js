const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only enable these for production builds
  ...(process.env.NODE_ENV === 'production' ? {
    output: 'export',
    images: {
      unoptimized: true
    }
  } : {}),
  reactStrictMode: true,
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: 'canvas' }];
    // Add transpilation of node_modules for certain packages
    config.module.rules.push({
      test: /\.(js|mjs|jsx|ts|tsx)$/,
      include: [
        /node_modules\/(lucide-react|@nextui-org|fabric)/
      ],
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['next/babel'],
        },
      },
    });
    return config;
  }
};

module.exports = nextConfig;
