import type { NextConfig } from 'next';

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
      "frame-src 'self' https://vidsrc.me https://*.vidsrc.me https://multiembed.mov https://*.multiembed.mov https://vidlink.pro https://*.vidlink.pro https://vidsrc.pm https://*.vidsrc.pm https://vidsrc.pro https://*.vidsrc.pro https://cinesrc.st https://*.cinesrc.st https://player.vidzee.wtf https://*.vidzee.wtf https://vidzee.wtf https://*.vidzee.wtf https://embed.smashystream.com https://*.smashystream.com https://autoembed.co https://*.autoembed.co https://www.2embed.cc https://*.2embed.cc https://vidbinge.dev https://*.vidbinge.dev https://embedmaster.link https://*.embedmaster.link https://vidstuck.xyz https://*.vidstuck.xyz https://player.videasy.net https://*.videasy.net https://vidfast.pro https://*.vidfast.pro https://vixsrc.to https://*.vixsrc.to",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "connect-src 'self' https:",
      "media-src 'self' blob: https:",
    ].join('; '),
  },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/((?!api/stream-proxy).*)',
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'image.tmdb.org',
      },
    ],
  },
  allowedDevOrigins: ['192.168.0.107'],
};

export default nextConfig;
