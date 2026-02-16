import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    domains: ["lh3.googleusercontent.com"], 
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
      
      // Ignore core-js modules that are causing issues
      config.resolve.alias = {
        ...config.resolve.alias,
        'core-js/modules/es.array.from.js': false,
        'core-js/modules/es.array.includes.js': false,
        'core-js/modules/es.array.index-of.js': false,
        'core-js/modules/es.array.some.js': false,
        'core-js/modules/es.string.replace.js': false,
        'core-js/modules/es.object.assign.js': false,
      };
    }
    
    // Handle canvg specifically
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        'canvg': 'canvg'
      });
    }
    
    return config;
  },
};

export default nextConfig;
