export default {
  transpilePackages: ['@painter-os-bts/public-content', '@painter-os-bts/backend', '@painter-os-bts/ui', '@painter-os-bts/domain'],
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'no-referrer' },
      { key: 'X-Frame-Options', value: 'DENY' },
    ] }];
  },
};
