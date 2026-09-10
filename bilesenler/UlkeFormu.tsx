'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { ulkeKaydet, type EylemSonucu } from '@/app/eylemler'
import {
  DURUMLAR, ONCELIKLER, PARA_BIRIMLERI, VARSAYILAN_DURUM,
} from '@/lib/sabitler'
import { ulkelerBolgeye, ulkeAdi, bayrak } from '@/lib/ulkeler'
import type { Ulke } from '@/lib/tipler'

/**
 * Ülke ekleme / düzenleme formu.
 *
 * Ağırlık merkezi GÖÇ YOLU bölümü: Kullanıcının hedefi diploma değil, o ülkede
 * kalabilmek (PROJE.md §1). Sıralaması yüksek ama mezuniyet sonrası çalışma
 * izni vermeyen bir ülke ona göre kötü bir ülkedir; form da o sırayla
 * dizilmiş — göç yolu en üstte, süreç notları en altta.
 */

type Props = { ulke?: Ulke }

function Gonder({ duzenleme }: { duzenleme: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="dugme dugme-ana" disabled={pending}>
      {pending ? 'Kaydediliyor…' : duzenleme ? 'Değişiklikleri kaydet' : 'Ülkeyi kaydet'}
    </button>
  )
}

/** Üç durumlu alanlar (evet / hayır / bilinmiyor) için ortak radyo grubu. */
function UcluSecim({
  ad, deger, etiketEvet = 'Evet', etiketHayir = 'Hayır',
}: {
  ad: string
  deger: boolean | null | undefined
  etiketEvet?: string
  etiketHayir?: string
}) {
  const secili = deger === true ? 'evet' : deger === false ? 'hayir' : ''
  return (
    <div className="secim-liste">
      {[
        { d: 'evet', ad: etiketEvet, simge: '✓' },
        { d: 'hayir', ad: etiketHayir, simge: '✗' },
        { d: '', ad: 'Bilinmiyor', simge: '?' },
      ].map((s) => (
        <label key={s.d || 'bos'} className="secim">
          <input type="radio" name={ad} value={s.d} defaultChecked={secili === s.d} />
          <span aria-hidden>{s.simge}</span>
          {s.ad}
        </label>
      ))}
    </div>
  )
}

