import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  transpilePackages: ['@shadergradient/react', 'three', '@react-three/fiber'],
};

export default nextConfig;
