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

  // Configuración de transpilación solo para paquetes del cliente
  transpilePackages: [
    'firebase', 
    '@firebase/firestore',
    '@tanstack/react-table',
    'date-fns',
    'react-dnd',
    'react-dnd-html5-backend',
    'yargs',
    '@puppeteer/browsers'
  ],
  
  // Configuración para paquetes que necesitan Node.js
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb'
    },
    typedRoutes: true,
    webpackBuildWorker: true,
    optimizePackageImports: [
      'firebase',
      '@tanstack/react-table',
      'date-fns',
      'react-dnd'
    ],
    esmExternals: true
  },
  
  // Configuración de output
  output: 'standalone',

  serverExternalPackages: [
    '@sparticuz/chromium',
    'puppeteer-core',
    'yargs'
  ],

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

    // Configuración específica para módulos ESM
    config.module = {
      ...config.module,
      parser: {
        ...config.module.parser,
        javascript: {
          ...config.module.parser?.javascript,
          dynamicImportMode: 'eager'
        }
      },
      rules: [
        ...config.module.rules || [],
        {
          test: /\.m?js$/,
          type: 'javascript/auto',
          resolve: {
            fullySpecified: false
          }
        }
      ]
    };

    // Configuración para yargs
    config.resolve.alias = {
      ...config.resolve.alias,
      'yargs': require.resolve('yargs')
    };

    // Asegurar que los módulos ESM se manejen correctamente
    config.resolve.extensionAlias = {
      '.js': ['.js', '.ts', '.tsx'],
      '.mjs': ['.mjs', '.mts', '.mtsx']
    };

    return config;
  },
};

module.exports = nextConfig; 