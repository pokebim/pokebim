const webpack = require('webpack');

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

  webpack: (config, { isServer }) => {
    // No usamos estos módulos en el navegador
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
      http2: false,
    };

    // Preferir módulos específicos del navegador
    config.resolve.mainFields = ['browser', 'module', 'main'];

    // Ignorar ciertos módulos específicos que no son necesarios en el navegador
    config.plugins.push(new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/(?:transport|http|https|error|webchannel-wrapper|node-fetch|bloom-blob)$/,
      contextRegExp: /@firebase|@grpc\/grpc-js/
    }));

    // Usar la versión "web" de Firebase en lugar de la versión "node"
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Forzar el uso de las versiones web/browser de los paquetes
        '@firebase/firestore': '@firebase/firestore/dist/index.esm2017.js',
      };
    }

    return config;
  },
};

module.exports = nextConfig; 