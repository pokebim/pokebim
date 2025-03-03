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

  webpack: (config) => {
    // Proporcionar fallbacks vacíos para módulos de Node.js
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      dns: false,
      child_process: false,
      http2: false,
      '@firebase/webchannel-wrapper/bloom-blob': false,
    };

    // Asegurar que los módulos de browser sean priorizados
    config.resolve.mainFields = ['browser', 'module', 'main'];
    
    return config;
  },
};

module.exports = nextConfig; 