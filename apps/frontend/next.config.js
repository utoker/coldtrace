/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@coldtrace/types'],

  // Webpack configuration for better chunk handling
  webpack: (config, { isServer }) => {
    // Handle graphql-ws and WebSocket properly
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Optimize chunk splitting for Apollo Client
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          apollo: {
            test: /[\\/]node_modules[\\/](@apollo|graphql)[\\/]/,
            name: 'apollo',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    };

    return config;
  },

  // Experimental features for better SSR handling
  experimental: {
    optimizePackageImports: ['@apollo/client'],
  },
};

export default nextConfig;
