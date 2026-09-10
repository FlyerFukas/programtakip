'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { universiteKaydet, type EylemSonucu } from '@/app/eylemler'
import {
  DURUMLAR, ONCELIKLER, PARA_BIRIMLERI, UNIVERSITE_TURLERI, VARSAYILAN_DURUM,
} from '@/lib/sabitler'
import { bayrak } from '@/lib/ulkeler'
import type { Universite, Ulke } from '@/lib/tipler'

/**
 * Üniversite ekleme / düzenleme formu.
 *
 * Buradaki alanların hepsi o üniversitedeki BÜTÜN programlar için ortak:
 * şehir, sıralama, başvuru platformu, başvuru ücreti, depozito. Düz tabloda
 * her programa tekrar yazılırdı; burada tek yerde duruyor ve tek yerden
 * güncelleniyor (PROJE.md §4.1).
 *
 * Ülke listesi ISO kataloğundan DEĞİL, kayıtlı ülkelerden geliyor: yabancı
 * anahtar öyle istiyor ve zaten "önce ülkeyi değerlendir, sonra okullarına
 * bak" sırası doğru sıra.
 */

type Props = {
  universite?: Universite
  /** Kayıtlı ülkeler — açılır listenin kaynağı. */
  ulkeler: Pick<Ulke, 'kod' | 'ad'>[]
  /** Ayrıştırıcıdan gelen ham metin (Aşama 10/11). Düzenlemede mevcut değer korunur. */
  hamMetin?: string
}

function Gonder({ duzenleme }: { duzenleme: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="dugme dugme-ana" disabled={pending}>
      {pending ? 'Kaydediliyor…' : duzenleme ? 'Değişiklikleri kaydet' : 'Üniversiteyi kaydet'}
    </button>
  )
}

