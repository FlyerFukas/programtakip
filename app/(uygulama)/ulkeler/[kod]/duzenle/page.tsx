import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ulkeGetir } from '@/lib/sorgular'
import { UlkeFormu } from '@/bilesenler/UlkeFormu'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params
  const ulke = await ulkeGetir(kod.toUpperCase())
  return { title: ulke ? `${ulke.ad} düzenle — Program Takip` : 'Bulunamadı — Program Takip' }
}

export default async function UlkeDuzenleSayfasi({
  params,
}: {
  params: Promise<{ kod: string }>
}) {
  const { kod } = await params
  const ulke = await ulkeGetir(kod.toUpperCase())
  if (!ulke) notFound()

  return (
    <main className="icerik">
      <div className="alt-m">
        <Link href={`/ulkeler/${ulke.kod}`} className="k1">← {ulke.ad}</Link>
        <h1 className="ust-s">{ulke.ad} — düzenle</h1>
      </div>

      <UlkeFormu ulke={ulke} />
    </main>
  )
}
