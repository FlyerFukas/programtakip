/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Arama motorlarına karşı ikinci savunma hattı: her yanıta noindex başlığı.
  // (Birincisi app/robots.ts, üçüncüsü layout'taki metadata.)
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
      },
    ]
  },
}

export default nextConfig
