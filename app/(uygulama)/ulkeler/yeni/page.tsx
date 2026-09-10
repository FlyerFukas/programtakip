import Link from 'next/link'
import { UlkeFormu } from '@/bilesenler/UlkeFormu'

export const metadata = { title: 'Yeni ülke — Program Takip' }

export default function YeniUlkeSayfasi() {
  return (
    <main className="icerik">
      <div className="alt-m">
        <Link href="/ulkeler" className="k1">← Ülkeler</Link>
        <h1 className="ust-s">Yeni ülke</h1>
        <p className="soluk k1 bosluk-0">
          Yalnızca ülke ve adı zorunlu. Göç yolu alanlarını araştırdıkça
          doldurabilirsin — boş bırakılan alan &quot;eksik&quot; olarak görünür, sıfır
          sayılmaz.
        </p>
      </div>

      <UlkeFormu />
    </main>
  )
}
