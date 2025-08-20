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
  },
  serverExternalPackages: [
    'puppeteer',
    '@google-cloud/kms', 
    'bullmq',
    'canvas',
    'jsdom'
  ],
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
    
    // Fix client-side globals being used on server
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
    };
    
    // Server-side compatibility handled by polyfills in layout.tsx
    
    // Optimize externals for server-side only heavy packages
    config.externals = Array.isArray(config.externals) ? config.externals : [];
    if (isServer) {
      config.externals.push(
        '@google-cloud/kms',
        'puppeteer',
        'bullmq',
        'canvas',
        'jsdom'
      );
    } else {
      // Client-side externals for browser compatibility
      config.externals.push({
        'puppeteer': 'puppeteer',
        'canvas': 'canvas',
        'jsdom': 'jsdom',
      });
    }
    
    // Optimize chunks - simplified to avoid issues
    if (!dev && !isServer) {
      config.optimization = config.optimization || {};
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        maxAsyncRequests: 25,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 20,
          },
          ui: {
            test: /[\\/]node_modules[\\/](@radix-ui|lucide-react|framer-motion)[\\/]/,
            name: 'ui',
            chunks: 'all',
            priority: 30,
          },
        },
      };
    }
    
    return config;
  },
};
export default nextConfig;
