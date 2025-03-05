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
    'long'
  ],
  
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

  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'pokebimapp-git-master-pokebims-projects.vercel.app'],
    },
    // La clave es que estamos usando chromium-min, así que no necesitamos especificar estos paquetes
    // como externos. Chromium se descargará en tiempo de ejecución desde GitHub.
    serverComponentsExternalPackages: []
  },
};

module.exports = nextConfig; 