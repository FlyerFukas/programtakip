import { redirect } from 'next/navigation'
import { oturumVar, korumaHazirMi } from '@/lib/auth'
import { GirisFormu } from './GirisFormu'

export const metadata = { title: 'Giriş — Program Takip' }

export default async function GirisSayfasi() {
  if (!korumaHazirMi()) redirect('/kurulum')
  if (await oturumVar()) redirect('/')

  return (
    <main className="icerik icerik-dar" style={{ maxWidth: 400, paddingTop: '14vh' }}>
      <div className="orta alt-l">
        {/* BursTakip'te burada emoji vardı; emoji her işletim sisteminde farklı
            çiziliyor ve markayı taşımıyor (aynı gerekçe UstBar'da da yazılı).
            next/image kullanılmıyor: kaynak SVG, optimize edilecek bir şey yok
            ve boyut sabit — yükleyici eklemek net zarar. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt=""
          width={52}
          height={52}
          style={{ borderRadius: 12, display: 'block', margin: '0 auto 10px' }}
        />
        <h1>Program Takip</h1>
        <p className="soluk k1 ust-s">
          Yüksek lisans programları: ülke, üniversite, bölüm. Son tarihler,
          maliyet ve uygunluk tek yerde.
        </p>
      </div>

      <div className="kart">
        <GirisFormu />
      </div>

      <p className="soluk-2 k2 orta ust-m">
        Parolanı unuttuysan sunucudaki <code>.env.local</code> dosyasındaki{' '}
        <code>APP_PAROLA</code> değerine bak.
      </p>
    </main>
  )
}
