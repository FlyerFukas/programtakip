'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  BOS_SUZGEC, SIRALAMALAR, TARIH_KISAYOLLARI,
  urldenSuzgec, suzgecSorgusu, suzgecUygula, siralamaUygula,
  suzgecAktif, suzgecSayisi, paraBirimleri, ogretimDilleri,
  type Suzgec, type SiralamaKodu,
} from '@/lib/suzgec'
import {
  DURUMLAR, UYGUNLUKLAR, BELGELER, ON_KOSULLAR, UCRET_DONEMLERI,
} from '@/lib/sabitler'
import { bayrak, ulkeAdi } from '@/lib/ulkeler'
import { siradakiTur, sonTarihMetni, turUyarisi, tarihKisa } from '@/lib/tarih'
import {
  DurumRozeti, OncelikRozeti, UygunlukRozeti, GeriSayim, seritSinifi,
  BelgeEtiketleri, KosulEtiketleri, EtiketListesi, Para, BosDurum,
} from '@/bilesenler/Rozetler'
import { MaliyetOzeti } from '@/bilesenler/MaliyetOzeti'
import type { ProgramGenis, Ulke, KurAyari } from '@/lib/tipler'

/**
 * Program listesi + süzgeç.
 *
 * Bütün liste sunucudan tek seferde geliyor, süzme burada yapılıyor
 * (PROJE.md §6.5). Süzgeç durumu URL'ye yazılıyor: geri tuşu çalışıyor ve
 * "Danimarka'da IELTS isteyen programlar" bir bağlantıya sığıyor.
 *
 * Arama kutusu GECİKMELİ yazıyor: her tuş vuruşunda adres çubuğunu
 * güncellemek tarayıcı geçmişini çöpe çeviriyor ve yazarken takılma
 * hissi veriyor.
 */
