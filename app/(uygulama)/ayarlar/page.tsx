import Link from 'next/link'
import { ayarGetir, baglantiSina } from '@/lib/sorgular'
import { KUR_ANAHTARI, kurAyariniDogrula, KUR_TARIHI } from '@/lib/para'
import { tarihFormat } from '@/lib/tarih'
import { KurFormu } from './KurFormu'
import { YedekBolumu } from './YedekBolumu'

export const metadata = { title: 'Ayarlar — Bölüm Takip' }
export const dynamic = 'force-dynamic'

export default async function AyarlarSayfasi() {
  const [kurHam, baglanti] = await Promise.all([
    ayarGetir(KUR_ANAHTARI),
    baglantiSina(),
  ])
  const kur = kurAyariniDogrula(kurHam)
  const kaydedilmis = kurHam !== null

  return (
    <main className="icerik icerik-dar">
      <div className="alt-l">
        <h1>Ayarlar</h1>
        <p className="soluk k1 ust-s bosluk-0">
          Kur oranları ve yedekleme burada. Belge havuzu{' '}
          <Link href="/belgeler">Belgeler</Link> ekranında.
        </p>
      </div>

      {/* ══════════════════════════════ kurlar ═════════════════════════ */}
      <section className="kart alt-l">
        <div className="kart-baslik">
          <h2>Kur oranları</h2>
          <span className="rozet rozet-mavi">{tarihFormat(kur.tarih)}</span>
        </div>

        <p className="soluk k1 alt-m">
          Programların ücretleri farklı para birimlerinde giriliyor; karşılaştırma
          bunları EUR üzerinden yapıyor. <strong>Canlı kur çekilmiyor</strong> —
          altı ay sonraki bir karar için günlük dalgalanma gürültü, ama çevrimdışı
          belirlilik değerli. Değiştiğinde buradan güncelle, kod dağıtımı
          gerekmiyor.
        </p>

        {!kaydedilmis && (
          <div className="uyari uyari-bilgi alt-m">
            <span aria-hidden>ℹ</span>
            <span>
              Henüz kur kaydetmedin; koddaki başlangıç değerleri kullanılıyor
              (Avrupa Merkez Bankası, {tarihFormat(KUR_TARIHI)}).
            </span>
          </div>
        )}

        <KurFormu kur={kur} />
      </section>

      {/* ═════════════════════════════ bağlantı ════════════════════════ */}
      <section className="kart alt-l">
        <h2 className="alt-m">Veritabanı</h2>
        <div className={`uyari ${baglanti.tamam ? 'uyari-basari' : 'uyari-hata'}`}>
          <span aria-hidden>{baglanti.tamam ? '✓' : '⚠'}</span>
          <span>{baglanti.mesaj}</span>
        </div>
        <p className="k2 soluk-2 ust-m bosluk-0">
          Neon (serverless PostgreSQL). Bağlantı dizgesi yalnızca sunucuda
          okunuyor; tarayıcıya hiçbir kimlik bilgisi gitmiyor.
        </p>
      </section>

      <YedekBolumu />
    </main>
  )
}