function UcluSecim({ ad, deger }: { ad: string; deger: boolean | null | undefined }) {
  const secili = deger === true ? 'evet' : deger === false ? 'hayir' : ''
  return (
    <div className="secim-liste">
      {[
        { d: 'evet', ad: 'Evet', simge: '✓' },
        { d: 'hayir', ad: 'Hayır', simge: '✗' },
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

export function UniversiteFormu({ universite, ulkeler, hamMetin }: Props) {
  const [sonuc, eylem] = useActionState<EylemSonucu, FormData>(universiteKaydet, {})
  const duzenleme = Boolean(universite)
  const hatalar = sonuc.hatalar ?? {}

  if (ulkeler.length === 0) {
    return (
      <div className="kart">
        <div className="uyari uyari-dikkat">
          <span aria-hidden>⚠</span>
          <span>
            Önce en az bir ülke eklemen gerekiyor — üniversite bir ülkeye bağlı
            kaydediliyor. <Link href="/ulkeler/yeni">Ülke ekle →</Link>
          </span>
        </div>
      </div>
    )
  }

  return (
    <form action={eylem}>
      {universite && <input type="hidden" name="id" value={universite.id} />}
      {/* Ham metin gizli taşınıyor: düzenlerken sıfırlanmasın, ayrıştırıcı
          bir şeyi kaçırdıysa kaynağa dönebilelim (PROJE.md §6.7). */}
      <input type="hidden" name="ham_metin" value={hamMetin ?? universite?.ham_metin ?? ''} />

      {sonuc.hata && (
        <div className="uyari uyari-hata alt-m" role="alert">
          <span aria-hidden>⚠</span>
          <span>{sonuc.hata}</span>
        </div>
      )}

      {/* ══════════════════════════════ kimlik ══════════════════════════ */}
      <section className="kart alt-m">
        <h2 className="alt-m">Üniversite</h2>

        <div className="alan">
          <label className="alan-etiket" htmlFor="ad">
            Adı <span style={{ color: 'var(--kirmizi)' }}>*</span>
          </label>
          <input
            id="ad" name="ad" type="text" required
            defaultValue={universite?.ad ?? ''}
            placeholder="Universiteit van Amsterdam"
            aria-invalid={hatalar.ad ? 'true' : undefined}
          />
          {hatalar.ad && <span className="alan-hata">{hatalar.ad}</span>}
          <span className="alan-ipucu">
            Resmî adını yaz — aynı ülkede aynı ada ikinci kayıt açılamıyor.
          </span>
        </div>

        <div className="izgara izgara-3">
          <div className="alan">
            <label className="alan-etiket" htmlFor="ulke_kodu">
              Ülke <span style={{ color: 'var(--kirmizi)' }}>*</span>
            </label>
            <select
              id="ulke_kodu" name="ulke_kodu" required
              defaultValue={universite?.ulke_kodu ?? ''}
              aria-invalid={hatalar.ulke_kodu ? 'true' : undefined}
            >
              <option value="">— seç —</option>
              {ulkeler.map((u) => (
                <option key={u.kod} value={u.kod}>{bayrak(u.kod)} {u.ad}</option>
              ))}
            </select>
            {hatalar.ulke_kodu && <span className="alan-hata">{hatalar.ulke_kodu}</span>}
            <span className="alan-ipucu">Yalnızca kayıtlı ülkeler listeleniyor.</span>
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="sehir">Şehir</label>
            <input
              id="sehir" name="sehir" type="text"
              defaultValue={universite?.sehir ?? ''}
              placeholder="Amsterdam"
            />
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="tur">Türü</label>
            <select id="tur" name="tur" defaultValue={universite?.tur ?? ''}>
              <option value="">— seç —</option>
              {UNIVERSITE_TURLERI.map((t) => (
                <option key={t.kod} value={t.kod}>{t.ad}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="ogretim_dili">Öğretim dilleri</label>
          <input
            id="ogretim_dili" name="ogretim_dili" type="text"
            defaultValue={universite?.ogretim_dili.join(', ') ?? ''}
            placeholder="İngilizce, Hollandaca"
          />
          <span className="alan-ipucu">Virgülle ayır. Programın kendi dili ayrı bir alan.</span>
        </div>
      </section>

      {/* ═══════════════════════════════ sıralama ══════════════════════ */}
      <section className="kart alt-m">
        <h2>Sıralama</h2>
        <p className="soluk k1 ust-s alt-m">
          Alan sıralaması genel sıralamadan daha çok işine yarıyor: istatistik
          ya da sosyoloji sıralamasında ilk 50&apos;de olan bir okul, genel
          sıralamada 300. olabilir.
        </p>

        <div className="izgara izgara-3">
          <div className="alan">
            <label className="alan-etiket" htmlFor="qs_sirasi">QS sırası</label>
            <input
              id="qs_sirasi" name="qs_sirasi" type="number" min={1} max={5000} step={1}
              defaultValue={universite?.qs_sirasi ?? ''}
              placeholder="53"
            />
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="the_sirasi">THE sırası</label>
            <input
              id="the_sirasi" name="the_sirasi" type="number" min={1} max={5000} step={1}
              defaultValue={universite?.the_sirasi ?? ''}
              placeholder="61"
            />
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="alan_sirasi">Alan sırası</label>
            <input
              id="alan_sirasi" name="alan_sirasi" type="number" min={1} max={5000} step={1}
              defaultValue={universite?.alan_sirasi ?? ''}
              placeholder="18"
            />
          </div>
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="siralama_not">Sıralama notu</label>
          <input
            id="siralama_not" name="siralama_not" type="text"
            defaultValue={universite?.siralama_not ?? ''}
            placeholder="QS Sociology 2026: 18. sıra"
          />
          <span className="alan-ipucu">Hangi sıralama, hangi yıl, hangi alan.</span>
        </div>
      </section>

      {/* ═══════════════════════════════ başvuru ═══════════════════════ */}
      <section className="kart alt-m">
        <h2>Başvuru ve ücretler</h2>
        <p className="soluk k1 ust-s alt-m">
          Bu tutarlar toplam maliyet hesabına giriyor (Aşama 7) — programın
          öğrenim ücretinin üstüne ekleniyorlar.
        </p>

        <div className="alan">
          <label className="alan-etiket" htmlFor="basvuru_platformu">Başvuru platformu</label>
          <input
            id="basvuru_platformu" name="basvuru_platformu" type="text"
            defaultValue={universite?.basvuru_platformu ?? ''}
            placeholder="Studielink / DreamApply / kendi portalı"
          />
        </div>

        <div className="izgara izgara-2">
          <div className="alan">
            <label className="alan-etiket" htmlFor="basvuru_ucreti">Başvuru ücreti</label>
            <div className="satir">
              <input
                id="basvuru_ucreti" name="basvuru_ucreti" type="number" min={0} step={1}
                defaultValue={universite?.basvuru_ucreti ?? ''}
                placeholder="100"
                className="buyu"
              />
              <select
                name="basvuru_ucreti_para"
                defaultValue={universite?.basvuru_ucreti_para ?? ''}
                aria-label="Başvuru ücreti para birimi"
                style={{ width: 100 }}
              >
                <option value="">—</option>
                {PARA_BIRIMLERI.map((p) => (
                  <option key={p.kod} value={p.kod}>{p.kod}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="depozito">Depozito</label>
            <div className="satir">
              <input
                id="depozito" name="depozito" type="number" min={0} step={1}
                defaultValue={universite?.depozito ?? ''}
                placeholder="2500"
                className="buyu"
              />
              <select
                name="depozito_para"
                defaultValue={universite?.depozito_para ?? ''}
                aria-label="Depozito para birimi"
                style={{ width: 100 }}
              >
                <option value="">—</option>
                {PARA_BIRIMLERI.map((p) => (
                  <option key={p.kod} value={p.kod}>{p.kod}</option>
                ))}
              </select>
            </div>
            <span className="alan-ipucu">Kabul sonrası istenen peşin ödeme.</span>
          </div>
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="depozito_not">Depozito notu</label>
          <textarea
            id="depozito_not" name="depozito_not" rows={2}
            defaultValue={universite?.depozito_not ?? ''}
            placeholder="Öğrenim ücretinden düşülüyor / iade edilmiyor…"
          />
        </div>

        <div className="izgara izgara-2">
          <div className="alan">
            <label className="alan-etiket" htmlFor="site_link">Okulun sitesi</label>
            <input
              id="site_link" name="site_link" type="text"
              defaultValue={universite?.site_link ?? ''}
              placeholder="uva.nl"
            />
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="basvuru_link">Başvuru sayfası</label>
            <input
              id="basvuru_link" name="basvuru_link" type="text"
              defaultValue={universite?.basvuru_link ?? ''}
              placeholder="uva.nl/en/education/admissions"
            />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════ burs ═════════════════════════ */}
      <section className="kart alt-m">
        <h2>Burs</h2>
        <p className="soluk k1 ust-s alt-m">
          Ayrıntı Burs Takip uygulamasında. Buraya sadece &quot;var mı, nereye
          bakılır&quot; yazılıyor.
        </p>

        <div className="alan">
          <span className="alan-etiket">Kendi bursu var mı</span>
          <UcluSecim ad="burs_var" deger={universite?.burs_var} />
        </div>

        <div className="izgara izgara-2">
          <div className="alan">
            <label className="alan-etiket" htmlFor="burs_link">Burs sayfası</label>
            <input
              id="burs_link" name="burs_link" type="text"
              defaultValue={universite?.burs_link ?? ''}
              placeholder="uva.nl/scholarships"
            />
          </div>
          <div className="alan">
            <label className="alan-etiket" htmlFor="burs_notu">Burs notu</label>
            <input
              id="burs_notu" name="burs_notu" type="text"
              defaultValue={universite?.burs_notu ?? ''}
              placeholder="Amsterdam Merit Scholarship — ayrı başvuru yok"
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
            <select id="durum" name="durum" defaultValue={universite?.durum ?? VARSAYILAN_DURUM}>
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
                    defaultChecked={(universite?.oncelik ?? 2) === o.kod}
                  />
                  <span aria-hidden>{o.simge}</span>
                  {o.ad}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="etiketler">Etiketler</label>
          <input
            id="etiketler" name="etiketler" type="text"
            defaultValue={universite?.etiketler.join(', ') ?? ''}
            placeholder="arastirma-yogun, buyuk-sehir"
          />
          <span className="alan-ipucu">Virgülle ayır.</span>
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="notlar">Notlar</label>
          <textarea
            id="notlar" name="notlar" rows={4}
            defaultValue={universite?.notlar ?? ''}
            placeholder="Numerus fixus programları var, kontenjan sınırlı…"
          />
        </div>
      </section>

      <div className="satir satir-sar" style={{ justifyContent: 'flex-end' }}>
        <Link
          href={universite ? `/universiteler/${universite.id}` : '/universiteler'}
          className="dugme"
        >
          Vazgeç
        </Link>
        <Gonder duzenleme={duzenleme} />
      </div>
    </form>
  )
}
