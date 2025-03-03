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
  transpilePackages: ['@firebase/firestore', '@firebase/app', '@firebase/auth', '@firebase/storage', '@firebase/functions'],
  
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
      };
      
      // Excluir completamente los módulos gRPC problemáticos
      config.externals = [
        ...(config.externals || []),
        { '@grpc/grpc-js': 'commonjs @grpc/grpc-js' }
      ];
      
      // Agregar alias para los módulos problemáticos
      config.resolve.alias = {
        ...config.resolve.alias,
        './call-stream': './grpc-mock.js',
        './call-credentials-filter': './grpc-mock.js',
        '@grpc/grpc-js/build/src/call-stream': require.resolve('./src/lib/grpc-mock.js'),
        '@grpc/grpc-js/build/src/call-credentials-filter': require.resolve('./src/lib/grpc-mock.js')
      };
    }
    
    return config;
  },
};

module.exports = nextConfig; 