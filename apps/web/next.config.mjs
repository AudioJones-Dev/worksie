/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@worksie/auth", "@worksie/domain", "@worksie/types"]
};

export default nextConfig;
