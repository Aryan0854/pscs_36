/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    domains: ['localhost', 'gzfblduetdukuxaholhf.supabase.co'],
  },
  serverExternalPackages: ['@supabase/supabase-js'],
  allowedDevOrigins: [
    'work-1-nbmsjrpngvntyznq.prod-runtime.all-hands.dev',
    'work-2-nbmsjrpngvntyznq.prod-runtime.all-hands.dev',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups',
          },
        ],
      },
      {
        source: '/api/media/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/media/:type/:id',
        destination: '/api/media/[type]/[id]',
      },
    ]
  },
  webpack: (config, { dev, isServer }) => {
    // Optimize for local development
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }

    // Handle Three.js and WebGL dependencies
    config.externals = config.externals || []
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      }
    }

    // Exclude pdf-parse test files that cause build issues
    config.module.rules.push({
      test: /pdf-parse\/test\/data\/.*\.pdf$/,
      use: 'null-loader',
    })

    return config
  },
}

export default nextConfig
