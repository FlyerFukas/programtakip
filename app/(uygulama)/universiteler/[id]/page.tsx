import Link from 'next/link'
import { notFound } from 'next/navigation'
import { universiteGetir, universiteninProgramlari } from '@/lib/sorgular'
import { bayrak, ulkeAdi } from '@/lib/ulkeler'
import { tarihFormat } from '@/lib/tarih'
import { UNIVERSITE_TURLERI } from '@/lib/sabitler'
import {
  DurumRozeti, OncelikRozeti, EtiketListesi, Para, Deger, EvetHayir, BosDurum,
} from '@/bilesenler/Rozetler'
import { HizliDurum } from './HizliDurum'
import { SilDugmesi } from './SilDugmesi'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const u = await universiteGetir(id)
  return { title: u ? `${u.ad} — Program Takip` : 'Bulunamadı — Program Takip' }
}

/**
 * Üniversite detayı.
 *
 * ALAN KAPSAMASI: `Universite` tipindeki her alan bu sayfada geçmek zorunda —
 * `npm run dogrula` statik olarak denetliyor. Muaflar: `id`, zaman damgaları
 * ve `ulke_kodu` (başlıkta bayrak + ülke adı olarak çiziliyor).
 */
export default async function UniversiteDetay({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const universite = await universiteGetir(id)
  if (!universite) notFound()

  const programlar = await universiteninProgramlari(universite.id)
  const tur = UNIVERSITE_TURLERI.find((t) => t.kod === universite.tur)

  return (
    <main className="icerik">
      <div className="alt-m basma-gizle">
        <Link href="/universiteler" className="k1">← Üniversiteler</Link>
      </div>

      {/* ══════════════════════════════ başlık ══════════════════════════ */}
      <div className="kart alt-m">
        <div className="satir-arasi satir-sar" style={{ alignItems: 'flex-start' }}>
          <div className="buyu">
            <h1>{universite.ad}</h1>
            <div className="satir satir-sar soluk k1 ust-s" style={{ gap: 8 }}>
              <Link href={`/ulkeler/${universite.ulke_kodu}`} className="satir" style={{ gap: 5 }}>
                <span aria-hidden>{bayrak(universite.ulke_kodu)}</span>
                {universite.ulke?.ad ?? ulkeAdi(universite.ulke_kodu)}
              </Link>
              {universite.sehir && <span>· {universite.sehir}</span>}
              {tur && <span>· {tur.ad}</span>}
              {universite.ogretim_dili.length > 0 && (
                <span>· {universite.ogretim_dili.join(', ')}</span>
              )}
            </div>
          </div>

          <div className="satir satir-sar basma-gizle" style={{ justifyContent: 'flex-end' }}>
            <Link href={`/universiteler/${universite.id}/duzenle`} className="dugme">Düzenle</Link>
            <SilDugmesi
              id={universite.id}
              ad={universite.ad}
              programSayisi={programlar.length}
            />
          </div>
        </div>

        <div className="satir satir-sar ust-m" style={{ gap: 7 }}>
          <DurumRozeti kod={universite.durum} />
          <OncelikRozeti oncelik={universite.oncelik} />
          {universite.qs_sirasi !== null && (
            <span className="rozet rozet-mavi">QS #{universite.qs_sirasi}</span>
          )}
          {universite.the_sirasi !== null && (
            <span className="rozet rozet-mavi">THE #{universite.the_sirasi}</span>
          )}
          {universite.alan_sirasi !== null && (
            <span className="rozet rozet-mor" title="Alan bazlı sıralama">
              Alan #{universite.alan_sirasi}
            </span>
          )}
          <EtiketListesi etiketler={universite.etiketler} />
        </div>

        {(universite.site_link || universite.basvuru_link) && (
          <div className="satir satir-sar ust-m basma-gizle" style={{ gap: 8 }}>
            {universite.basvuru_link && (
              <a
                href={universite.basvuru_link} target="_blank" rel="noopener noreferrer"
                className="dugme dugme-ana dugme-kucuk"
              >
                Başvuru sayfası ↗
              </a>
            )}
            {universite.site_link && (
              <a
                href={universite.site_link} target="_blank" rel="noopener noreferrer"
                className="dugme dugme-kucuk"
              >
                Okulun sitesi ↗
              </a>
            )}
          </div>
        )}
      </div>

      <div className="izgara izgara-2 alt-m">
        {/* ═══════════════════════ başvuru ve ücretler ═════════════════ */}
        <section className="kart">
          <h2 className="alt-m">Başvuru ve ücretler</h2>

          <Deger etiket="Başvuru platformu" deger={universite.basvuru_platformu} />
          <Deger
            etiket="Başvuru ücreti"
            deger={
              universite.basvuru_ucreti !== null
                ? <Para tutar={universite.basvuru_ucreti} birim={universite.basvuru_ucreti_para} />
                : null
            }
          />
          {/* Para birimleri ayrı satır olarak da geçiyor: tutar boşken de
              görünsünler, başka alanın koşuluna gömülü kalmasınlar. */}
          <Deger etiket="Başvuru ücreti para birimi" deger={universite.basvuru_ucreti_para} />
          <Deger
            etiket="Depozito"
            deger={
              universite.depozito !== null
                ? <Para tutar={universite.depozito} birim={universite.depozito_para} />
                : null
            }
          />
          <Deger etiket="Depozito para birimi" deger={universite.depozito_para} />
          <Deger etiket="Depozito notu" deger={universite.depozito_not} cokSatir />

          <hr className="ayrac" />

          <h3 className="alt-m">Burs</h3>
          <Deger etiket="Kendi bursu var mı" deger={<EvetHayir deger={universite.burs_var} />} />
          <Deger etiket="Burs notu" deger={universite.burs_notu} />
          <Deger
            etiket="Burs sayfası"
            deger={universite.burs_link
              ? <a href={universite.burs_link} target="_blank" rel="noopener noreferrer">Aç ↗</a>
              : null}
          />
        </section>

        {/* ════════════════════════════ sıralama ══════════════════════ */}
        <section className="kart">
          <h2 className="alt-m">Sıralama ve kimlik</h2>

          <Deger etiket="Şehir" deger={universite.sehir} />
          <Deger etiket="Türü" deger={tur?.ad} />
          <Deger
            etiket="Öğretim dilleri"
            deger={universite.ogretim_dili.length > 0 ? universite.ogretim_dili.join(', ') : null}
          />
          <Deger
            etiket="QS sırası"
            deger={universite.qs_sirasi !== null ? `#${universite.qs_sirasi}` : null}
          />
          <Deger
            etiket="THE sırası"
            deger={universite.the_sirasi !== null ? `#${universite.the_sirasi}` : null}
          />
          <Deger
            etiket="Alan sırası"
            deger={universite.alan_sirasi !== null ? `#${universite.alan_sirasi}` : null}
            ipucu="Genel sıralamadan daha çok işe yarayan sayı."
          />
          <Deger etiket="Sıralama notu" deger={universite.siralama_not} cokSatir />

          <hr className="ayrac" />

          <Deger
            etiket="Okulun sitesi"
            deger={universite.site_link
              ? <a href={universite.site_link} target="_blank" rel="noopener noreferrer">Aç ↗</a>
              : null}
          />
          <Deger
            etiket="Başvuru sayfası"
            deger={universite.basvuru_link
              ? <a href={universite.basvuru_link} target="_blank" rel="noopener noreferrer">Aç ↗</a>
              : null}
          />
        </section>
      </div>

      {/* ═══════════════════════════ programlar ═══════════════════════ */}
      <section className="kart alt-m">
        <div className="kart-baslik">
          <h2>Bu üniversitedeki programlar</h2>
          <Link href="/programlar" className="k1">Tümü →</Link>
        </div>

        {programlar.length === 0 ? (
          <BosDurum
            simge="🎓"
            baslik="Henüz program yok"
            aciklama="Başvuru birimi programdır: son tarih, öğrenim ücreti ve ön koşullar orada tutuluyor."
          >
            <div className="satir-arasi" style={{ justifyContent: 'center', gap: 8 }}>
              <Link href="/ekle" className="dugme dugme-ana">Metinden ekle</Link>
              <Link href="/programlar/yeni" className="dugme dugme-sade">Elle ekle</Link>
            </div>
          </BosDurum>
        ) : (
          <div className="sutun" style={{ gap: 8 }}>
            {programlar.map((p) => (
              <Link
                key={p.id}
                href={`/programlar/${p.id}`}
                className="satir-arasi kart kart-sik"
                style={{ color: 'inherit' }}
              >
                <div className="buyu">
                  <div className="kalin">{p.ad}</div>
                  <div className="k2 soluk">
                    {[p.derece, p.bolum, p.sure_ay ? `${p.sure_ay} ay` : null]
                      .filter(Boolean).join(' · ')}
                  </div>
                </div>
                <DurumRozeti kod={p.durum} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ════════════════════════════ notlar ═══════════════════════════ */}
      {universite.notlar && (
        <section className="kart alt-m">
          <h2 className="alt-m">Notlar</h2>
          <div className="ham-metin">{universite.notlar}</div>
        </section>
      )}

      {/* Ayrıştırıcı bir şeyi kaçırdıysa kaynağa dönebilmek için saklanıyor. */}
      {universite.ham_metin && (
        <section className="kart alt-m">
          <h2 className="alt-m">Kaydedilen ham metin</h2>
          <div className="ham-metin">{universite.ham_metin}</div>
        </section>
      )}

      {/* ═══════════════════════════ hızlı durum ═══════════════════════ */}
      <section className="kart alt-m basma-gizle">
        <h2 className="alt-m">Hızlı güncelleme</h2>
        <HizliDurum
          id={universite.id}
          durum={universite.durum}
          oncelik={universite.oncelik}
        />
      </section>

      <p className="k2 soluk-2">
        Eklendi {tarihFormat(universite.olusturma.slice(0, 10))}
        {' · '}
        Güncellendi {tarihFormat(universite.guncelleme.slice(0, 10))}
      </p>
    </main>
  )
}
