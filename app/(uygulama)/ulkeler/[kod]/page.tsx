import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ulkeGetir, ulkeninUniversiteleri } from '@/lib/sorgular'
import { bayrak, ulkeAdi } from '@/lib/ulkeler'
import { tarihFormat } from '@/lib/tarih'
import {
  DurumRozeti, OncelikRozeti, DonusUyarisi, EtiketListesi, Para, Deger, EvetHayir,
  BosDurum,
} from '@/bilesenler/Rozetler'
import { HizliDurum } from './HizliDurum'
import { SilDugmesi } from './SilDugmesi'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params
  const ulke = await ulkeGetir(kod.toUpperCase())
  return { title: ulke ? `${ulke.ad} — Program Takip` : 'Bulunamadı — Program Takip' }
}

/**
 * Ülke detayı.
 *
 * ALAN KAPSAMASI: `Ulke` tipindeki her alan bu sayfada geçmek zorunda —
 * `npm run dogrula` bunu statik olarak denetliyor. Tek muaf `kod`, o da
 * başlıktaki bayrak olarak çiziliyor.
 *
 * Boş alanlar `Deger` bileşeni tarafından hiç çizilmiyor; ama her alan KENDİ
 * boşluğuna bakıyor, başka bir alanın koşuluna gömülmüyor. BursTakip'te
 * `kontenjan_not` tam olarak öyle kaybolmuştu.
 */
