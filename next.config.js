const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config) => {
    config.externals = [...config.externals, { canvas: 'canvas' }];
    return config;
  },
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  staticPageGenerationTimeout: 120,
};

module.exports = nextConfig;
