import Link from 'next/link'
import { notFound } from 'next/navigation'
import { programGetir, universiteSecenekleri } from '@/lib/sorgular'
import { ProgramFormu } from '@/bilesenler/ProgramFormu'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await programGetir(id)
  return { title: p ? `${p.ad} düzenle — Bölüm Takip` : 'Bulunamadı — Bölüm Takip' }
}

export default async function ProgramDuzenleSayfasi({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [program, universiteler] = await Promise.all([
    programGetir(id),
    universiteSecenekleri(),
  ])
  if (!program) notFound()

  return (
    <main className="icerik">
      <div className="alt-m">
        <Link href={`/programlar/${program.id}`} className="k1">← {program.ad}</Link>
        <h1 className="ust-s">{program.ad} — düzenle</h1>
      </div>

      <ProgramFormu program={program} universiteler={universiteler} />
    </main>
  )
}
