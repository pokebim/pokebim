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

  // Configuración de transpilación
  transpilePackages: [
    'firebase', 
    '@firebase/firestore',
    '@grpc/grpc-js',
    '@grpc/proto-loader',
    'long'
  ],
  
  // Optimizaciones para Vercel
  experimental: {
    serverComponentsExternalPackages: ['puppeteer', '@grpc/grpc-js', '@grpc/proto-loader'],
    esmExternals: 'loose'
  },
  
  // Configuración de output
  output: 'standalone',

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig; 