import Link from 'next/link'
import { universiteSecenekleri } from '@/lib/sorgular'
import { ProgramFormu } from '@/bilesenler/ProgramFormu'

export const metadata = { title: 'Yeni program — Program Takip' }
export const dynamic = 'force-dynamic'

export default async function YeniProgramSayfasi() {
  const universiteler = await universiteSecenekleri()

  return (
    <main className="icerik">
      <div className="alt-m">
        <Link href="/programlar" className="k1">← Programlar</Link>
        <h1 className="ust-s">Yeni program</h1>
        <p className="soluk k1 bosluk-0">
          Başvuru birimi burası. AB dışı ve AB için ayrı son tarih varsa
          <strong> başvuru turlarını</strong> doldur — uygulama senin turunu
          seçip geri sayımı ona göre gösterir.
        </p>
      </div>

      <ProgramFormu universiteler={universiteler} />
    </main>
  )
}
