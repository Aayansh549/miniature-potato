/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = [...config.externals, '@napi-rs/canvas'];
    }
    return config;
  },
}

export default nextConfig