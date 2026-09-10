'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { metinAyristirEylem, type AyristirmaEylemSonucu } from '@/app/eylemler'
import { DESTEKLENEN_UZANTILAR } from '@/lib/dosya-sabitleri'
import { ProgramFormu } from '@/bilesenler/ProgramFormu'
import type { Universite, Saglayici } from '@/lib/tipler'

/**
 * Metinden program ekleme — iki adımlı.
 *
 * 1. Metni yapıştır / dosya yükle → Claude okur, taslak çıkarır.
 * 2. Taslak forma doldurulmuş hâlde açılır; kaydete sen basarsın.
 *
 * İkinci adımı ayrı bir sayfaya taşımadık: taslak URL'ye sığmayacak kadar
 * büyük ve veritabanına yazmadan taşımanın başka yolu yok. Aynı sayfada
 * durum değiştirmek hem basit hem de "henüz kaydedilmedi" hissini koruyor.
 */

type Props = {
  universiteler: Pick<Universite, 'id' | 'ad' | 'ulke_kodu' | 'sehir'>[]
  /** Anahtarı tanımlı sağlayıcılar; boşsa ekran kapalı. İlki varsayılan. */
  saglayicilar: { kod: Saglayici; ad: string }[]
}

function Gonder() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="dugme dugme-ana" disabled={pending}>
      {pending ? 'Okunuyor… (30–60 sn)' : 'Metni oku'}
    </button>
  )
}

export function MetinEkle({ universiteler, saglayicilar }: Props) {
  const [sonuc, eylem] = useActionState<AyristirmaEylemSonucu, FormData>(metinAyristirEylem, {})

  if (saglayicilar.length === 0) {
    return (
      <div className="kart">
        <div className="uyari uyari-dikkat">
          <span aria-hidden>⚠</span>
          <span>
            <strong>Metinden ekleme kapalı.</strong> Bu özellik bir dil
            modeli anahtarına bağlı; ne <code>ANTHROPIC_API_KEY</code> ne{' '}
            <code>GEMINI_API_KEY</code> tanımlı. Uygulamanın geri kalanı
            bundan etkilenmiyor —{' '}
            <Link href="/programlar/yeni">programı elle ekleyebilirsin</Link>.
          </span>
        </div>
      </div>
    )
  }

  /* ── 2. adım: taslak geldi, form açıldı ── */
  if (sonuc.sonuc) {
    const { taslak, ozet, hamMetin, uyarilar } = sonuc.sonuc
    return (
      <>
        <div className="uyari uyari-basari alt-l">
          <span aria-hidden>✓</span>
          <span>
            <strong>Metin okundu</strong>
            {sonuc.sonuc.saglayici && ` (${sonuc.sonuc.model})`}. {ozet}.
            Hiçbir şey kaydedilmedi — aşağıdaki formu kontrol edip{' '}
            <em>Programı kaydet</em>&apos;e bas.
          </span>
        </div>

        {sonuc.eslesmeyenUniversite && (
          <div className="uyari uyari-dikkat alt-l">
            <span aria-hidden>⚠</span>
            <span>
              Metinde <strong>{sonuc.eslesmeyenUniversite}</strong> geçiyor ama
              bu adda kayıtlı üniversite yok. Listeden birini seç ya da{' '}
              <Link href="/universiteler/yeni">önce üniversiteyi ekle</Link>{' '}
              (bu sayfadan çıkarsan taslak kaybolur, formu yeni sekmede aç).
            </span>
          </div>
        )}

        {uyarilar.length > 0 && (
          <div className="uyari uyari-dikkat alt-l">
            <span aria-hidden>⚠</span>
            <span>
              <strong>Ayrıştırıcının söyledikleri:</strong>
              <ul style={{ margin: '.4rem 0 0', paddingLeft: '1.1rem' }}>
                {uyarilar.map((u, i) => <li key={i}>{u}</li>)}
              </ul>
            </span>
          </div>
        )}

        <p className="k2 soluk-2 alt-l">
          Sarı <span className="rozet rozet-sari" style={{ fontSize: '.68rem' }}>kontrol et</span>{' '}
          rozetli alanlar tahmine dayanıyor; üstüne gelince metinden alınan
          dayanağı gösteriyor. ·{' '}
          <Link href="/ekle">Baştan başla</Link>
        </p>

        <ProgramFormu
          universiteler={universiteler}
          taslak={taslak}
          hamMetin={hamMetin}
          universiteId={sonuc.universiteId}
        />
      </>
    )
  }

  /* ── 1. adım: metin girişi ── */
  return (
    <form action={eylem}>
      {sonuc.hata && (
        <div className="uyari uyari-hata alt-l">
          <span aria-hidden>✖</span>
          <span>{sonuc.hata}</span>
        </div>
      )}

      <div className="kart">
        <div className="alan">
          <label className="alan-etiket" htmlFor="metin">
            Program sayfasının metni
          </label>
          <textarea
            id="metin" name="metin" rows={14}
            placeholder="Üniversitenin program sayfasını aç, Ctrl+A → Ctrl+C yap, buraya yapıştır."
          />
          <span className="alan-ipucu">
            Başvuru tarihleri, ücret ve belge listesi hangi sayfadaysa onu
            yapıştır. Menü ve çerez metni sorun değil, ayrıştırıcı atlıyor.
          </span>
        </div>

        <div className="alan">
          <label className="alan-etiket" htmlFor="dosya">
            …ya da dosya yükle
          </label>
          <input
            type="file" id="dosya" name="dosya"
            accept={DESTEKLENEN_UZANTILAR.join(',')}
          />
          <span className="alan-ipucu">
            {DESTEKLENEN_UZANTILAR.join(' · ')} — en fazla 10 MB. Dosya
            seçersen yukarıdaki metin yerine o okunur.
          </span>
        </div>

        {saglayicilar.length > 1 ? (
          <div className="alan">
            <span className="alan-etiket">Hangi model okusun</span>
            <div className="secim-liste">
              {saglayicilar.map((s, i) => (
                <label key={s.kod} className="secim">
                  <input
                    type="radio" name="saglayici" value={s.kod}
                    defaultChecked={i === 0}
                  />
                  {s.ad}
                </label>
              ))}
            </div>
            <span className="alan-ipucu">
              İkisi de aynı şemayı dolduruyor ve çıktı aynı süzgeçten
              geçiyor. Biri kotayı doldurduğunda ya da bir sayfayı kötü
              okuduğunda diğerini dene.
            </span>
          </div>
        ) : (
          <input type="hidden" name="saglayici" value={saglayicilar[0].kod} />
        )}

        <div className="satir-arasi ust-m">
          <Gonder />
          <Link href="/programlar/yeni" className="dugme dugme-sade">
            Elle ekle
          </Link>
        </div>
      </div>

      <p className="k2 soluk-2 ust-m">
        Metin {saglayicilar.map((s) => s.ad).join(' ya da ')}&apos;a
        gönderiliyor ve okunan her alan forma taslak olarak dolduruluyor. <strong>Kaydete sen basana kadar hiçbir şey
        veritabanına yazılmıyor.</strong> Ham metin kayıtla birlikte saklanıyor
        — ayrıştırıcı bir şeyi kaçırdıysa kaynağa dönebilesin.
      </p>
    </form>
  )
}
