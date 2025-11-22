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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Security Headers
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.hcaptcha.com;
              style-src 'self' 'unsafe-inline' https://hcaptcha.com https://*.hcaptcha.com;
              img-src 'self' data: https: https://hcaptcha.com https://*.hcaptcha.com;
              font-src 'self' https://r2cdn.perplexity.ai;
              connect-src 'self' https://gzfblduetdukuxaholhf.supabase.co;
              media-src 'self';
              object-src 'none';
              child-src 'self';
              frame-src https://hcaptcha.com https://*.hcaptcha.com;
              frame-ancestors 'none';
              base-uri 'self';
              form-action 'self';
            `.replace(/\s{2,}/g, ' ').trim()
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
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