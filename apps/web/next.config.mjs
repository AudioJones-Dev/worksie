/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@worksie/domain", "@worksie/types"]
};

export default nextConfig;
