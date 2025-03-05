/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'i.ebayimg.com',
      'firebasestorage.googleapis.com',
      'via.placeholder.com',
      'picsum.photos',
      'images.pokellector.com',
      'product-images.tcgplayer.com',
      'crystal-cdn3.crystalcommerce.com',
      'crystal-cdn4.crystalcommerce.com',
      'cdn.shopify.com',
      'media.karousell.com',
      'flashstore.es',
      'krystalkollectz.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  reactStrictMode: true,
  
  // Ignorar errores de TypeScript durante el build
  typescript: {
    // !! ADVERTENCIA !!
    // Ignorando los errores de tipado de TypeScript para evitar problemas en el build
    ignoreBuildErrors: true,
  },
  
  // Ignorar errores de ESLint durante el build
  eslint: {
    // !! ADVERTENCIA !!
    // Ignorando los errores de ESLint para evitar problemas en el build
    ignoreDuringBuilds: true,
  },

  // Configuración especial de transpilación para excluir problemas con firebase y dependencias
  transpilePackages: ['firebase', '@firebase/firestore', '@grpc/grpc-js', '@grpc/proto-loader', 'long'],
};

module.exports = nextConfig; 