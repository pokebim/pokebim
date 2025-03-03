/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      }
    ],
  },
  
  // Ignorar errores de TypeScript durante el build
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Ignorar errores de ESLint durante el build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Transpilar los paquetes problemáticos
  transpilePackages: ['@firebase/firestore', '@firebase/app', '@firebase/auth', '@firebase/storage', '@firebase/functions', '@grpc/grpc-js'],
  
  // Configuración de webpack para manejar módulos de Node
  webpack: (config, { isServer }) => {
    // Si estamos en el cliente (browser), proporcionar mocks para módulos de Node.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        stream: false,
        util: false,
        child_process: false,
        net: false,
        tls: false,
        dns: false,
        'call-stream': false,
        'call-credentials-filter': false
      };
    }
    
    return config;
  },
};

module.exports = nextConfig; 