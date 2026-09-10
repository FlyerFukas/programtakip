import Link from 'next/link'
import { notFound } from 'next/navigation'
import { programGetir, programBelgeleriGetir, havuzGetir, ayarGetir } from '@/lib/sorgular'
import { KUR_ANAHTARI, kurAyariniDogrula } from '@/lib/para'
import { MaliyetOzeti } from '@/bilesenler/MaliyetOzeti'
import { programBelgeListesi } from '@/lib/belge-takvim'
import { bayrak, ulkeAdi } from '@/lib/ulkeler'
import {
  sonTarihMetni, acilisMetni, tarihFormat, turUyarisi, siradakiTur, bilgiTurlari,
} from '@/lib/tarih'
import {
  UCRET_DONEMLERI, KAMPUS_TIPLERI, BASLANGIC_DONEMLERI, uygunlukBul,
} from '@/lib/sabitler'
import {
  DurumRozeti, OncelikRozeti, UygunlukRozeti, GeriSayim, seritSinifi,
  TurSatiri, KosulEtiketleri, EtiketListesi, Para, Deger, EvetHayir,
} from '@/bilesenler/Rozetler'
import { BelgeKontrolListesi } from './BelgeKontrolListesi'
import { HizliDurum } from './HizliDurum'
import { SilDugmesi } from './SilDugmesi'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await programGetir(id)
  return { title: p ? `${p.ad} — Program Takip` : 'Bulunamadı — Program Takip' }
}

/**
 * Program detayı — başvuru biriminin tam kaydı.
 *
 * ALAN KAPSAMASI: `Program` tipindeki her alan bu sayfada geçmek zorunda.
 * `npm run dogrula` denetliyor; muaflar `scripts/dogrula-alanlar.ts` içinde
 * gerekçesiyle yazılı.
 */