export default async function UlkeDetay({ params }: { params: Promise<{ kod: string }> }) {
  const { kod } = await params
  const ulke = await ulkeGetir(kod.toUpperCase())
  if (!ulke) notFound()

  const universiteler = await ulkeninUniversiteleri(ulke.kod)
  const programSayisi = universiteler.reduce((t, u) => t + u.program_sayisi, 0)

  return (
    <main className="icerik">
      <div className="alt-m basma-gizle">
        <Link href="/ulkeler" className="k1">← Ülkeler</Link>
      </div>

      {/* ══════════════════════════════ başlık ══════════════════════════ */}
      <div className="kart alt-m">
        <div className="satir-arasi satir-sar" style={{ alignItems: 'flex-start' }}>
          <div className="satir buyu" style={{ gap: 12 }}>
            <span aria-hidden style={{ fontSize: '2.6rem', lineHeight: 1 }}>
              {bayrak(ulke.kod)}
            </span>
            <div className="buyu">
              <h1>{ulke.ad}</h1>
              <div className="soluk k1 ust-s">
                {ulkeAdi(ulke.kod)} · {universiteler.length} üniversite · {programSayisi} program
              </div>
            </div>
          </div>

          <div className="satir satir-sar basma-gizle" style={{ justifyContent: 'flex-end' }}>
            <Link href={`/ulkeler/${ulke.kod}/duzenle`} className="dugme">Düzenle</Link>
            <SilDugmesi kod={ulke.kod} ad={ulke.ad} universiteSayisi={universiteler.length} />
          </div>
        </div>

        <div className="satir satir-sar ust-m" style={{ gap: 7 }}>
          <DurumRozeti kod={ulke.durum} />
          <OncelikRozeti oncelik={ulke.oncelik} />
          <DonusUyarisi metin={ulke.donus_yukumlulugu} />
          <EtiketListesi etiketler={ulke.etiketler} />
        </div>

        {ulke.kaynak_link && (
          <div className="ust-m basma-gizle">
            <a
              href={ulke.kaynak_link} target="_blank" rel="noopener noreferrer"
              className="dugme dugme-kucuk"
            >
              Kaynak sayfası ↗
            </a>
          </div>
        )}
      </div>

      {/* Kırmızı çizgi: sayfanın dibinde bir satır olarak kalmamalı. */}
      {ulke.donus_yukumlulugu && (
        <div className="uyari uyari-hata alt-m">
          <span aria-hidden>⛔</span>
          <span>
            <strong>Geri dönüş yükümlülüğü var.</strong> {ulke.donus_yukumlulugu}
          </span>
        </div>
      )}

      {ulke.elenme_sebebi && (
        <div className="uyari uyari-dikkat alt-m">
          <span aria-hidden>⚠</span>
          <span><strong>Elenme sebebi:</strong> {ulke.elenme_sebebi}</span>
        </div>
      )}

      <div className="izgara izgara-2 alt-m">
        {/* ═══════════════════════════ göç yolu ════════════════════════ */}
        <section className="kart">
          <h2 className="alt-m">Göç yolu</h2>

          <Deger etiket="Mezuniyet sonrası izin" deger={ulke.mezuniyet_sonrasi_izin} />
          <Deger
            etiket="…kaç ay"
            deger={ulke.mezuniyet_sonrasi_ay !== null ? `${ulke.mezuniyet_sonrasi_ay} ay` : null}
          />
          <Deger
            etiket="Daimî oturuma"
            deger={ulke.oturum_yil !== null ? `${ulke.oturum_yil} yıl` : null}
          />
          <Deger
            etiket="Vatandaşlığa"
            deger={ulke.vatandaslik_yil !== null ? `${ulke.vatandaslik_yil} yıl` : null}
          />
          <Deger etiket="Oturum için dil şartı" deger={ulke.oturum_dil_sarti} />
          <Deger
            etiket="Çifte vatandaşlık"
            deger={<EvetHayir deger={ulke.cifte_vatandaslik} />}
            ipucu="Türkiye izin veriyor; buradaki, karşı tarafın tutumu."
          />
          <Deger etiket="Öğrenci çalışma hakkı" deger={ulke.ogrenci_calisma} />

          <Deger etiket="Oturum yolu" deger={ulke.oturum_yolu} cokSatir />
          <Deger etiket="Yabancıya mülk kısıtı" deger={ulke.mulk_kisiti} cokSatir />
        </section>

        {/* ════════════════════════════ para ══════════════════════════ */}
        <section className="kart">
          <h2 className="alt-m">Para</h2>

          <Deger etiket="Para birimi" deger={ulke.para_birimi} />
          <Deger
            etiket="Aylık yaşam gideri"
            deger={
              ulke.aylik_yasam_gideri !== null
                ? <Para tutar={ulke.aylik_yasam_gideri} birim={ulke.para_birimi} />
                : null
            }
          />
          <Deger
            etiket="Bloke hesap şartı"
            deger={
              ulke.blokeli_hesap !== null
                ? <Para tutar={ulke.blokeli_hesap} birim={ulke.para_birimi} />
                : null
            }
            ipucu="Vize için dondurulması gereken tutar."
          />
          <Deger etiket="Yaşam gideri notu" deger={ulke.yasam_gideri_not} cokSatir />

          <hr className="ayrac" />

          <h3 className="alt-m">Vize ve dil</h3>
          <Deger etiket="Vize maliyeti" deger={ulke.vize_maliyet} />
          <Deger etiket="Öğretim / günlük dil" deger={ulke.ogretim_dili_not} />
          <Deger etiket="Vize süreci" deger={ulke.vize_sureci} cokSatir />
        </section>
      </div>

      {/* ══════════════════════════ üniversiteler ══════════════════════ */}
      <section className="kart alt-m">
        <div className="kart-baslik">
          <h2>Bu ülkedeki üniversiteler</h2>
          <Link href="/universiteler" className="k1">Tümü →</Link>
        </div>

        {universiteler.length === 0 ? (
          <BosDurum
            simge="🏛"
            baslik="Henüz üniversite yok"
            aciklama="Bu ülkeye üniversite eklendiğinde burada listelenecek."
          />
        ) : (
          <div className="sutun" style={{ gap: 8 }}>
            {universiteler.map((u) => (
              <Link
                key={u.id}
                href={`/universiteler/${u.id}`}
                className="satir-arasi kart kart-sik"
                style={{ color: 'inherit' }}
              >
                <div className="buyu">
                  <div className="kalin">{u.ad}</div>
                  <div className="k2 soluk">
                    {[u.sehir, u.qs_sirasi ? `QS #${u.qs_sirasi}` : null]
                      .filter(Boolean).join(' · ')}
                  </div>
                </div>
                <span className="etiket">{u.program_sayisi} program</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ════════════════════════════ notlar ═══════════════════════════ */}
      {ulke.notlar && (
        <section className="kart alt-m">
          <h2 className="alt-m">Notlar</h2>
          <div className="ham-metin">{ulke.notlar}</div>
        </section>
      )}

      {/* ═══════════════════════════ hızlı durum ═══════════════════════ */}
      <section className="kart alt-m basma-gizle">
        <h2 className="alt-m">Hızlı güncelleme</h2>
        <HizliDurum kod={ulke.kod} durum={ulke.durum} oncelik={ulke.oncelik} />
      </section>

      <p className="k2 soluk-2">
        Eklendi {tarihFormat(ulke.olusturma.slice(0, 10))}
        {' · '}
        Güncellendi {tarihFormat(ulke.guncelleme.slice(0, 10))}
      </p>
    </main>
  )
}
