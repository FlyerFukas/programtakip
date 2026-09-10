import { universiteleriGetir } from '@/lib/sorgular'
import { kullanilabilirSaglayicilar, SAGLAYICI_ADLARI } from '@/lib/ayristir-yz'
import { MetinEkle } from './MetinEkle'

export const metadata = { title: 'Metinden ekle — Program Takip' }
export const dynamic = 'force-dynamic'

/**
 * Metinden program ekleme (PROJE.md Aşama 11).
 *
 * Anahtar kontrolü SUNUCUDA yapılıyor: API anahtarları sunucu değişkeni,
 * istemciye gitmemeli. İstemciye yalnızca hangi sağlayıcıların açık olduğu
 * iniyor — anahtarın kendisi değil.
 */
export default async function EkleSayfasi() {
  const universiteler = await universiteleriGetir()
  const saglayicilar = kullanilabilirSaglayicilar()
    .map((kod) => ({ kod, ad: SAGLAYICI_ADLARI[kod] }))

  return (
    <main className="icerik">
      <div className="alt-l">
        <h1>Metinden ekle</h1>
        <p className="soluk k1 ust-s bosluk-0">
          Program sayfasını yapıştır, model okusun, form dolsun.
        </p>
      </div>

      <MetinEkle universiteler={universiteler} saglayicilar={saglayicilar} />
    </main>
  )
}
