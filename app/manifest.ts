import type { MetadataRoute } from 'next'

/**
 * PWA manifest'i — telefonda "Ana ekrana ekle" dendiğinde uygulamanın
 * adını, ikonunu ve nasıl açılacağını belirler.
 *
 * `display: 'standalone'` tarayıcı çubuğunu gizler; uygulama tam ekran
 * açılır ve alt gezinti çubuğu gerçek bir uygulamadaki gibi davranır.
 *
 * Renk Burs Takip ile aynı (ikisi de `--vurgu` mavisini kullanıyor); ana
 * ekranda ikisini ayıran şey ikonun kendisi — orada kep, burada konum
 * iğnesi. Ayrıntısı public/logo.svg başındaki notta.
 *
 * Not: manifest arama motorlarına açılan bir kapı değil — sayfalar zaten
 * `noindex` (app/robots.ts + layout metadata + next.config başlığı).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bölüm Takip',
    short_name: 'Bölüm Takip',
    description: 'Yüksek lisans programları: ülke, üniversite, bölüm — son tarih, maliyet, uygunluk.',
    lang: 'tr',
    dir: 'ltr',

    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',

    // Açılış ekranının ve sistem çubuklarının rengi.
    background_color: '#0f1216',
    theme_color: '#2843b3',

    categories: ['education', 'productivity'],

    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Android adaptive icon: sistem daire/damla şeklinde kırpar.
      { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],

    // Uzun basınca çıkan kısayollar — en sık girilen iki ekran.
    shortcuts: [
      {
        name: 'Program ekle',
        short_name: 'Ekle',
        description: 'Metin yapıştırıp yeni program kaydet',
        url: '/ekle',
      },
      {
        name: 'Belge takvimi',
        short_name: 'Belgeler',
        description: 'Hangi belgeye ne zaman başlamalıyım',
        url: '/belgeler',
      },
    ],
  }
}
