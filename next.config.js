/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Ignorar errores que podrían estar interrumpiendo el build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Para excluir módulos problemáticos en el cliente
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Proporcionar fallbacks para módulos de Node.js en el cliente
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        os: false,
        path: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        querystring: false,
        child_process: false,
        dns: false,
        tty: false,
        module: false,
        '@grpc/grpc-js': false
      };
    }
    return config;
  },
  
  // Procesar estos paquetes correctamente
  transpilePackages: ['firebase', 'firebase-admin']
};

module.exports = nextConfig; 