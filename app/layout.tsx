import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Bölüm Takip',
  description: 'Yüksek lisans programları: ülke, üniversite, bölüm — son tarih, maliyet, uygunluk.',
  // Bu kişisel bir not defteri — arama motorlarında görünmesin.
  // İkinci savunma hattı next.config.mjs'teki X-Robots-Tag başlığı,
  // üçüncüsü app/robots.ts.
  robots: { index: false, follow: false, nocache: true },

  /*
   * DİKKAT: `icons` nesnesini tanımlamak, Next.js'in `app/icon.svg`
   * dosyasını kendiliğinden bağlamasını DEVRE DIŞI bırakıyor. BursTakip'te
   * önce yalnızca `apple` yazılmıştı ve sekmede hiç `rel="icon"` çıkmadı —
   * sekme ikonu boş göründü. Buraya bir şey eklerken sekme ikonunu da
   * açıkça yaz.
   *
   * Sıra önemli: SVG'yi destekleyen tarayıcı onu seçer (her ölçekte keskin),
   * desteklemeyen PNG'ye düşer.
   */
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },

  // iOS'ta ana ekrandan açılınca tam ekran davransın.
  appleWebApp: {
    capable: true,
    title: 'Bölüm Takip',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Tarayıcı çubuğu tema rengiyle uyumlu olsun.
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f7f9' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1216' },
  ],
}

/**
 * Tema tercihini İLK BOYAMADAN ÖNCE uygula.
 *
 * React hidrasyonu beklenirse sayfa bir an açık temada yanıp sonra koyuya
 * geçer. Bu küçük betik localStorage'daki tercihi <html> üzerine yazarak
 * o parlamayı engelliyor.
 *
 * Anahtar `pt-tema` — Burs Takip'in `bt-tema` anahtarından ayrı. İkisi de
 * localhost:3000'de çalışırken aynı depoyu paylaşıyor; aynı adı kullansalar
 * birinde yapılan tema değişikliği diğerine sızardı.
 */
const TEMA_BETIGI = `
(function () {
  try {
    var t = localStorage.getItem('pt-tema');
    if (t === 'acik' || t === 'koyu') document.documentElement.dataset.tema = t;
  } catch (e) {}
})();
`

export default function KokDuzen({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_BETIGI }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
