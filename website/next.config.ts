import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  transpilePackages: ['@shadergradient/react', 'three', '@react-three/fiber'],
};

export default nextConfig;
