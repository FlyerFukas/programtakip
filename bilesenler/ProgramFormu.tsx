'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { programKaydet, type EylemSonucu } from '@/app/eylemler'
import {
  DURUMLAR, ONCELIKLER, PARA_BIRIMLERI, SON_TARIH_TIPLERI, UCRET_DONEMLERI,
  UYGUNLUKLAR, ON_KOSULLAR, BELGELER, KAMPUS_TIPLERI, BASLANGIC_DONEMLERI,
  DERECELER, VARSAYILAN_DURUM, type SonTarihTipi,
} from '@/lib/sabitler'
import { bayrak } from '@/lib/ulkeler'
import type { Program, Taslak, Universite, BasvuruTuru } from '@/lib/tipler'
import { BasvuruTurlari } from './BasvuruTurlari'

/**
 * Program ekleme / düzenleme formu.
 *
 * Üç kaynaktan beslenebilir:
 *  - boş (elle ekleme)
 *  - `program` (düzenleme)
 *  - `taslak` (metin ayrıştırıcının çıkarımı — Aşama 10/11)
 *
 * Taslak geldiğinde ayrıştırıcının DÜŞÜK GÜVENLİ bulguları sarı bir rozetle
 * işaretlenir; kullanıcı neye bakması gerektiğini bilsin. Hiçbir şey kaydete
 * basılmadan veritabanına gitmez.
 */

type Props = {
  program?: Program
  /** Program formunun üniversite açılır listesi — kayıtlı üniversiteler. */
  universiteler: (Pick<Universite, 'id' | 'ad' | 'ulke_kodu' | 'sehir'>)[]
  taslak?: Taslak
  hamMetin?: string
  /** Taslaktaki üniversite adı kayıtlı bir üniversiteyle eşleştiyse onun id'si. */
  universiteId?: string
}

function Gonder({ duzenleme }: { duzenleme: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="dugme dugme-ana" disabled={pending}>
      {pending ? 'Kaydediliyor…' : duzenleme ? 'Değişiklikleri kaydet' : 'Programı kaydet'}
    </button>
  )
}

