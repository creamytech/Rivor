/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@rivor/config", "@rivor/crypto", "@rivor/db"],
};
export default nextConfig;
