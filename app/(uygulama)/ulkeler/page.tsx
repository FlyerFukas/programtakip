import Link from 'next/link'
import { ulkeleriGetir } from '@/lib/sorgular'
import { bayrak } from '@/lib/ulkeler'
import { durumBul } from '@/lib/sabitler'
import {
  DurumRozeti, OncelikRozeti, DonusUyarisi, EtiketListesi, Para, BosDurum,
} from '@/bilesenler/Rozetler'

export const metadata = { title: 'Ülkeler — Bölüm Takip' }
export const dynamic = 'force-dynamic'

/**
 * Ülke listesi.
 *
 * Kartta gösterilenler kullanıcının karar ekseni: çalışma izni, oturum süresi,
 * yaşam gideri. Sıralama ve QS burada yok — onlar üniversite katmanının işi.
 *
 * Süzgeç YOK ve bilerek: bu liste on satır civarında kalacak. Süzme
 * yatırımı programlar ekranına yapılıyor (Aşama 5), yüzlerce satırın olduğu
 * yere.
 */
export default async function UlkelerSayfasi() {
  const ulkeler = await ulkeleriGetir()

  const acik = ulkeler.filter((u) => !durumBul(u.durum)?.kapali)
  const kapali = ulkeler.filter((u) => durumBul(u.durum)?.kapali)

  return (
    <main className="icerik">
      <div className="satir-arasi satir-sar alt-l">
        <div>
          <h1>Ülkeler</h1>
          <p className="soluk k1 ust-s bosluk-0">
            {ulkeler.length === 0
              ? 'Henüz ülke eklenmedi.'
              : `${ulkeler.length} ülke · ${acik.length} tanesi hâlâ değerlendirmede`}
          </p>
        </div>
        <Link href="/ulkeler/yeni" className="dugme dugme-ana">＋ Ülke ekle</Link>
      </div>

      {ulkeler.length === 0 ? (
        <div className="kart">
          <BosDurum
            simge="🌍"
            baslik="Ülke listesi boş"
            aciklama="Önce hedef ülkeleri gir: mezuniyet sonrası çalışma izni, oturum süresi ve yaşam gideri buraya yazılıyor. Üniversiteler ve programlar bunların altına bağlanacak."
          >
            <Link href="/ulkeler/yeni" className="dugme dugme-ana">İlk ülkeyi ekle</Link>
          </BosDurum>
        </div>
      ) : (
        <>
          <div className="izgara izgara-2">
            {acik.map((u) => <UlkeKarti key={u.kod} ulke={u} />)}
          </div>

          {kapali.length > 0 && (
            <>
              <h2 className="ust-l alt-m soluk">Elenenler ve kapananlar</h2>
              <div className="izgara izgara-2">
                {kapali.map((u) => <UlkeKarti key={u.kod} ulke={u} soluk />)}
              </div>
            </>
          )}
        </>
      )}
    </main>
  )
}

function UlkeKarti({
  ulke,
  soluk = false,
}: {
  ulke: Awaited<ReturnType<typeof ulkeleriGetir>>[number]
  soluk?: boolean
}) {
  return (
    <Link
      href={`/ulkeler/${ulke.kod}`}
      className="kart"
      style={{ display: 'block', color: 'inherit', opacity: soluk ? 0.62 : 1 }}
    >
      <div className="satir-arasi" style={{ alignItems: 'flex-start' }}>
        <div className="satir buyu" style={{ gap: 9 }}>
          <span aria-hidden style={{ fontSize: '1.7rem', lineHeight: 1 }}>{bayrak(ulke.kod)}</span>
          <div className="buyu">
            <h3 className="tek-satir">{ulke.ad}</h3>
            {ulke.mezuniyet_sonrasi_izin && (
              <div className="k2 soluk tek-satir">{ulke.mezuniyet_sonrasi_izin}</div>
            )}
          </div>
        </div>
        <OncelikRozeti oncelik={ulke.oncelik} />
      </div>

      <div className="satir satir-sar ust-m" style={{ gap: 6 }}>
        <DurumRozeti kod={ulke.durum} />
        <DonusUyarisi metin={ulke.donus_yukumlulugu} />
        <EtiketListesi etiketler={ulke.etiketler} />
      </div>

      {/* Üç sayı: kalma süresi, oturuma yol, aylık gider. Karardaki üç ölçü. */}
      <div className="izgara izgara-3 ust-m" style={{ gap: 8 }}>
        <Olcu
          etiket="Çalışma izni"
          deger={ulke.mezuniyet_sonrasi_ay !== null ? `${ulke.mezuniyet_sonrasi_ay} ay` : null}
        />
        <Olcu
          etiket="Daimî oturum"
          deger={ulke.oturum_yil !== null ? `${ulke.oturum_yil} yıl` : null}
        />
        <Olcu
          etiket="Aylık gider"
          deger={
            ulke.aylik_yasam_gideri !== null
              ? <Para tutar={ulke.aylik_yasam_gideri} birim={ulke.para_birimi} />
              : null
          }
        />
      </div>
    </Link>
  )
}

/**
 * Kartın alt şeridindeki tek ölçü.
 *
 * Veri yoksa "0" ya da "—" yerine açıkça "eksik" yazıyor: eksik veriyi sıfır
 * göstermek PROJE.md §4.6'da yasak, çünkü kararı bozan bir yalan üretiyor.
 */
function Olcu({ etiket, deger }: { etiket: string; deger: React.ReactNode }) {
  return (
    <div>
      <div className="k2 soluk-2">{etiket}</div>
      {deger
        ? <div className="kalin">{deger}</div>
        : <div className="k2 soluk-2" style={{ fontStyle: 'italic' }}>eksik</div>}
    </div>
  )
}
