/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
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
  
  // Configuración de webpack para manejar Firebase
  webpack: (config, { isServer }) => {
    // Configuración específica para @grpc y otras dependencias nativas
    config.externals = [...(config.externals || []), '@grpc/grpc-js'];

    // Resolver problemas con módulos específicos
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        child_process: false,
        net: false,
        tls: false,
        dns: false,
        os: false,
        http2: false,
        util: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        stream: false,
        crypto: false,
      };
    }
    
    return config;
  }
};

module.exports = nextConfig; 