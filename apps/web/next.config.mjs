import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  experimental: {
    externalDir: true,
    optimizeCss: true,
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  outputFileTracingIncludes: {
    '/*': [
      './node_modules/.prisma/client/**',
      './node_modules/@prisma/client/**',
    ],
  },
  transpilePackages: ["@rivor/config", "@rivor/crypto", "@rivor/db"],
  webpack: (config, { dev, isServer }) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@rivor/config/env": path.join(__dirname, "../../packages/config/src/env.ts"),
      "@rivor/config": path.join(__dirname, "../../packages/config/src/index.ts"),
      "@rivor/db": path.join(__dirname, "../../packages/db/src/index.ts"),
    };
    
    // Optimize externals for server-side only heavy packages
    config.externals = Array.isArray(config.externals) ? config.externals : [];
    if (isServer) {
      config.externals.push(
        '@google-cloud/kms',
        'puppeteer',
        'bullmq'
      );
    }
    
    // Optimize chunks
    if (!dev) {
      config.optimization = config.optimization || {};
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react)[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 20,
          },
          api: {
            test: /[\\/]src[\\/]app[\\/]api[\\/]/,
            name: 'api',
            chunks: 'all',
            priority: 15,
          },
        },
      };
    }
    
    return config;
  },
};
export default nextConfig;
