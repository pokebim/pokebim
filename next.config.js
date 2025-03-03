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
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      // Optionally, add other fallbacks if needed
    };

    // Prefer browser specific modules
    config.resolve.mainFields = ['browser', 'module', 'main'];

    // Ignore specific modules in @grpc/grpc-js that are not needed in browser environments
    config.plugins.push(new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/error$/,
      contextRegExp: /@grpc\/grpc-js/
    }));

    config.plugins.push(new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/transport$/,
      contextRegExp: /@grpc\/grpc-js/
    }));

    return config;
  },
};

module.exports = nextConfig; 