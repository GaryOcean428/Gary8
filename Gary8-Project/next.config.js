/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    webpack: (config) => {
        config.externals = [...config.externals, { canvas: 'canvas' }]; // Required for fabric.js
        return config;
    },
};

module.exports = nextConfig;
