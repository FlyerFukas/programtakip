'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cikisYap } from '@/app/eylemler'
import { TemaDugmesi } from './TemaDugmesi'

/**
 * Gezinti.
 *
 * Masaüstünde üst barda yatay bağlantılar. Telefonda bağlantılar alttaki
 * sabit çubuğa taşınıyor (başparmağın zaten orada olduğu yer), üst barda
 * yalnızca marka ve yardımcı düğmeler kalıyor.
 *
 * BursTakip'te beş ana bağlantı vardı. Burada veri üç katmanlı (ülke →
 * üniversite → program) ve her katmanın kendi ekranı var, o yüzden altı
 * oldu. Altı sütun 375 pikselde ancak kısaltılmış etiketlerle sığıyor —
 * `kisa` alanı bunun için. Tam adlar masaüstünde duruyor.
 *
 * Ayarlar alt çubuğa girmiyor: nadiren açılıyor, telefonda üst bardaki
 * dişli düğmesi yeterli.
 *
 * Karşılaştırma ekranı İPTAL EDİLDİ (PROJE.md Aşama 8). Program listesi
 * zaten hepsini EUR'ya çevirip süzüyor ve sıralıyor; iki kaydı yan yana
 * koymak ayrı bir ekranın bakım yükünü hak etmiyordu.
 */

type Baglanti = { yol: string; ad: string; kisa: string; simge: string }

const BAGLANTILAR: Baglanti[] = [
  { yol: '/',              ad: 'Panel',        kisa: 'Panel',   simge: '◧' },
  { yol: '/programlar',    ad: 'Programlar',   kisa: 'Program', simge: '🎓' },
  { yol: '/universiteler', ad: 'Üniversiteler', kisa: 'Üniv.',  simge: '🏛' },
  { yol: '/ulkeler',       ad: 'Ülkeler',      kisa: 'Ülke',    simge: '🌍' },
  { yol: '/belgeler',      ad: 'Belgeler',     kisa: 'Belge',   simge: '📋' },
  { yol: '/ekle',          ad: 'Ekle',         kisa: 'Ekle',    simge: '＋' },
]

/** Masaüstü barında görünen, alt çubuğa girmeyen ikincil bağlantılar. */
const IKINCIL: Baglanti[] = [
  { yol: '/ayarlar', ad: 'Ayarlar', kisa: 'Ayarlar', simge: '⚙' },
]

export function UstBar() {
  const yol = usePathname()

  /** '/programlar/abc' iken 'Programlar' etkin görünmeli; '/' yalnızca tam eşleşmede. */
  const etkinMi = (hedef: string) =>
    hedef === '/' ? yol === '/' : yol === hedef || yol.startsWith(`${hedef}/`)

  return (
    <>
      <header className="ustbar basma-gizle">
        <div className="ustbar-ic">
          <Link href="/" className="marka">
            {/* Emoji yerine gerçek logo: emoji her işletim sisteminde farklı
                çiziliyor ve markayı taşımıyor. Boyut sabit verildi ki yazı
                tipi ölçeğinden etkilenmesin. */}
            <img src="/logo.svg" alt="" width={22} height={22} className="marka-logo" />
            <span>Bölüm Takip</span>
          </Link>

          <nav className="gezinti buyu masaustu-gezinti" aria-label="Ana gezinti">
            {[...BAGLANTILAR, ...IKINCIL].map((b) => (
              <Link
                key={b.yol}
                href={b.yol}
                className="gez-bag"
                aria-current={etkinMi(b.yol) ? 'page' : undefined}
              >
                {b.ad}
              </Link>
            ))}
          </nav>

          <span className="buyu mobil-bosluk" />

          {/* Telefonda alt çubukta yeri olmayan Ayarlar'a giden kapı.
              Masaüstünde gezintide zaten yazılı olduğu için gizli. */}
          <Link
            href="/ayarlar"
            className="dugme dugme-sade dugme-kucuk mobil-ayarlar"
            title="Ayarlar"
            aria-label="Ayarlar"
            aria-current={etkinMi('/ayarlar') ? 'page' : undefined}
            style={{ minWidth: 34 }}
          >
            <span aria-hidden>⚙</span>
          </Link>

          <TemaDugmesi />

          <form action={cikisYap}>
            <button type="submit" className="dugme dugme-sade dugme-kucuk" title="Çıkış yap">
              Çıkış
            </button>
          </form>
        </div>
      </header>

      {/* Telefonda alt sabit gezinti — masaüstünde CSS ile gizli. */}
      <nav className="alt-gezinti basma-gizle" aria-label="Ana gezinti">
        {BAGLANTILAR.map((b) => (
          <Link
            key={b.yol}
            href={b.yol}
            className="alt-gez-bag"
            aria-current={etkinMi(b.yol) ? 'page' : undefined}
          >
            <span aria-hidden className="alt-gez-simge">{b.simge}</span>
            <span>{b.kisa}</span>
          </Link>
        ))}
      </nav>
    </>
  )
}