export default async function ProgramDetay({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const program = await programGetir(id)
  if (!program) notFound()

  const [belgeDurumlari, havuz, kurHam] = await Promise.all([
    programBelgeleriGetir(program.id),
    havuzGetir(),
    ayarGetir(KUR_ANAHTARI),
  ])
  const kur = kurAyariniDogrula(kurHam)
  const belgeListesi = programBelgeListesi(program, belgeDurumlari, havuz)

  const uni = program.universite
  const tur = siradakiTur(program)
  const digerTurlar = bilgiTurlari(program)
  const uyari = turUyarisi(program)
  const acilis = acilisMetni(program)
  const donem = UCRET_DONEMLERI.find((u) => u.kod === program.ogrenim_ucreti_donem)
  const kampus = KAMPUS_TIPLERI.find((k) => k.kod === program.kampus)
  const uygunlukBilgi = uygunlukBul(program.uygunluk)

  return (
    <main className="icerik">
      <div className="alt-m basma-gizle">
        <Link href="/programlar" className="k1">← Programlar</Link>
      </div>

      {/* ══════════════════════════════ başlık ══════════════════════════ */}
      <div className={`kart ${seritSinifi(program)} alt-m`}>
        <div className="satir-arasi satir-sar" style={{ alignItems: 'flex-start' }}>
          <div className="buyu">
            <h1>{program.ad}</h1>
            <div className="satir satir-sar soluk k1 ust-s" style={{ gap: 8 }}>
              <Link href={`/universiteler/${uni.id}`} className="satir" style={{ gap: 5 }}>
                <span aria-hidden>{bayrak(uni.ulke_kodu)}</span>
                {uni.ad}
              </Link>
              <Link href={`/ulkeler/${uni.ulke_kodu}`}>· {ulkeAdi(uni.ulke_kodu)}</Link>
              {uni.sehir && <span>· {uni.sehir}</span>}
              {program.bolum && <span>· {program.bolum}</span>}
              {program.derece && <span>· {program.derece}</span>}
            </div>

            {program.alanlar.length > 0 && (
              <div className="satir satir-sar ust-s" style={{ gap: 4 }}>
                {program.alanlar.map((a) => <span key={a} className="etiket">{a}</span>)}
              </div>
            )}
          </div>

          <div className="satir satir-sar basma-gizle" style={{ justifyContent: 'flex-end' }}>
            <Link href={`/programlar/${program.id}/duzenle`} className="dugme">Düzenle</Link>
            <SilDugmesi id={program.id} ad={program.ad} />
          </div>
        </div>

        <div className="satir satir-sar ust-m" style={{ gap: 7 }}>
          <DurumRozeti kod={program.durum} />
          <GeriSayim program={program} />
          <UygunlukRozeti kod={program.uygunluk} />
          <OncelikRozeti oncelik={program.oncelik} />
          {program.kontenjan !== null && (
            <span className="etiket">👥 {program.kontenjan} kişilik</span>
          )}
          <EtiketListesi etiketler={program.etiketler} />
        </div>

        {(program.basvuru_link || program.kaynak_link || program.mufredat_link) && (
          <div className="satir satir-sar ust-m basma-gizle" style={{ gap: 8 }}>
            {program.basvuru_link && (
              <a href={program.basvuru_link} target="_blank" rel="noopener noreferrer"
                 className="dugme dugme-ana dugme-kucuk">Başvuru sayfası ↗</a>
            )}
            {program.kaynak_link && (
              <a href={program.kaynak_link} target="_blank" rel="noopener noreferrer"
                 className="dugme dugme-kucuk">Bilgi sayfası ↗</a>
            )}
            {program.mufredat_link && (
              <a href={program.mufredat_link} target="_blank" rel="noopener noreferrer"
                 className="dugme dugme-kucuk">Müfredat ↗</a>
            )}
          </div>
        )}
      </div>

      {/* Turun merkezî tarihten önce kapanıyorsa bu uyarı bir yıl kurtarır. */}
      {uyari && (
        <div className="uyari uyari-dikkat alt-m">
          <span aria-hidden>⚠</span>
          <span>{uyari}</span>
        </div>
      )}

      {acilis && (
        <div className="uyari uyari-bilgi alt-m">
          <span aria-hidden>ℹ</span>
          <span>{acilis}</span>
        </div>
      )}

      {(program.uygunluk === 'supheli' || program.uygunluk === 'uygun_degil') && (
        <div
          className={`uyari ${program.uygunluk === 'supheli' ? 'uyari-dikkat' : 'uyari-hata'} alt-m`}
        >
          <span aria-hidden>{uygunlukBilgi?.simge}</span>
          <span>
            <strong>{uygunlukBilgi?.ad}.</strong>{' '}
            {program.uygunluk_not || uygunlukBilgi?.aciklama}
          </span>
        </div>
      )}

      {/* ═════════════════════ son tarih ve başvuru turları ═══════════ */}
      <section className="kart alt-m">
        <h2 className="alt-m">Son başvuru tarihi</h2>

        <div className="satir-arasi satir-sar alt-m">
          <div>
            <div className="k2 soluk-2">Merkezî tarih</div>
            <div className="sayac-buyuk" style={{ fontSize: '1.25rem' }}>
              {sonTarihMetni(program)}
            </div>
          </div>
          <GeriSayim program={program} />
        </div>

        <Deger etiket="Tarih notu" deger={program.son_tarih_not} />
        <Deger
          etiket="Başvuruların açılışı"
          deger={program.acilis_tarihi ? tarihFormat(program.acilis_tarihi) : null}
        />

        {program.basvuru_turlari.length > 0 ? (
          <>
            <hr className="ayrac" />
            <h3 className="alt-s">Başvuru turları</h3>
            <p className="k2 soluk-2 alt-m">
              Senin turun kalın; AB turları bilgi amaçlı, soluk çiziliyor.
            </p>
            <div className="sutun" style={{ gap: 8 }}>
              {tur && <TurSatiri tur={tur} senin />}
              {program.basvuru_turlari
                .filter((t) => t !== tur && !digerTurlar.includes(t))
                .map((t, i) => <TurSatiri key={`acik-${i}`} tur={t} senin={false} />)}
              {digerTurlar.map((t, i) => <TurSatiri key={`bilgi-${i}`} tur={t} senin={false} />)}
            </div>
          </>
        ) : (
          <p className="k2 soluk-2">
            Tur girilmemiş — programın tek son tarihi var ya da henüz bakılmadı.
          </p>
        )}
      </section>

      <div className="izgara izgara-2 alt-m">
        {/* ════════════════════════════ maliyet ════════════════════════ */}
        <section className="kart">
          <h2 className="alt-m">Maliyet</h2>

          <Deger
            etiket="Öğrenim ücreti"
            deger={
              program.ogrenim_ucreti !== null
                ? <><Para tutar={program.ogrenim_ucreti} birim={program.para_birimi} />
                    {donem ? ` / ${donem.ad.toLowerCase()}` : ''}</>
                : null
            }
          />
          <Deger etiket="Para birimi" deger={program.para_birimi} />
          <Deger etiket="Ücret neye ait" deger={donem?.ad} />
          <Deger
            etiket="AB dışına muafiyet ihtimali"
            deger={<EvetHayir deger={program.ucret_muafiyeti} />}
          />
          <Deger etiket="Ücret notu" deger={program.ucret_not} cokSatir />

          <hr className="ayrac" />
          <h3 className="alt-s">Üniversiteden gelen kalemler</h3>
          <Deger
            etiket="Başvuru ücreti"
            deger={uni.basvuru_ucreti !== null
              ? <Para tutar={uni.basvuru_ucreti} birim={uni.basvuru_ucreti_para} />
              : null}
          />
          <Deger
            etiket="Depozito"
            deger={uni.depozito !== null
              ? <Para tutar={uni.depozito} birim={uni.depozito_para} />
              : null}
          />
        </section>

        {/* ══════════════════════════ programın yapısı ═════════════════ */}
        <section className="kart">
          <h2 className="alt-m">Yapı</h2>

          <Deger etiket="Süre" deger={program.sure_ay !== null ? `${program.sure_ay} ay` : null} />
          <Deger etiket="ECTS" deger={program.ects !== null ? `${program.ects} ECTS` : null} />
          <Deger
            etiket="Tezli mi"
            deger={<EvetHayir deger={program.tezli} />}
            ipucu="Kanada'da finansman buna bağlı: tezli fonlanır, ders bazlı fonlanmaz."
          />
          <Deger etiket="Öğretim dili" deger={program.ogretim_dili} />
          <Deger etiket="Kampüs" deger={kampus ? `${kampus.simge} ${kampus.ad}` : null} />
          <Deger
            etiket="Başlangıç dönemleri"
            deger={program.baslangic_donemleri.length > 0
              ? program.baslangic_donemleri
                  .map((d) => BASLANGIC_DONEMLERI.find((x) => x.kod === d)?.ad ?? d)
                  .join(', ')
              : null}
          />

          <hr className="ayrac" />
          <h3 className="alt-s">Rekabet</h3>
          <Deger
            etiket="Kontenjan"
            deger={program.kontenjan !== null ? `${program.kontenjan} kişi` : null}
          />
          <Deger etiket="Kabul oranı" deger={program.kabul_orani} />
          <Deger etiket="Rekabet notu" deger={program.rekabet_not} cokSatir />
        </section>
      </div>

      {/* ══════════════════════════ toplam maliyet ═══════════════════════ */}
      <section className="kart alt-m">
        <h2 className="alt-m">Toplam net maliyet</h2>
        <MaliyetOzeti program={program} kur={kur} />
      </section>

      {/* ═══════════════════════════ uygunluk kapısı ═══════════════════ */}
      <section className="kart alt-m">
        <div className="kart-baslik">
          <h2>Uygunluk</h2>
          <UygunlukRozeti kod={program.uygunluk} />
        </div>

        {program.on_kosullar.length > 0 ? (
          <div className="alt-m">
            <div className="k2 soluk-2 alt-s">Ön koşullar</div>
            <KosulEtiketleri kodlar={program.on_kosullar} />
          </div>
        ) : (
          <p className="k2 soluk-2">Ön koşul işaretlenmemiş.</p>
        )}

        <Deger etiket="Ön koşul ayrıntısı" deger={program.on_kosul_detay} cokSatir />
        <Deger etiket="Uygunluk notun" deger={program.uygunluk_not} cokSatir />

        <div className="izgara izgara-3 ust-m">
          <div>
            <div className="k2 soluk-2">Dil şartı</div>
            <div className="k1">{program.dil_sarti || <span className="soluk-2">eksik</span>}</div>
          </div>
          <div>
            <div className="k2 soluk-2">Not ortalaması</div>
            <div className="k1">
              {program.not_ortalamasi || <span className="soluk-2">eksik</span>}
            </div>
          </div>
          <div>
            <div className="k2 soluk-2">İş deneyimi</div>
            <div className="k1">
              {program.is_deneyimi || <span className="soluk-2">eksik</span>}
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════ belgeler ═════════════════════════ */}
      <section className="kart alt-m">
        <div className="kart-baslik">
          <h2>İstenen belgeler</h2>
          {/* `program.belgeler` burada AÇIKÇA geçiyor: alan kapsama denetimi
              (npm run dogrula) yardımcı fonksiyonun içini göremiyor ve bu
              satır silinince alanın kaybolduğunu haklı olarak bildiriyor. */}
          <span className="etiket">{program.belgeler.length} belge</span>
        </div>
        <BelgeKontrolListesi programId={program.id} belgeler={belgeListesi} />
        <Deger etiket="Belge ayrıntısı" deger={program.belge_detay} cokSatir />
      </section>

      <div className="izgara izgara-2 alt-m">
        {/* ══════════════════════════════ burs ══════════════════════════ */}
        <section className="kart">
          <h2 className="alt-m">Burs</h2>
          <Deger
            etiket="İlgili burslar"
            deger={program.ilgili_burslar.length > 0 ? program.ilgili_burslar.join(', ') : null}
          />
          <Deger
            etiket="Beklenen burs tutarı"
            deger={program.burs_tahmini !== null
              ? <Para tutar={program.burs_tahmini} birim={program.burs_tahmini_para} />
              : null}
            ipucu="Toplam maliyetten düşülüyor."
          />
          <Deger etiket="Bursun para birimi" deger={program.burs_tahmini_para} />
          <Deger etiket="Burs notu" deger={program.burs_notu} cokSatir />
          {/* Burslar ayrı bir uygulamada tutuluyorsa oraya köprü. Adres
              NEXT_PUBLIC_BURS_APP_URL ile veriliyor; tanımlı değilse bu
              satır hiç çizilmiyor (sabit bir adrese bağlanmasın). */}
          {process.env.NEXT_PUBLIC_BURS_APP_URL && (
            <p className="k2 soluk-2 ust-s">
              Bursların ayrıntısı ayrı uygulamada:{' '}
              <a href={process.env.NEXT_PUBLIC_BURS_APP_URL}
                 target="_blank" rel="noopener noreferrer">
                burs takip ↗
              </a>
            </p>
          )}
        </section>

        {/* ════════════════════════════ kariyer ════════════════════════ */}
        <section className="kart">
          <h2 className="alt-m">Kariyer</h2>
          <Deger etiket="Staj zorunlu mu" deger={<EvetHayir deger={program.staj_zorunlu} />} />
          <Deger etiket="Mezun istihdamı" deger={program.mezun_istihdam} cokSatir />
          <Deger etiket="Kariyer notu" deger={program.kariyer_not} cokSatir />
        </section>
      </div>

      {program.notlar && (
        <section className="kart alt-m">
          <h2 className="alt-m">Notlar</h2>
          <div className="ham-metin">{program.notlar}</div>
        </section>
      )}

      {program.ham_metin && (
        <section className="kart alt-m">
          <h2 className="alt-m">Kaydedilen ham metin</h2>
          <div className="ham-metin">{program.ham_metin}</div>
        </section>
      )}

      <section className="kart alt-m basma-gizle">
        <h2 className="alt-m">Hızlı güncelleme</h2>
        <HizliDurum
          id={program.id}
          durum={program.durum}
          oncelik={program.oncelik}
          uygunluk={program.uygunluk}
        />
      </section>

      <p className="k2 soluk-2">
        Eklendi {tarihFormat(program.olusturma.slice(0, 10))}
        {' · '}
        Güncellendi {tarihFormat(program.guncelleme.slice(0, 10))}
      </p>
    </main>
  )
}
