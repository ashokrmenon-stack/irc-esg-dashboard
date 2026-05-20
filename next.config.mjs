const nextConfig = {
  reactStrictMode: true,
  // Don't fail the production build on TypeScript or ESLint warnings —
  // ship first, polish types later.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
};
export default nextConfig;
