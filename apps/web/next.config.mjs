import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  transpilePackages: ["@rivor/config", "@rivor/crypto", "@rivor/db"],
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      "@rivor/config/env": path.join(__dirname, "../../packages/config/src/env.ts"),
      "@rivor/config": path.join(__dirname, "../../packages/config/src/index.ts"),
    };
    return config;
  },
};
export default nextConfig;
