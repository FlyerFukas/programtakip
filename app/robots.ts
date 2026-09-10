import type { MetadataRoute } from 'next'

/** Kişisel not defteri — hiçbir arama motoru taramasın. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', disallow: '/' } }
}
