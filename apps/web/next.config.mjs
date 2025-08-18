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
  },
  outputFileTracingIncludes: {
    '/*': [
      './node_modules/.prisma/client/**',
      './node_modules/@prisma/client/**',
    ],
  },
  transpilePackages: ["@rivor/config", "@rivor/crypto", "@rivor/db"],
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@rivor/config/env": path.join(__dirname, "../../packages/config/src/env.ts"),
      "@rivor/config": path.join(__dirname, "../../packages/config/src/index.ts"),
      "@rivor/db": path.join(__dirname, "../../packages/db/src/index.ts"),
    };
    // Avoid bundling @google-cloud/kms in edge/client; mark as external in webpack
    config.externals = Array.isArray(config.externals) ? config.externals : [];
    config.externals.push({ '@google-cloud/kms': 'commonjs @google-cloud/kms' });
    return config;
  },
};
export default nextConfig;
