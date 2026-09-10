'use client'

import { useState } from 'react'
import { TUR_KIMIN_ICIN } from '@/lib/sabitler'
import type { BasvuruTuru } from '@/lib/tipler'

/**
 * Başvuru turlarını düzenleyen dinamik liste.
 *
 * NEDEN AYRI BİR BİLEŞEN: bir programın tek son tarihi olmayabilir. Kıta
 * Avrupası'nda yaygın kalıp, AB/AEA dışı başvurunun AB başvurusundan
 * haftalar — çoğu zaman aylar — önce kapanması. Danimarka'da AB dışı
 * 15 Ocak, AB 15 Mart. Kullanıcı AB DIŞI ve programın sayfasında büyük puntoyla
 * yazan tarih çoğunlukla AB tarihidir. Tek bir "son tarih" kutusu bu ayrımı
 * taşıyamıyor; yanlış turu takip etmek bir yıl kaybettirir.
 *
 * Değer forma gizli bir JSON alanı olarak gönderiliyor: satır sayısı
 * değişken olduğu için düz FormData alan adlarıyla temsil etmek kırılgan
 * olurdu (satır silince indeksler kayar). Kalıp `UniversiteListesi.tsx`
 * (BursTakip) ile birebir aynı.
 */
export function BasvuruTurlari({ baslangic }: { baslangic: BasvuruTuru[] }) {
  const [satirlar, setSatirlar] = useState<BasvuruTuru[]>(baslangic)

  const bos = (kiminIcin: BasvuruTuru['kimin_icin']): BasvuruTuru => ({
    ad: kiminIcin === 'ab_disi' ? 'AB/AEA dışı' : kiminIcin === 'ab' ? 'AB/AEA vatandaşı' : '',
    son_tarih: null,
    kimin_icin: kiminIcin,
    baslangic: null,
    sonuc_tarihi: null,
    not: null,
  })

  function guncelle(i: number, alan: keyof BasvuruTuru, deger: string) {
    setSatirlar((onceki) => onceki.map((s, j) => {
      if (j !== i) return s
      if (alan === 'kimin_icin') {
        return { ...s, kimin_icin: (deger || null) as BasvuruTuru['kimin_icin'] }
      }
      const temiz = deger.trim() === '' ? (alan === 'ad' ? '' : null) : deger
      return { ...s, [alan]: temiz }
    }))
  }

  const sil = (i: number) => setSatirlar((o) => o.filter((_, j) => j !== i))
  const ekle = (kiminIcin: BasvuruTuru['kimin_icin']) =>
    setSatirlar((o) => [...o, bos(kiminIcin)])

  /** İki turlu kalıp tek tıkla kurulsun — en sık girilen yapı bu. */
  const ikiliEkle = () => setSatirlar((o) => [...o, bos('ab_disi'), bos('ab')])

  const seninTurunVar = satirlar.some(
    (s) => s.kimin_icin === 'ab_disi' || s.kimin_icin === 'herkes',
  )

  return (
    <div className="alan">
      {/* Sunucuya giden asıl değer. Adı olmayan satır atılıyor. */}
      <input
        type="hidden"
        name="basvuru_turlari"
        value={JSON.stringify(satirlar.filter((s) => s.ad.trim()))}
      />

      <span className="alan-etiket">Başvuru turları</span>
      <span className="alan-ipucu">
        Programın AB dışı ve AB için ayrı son tarihi varsa ikisini de gir.
        Uygulama <strong>senin turunu</strong> (AB/AEA dışı) kalın ve geri
        sayımlı gösterir, AB turunu soluk. Tek tarih varsa buraya hiç dokunma —
        yukarıdaki merkezî tarih yeter.
      </span>

      {satirlar.length === 0 ? (
        <div className="ust-s">
          <button type="button" className="dugme dugme-kucuk" onClick={ikiliEkle}>
            + AB dışı / AB turlarını ekle
          </button>
        </div>
      ) : (
        <>
          {!seninTurunVar && (
            <div className="uyari uyari-dikkat ust-s">
              <span aria-hidden>⚠</span>
              <span>
                Girilen turların hiçbiri sana açık değil. En az bir turu
                &quot;AB/AEA dışı&quot; ya da &quot;Herkes&quot; olarak işaretle, yoksa geri
                sayım turlara bakmaz.
              </span>
            </div>
          )}

          <div className="sutun ust-s" style={{ gap: 10 }}>
            {satirlar.map((s, i) => {
              const secilen = TUR_KIMIN_ICIN.find((t) => t.kod === s.kimin_icin)
              const senin = secilen?.seninTurun ?? false
              return (
                <div
                  key={i}
                  className="kart kart-sik"
                  style={{
                    background: senin ? 'var(--vurgu-soluk)' : 'var(--kart-2)',
                    borderColor: senin ? 'var(--vurgu)' : undefined,
                  }}
                >
                  <div className="satir-arasi alt-s">
                    <strong className="k1">
                      {i + 1}. tur
                      {senin && (
                        <span className="etiket etiket-vurgu" style={{ marginLeft: 6 }}>
                          senin turun
                        </span>
                      )}
                    </strong>
                    <button
                      type="button"
                      className="dugme dugme-sade dugme-kucuk dugme-tehlike"
                      onClick={() => sil(i)}
                    >
                      Kaldır
                    </button>
                  </div>

                  <div className="izgara izgara-2" style={{ gap: 8 }}>
                    <label className="k2 soluk">
                      Turun adı
                      <input
                        type="text"
                        value={s.ad}
                        onChange={(e) => guncelle(i, 'ad', e.target.value)}
                        placeholder="Tur 1 — AB dışı"
                      />
                    </label>

                    <label className="k2 soluk">
                      Kimin için
                      <select
                        value={s.kimin_icin ?? ''}
                        onChange={(e) => guncelle(i, 'kimin_icin', e.target.value)}
                      >
                        <option value="">— belirtilmemiş —</option>
                        {TUR_KIMIN_ICIN.map((t) => (
                          <option key={t.kod} value={t.kod}>{t.simge} {t.ad}</option>
                        ))}
                      </select>
                    </label>

                    <label className="k2 soluk">
                      Son başvuru tarihi
                      <input
                        type="date"
                        value={s.son_tarih ?? ''}
                        onChange={(e) => guncelle(i, 'son_tarih', e.target.value)}
                      />
                    </label>

                    <label className="k2 soluk">
                      Sonuç açıklanma tarihi
                      <input
                        type="date"
                        value={s.sonuc_tarihi ?? ''}
                        onChange={(e) => guncelle(i, 'sonuc_tarihi', e.target.value)}
                      />
                    </label>
                  </div>

                  <div className="izgara izgara-2 ust-s" style={{ gap: 8 }}>
                    <label className="k2 soluk">
                      Hangi dönem için
                      <input
                        type="text"
                        value={s.baslangic ?? ''}
                        onChange={(e) => guncelle(i, 'baslangic', e.target.value)}
                        placeholder="2027 Güz"
                      />
                    </label>

                    <label className="k2 soluk">
                      Not
                      <input
                        type="text"
                        value={s.not ?? ''}
                        onChange={(e) => guncelle(i, 'not', e.target.value)}
                        placeholder="Kontenjan dolarsa erken kapanabilir"
                      />
                    </label>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="satir satir-sar ust-s">
            <button
              type="button" className="dugme dugme-kucuk"
              onClick={() => ekle('ab_disi')}
            >
              + AB dışı tur
            </button>
            <button
              type="button" className="dugme dugme-kucuk"
              onClick={() => ekle('ab')}
            >
              + AB turu
            </button>
            <button
              type="button" className="dugme dugme-kucuk"
              onClick={() => ekle('herkes')}
            >
              + Herkese açık tur
            </button>
          </div>
        </>
      )}
    </div>
  )
}
