/**
 * İkonları üretir: SVG kaynaklardan public/ altına PNG'ler.
 *
 *   npm run simge
 *
 * İKİ AYRI KAYNAK var, sebebi boyut:
 *
 *   public/logo.svg  → tam logo (kep + onay rozeti + püskül).
 *                      Telefon ana ekranı ve uygulama içi için. 180 piksel
 *                      ve üstünde bütün detay okunuyor.
 *
 *   app/icon.svg     → sadeleştirilmiş logo (yalnızca kep).
 *                      Tarayıcı sekmesi için. Tam logo 16 pikselde
 *                      dağılıyor: onay rozeti yeşil bir lekeye, püskül tek
 *                      piksele iniyor. Sekmede tanınırlık tek bir güçlü
 *                      siluetten gelir.
 *
 * Logolardan birini değiştirdiğinde bunu yeniden çalıştır.
 * `sharp` Next.js'in kendi bağımlılığı, ek paket gerekmiyor.
 */

import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const KOK = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const HEDEF = resolve(KOK, 'public')

const ISLER = [
  // Telefon ana ekranı — tam logo.
  { kaynak: 'public/logo.svg', ad: 'icon-192.png', boyut: 192 },
  { kaynak: 'public/logo.svg', ad: 'icon-512.png', boyut: 512 },
  { kaynak: 'public/logo.svg', ad: 'apple-touch-icon.png', boyut: 180 },
  // Android adaptive icon: sistem daire/damla şeklinde kırpar.
  { kaynak: 'public/logo.svg', ad: 'icon-maskable-512.png', boyut: 512 },

  // Tarayıcı sekmesi — sade logo. SVG faviconu desteklemeyen ya da
  // PNG'yi tercih eden bağlamlar (yer imi, geçmiş listesi) için.
  { kaynak: 'app/icon.svg', ad: 'favicon-32.png', boyut: 32 },
  { kaynak: 'app/icon.svg', ad: 'favicon-16.png', boyut: 16 },
]

mkdirSync(HEDEF, { recursive: true })
console.log('\nİkonlar üretiliyor…\n')

let sonKaynak = ''
for (const { kaynak, ad, boyut } of ISLER) {
  if (kaynak !== sonKaynak) {
    console.log(`  ${kaynak}`)
    sonKaynak = kaynak
  }

  const veri = await sharp(readFileSync(resolve(KOK, kaynak)), { density: 384 })
    .resize(boyut, boyut, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer()

  writeFileSync(resolve(HEDEF, ad), veri)
  console.log(`    ✓ ${ad.padEnd(24)} ${String(boyut).padStart(3)}×${boyut}  ${(veri.length / 1024).toFixed(1)} KB`)
}

console.log('\nTamam. Telefondaki ikon değişmediyse uygulamayı ana ekrandan silip')
console.log('yeniden ekle — işletim sistemi ikonu önbelleğe alıyor.\n')
