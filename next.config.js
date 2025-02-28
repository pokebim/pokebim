/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  images: {
    domains: [
      'm.media-amazon.com', // Para imágenes de Amazon
      'images.unsplash.com', // Para imágenes de Unsplash
      'via.placeholder.com', // Para imágenes placeholder
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazon.com',
        pathname: '/images/**',
      },
    ],
  },
  // Ensure we properly handle React 19
  reactStrictMode: true,
  eslint: {
    // Deshabilitamos la validación de ESLint durante la compilación de producción
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 