/** Ayrıştırıcının şüpheli bulgularını işaretleyen küçük uyarı rozeti. */
function GuvenIsareti({ taslak, alan }: { taslak?: Taslak; alan: keyof Taslak }) {
  const b = taslak?.[alan]
  if (!b || b.guven !== 'dusuk') return null
  return (
    <span
      className="rozet rozet-sari"
      title={b.kanit ? `Metinden çıkarıldı, emin değil: "${b.kanit}"` : 'Tahmin — kontrol et'}
      style={{ fontSize: '.68rem' }}
    >
      kontrol et
    </span>
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

export function ProgramFormu({ program, universiteler, taslak, hamMetin, universiteId }: Props) {
  const [sonuc, eylem] = useActionState<EylemSonucu, FormData>(programKaydet, {})
  const duzenleme = Boolean(program)
  const hatalar = sonuc.hatalar ?? {}

  /** Taslak > mevcut kayıt > boş sırasıyla başlangıç değeri. */
  function ilk<T>(alan: keyof Taslak, programAlan: keyof Program, varsayilan: T): T {
    const t = taslak?.[alan] as { deger: T } | undefined
    if (t?.deger !== undefined) return t.deger
    const p = program?.[programAlan] as T | undefined
    return p !== undefined && p !== null ? p : varsayilan
  }

  /* Son tarih tipi hangi alanların görüneceğini belirlediği için kontrollü. */
  const [tarihTipi, setTarihTipi] = useState<SonTarihTipi>(
    ilk<SonTarihTipi>('son_tarih_tipi', 'son_tarih_tipi', 'bilinmiyor'),
  )

  if (universiteler.length === 0) {
    return (
      <div className="kart">
        <div className="uyari uyari-dikkat">
          <span aria-hidden>⚠</span>
          <span>
            Önce en az bir üniversite eklemen gerekiyor — program bir
            üniversiteye bağlı kaydediliyor.{' '}
            <Link href="/universiteler/yeni">Üniversite ekle →</Link>
          </span>
        </div>
      </div>
    )
  }

  return (
    <form action={eylem}>
      {program && <input type="hidden" name="id" value={program.id} />}
      {/* Ham metin gizli taşınıyor: düzenlerken sıfırlanmasın, ayrıştırıcı
          bir şeyi kaçırdıysa kaynağa dönebilelim (PROJE.md §6.7). */}
      <input type="hidden" name="ham_metin" value={hamMetin ?? program?.ham_metin ?? ''} />

      {sonuc.hata && (
        <div className="uyari uyari-hata alt-m" role="alert">
          <span aria-hidden>⚠</span>
          <span>{sonuc.hata}</span>
        </div>
      )}

      {/* ══════════════════════════════ kimlik ══════════════════════════ */}
      <section className="kart alt-m">
        <h2 className="alt-m">Program</h2>

        <div className="alan">
          <label className="alan-etiket satir" htmlFor="ad">
            Programın adı <span style={{ color: 'var(--kirmizi)' }}>*</span>
            <GuvenIsareti taslak={taslak} alan="ad" />
          </label>
          <input
            id="ad" name="ad" type="text" required
            defaultValue={ilk('ad', 'ad', '')}
            placeholder="MSc Social Data Science"
            aria-invalid={hatalar.ad ? 'true' : undefined}
          />
          {hatalar.ad && <span className="alan-hata">{hatalar.ad}</span>}
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="universite_id">
            Üniversite <span style={{ color: 'var(--kirmizi)' }}>*</span>
          </label>
          <select
            id="universite_id" name="universite_id" required
            defaultValue={program?.universite_id ?? universiteId ?? ''}
            aria-invalid={hatalar.universite_id ? 'true' : undefined}
          >
            <option value="">— seç —</option>
            {universiteler.map((u) => (
              <option key={u.id} value={u.id}>
                {bayrak(u.ulke_kodu)} {u.ad}{u.sehir ? ` — ${u.sehir}` : ''}
              </option>
            ))}
          </select>
          {hatalar.universite_id && <span className="alan-hata">{hatalar.universite_id}</span>}
          <span className="alan-ipucu">
            Ülke, şehir, sıralama ve başvuru ücreti üniversiteden geliyor —
            burada tekrar girmiyorsun.
          </span>
        </div>

        <div className="izgara izgara-3">
          <div className="alan">
            <label className="alan-etiket satir" htmlFor="bolum">
              Bölüm / fakülte
              <GuvenIsareti taslak={taslak} alan="bolum" />
            </label>
            <input
              id="bolum" name="bolum" type="text"
              defaultValue={ilk('bolum', 'bolum', '')}
              placeholder="Department of Sociology"
            />
          </div>

          <div className="alan">
            <label className="alan-etiket satir" htmlFor="derece">
              Derece
              <GuvenIsareti taslak={taslak} alan="derece" />
            </label>
            <input
              id="derece" name="derece" type="text" list="derece-onerileri"
              defaultValue={ilk('derece', 'derece', '')}
              placeholder="MSc"
            />
            <datalist id="derece-onerileri">
              {DERECELER.map((d) => <option key={d} value={d} />)}
            </datalist>
          </div>

          <div className="alan">
            <label className="alan-etiket satir" htmlFor="ogretim_dili">
              Öğretim dili
              <GuvenIsareti taslak={taslak} alan="ogretim_dili" />
            </label>
            <input
              id="ogretim_dili" name="ogretim_dili" type="text"
              defaultValue={ilk('ogretim_dili', 'ogretim_dili', '')}
              placeholder="İngilizce"
            />
          </div>
        </div>

        <div className="alan">
          <label className="alan-etiket satir" htmlFor="alanlar">
            Çalışma alanları
            <GuvenIsareti taslak={taslak} alan="alanlar" />
          </label>
          <input
            id="alanlar" name="alanlar" type="text"
            defaultValue={ilk<string[]>('alanlar', 'alanlar', []).join(', ')}
            placeholder="demografi, göç, hesaplamalı sosyal bilim"
          />
          <span className="alan-ipucu">Virgülle ayır.</span>
        </div>
      </section>

      {/* ═══════════════════════════════ yapı ══════════════════════════ */}
      <section className="kart alt-m">
        <h2 className="alt-m">Programın yapısı</h2>

        <div className="izgara izgara-3">
          <div className="alan">
            <label className="alan-etiket satir" htmlFor="sure_ay">
              Süre (ay)
              <GuvenIsareti taslak={taslak} alan="sure_ay" />
            </label>
            <input
              id="sure_ay" name="sure_ay" type="number" min={1} max={120} step={1}
              defaultValue={ilk<number | ''>('sure_ay', 'sure_ay', '')}
              placeholder="24"
            />
          </div>

          <div className="alan">
            <label className="alan-etiket satir" htmlFor="ects">
              ECTS
              <GuvenIsareti taslak={taslak} alan="ects" />
            </label>
            <input
              id="ects" name="ects" type="number" min={1} max={600} step={1}
              defaultValue={ilk<number | ''>('ects', 'ects', '')}
              placeholder="120"
            />
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="kampus">Kampüs</label>
            <select id="kampus" name="kampus" defaultValue={program?.kampus ?? ''}>
              <option value="">— seç —</option>
              {KAMPUS_TIPLERI.map((k) => (
                <option key={k.kod} value={k.kod}>{k.simge} {k.ad}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="alan">
          <span className="alan-etiket satir">
            Tezli mi
            <GuvenIsareti taslak={taslak} alan="tezli" />
          </span>
          <UcluSecim ad="tezli" deger={ilk<boolean | null>('tezli', 'tezli', null)} />
          <span className="alan-ipucu">
            Kanada&apos;da finansman buna bağlı: tezli MASc fonlanır, ders bazlı
            MEng fonlanmaz — aynı okulda ücret farkı üç katı olabiliyor.
          </span>
        </div>

        <div className="alan">
          <span className="alan-etiket">Başlangıç dönemleri</span>
          <div className="secim-liste">
            {BASLANGIC_DONEMLERI.map((d) => (
              <label key={d.kod} className="secim">
                <input
                  type="checkbox" name="baslangic_donemleri" value={d.kod}
                  defaultChecked={ilk<string[]>(
                    'baslangic_donemleri', 'baslangic_donemleri', [],
                  ).includes(d.kod)}
                />
                <span aria-hidden>{d.simge}</span>
                {d.ad}
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════ son tarih ══════════════════════ */}
      <section className="kart alt-m">
        <h2 className="alt-m">Son başvuru tarihi</h2>

        <div className="alan">
          <span className="alan-etiket satir">
            Tarih tipi
            <GuvenIsareti taslak={taslak} alan="son_tarih_tipi" />
          </span>
          <div className="secim-liste">
            {SON_TARIH_TIPLERI.map((t) => (
              <label key={t.kod} className="secim" title={t.aciklama}>
                <input
                  type="radio" name="son_tarih_tipi" value={t.kod}
                  checked={tarihTipi === t.kod}
                  onChange={() => setTarihTipi(t.kod)}
                />
                {t.ad}
              </label>
            ))}
          </div>
          {hatalar.son_tarih_tipi && <span className="alan-hata">{hatalar.son_tarih_tipi}</span>}
        </div>

        {tarihTipi === 'kesin' && (
          <div className="alan">
            <label className="alan-etiket satir" htmlFor="son_tarih">
              Son gün
              <GuvenIsareti taslak={taslak} alan="son_tarih" />
            </label>
            <input
              id="son_tarih" name="son_tarih" type="date"
              defaultValue={ilk('son_tarih', 'son_tarih', '')}
              aria-invalid={hatalar.son_tarih ? 'true' : undefined}
            />
            {hatalar.son_tarih && <span className="alan-hata">{hatalar.son_tarih}</span>}
          </div>
        )}

        {tarihTipi === 'aralik' && (
          <div className="izgara izgara-2">
            <div className="alan">
              <label className="alan-etiket" htmlFor="son_tarih_baslangic">Aralığın başı</label>
              <input
                id="son_tarih_baslangic" name="son_tarih_baslangic" type="date"
                defaultValue={ilk('son_tarih_baslangic', 'son_tarih_baslangic', '')}
              />
              {hatalar.son_tarih_baslangic && (
                <span className="alan-hata">{hatalar.son_tarih_baslangic}</span>
              )}
            </div>
            <div className="alan">
              <label className="alan-etiket" htmlFor="son_tarih_bitis">Aralığın sonu</label>
              <input
                id="son_tarih_bitis" name="son_tarih_bitis" type="date"
                defaultValue={ilk('son_tarih_bitis', 'son_tarih_bitis', '')}
              />
              {hatalar.son_tarih_bitis && (
                <span className="alan-hata">{hatalar.son_tarih_bitis}</span>
              )}
            </div>
          </div>
        )}

        <div className="izgara izgara-2">
          <div className="alan">
            <label className="alan-etiket" htmlFor="acilis_tarihi">
              Başvuruların açılış günü
            </label>
            <input
              id="acilis_tarihi" name="acilis_tarihi" type="date"
              defaultValue={ilk('acilis_tarihi', 'acilis_tarihi', '')}
              aria-invalid={hatalar.acilis_tarihi ? 'true' : undefined}
            />
            {hatalar.acilis_tarihi && <span className="alan-hata">{hatalar.acilis_tarihi}</span>}
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="son_tarih_not">Tarih notu</label>
            <input
              id="son_tarih_not" name="son_tarih_not" type="text"
              defaultValue={ilk('son_tarih_not', 'son_tarih_not', '')}
              placeholder="Geçen yıl 15 Ocak'tı, henüz duyurulmadı"
            />
          </div>
        </div>

        <hr className="ayrac" />

        <BasvuruTurlari
          baslangic={ilk<BasvuruTuru[]>('basvuru_turlari', 'basvuru_turlari', [])}
        />
      </section>

      {/* ═══════════════════════════════ maliyet ═══════════════════════ */}
      <section className="kart alt-m">
        <h2 className="alt-m">Maliyet</h2>

        <div className="izgara izgara-3">
          <div className="alan">
            <label className="alan-etiket satir" htmlFor="ogrenim_ucreti">
              Öğrenim ücreti
              <GuvenIsareti taslak={taslak} alan="ogrenim_ucreti" />
            </label>
            <input
              id="ogrenim_ucreti" name="ogrenim_ucreti" type="number" min={0} step={1}
              defaultValue={ilk<number | ''>('ogrenim_ucreti', 'ogrenim_ucreti', '')}
              placeholder="18500"
            />
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="para_birimi">Para birimi</label>
            <select
              id="para_birimi" name="para_birimi"
              defaultValue={ilk('para_birimi', 'para_birimi', '')}
              aria-invalid={hatalar.para_birimi ? 'true' : undefined}
            >
              <option value="">— seç —</option>
              {PARA_BIRIMLERI.map((p) => (
                <option key={p.kod} value={p.kod}>{p.kod} — {p.ad}</option>
              ))}
            </select>
            {hatalar.para_birimi && <span className="alan-hata">{hatalar.para_birimi}</span>}
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="ogrenim_ucreti_donem">Ücret neye ait</label>
            <select
              id="ogrenim_ucreti_donem" name="ogrenim_ucreti_donem"
              defaultValue={ilk('ogrenim_ucreti_donem', 'ogrenim_ucreti_donem', '')}
              aria-invalid={hatalar.ogrenim_ucreti_donem ? 'true' : undefined}
            >
              <option value="">— seç —</option>
              {UCRET_DONEMLERI.map((u) => (
                <option key={u.kod} value={u.kod} title={u.aciklama}>{u.ad}</option>
              ))}
            </select>
            {hatalar.ogrenim_ucreti_donem && (
              <span className="alan-hata">{hatalar.ogrenim_ucreti_donem}</span>
            )}
          </div>
        </div>

        <div className="alan">
          <span className="alan-etiket satir">
            AB dışına ücret muafiyeti ihtimali
            <GuvenIsareti taslak={taslak} alan="ucret_muafiyeti" />
          </span>
          <UcluSecim ad="ucret_muafiyeti" deger={ilk<boolean | null>('ucret_muafiyeti', 'ucret_muafiyeti', null)} />
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="ucret_not">Ücret notu</label>
          <textarea
            id="ucret_not" name="ucret_not" rows={2}
            defaultValue={ilk('ucret_not', 'ucret_not', '')}
            placeholder="AB dışı 18.500 EUR/yıl, AB 2.530 EUR/yıl"
          />
        </div>
      </section>

      {/* ═══════════════════════════ uygunluk kapısı ═══════════════════ */}
      <section className="kart alt-m">
        <h2>Uygunluk</h2>
        <p className="soluk k1 ust-s alt-m">
          Bunu <strong>sen</strong> işaretliyorsun, uygulama hesaplamıyor. Ön
          koşulun tutup tutmadığına ancak transkriptine bakarak karar
          verebilirsin; uygulamanın tahmin etmesi yanlış güven verir.
        </p>

        <div className="alan">
          <span className="alan-etiket">Durum</span>
          <div className="secim-liste">
            {UYGUNLUKLAR.map((u) => (
              <label key={u.kod} className="secim" title={u.aciklama}>
                <input
                  type="radio" name="uygunluk" value={u.kod}
                  defaultChecked={(program?.uygunluk ?? 'bilinmiyor') === u.kod}
                />
                <span aria-hidden>{u.simge}</span>
                {u.ad}
              </label>
            ))}
          </div>
        </div>

        <div className="alan">
          <span className="alan-etiket satir">
            Ön koşullar
            <GuvenIsareti taslak={taslak} alan="on_kosullar" />
          </span>
          <div className="secim-liste">
            {ON_KOSULLAR.map((k) => (
              <label key={k.kod} className="secim" title={k.aciklama}>
                <input
                  type="checkbox" name="on_kosullar" value={k.kod}
                  defaultChecked={ilk<string[]>('on_kosullar', 'on_kosullar', []).includes(k.kod)}
                />
                <span aria-hidden>{k.simge}</span>
                {k.ad}
              </label>
            ))}
          </div>
        </div>

        <div className="alan">
          <label className="alan-etiket satir" htmlFor="on_kosul_detay">
            Ön koşul ayrıntısı
            <GuvenIsareti taslak={taslak} alan="on_kosul_detay" />
          </label>
          <textarea
            id="on_kosul_detay" name="on_kosul_detay" rows={3}
            defaultValue={ilk('on_kosul_detay', 'on_kosul_detay', '')}
            placeholder="En az 30 ECTS matematik + istatistik; kanıtlanmış Python/R bilgisi"
          />
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="uygunluk_not">Uygunluk notun</label>
          <textarea
            id="uygunluk_not" name="uygunluk_not" rows={2}
            defaultValue={program?.uygunluk_not ?? ''}
            placeholder="Matematik ECTS sınırda — transkripti say"
          />
          <span className="alan-ipucu">
            &quot;Şüpheli&quot; ya da &quot;uygun değil&quot; işaretlediysen sebebini yaz.
          </span>
        </div>

        <div className="izgara izgara-3">
          <div className="alan">
            <label className="alan-etiket satir" htmlFor="dil_sarti">
              Dil şartı
              <GuvenIsareti taslak={taslak} alan="dil_sarti" />
            </label>
            <input
              id="dil_sarti" name="dil_sarti" type="text"
              defaultValue={ilk('dil_sarti', 'dil_sarti', '')}
              placeholder="IELTS 6.5, her bölümden en az 6.0"
            />
          </div>

          <div className="alan">
            <label className="alan-etiket satir" htmlFor="not_ortalamasi">
              Not ortalaması
              <GuvenIsareti taslak={taslak} alan="not_ortalamasi" />
            </label>
            <input
              id="not_ortalamasi" name="not_ortalamasi" type="text"
              defaultValue={ilk('not_ortalamasi', 'not_ortalamasi', '')}
              placeholder="4 üzerinden 3.0"
            />
          </div>

          <div className="alan">
            <label className="alan-etiket satir" htmlFor="is_deneyimi">
              İş deneyimi şartı
              <GuvenIsareti taslak={taslak} alan="is_deneyimi" />
            </label>
            <input
              id="is_deneyimi" name="is_deneyimi" type="text"
              defaultValue={ilk('is_deneyimi', 'is_deneyimi', '')}
              placeholder="Şart değil ama avantaj"
            />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════ belgeler ══════════════════════ */}
      <section className="kart alt-m">
        <h2>İstenen belgeler</h2>
        <p className="soluk k1 ust-s alt-m">
          İşaretlediklerin belge takvimine giriyor: her belgenin hazırlık
          süresi biliniyor, uygulama &quot;ne zaman başlamalıyım&quot; gününü buradan
          hesaplıyor (Aşama 6).
        </p>

        <div className="alan">
          <span className="alan-etiket satir">
            Belgeler
            <GuvenIsareti taslak={taslak} alan="belgeler" />
          </span>
          <div className="secim-liste">
            {BELGELER.map((b) => (
              <label key={b.kod} className="secim" title={b.aciklama}>
                <input
                  type="checkbox" name="belgeler" value={b.kod}
                  defaultChecked={ilk<string[]>('belgeler', 'belgeler', []).includes(b.kod)}
                />
                <span aria-hidden>{b.simge}</span>
                {b.ad}
              </label>
            ))}
          </div>
        </div>

        <div className="alan">
          <label className="alan-etiket satir" htmlFor="belge_detay">
            Belge ayrıntısı
            <GuvenIsareti taslak={taslak} alan="belge_detay" />
          </label>
          <textarea
            id="belge_detay" name="belge_detay" rows={3}
            defaultValue={ilk('belge_detay', 'belge_detay', '')}
            placeholder="2 referans, en az biri akademik olmalı"
          />
        </div>
      </section>

      {/* ═══════════════════════════════ rekabet ═══════════════════════ */}
      <section className="kart alt-m">
        <h2 className="alt-m">Rekabet ve burs</h2>

        <div className="izgara izgara-2">
          <div className="alan">
            <label className="alan-etiket satir" htmlFor="kontenjan">
              Kontenjan
              <GuvenIsareti taslak={taslak} alan="kontenjan" />
            </label>
            <input
              id="kontenjan" name="kontenjan" type="number" min={1} step={1}
              defaultValue={ilk<number | ''>('kontenjan', 'kontenjan', '')}
              placeholder="40"
            />
          </div>

          <div className="alan">
            <label className="alan-etiket satir" htmlFor="kabul_orani">
              Kabul oranı
              <GuvenIsareti taslak={taslak} alan="kabul_orani" />
            </label>
            <input
              id="kabul_orani" name="kabul_orani" type="text"
              defaultValue={ilk('kabul_orani', 'kabul_orani', '')}
              placeholder="%18"
            />
          </div>
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="rekabet_not">Rekabet notu</label>
          <textarea
            id="rekabet_not" name="rekabet_not" rows={2}
            defaultValue={program?.rekabet_not ?? ''}
            placeholder="Numerus fixus — kontenjan dolunca kapanıyor"
          />
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="ilgili_burslar">İlgili burslar</label>
          <input
            id="ilgili_burslar" name="ilgili_burslar" type="text"
            defaultValue={program?.ilgili_burslar.join(', ') ?? ''}
            placeholder="Holland Scholarship, Amsterdam Merit"
          />
          <span className="alan-ipucu">
            Virgülle ayır. Bursların ayrıntısı Burs Takip uygulamasında.
          </span>
        </div>

        <div className="izgara izgara-2">
          <div className="alan">
            <label className="alan-etiket" htmlFor="burs_tahmini">
              Beklenen burs tutarı
            </label>
            <input
              id="burs_tahmini" name="burs_tahmini" type="number" min={0} step={100}
              defaultValue={program?.burs_tahmini ?? ''}
              placeholder="5000"
            />
            <span className="alan-ipucu">
              Toplam maliyetten <strong>düşülüyor</strong>. Tahmin bile olsa
              yazmak, hiç yazmamaktan iyi — hesap onsuz &quot;eksik&quot; kalıyor.
            </span>
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="burs_tahmini_para">
              Bursun para birimi
            </label>
            <select
              id="burs_tahmini_para" name="burs_tahmini_para"
              defaultValue={program?.burs_tahmini_para ?? ''}
              aria-invalid={hatalar.burs_tahmini_para ? 'true' : undefined}
            >
              <option value="">— seç —</option>
              {PARA_BIRIMLERI.map((p) => (
                <option key={p.kod} value={p.kod}>{p.kod} — {p.ad}</option>
              ))}
            </select>
            {hatalar.burs_tahmini_para && (
              <span className="alan-hata">{hatalar.burs_tahmini_para}</span>
            )}
          </div>
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="burs_notu">Burs notu</label>
          <textarea
            id="burs_notu" name="burs_notu" rows={2}
            defaultValue={program?.burs_notu ?? ''}
            placeholder="Kabul mektubu gelmeden burs başvurusu açılmıyor"
          />
        </div>
      </section>

      {/* ═══════════════════════════ kariyer / göç ═════════════════════ */}
      <section className="kart alt-m">
        <h2 className="alt-m">Kariyer</h2>

        <div className="alan">
          <label className="alan-etiket" htmlFor="mezun_istihdam">Mezun istihdamı</label>
          <textarea
            id="mezun_istihdam" name="mezun_istihdam" rows={2}
            defaultValue={program?.mezun_istihdam ?? ''}
            placeholder="Mezunların %80'i 6 ay içinde işe giriyor (okulun kendi verisi)"
          />
        </div>

        <div className="izgara izgara-2">
          <div className="alan">
            <span className="alan-etiket">Staj zorunlu mu</span>
            {/* `staj_zorunlu` Taslak tipinde yok — ayrıştırıcı bu alanı
                doldurmuyor, o yüzden yalnızca mevcut kayıttan okunuyor. */}
            <UcluSecim ad="staj_zorunlu" deger={program?.staj_zorunlu} />
          </div>

          <div className="alan">
            <label className="alan-etiket" htmlFor="kariyer_not">Kariyer notu</label>
            <textarea
              id="kariyer_not" name="kariyer_not" rows={2}
              defaultValue={program?.kariyer_not ?? ''}
              placeholder="Sektör bağlantıları güçlü, CBS ile ortak projeler"
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
            <select id="durum" name="durum" defaultValue={program?.durum ?? VARSAYILAN_DURUM}>
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
                    defaultChecked={(program?.oncelik ?? 2) === o.kod}
                  />
                  <span aria-hidden>{o.simge}</span>
                  {o.ad}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="izgara izgara-3">
          <div className="alan">
            <label className="alan-etiket satir" htmlFor="basvuru_link">
              Başvuru bağlantısı
              <GuvenIsareti taslak={taslak} alan="basvuru_link" />
            </label>
            <input
              id="basvuru_link" name="basvuru_link" type="text"
              defaultValue={ilk('basvuru_link', 'basvuru_link', '')}
              placeholder="uva.nl/…/apply"
            />
          </div>

          <div className="alan">
            <label className="alan-etiket satir" htmlFor="kaynak_link">
              Bilgi sayfası
              <GuvenIsareti taslak={taslak} alan="kaynak_link" />
            </label>
            <input
              id="kaynak_link" name="kaynak_link" type="text"
              defaultValue={ilk('kaynak_link', 'kaynak_link', '')}
              placeholder="uva.nl/…/social-data-science"
            />
          </div>

          <div className="alan">
            <label className="alan-etiket satir" htmlFor="mufredat_link">
              Müfredat
              <GuvenIsareti taslak={taslak} alan="mufredat_link" />
            </label>
            <input
              id="mufredat_link" name="mufredat_link" type="text"
              defaultValue={ilk('mufredat_link', 'mufredat_link', '')}
              placeholder="studiegids.uva.nl/…"
            />
          </div>
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="etiketler">Etiketler</label>
          <input
            id="etiketler" name="etiketler" type="text"
            defaultValue={program?.etiketler.join(', ') ?? ''}
            placeholder="ilk-tercih, nicel"
          />
          <span className="alan-ipucu">Virgülle ayır.</span>
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="notlar">Notlar</label>
          <textarea
            id="notlar" name="notlar" rows={4}
            defaultValue={program?.notlar ?? ''}
            placeholder="Aklında kalsın istediğin her şey."
          />
        </div>
      </section>

      <div className="satir satir-sar" style={{ justifyContent: 'flex-end' }}>
        <Link href={program ? `/programlar/${program.id}` : '/programlar'} className="dugme">
          Vazgeç
        </Link>
        <Gonder duzenleme={duzenleme} />
      </div>
    </form>
  )
}
