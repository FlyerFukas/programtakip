import Link from 'next/link'
import { notFound } from 'next/navigation'
import { universiteGetir, ulkeleriGetir } from '@/lib/sorgular'
import { UniversiteFormu } from '@/bilesenler/UniversiteFormu'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const u = await universiteGetir(id)
  return { title: u ? `${u.ad} düzenle — Bölüm Takip` : 'Bulunamadı — Bölüm Takip' }
}

export default async function UniversiteDuzenleSayfasi({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [universite, ulkeler] = await Promise.all([universiteGetir(id), ulkeleriGetir()])
  if (!universite) notFound()

  return (
    <main className="icerik">
      <div className="alt-m">
        <Link href={`/universiteler/${universite.id}`} className="k1">← {universite.ad}</Link>
        <h1 className="ust-s">{universite.ad} — düzenle</h1>
      </div>

      <UniversiteFormu universite={universite} ulkeler={ulkeler} />
    </main>
  )
}
