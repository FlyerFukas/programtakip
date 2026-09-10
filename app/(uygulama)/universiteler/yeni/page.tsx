import Link from 'next/link'
import { ulkeleriGetir } from '@/lib/sorgular'
import { UniversiteFormu } from '@/bilesenler/UniversiteFormu'

export const metadata = { title: 'Yeni üniversite — Program Takip' }
export const dynamic = 'force-dynamic'

export default async function YeniUniversiteSayfasi() {
  const ulkeler = await ulkeleriGetir()

  return (
    <main className="icerik">
      <div className="alt-m">
        <Link href="/universiteler" className="k1">← Üniversiteler</Link>
        <h1 className="ust-s">Yeni üniversite</h1>
        <p className="soluk k1 bosluk-0">
          Buraya yalnızca o üniversitedeki <strong>bütün</strong> programlar için
          ortak olan şeyler giriyor. Son tarih, öğrenim ücreti ve ön koşullar
          programın kendi kaydında.
        </p>
      </div>

      <UniversiteFormu ulkeler={ulkeler} />
    </main>
  )
}
