/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    externalDir: true,
  },
  transpilePackages: ["@rivor/config", "@rivor/crypto", "@rivor/db"],
};
export default nextConfig;
