import Link from 'next/link'
import { universiteleriGetir, ulkeleriGetir } from '@/lib/sorgular'
import { bayrak } from '@/lib/ulkeler'
import { durumBul } from '@/lib/sabitler'
import {
  DurumRozeti, OncelikRozeti, EtiketListesi, Para, BosDurum,
} from '@/bilesenler/Rozetler'
import type { UniversiteGenis } from '@/lib/tipler'

export const metadata = { title: 'Üniversiteler — Bölüm Takip' }
export const dynamic = 'force-dynamic'

/**
 * Üniversite listesi — ülkeye göre gruplu.
 *
 * NEDEN GRUP, NEDEN SÜZGEÇ DEĞİL: bu liste kırk satır civarında kalacak ve
 * neredeyse her bakışta soru "hangi ülkede ne var" oluyor. Gruplama o soruyu
 * tek ekranda cevaplıyor; süzgeç makinesi yüzlerce satırın olduğu programlar
 * ekranına kuruluyor (Aşama 5).
 */
export default async function UniversitelerSayfasi() {
  const [universiteler, ulkeler] = await Promise.all([
    universiteleriGetir(),
    ulkeleriGetir(),
  ])

  // Ülke sırası ülke listesindeki sırayı (öncelik → ad) izliyor ki iki ekran
  // birbiriyle tutarlı okunsun.
  const gruplar = ulkeler
    .map((u) => ({
      kod: u.kod,
      ad: u.ad,
      liste: universiteler.filter((x) => x.ulke_kodu === u.kod),
    }))
    .filter((g) => g.liste.length > 0)

  const toplamProgram = universiteler.reduce((t, u) => t + u.program_sayisi, 0)

  return (
    <main className="icerik">
      <div className="satir-arasi satir-sar alt-l">
        <div>
          <h1>Üniversiteler</h1>
          <p className="soluk k1 ust-s bosluk-0">
            {universiteler.length === 0
              ? 'Henüz üniversite eklenmedi.'
              : `${universiteler.length} üniversite · ${gruplar.length} ülke · ${toplamProgram} program`}
          </p>
        </div>
        <Link href="/universiteler/yeni" className="dugme dugme-ana">＋ Üniversite ekle</Link>
      </div>

      {universiteler.length === 0 ? (
        <div className="kart">
          <BosDurum
            simge="🏛"
            baslik="Üniversite listesi boş"
            aciklama={ulkeler.length === 0
              ? 'Üniversite bir ülkeye bağlı kaydediliyor. Önce Ülkeler ekranından en az bir ülke ekle.'
              : 'Şehir, sıralama, başvuru platformu ve ücretler burada tutuluyor — o üniversitedeki bütün programlar için ortak oldukları için.'}
          >
            {ulkeler.length === 0
              ? <Link href="/ulkeler/yeni" className="dugme dugme-ana">Önce ülke ekle</Link>
              : <Link href="/universiteler/yeni" className="dugme dugme-ana">İlk üniversiteyi ekle</Link>}
          </BosDurum>
        </div>
      ) : (
        gruplar.map((g) => (
          <section key={g.kod} className="alt-l">
            <div className="satir-arasi alt-m">
              <h2 className="satir" style={{ gap: 8 }}>
                <span aria-hidden>{bayrak(g.kod)}</span>
                {g.ad}
                <span className="etiket">{g.liste.length}</span>
              </h2>
              <Link href={`/ulkeler/${g.kod}`} className="k1">Ülke sayfası →</Link>
            </div>

            <div className="izgara izgara-2">
              {g.liste.map((u) => <UniversiteKarti key={u.id} universite={u} />)}
            </div>
          </section>
        ))
      )}
    </main>
  )
}

function UniversiteKarti({ universite: u }: { universite: UniversiteGenis }) {
  const kapali = durumBul(u.durum)?.kapali ?? false

  /** Sıralamalardan dolu olan ilki — üçünü birden yazmak kartı boğuyor. */
  const siralama =
    u.alan_sirasi !== null ? { etiket: 'Alan', deger: u.alan_sirasi }
    : u.qs_sirasi !== null ? { etiket: 'QS', deger: u.qs_sirasi }
    : u.the_sirasi !== null ? { etiket: 'THE', deger: u.the_sirasi }
    : null

  return (
    <Link
      href={`/universiteler/${u.id}`}
      className="kart"
      style={{ display: 'block', color: 'inherit', opacity: kapali ? 0.62 : 1 }}
    >
      <div className="satir-arasi" style={{ alignItems: 'flex-start' }}>
        <div className="buyu">
          <h3 className="iki-satir">{u.ad}</h3>
          <div className="k2 soluk ust-s">
            {[u.sehir, u.basvuru_platformu].filter(Boolean).join(' · ') || 'Şehir girilmemiş'}
          </div>
        </div>
        {siralama && (
          <span className="rozet rozet-mavi" title={`${siralama.etiket} sıralaması`}>
            {siralama.etiket} #{siralama.deger}
          </span>
        )}
      </div>

      <div className="satir satir-sar ust-m" style={{ gap: 6 }}>
        <DurumRozeti kod={u.durum} />
        <OncelikRozeti oncelik={u.oncelik} />
        <span className="etiket">{u.program_sayisi} program</span>
        {u.burs_var === true && (
          <span className="etiket etiket-vurgu" title={u.burs_notu ?? undefined}>🎁 Bursu var</span>
        )}
        <EtiketListesi etiketler={u.etiketler} />
      </div>

      {(u.basvuru_ucreti !== null || u.depozito !== null) && (
        <div className="satir satir-sar k2 soluk ust-m" style={{ gap: 12 }}>
          {u.basvuru_ucreti !== null && (
            <span>
              Başvuru <Para tutar={u.basvuru_ucreti} birim={u.basvuru_ucreti_para} />
            </span>
          )}
          {u.depozito !== null && (
            <span>
              Depozito <Para tutar={u.depozito} birim={u.depozito_para} />
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
