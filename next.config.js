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

  // Excluir gRPC y otros módulos problemáticos
  webpack: (config, { isServer }) => {
    // Añadir alias para módulos problemáticos
    config.resolve.alias['@grpc/grpc-js'] = isServer 
      ? '@grpc/grpc-js'
      : './src/lib/grpc-mock.js';
      
    // Excluir todos los módulos de node_modules en el cliente
    if (!isServer) {
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
        dgram: false,
        dns: false,
        tty: false,
        module: false,
        '@grpc/grpc-js': false
      };
    }

    return config;
  },
  
  // Para evitar errores con firebase-admin en el cliente
  transpilePackages: ['firebase-admin']
};

module.exports = nextConfig; 