export function UlkeFormu({ ulke }: Props) {
  const [sonuc, eylem] = useActionState<EylemSonucu, FormData>(ulkeKaydet, {})
  const duzenleme = Boolean(ulke)
  const hatalar = sonuc.hatalar ?? {}

  /*
   * Kod ve ad birlikte yürüyor: katalogdan ülke seçilince ad kendiliğinden
   * doluyor. Ama ad SERBEST kalıyor — Kullanıcı "Hollanda" yerine "Hollanda
   * (Randstad)" yazmak isteyebilir. O yüzden yalnızca kullanıcı adı elle
   * değiştirmediyse üstüne yazılıyor.
   */
  const [kod, setKod] = useState(ulke?.kod ?? '')
  const [ad, setAd] = useState(ulke?.ad ?? '')

  function kodDegisti(yeni: string) {
    const oncekiKatalogAdi = kod ? ulkeAdi(kod) : ''
    if (!ad.trim() || ad === oncekiKatalogAdi) setAd(yeni ? ulkeAdi(yeni) : '')
    setKod(yeni)
  }

  const bolgeler = ulkelerBolgeye()

  return (
    <form action={eylem}>
      {duzenleme && <input type="hidden" name="duzenleme" value="1" />}
      {/* Düzenlemede kod değiştirilemiyor: birincil anahtar o, değişirse
          kayıt taşınmaz — yeni bir ülke açılır ve eskisi öksüz kalır. */}
      {duzenleme && <input type="hidden" name="kod" value={ulke!.kod} />}

      {sonuc.hata && (
        <div className="uyari uyari-hata alt-m" role="alert">
          <span aria-hidden>⚠</span>
          <span>{sonuc.hata}</span>
        </div>
      )}

      {/* ══════════════════════════════ kimlik ══════════════════════════ */}
      <section className="kart alt-m">
        <h2 className="alt-m">Ülke</h2>

        <div className="izgara izgara-2">
          <div className="alan">
            <label className="alan-etiket" htmlFor="kod">
              Ülke {!duzenleme && <span style={{ color: 'var(--kirmizi)' }}>*</span>}
            </label>
            {duzenleme ? (
              <div className="satir" style={{ gap: 7, paddingTop: 6 }}>
                <span aria-hidden style={{ fontSize: '1.2rem' }}>{bayrak(ulke!.kod)}</span>
                <span className="kalin">{ulkeAdi(ulke!.kod)}</span>
                <span className="etiket">{ulke!.kod}</span>
              </div>
            ) : (
              <select
                id="kod" name="kod" required
                value={kod}
                onChange={(e) => kodDegisti(e.target.value)}
                aria-invalid={hatalar.kod ? 'true' : undefined}
              >
                <option value="">— seç —</option>
                {bolgeler.map((g) => (
                  <optgroup key={g.bolge} label={g.bolge}>
                    {g.ulkeler.map((u) => (
                      <option key={u.kod} value={u.kod}>
                        {bayrak(u.kod)} {u.ad}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
            {hatalar.kod && <span className="alan-hata">{hatalar.kod}</span>}
            {duzenleme && (
              <span className="alan-ipucu">
                Ülke kodu değiştirilemez. Yanlış ülkeyi eklediysen kaydı sil, yenisini ekle.
              </span>
            )}
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="ad">
              Listede görünecek ad <span style={{ color: 'var(--kirmizi)' }}>*</span>
            </label>
            <input
              id="ad" name="ad" type="text" required
              value={ad}
              onChange={(e) => setAd(e.target.value)}
              placeholder="Hollanda"
              aria-invalid={hatalar.ad ? 'true' : undefined}
            />
            {hatalar.ad && <span className="alan-hata">{hatalar.ad}</span>}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ göç yolu ═══════════════════════ */}
      <section className="kart alt-m">
        <h2>Göç yolu</h2>
        <p className="soluk k1 ust-s alt-m">
          Asıl karar ekseni burası: yüksek lisans → çalışma → oturum → mülk.
          Bilmediğin alanı boş bırak — uygulama boşu tahmin etmiyor, &quot;eksik&quot; diye
          gösteriyor.
        </p>

        <div className="izgara izgara-2">
          <div className="alan">
            <label className="alan-etiket" htmlFor="mezuniyet_sonrasi_izin">
              Mezuniyet sonrası çalışma izni
            </label>
            <input
              id="mezuniyet_sonrasi_izin" name="mezuniyet_sonrasi_izin" type="text"
              defaultValue={ulke?.mezuniyet_sonrasi_izin ?? ''}
              placeholder="PGWP 3 yıl / zoekjaar 1 yıl"
            />
            <span className="alan-ipucu">Programın kendisi kadar önemli: iznin yoksa kalamıyorsun.</span>
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="mezuniyet_sonrasi_ay">
              …kaç ay
            </label>
            <input
              id="mezuniyet_sonrasi_ay" name="mezuniyet_sonrasi_ay" type="number"
              min={0} max={240} step={1}
              defaultValue={ulke?.mezuniyet_sonrasi_ay ?? ''}
              placeholder="36"
            />
            <span className="alan-ipucu">Ayrı sayı alanı — ülkeleri buna göre sıralayabilmek için.</span>
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="oturum_yil">
              Daimî oturuma kaç yıl
            </label>
            <input
              id="oturum_yil" name="oturum_yil" type="number"
              min={0} max={60} step={0.5}
              defaultValue={ulke?.oturum_yil ?? ''}
              placeholder="5"
            />
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="vatandaslik_yil">
              Vatandaşlığa kaç yıl
            </label>
            <input
              id="vatandaslik_yil" name="vatandaslik_yil" type="number"
              min={0} max={60} step={0.5}
              defaultValue={ulke?.vatandaslik_yil ?? ''}
              placeholder="10"
            />
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="oturum_dil_sarti">
              Oturum için dil şartı
            </label>
            <input
              id="oturum_dil_sarti" name="oturum_dil_sarti" type="text"
              defaultValue={ulke?.oturum_dil_sarti ?? ''}
              placeholder="B1 Hollandaca"
            />
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="ogrenci_calisma">
              Öğrenciyken çalışma hakkı
            </label>
            <input
              id="ogrenci_calisma" name="ogrenci_calisma" type="text"
              defaultValue={ulke?.ogrenci_calisma ?? ''}
              placeholder="Haftada 20 saat"
            />
          </div>
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="oturum_yolu">Oturum yolu — nasıl işliyor</label>
          <textarea
            id="oturum_yolu" name="oturum_yolu" rows={4}
            defaultValue={ulke?.oturum_yolu ?? ''}
            placeholder="Mezuniyet → arama yılı → çalışma izni → 5 yıl sonra daimî oturum…"
          />
        </div>

        <div className="alan">
          <span className="alan-etiket">Çifte vatandaşlığa izin veriyor mu</span>
          <UcluSecim ad="cifte_vatandaslik" deger={ulke?.cifte_vatandaslik} />
          <span className="alan-ipucu">
            Türkiye izin veriyor; soru karşı tarafın ne dediği.
          </span>
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="mulk_kisiti">Yabancıya mülk kısıtı</label>
          <textarea
            id="mulk_kisiti" name="mulk_kisiti" rows={2}
            defaultValue={ulke?.mulk_kisiti ?? ''}
            placeholder="Oturum izni olmadan konut alınamıyor / kısıt yok…"
          />
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="donus_yukumlulugu">
            Geri dönüş yükümlülüğü
          </label>
          <textarea
            id="donus_yukumlulugu" name="donus_yukumlulugu" rows={2}
            defaultValue={ulke?.donus_yukumlulugu ?? ''}
            placeholder="Yoksa boş bırak."
          />
          <span className="alan-ipucu" style={{ color: 'var(--kirmizi)' }}>
            KIRMIZI ÇİZGİ. Burada bir şey yazarsa ülke listede kırmızı işaretlenir —
            mezuniyetten sonra dönmeyi zorunlu kılan hiçbir kanalla ilgilenmiyorsun.
          </span>
        </div>
      </section>

      {/* ════════════════════════════════ para ═════════════════════════ */}
      <section className="kart alt-m">
        <h2 className="alt-m">Para</h2>

        <div className="izgara izgara-3">
          <div className="alan">
            <label className="alan-etiket" htmlFor="para_birimi">Para birimi</label>
            <select
              id="para_birimi" name="para_birimi"
              defaultValue={ulke?.para_birimi ?? ''}
            >
              <option value="">— seç —</option>
              {PARA_BIRIMLERI.map((p) => (
                <option key={p.kod} value={p.kod}>{p.kod} — {p.ad}</option>
              ))}
            </select>
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="aylik_yasam_gideri">
              Aylık yaşam gideri
            </label>
            <input
              id="aylik_yasam_gideri" name="aylik_yasam_gideri" type="number"
              min={0} step={1}
              defaultValue={ulke?.aylik_yasam_gideri ?? ''}
              placeholder="1100"
            />
            <span className="alan-ipucu">Seçtiğin para birimi cinsinden.</span>
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="blokeli_hesap">Bloke hesap şartı</label>
            <input
              id="blokeli_hesap" name="blokeli_hesap" type="number"
              min={0} step={1}
              defaultValue={ulke?.blokeli_hesap ?? ''}
              placeholder="11904"
            />
            <span className="alan-ipucu">Almanya gibi ülkelerde vize için dondurulan tutar.</span>
          </div>
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="yasam_gideri_not">Yaşam gideri notu</label>
          <textarea
            id="yasam_gideri_not" name="yasam_gideri_not" rows={2}
            defaultValue={ulke?.yasam_gideri_not ?? ''}
            placeholder="Amsterdam'da kira tek başına 900 EUR; taşrada 600…"
          />
        </div>
      </section>

      {/* ═══════════════════════════════ vize / dil ════════════════════ */}
      <section className="kart alt-m">
        <h2 className="alt-m">Vize ve dil</h2>

        <div className="alan">
          <label className="alan-etiket" htmlFor="vize_sureci">Vize süreci</label>
          <textarea
            id="vize_sureci" name="vize_sureci" rows={3}
            defaultValue={ulke?.vize_sureci ?? ''}
            placeholder="Üniversite başvuruyu kendisi yapıyor, 2-4 hafta sürüyor…"
          />
        </div>

        <div className="izgara izgara-2">
          <div className="alan">
            <label className="alan-etiket" htmlFor="vize_maliyet">Vize maliyeti</label>
            <input
              id="vize_maliyet" name="vize_maliyet" type="text"
              defaultValue={ulke?.vize_maliyet ?? ''}
              placeholder="228 EUR + 60 EUR ikamet kartı"
            />
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="ogretim_dili_not">Öğretim / günlük dil</label>
            <input
              id="ogretim_dili_not" name="ogretim_dili_not" type="text"
              defaultValue={ulke?.ogretim_dili_not ?? ''}
              placeholder="Master İngilizce, günlük hayat Danca"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ süreç ═════════════════════════ */}
      <section className="kart alt-m">
        <h2 className="alt-m">Süreç</h2>

        <div className="izgara izgara-2">
          <div className="alan">
            <label className="alan-etiket" htmlFor="durum">Durum</label>
            <select id="durum" name="durum" defaultValue={ulke?.durum ?? VARSAYILAN_DURUM}>
              {DURUMLAR.map((d) => (
                <option key={d.kod} value={d.kod}>{d.simge} {d.ad}</option>
              ))}
            </select>
          </div>

          <div className="alan">
            <span className="alan-etiket">Öncelik</span>
            <div className="secim-liste">
              {ONCELIKLER.map((o) => (
                <label key={o.kod} className="secim">
                  <input
                    type="radio" name="oncelik" value={o.kod}
                    defaultChecked={(ulke?.oncelik ?? 2) === o.kod}
                  />
                  <span aria-hidden>{o.simge}</span>
                  {o.ad}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="elenme_sebebi">Elenme sebebi</label>
          <textarea
            id="elenme_sebebi" name="elenme_sebebi" rows={2}
            defaultValue={ulke?.elenme_sebebi ?? ''}
            placeholder="Devlet bursu yok + AB dışına tam ücret"
          />
          <span className="alan-ipucu">
            Elediysen sebebini yaz. Kayıt silinmiyor — altı ay sonra &quot;bunu neden
            elemiştim&quot; diye sormamak için.
          </span>
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="kaynak_link">Kaynak bağlantısı</label>
          <input
            id="kaynak_link" name="kaynak_link" type="text"
            defaultValue={ulke?.kaynak_link ?? ''}
            placeholder="ind.nl/en/residence-permits"
          />
          <span className="alan-ipucu">Başında https:// olmasa da olur.</span>
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="etiketler">Etiketler</label>
          <input
            id="etiketler" name="etiketler" type="text"
            defaultValue={ulke?.etiketler.join(', ') ?? ''}
            placeholder="ab, iskandinavya, ucretsiz-master"
          />
          <span className="alan-ipucu">Virgülle ayır.</span>
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="notlar">Notlar</label>
          <textarea
            id="notlar" name="notlar" rows={4}
            defaultValue={ulke?.notlar ?? ''}
            placeholder="Aklında kalsın istediğin her şey."
          />
        </div>
      </section>

      <div className="satir satir-sar" style={{ justifyContent: 'flex-end' }}>
        <Link href={ulke ? `/ulkeler/${ulke.kod}` : '/ulkeler'} className="dugme">
          Vazgeç
        </Link>
        <Gonder duzenleme={duzenleme} />
      </div>
    </form>
  )
}
