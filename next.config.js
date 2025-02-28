/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    domains: [
      'via.placeholder.com',
      'picsum.photos',
      'images.unsplash.com',
      'firebasestorage.googleapis.com',
      'source.unsplash.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ]
  },
  // Ensure we properly handle React 19
  reactStrictMode: true,
  eslint: {
    // Deshabilitamos la validación de ESLint durante la compilación de producción
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Deshabilitamos temporalmente la comprobación de TypeScript durante la compilación para Vercel
    ignoreBuildErrors: true,
  },
  output: 'standalone',
};

module.exports = nextConfig; 