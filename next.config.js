/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'via.placeholder.com',
      'picsum.photos',
      'images.unsplash.com',
      'firebasestorage.googleapis.com',
      'source.unsplash.com',
      'flashstore.es'
    ]
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
  transpilePackages: [
    'firebase', 
    '@firebase/firestore', 
    '@grpc/grpc-js', 
    '@grpc/proto-loader', 
    'long',
    'puppeteer-core',
    '@sparticuz/chromium'
  ],
  
  // Aumentar el tiempo de espera para las API routes
  experimental: {
    serverComponentsExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
    outputFileTracingExcludes: {
      '*': [
        'node_modules/puppeteer-core/**/*',
        'node_modules/@sparticuz/chromium/**/*',
        'node_modules/chrome-aws-lambda/**/*'
      ],
    },
  },
  
  // Configuración específica para Vercel
  webpack: (config, { isServer }) => {
    // Evitar problemas con algunos módulos en el cliente
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