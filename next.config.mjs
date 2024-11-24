/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Static HTML Export
  images: {
    unoptimized: true, // Required for static export
  },
  // Ensure we don't use features incompatible with static export
  experimental: {
    appDir: false,
  },
  // Disable server components for static export
  reactStrictMode: true,
}

export default nextConfig; 