export function ProgramlarIstemci({
  programlar,
  ulkeler,
  kur,
}: {
  programlar: ProgramGenis[]
  ulkeler: Pick<Ulke, 'kod' | 'ad'>[]
  kur: KurAyari
}) {
  const router = useRouter()
  const yol = usePathname()
  const sp = useSearchParams()

  const suzgec = useMemo(() => urldenSuzgec(new URLSearchParams(sp.toString())), [sp])
  const [panelAcik, setPanelAcik] = useState(false)
  const [aramaYazisi, setAramaYazisi] = useState(suzgec.ara)

  /** URL dışarıdan değişirse (geri tuşu, paylaşılan bağlantı) kutuyu eşitle. */
  useEffect(() => { setAramaYazisi(suzgec.ara) }, [suzgec.ara])

  function yaz(yeni: Suzgec) {
    const q = suzgecSorgusu(yeni)
    router.replace(q ? `${yol}?${q}` : yol, { scroll: false })
  }

  function guncelle(parca: Partial<Suzgec>) {
    yaz({ ...suzgec, ...parca })
  }

  /** Çoklu seçim listelerinde bir kodu aç/kapa. */
  function degistir(alan: 'ulke' | 'uygunluk' | 'durum' | 'belge' | 'kosul' | 'dil', kod: string) {
    const mevcut = suzgec[alan]
    guncelle({
      [alan]: mevcut.includes(kod) ? mevcut.filter((x) => x !== kod) : [...mevcut, kod],
    } as Partial<Suzgec>)
  }

  // Arama kutusu: yazarken bekle, sonra URL'ye yaz.
  useEffect(() => {
    if (aramaYazisi === suzgec.ara) return
    const z = setTimeout(() => guncelle({ ara: aramaYazisi }), 300)
    return () => clearTimeout(z)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aramaYazisi])

  const suzulmus = useMemo(
    () => siralamaUygula(
      suzgecUygula(programlar, suzgec, kur.kurlar),
      suzgec.sirala,
      kur.kurlar,
    ),
    [programlar, suzgec, kur],
  )

  const diller = useMemo(() => ogretimDilleri(programlar), [programlar])
  const paralar = useMemo(() => paraBirimleri(programlar), [programlar])

  const supheli = suzulmus.filter((p) => p.uygunluk === 'supheli')
  const bakilmamis = suzulmus.filter((p) => p.uygunluk === 'bilinmiyor')
  const turRiski = suzulmus.filter((p) => turUyarisi(p) !== null)

  const aktif = suzgecAktif(suzgec)
  const sayi = suzgecSayisi(suzgec)

  /* Süzgeçte kullanılan kodların yalnızca veride GEÇENleri gösteriliyor —
     hiç program içermeyen bir filtreyi listelemek boş sonuç üretmekten
     başka bir işe yaramıyor. */
  const gecenBelgeler = useMemo(() => {
    const k = new Set(programlar.flatMap((p) => p.belgeler))
    return BELGELER.filter((b) => k.has(b.kod))
  }, [programlar])

  const gecenKosullar = useMemo(() => {
    const k = new Set(programlar.flatMap((p) => p.on_kosullar))
    return ON_KOSULLAR.filter((x) => k.has(x.kod))
  }, [programlar])

  const gecenUlkeler = useMemo(() => {
    const k = new Set(programlar.map((p) => p.universite.ulke_kodu))
    return ulkeler.filter((u) => k.has(u.kod))
  }, [programlar, ulkeler])

  return (
    <>
      <div className="satir-arasi satir-sar alt-m">
        <div>
          <h1>Programlar</h1>
          <p className="soluk k1 ust-s bosluk-0">
            {programlar.length === 0
              ? 'Henüz program eklenmedi.'
              : aktif
                ? `${suzulmus.length} / ${programlar.length} program gösteriliyor`
                : `${programlar.length} program`}
          </p>
        </div>
        <div className="satir satir-sar">
          <Link href="/ekle" className="dugme">Metinden ekle</Link>
          <Link href="/programlar/yeni" className="dugme dugme-ana">＋ Program ekle</Link>
        </div>
      </div>

      {/* ══════════════════════════════ süzgeç ══════════════════════════ */}
      {programlar.length > 0 && (
        <section className="kart alt-m basma-gizle">
          <div className="satir satir-sar" style={{ gap: 8 }}>
            <input
              type="search"
              value={aramaYazisi}
              onChange={(e) => setAramaYazisi(e.target.value)}
              placeholder="Ara: program, üniversite, şehir, alan, not…"
              className="buyu"
              aria-label="Programlarda ara"
              style={{ minWidth: 180 }}
            />

            <select
              value={suzgec.sirala}
              onChange={(e) => guncelle({ sirala: e.target.value as SiralamaKodu })}
              aria-label="Sıralama"
              style={{ width: 'auto' }}
            >
              {SIRALAMALAR.map((s) => (
                <option key={s.kod} value={s.kod} title={s.aciklama}>{s.ad}</option>
              ))}
            </select>

            <button
              type="button"
              className={`dugme ${sayi > 0 ? 'dugme-ana' : ''}`}
              onClick={() => setPanelAcik((a) => !a)}
              aria-expanded={panelAcik}
            >
              Süzgeç{sayi > 0 ? ` (${sayi})` : ''} {panelAcik ? '▲' : '▼'}
            </button>

            {aktif && (
              <button type="button" className="dugme dugme-sade" onClick={() => yaz(BOS_SUZGEC)}>
                Temizle
              </button>
            )}
          </div>

          {panelAcik && (
            <div className="ust-m">
              {/* ── son tarih penceresi ── */}
              <div className="alan">
                <span className="alan-etiket">Son tarih — bu süre içinde kapananlar</span>
                <div className="secim-liste">
                  {TARIH_KISAYOLLARI.map((t) => (
                    <button
                      key={t.kod}
                      type="button"
                      className="secim"
                      aria-pressed={suzgec.son === t.kod}
                      onClick={() => guncelle({ son: suzgec.son === t.kod ? null : t.kod })}
                      style={suzgec.son === t.kod ? SECILI : undefined}
                    >
                      {t.ad}
                    </button>
                  ))}
                </div>
                <span className="alan-ipucu">
                  Bağlantıya <code>?son=+30</code> olarak yazılıyor — göreli olduğu
                  için kaydettiğin bağlantı yarın da doğru. Tarihi olmayan
                  programlar bu süzgeçte görünmez.
                </span>
              </div>

              {/* ── ülke ── */}
              {gecenUlkeler.length > 0 && (
                <div className="alan">
                  <span className="alan-etiket">Ülke</span>
                  <div className="secim-liste">
                    {gecenUlkeler.map((u) => (
                      <button
                        key={u.kod} type="button" className="secim"
                        aria-pressed={suzgec.ulke.includes(u.kod)}
                        onClick={() => degistir('ulke', u.kod)}
                        style={suzgec.ulke.includes(u.kod) ? SECILI : undefined}
                      >
                        <span aria-hidden>{bayrak(u.kod)}</span> {u.ad}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── uygunluk ── */}
              <div className="alan">
                <span className="alan-etiket">Uygunluk</span>
                <div className="secim-liste">
                  {UYGUNLUKLAR.map((u) => (
                    <button
                      key={u.kod} type="button" className="secim" title={u.aciklama}
                      aria-pressed={suzgec.uygunluk.includes(u.kod)}
                      onClick={() => degistir('uygunluk', u.kod)}
                      style={suzgec.uygunluk.includes(u.kod) ? SECILI : undefined}
                    >
                      <span aria-hidden>{u.simge}</span> {u.ad}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── durum ── */}
              <div className="alan">
                <span className="alan-etiket">Süreç durumu</span>
                <div className="secim-liste">
                  {DURUMLAR.map((d) => (
                    <button
                      key={d.kod} type="button" className="secim" title={d.aciklama}
                      aria-pressed={suzgec.durum.includes(d.kod)}
                      onClick={() => degistir('durum', d.kod)}
                      style={suzgec.durum.includes(d.kod) ? SECILI : undefined}
                    >
                      <span aria-hidden>{d.simge}</span> {d.ad}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── belgeler ── */}
              {gecenBelgeler.length > 0 && (
                <div className="alan">
                  <span className="alan-etiket">İstenen belgeler</span>
                  <div className="secim-liste">
                    {gecenBelgeler.map((b) => (
                      <button
                        key={b.kod} type="button" className="secim" title={b.aciklama}
                        aria-pressed={suzgec.belge.includes(b.kod)}
                        onClick={() => degistir('belge', b.kod)}
                        style={suzgec.belge.includes(b.kod) ? SECILI : undefined}
                      >
                        <span aria-hidden>{b.simge}</span> {b.ad}
                      </button>
                    ))}
                  </div>
                  <span className="alan-ipucu">
                    Birden fazla seçersen <strong>hepsini birden</strong> isteyen
                    programlar kalır.
                  </span>
                </div>
              )}

              {/* ── ön koşullar ── */}
              {gecenKosullar.length > 0 && (
                <div className="alan">
                  <span className="alan-etiket">Ön koşullar</span>
                  <div className="secim-liste">
                    {gecenKosullar.map((k) => (
                      <button
                        key={k.kod} type="button" className="secim" title={k.aciklama}
                        aria-pressed={suzgec.kosul.includes(k.kod)}
                        onClick={() => degistir('kosul', k.kod)}
                        style={suzgec.kosul.includes(k.kod) ? SECILI : undefined}
                      >
                        <span aria-hidden>{k.simge}</span> {k.ad}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── öğretim dili ── */}
              {diller.length > 0 && (
                <div className="alan">
                  <span className="alan-etiket">Öğretim dili</span>
                  <div className="secim-liste">
                    {diller.map((d) => (
                      <button
                        key={d} type="button" className="secim"
                        aria-pressed={suzgec.dil.includes(d)}
                        onClick={() => degistir('dil', d)}
                        style={suzgec.dil.includes(d) ? SECILI : undefined}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── ücret ── */}
              <div className="alan">
                <span className="alan-etiket">Öğrenim ücreti aralığı</span>
                <div className="satir satir-sar">
                  <input
                    type="number" min={0} step={500}
                    value={suzgec.ucretMin ?? ''}
                    onChange={(e) => guncelle({
                      ucretMin: e.target.value === '' ? null : Number(e.target.value),
                    })}
                    placeholder="en az"
                    aria-label="En az ücret"
                    style={{ width: 120 }}
                  />
                  <span className="soluk-2">–</span>
                  <input
                    type="number" min={0} step={500}
                    value={suzgec.ucretMax ?? ''}
                    onChange={(e) => guncelle({
                      ucretMax: e.target.value === '' ? null : Number(e.target.value),
                    })}
                    placeholder="en çok"
                    aria-label="En çok ücret"
                    style={{ width: 120 }}
                  />
                </div>
                <span className="alan-ipucu">
                  <strong>EUR cinsinden.</strong>{' '}
                  {paralar.length > 1
                    ? `Listede ${paralar.join(', ')} var; hepsi ${kur.tarih} kurlarıyla EUR'ya çevrilip karşılaştırılıyor.`
                    : `Kurlar ${kur.tarih} tarihli.`}
                  {' '}Ücreti ya da para birimi girilmemiş programlar bu süzgeçte
                  görünmez — eksik veri sıfır sayılmıyor.
                </span>
              </div>

              {/* ── gizlenenler ── */}
              <div className="alan">
                <span className="alan-etiket">Varsayılan olarak gizlenenler</span>
                <div className="secim-liste">
                  <button
                    type="button" className="secim"
                    aria-pressed={suzgec.kapaliGoster}
                    onClick={() => guncelle({ kapaliGoster: !suzgec.kapaliGoster })}
                    style={suzgec.kapaliGoster ? SECILI : undefined}
                  >
                    Kapanmışları da göster
                  </button>
                  <button
                    type="button" className="secim"
                    aria-pressed={suzgec.uygunsuzGoster}
                    onClick={() => guncelle({ uygunsuzGoster: !suzgec.uygunsuzGoster })}
                    style={suzgec.uygunsuzGoster ? SECILI : undefined}
                  >
                    Uygun olmayanları da göster
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ══════════════════════════════ uyarılar ═══════════════════════ */}
      {turRiski.length > 0 && (
        <div className="uyari uyari-dikkat alt-m">
          <span aria-hidden>⚠</span>
          <span>
            <strong>{turRiski.length} programda</strong> senin turun merkezî
            tarihten önce kapanıyor. Geri sayım turuna göre yapılıyor; merkezî
            alandaki tarih büyük ihtimalle AB turunun tarihi — kaydı bir kontrol et.
          </span>
        </div>
      )}

      {supheli.length > 0 && (
        <div className="uyari uyari-dikkat alt-m">
          <span aria-hidden>🟡</span>
          <span>
            <strong>{supheli.length} program</strong> &quot;şüpheli&quot; işaretli —
            transkriptini kontrol et.
          </span>
        </div>
      )}

      {bakilmamis.length > 0 && (
        <div className="uyari uyari-bilgi alt-m">
          <span aria-hidden>⚪</span>
          <span>
            <strong>{bakilmamis.length} programın</strong> uygunluğuna hiç
            bakılmamış. Başvurmadan önce eleneceğini görmek, sonradan
            öğrenmekten iyi.
          </span>
        </div>
      )}

      {/* ══════════════════════════════ liste ══════════════════════════ */}
      {programlar.length === 0 ? (
        <div className="kart">
          <BosDurum
            simge="🎓"
            baslik="Program listesi boş"
            aciklama="Başvuru birimi burası: son tarih, öğrenim ücreti, ön koşullar ve istenen belgeler programın kaydında tutuluyor. Program bir üniversiteye, üniversite bir ülkeye bağlı."
          >
            <div className="satir satir-sar" style={{ justifyContent: 'center' }}>
              <Link href="/programlar/yeni" className="dugme dugme-ana">İlk programı ekle</Link>
              <Link href="/universiteler" className="dugme">Önce üniversitelere bak</Link>
            </div>
          </BosDurum>
        </div>
      ) : suzulmus.length === 0 ? (
        <div className="kart">
          <BosDurum
            simge="🔍"
            baslik="Bu süzgeçle eşleşen program yok"
            aciklama={`${programlar.length} program var ama hiçbiri seçtiğin ölçütleri karşılamıyor. Bir ölçütü kaldırmayı dene.`}
          >
            <button type="button" className="dugme dugme-ana" onClick={() => yaz(BOS_SUZGEC)}>
              Süzgeci temizle
            </button>
          </BosDurum>
        </div>
      ) : (
        <div className="izgara izgara-2">
          {suzulmus.map((p) => <ProgramKarti key={p.id} program={p} kur={kur} />)}
        </div>
      )}
    </>
  )
}

const SECILI = {
  background: 'var(--vurgu-soluk)',
  borderColor: 'var(--vurgu)',
  color: 'var(--vurgu)',
  fontWeight: 580,
} as const

function ProgramKarti({ program: p, kur }: { program: ProgramGenis; kur: KurAyari }) {
  const tur = siradakiTur(p)
  const donem = UCRET_DONEMLERI.find((u) => u.kod === p.ogrenim_ucreti_donem)
  /** Turun tarihi merkezî tarihten farklıysa ikisini de göster. */
  const merkezliFark =
    Boolean(tur?.son_tarih)
    && (p.son_tarih_tipi === 'kesin' || p.son_tarih_tipi === 'aralik')

  return (
    <Link
      href={`/programlar/${p.id}`}
      className={`kart ${seritSinifi(p)}`}
      style={{ display: 'block', color: 'inherit' }}
    >
      <div className="satir-arasi" style={{ alignItems: 'flex-start' }}>
        <div className="buyu">
          <h3 className="iki-satir">{p.ad}</h3>
          <div className="k2 soluk ust-s tek-satir">
            <span aria-hidden>{bayrak(p.universite.ulke_kodu)}</span>{' '}
            {p.universite.ad}
            {p.universite.sehir ? ` · ${p.universite.sehir}` : ''}
            {` · ${ulkeAdi(p.universite.ulke_kodu)}`}
          </div>
        </div>
        <OncelikRozeti oncelik={p.oncelik} />
      </div>

      <div className="satir satir-sar ust-m" style={{ gap: 6 }}>
        <GeriSayim program={p} />
        <UygunlukRozeti kod={p.uygunluk} />
        <DurumRozeti kod={p.durum} />
        <EtiketListesi etiketler={p.etiketler} />
      </div>

      {/*
        Turun KENDİ tarihi yazılıyor, programın merkezî tarihi değil. İlk
        yazımda `sonTarihMetni(p)` kullanılmıştı ve kart "AB/AEA dışı ·
        28 Ekim" diyordu — turun adını merkezî tarihle eşleştiren, tam da
        önlemeye çalıştığımız karışıklık.
      */}
      <div className="k2 soluk ust-m">
        {tur?.son_tarih ? (
          <>
            <strong>{tur.ad}</strong> · {tarihKisa(tur.son_tarih)}
            {merkezliFark && (
              <span className="soluk-2"> · merkezî tarih {sonTarihMetni(p)}</span>
            )}
          </>
        ) : (
          sonTarihMetni(p)
        )}
      </div>

      <div className="izgara izgara-3 ust-m" style={{ gap: 8 }}>
        <Olcu
          etiket="Yıllık ücret"
          deger={p.ogrenim_ucreti !== null
            ? <>
                <Para tutar={p.ogrenim_ucreti} birim={p.para_birimi} />
                {donem && donem.kod !== 'yillik' && (
                  <span className="k2 soluk-2"> /{donem.ad.toLowerCase()}</span>
                )}
              </>
            : null}
        />
        <Olcu etiket="Süre" deger={p.sure_ay !== null ? `${p.sure_ay} ay` : null} />
        {/* Toplam net maliyet — eksik kalem varsa "≥" ile ve ipucunda
            hangilerinin eksik olduğuyla birlikte (PROJE.md §4.6). */}
        <Olcu etiket="Toplam maliyet" deger={<MaliyetOzeti program={p} kur={kur} sade />} />
      </div>

      {(p.belgeler.length > 0 || p.on_kosullar.length > 0) && (
        <div className="ust-m" style={{ display: 'grid', gap: 6 }}>
          {p.on_kosullar.length > 0 && <KosulEtiketleri kodlar={p.on_kosullar} enFazla={3} />}
          {p.belgeler.length > 0 && <BelgeEtiketleri kodlar={p.belgeler} enFazla={4} />}
        </div>
      )}
    </Link>
  )
}

/**
 * Kartın alt şeridindeki tek ölçü.
 *
 * Veri yoksa "0" değil açıkça "eksik" yazıyor: eksik veriyi sıfır göstermek
 * PROJE.md §4.6'da yasak, çünkü kararı bozan bir yalan üretiyor.
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
