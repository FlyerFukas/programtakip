import { Suspense } from 'react'
import { programlariGetir, ulkeleriGetir, ayarGetir } from '@/lib/sorgular'
import { KUR_ANAHTARI, kurAyariniDogrula } from '@/lib/para'
import { ProgramlarIstemci } from './ProgramlarIstemci'

export const metadata = { title: 'Programlar — Bölüm Takip' }
export const dynamic = 'force-dynamic'

/**
 * Program listesi.
 *
 * Sunucunun tek işi veriyi çekmek; süzme, sıralama ve URL durumu istemcide
 * (PROJE.md §6.5). Veri kişisel ölçekte olduğu için tamamı bir kerede
 * gidiyor ve her filtre tıkı sunucuya gitmiyor.
 *
 * Kur tablosu da buradan iniyor: ücret süzgeci ve toplam maliyet EUR
 * üzerinden hesaplanıyor, istemcinin veritabanına gitmesi gerekmiyor.
 *
 * `Suspense`: `ProgramlarIstemci` `useSearchParams()` kullanıyor, Next.js
 * onu bir sınırla sarmayı istiyor.
 */
export default async function ProgramlarSayfasi() {
  const [programlar, ulkeler, kurHam] = await Promise.all([
    programlariGetir(),
    ulkeleriGetir(),
    ayarGetir(KUR_ANAHTARI),
  ])
  const kur = kurAyariniDogrula(kurHam)

  return (
    <main className="icerik">
      <Suspense fallback={<p className="soluk">Yükleniyor…</p>}>
        <ProgramlarIstemci programlar={programlar} ulkeler={ulkeler} kur={kur} />
      </Suspense>
    </main>
  )
}
