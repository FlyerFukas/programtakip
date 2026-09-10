'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { yedekYukleEylem, type EylemSonucu } from '@/app/eylemler'

/**
 * Yedek al / geri yükle (PROJE.md Aşama 14).
 *
 * İndirme düz bir bağlantı: `/api/yedek` dosyayı `Content-Disposition` ile
 * gönderiyor, JavaScript'e gerek yok.
 *
 * Geri yükleme iki kipli ve varsayılan olarak ÜSTÜNE YAZAN kip seçili.
 * "Önce her şeyi sil" ayrı bir onay kutusu ve kırmızı uyarıyla duruyor:
 * yanlış tıklamanın bedeli tüm veritabanı.
 */
export function YedekBolumu() {
  const [sonuc, eylem] = useActionState<EylemSonucu, FormData>(yedekYukleEylem, {})
  const [temizle, setTemizle] = useState(false)

  return (
    <section className="kart">
      <div className="kart-baslik">
        <h2>Yedekleme</h2>
      </div>

      <p className="soluk k1 alt-m">
        Bütün veriler tek bir JSON dosyasında. Neon ücretsiz planında
        otomatik yedek yok — ayda bir indirip bir kenara koymak, veritabanı
        bir gün kaybolursa aylarca toplanmış veriyi kurtarır.
      </p>

      <a href="/api/yedek" className="dugme dugme-ana alt-l" download>
        ⬇ Yedeği indir
      </a>

      <hr className="ayrac" />

      <h3 className="alt-s">Yedekten geri yükle</h3>

      {sonuc.hata && (
        <div className="uyari uyari-hata alt-m">
          <span aria-hidden>✖</span>
          <span>{sonuc.hata}</span>
        </div>
      )}
      {sonuc.tamam && sonuc.mesaj && (
        <div className="uyari uyari-basari alt-m">
          <span aria-hidden>✓</span>
          <span>{sonuc.mesaj}</span>
        </div>
      )}

      <form action={eylem}>
        <div className="alan">
          <label className="alan-etiket" htmlFor="yedek">Yedek dosyası</label>
          <input type="file" id="yedek" name="yedek" accept=".json,application/json" required />
          <span className="alan-ipucu">
            <code>/api/yedek</code> ile indirdiğin <code>.json</code> dosyası.
          </span>
        </div>

        <label className="secim alt-m" style={{ display: 'flex', gap: 8 }}>
          <input
            type="checkbox" name="temizle" value="evet"
            checked={temizle}
            onChange={(e) => setTemizle(e.target.checked)}
          />
          <span>
            <strong>Önce mevcut verinin tamamını sil.</strong>
            <span className="k2 soluk-2" style={{ display: 'block' }}>
              İşaretlemezsen üstüne yazar: aynı kayıt güncellenir, yeni olan
              eklenir, yedekte olmayan kayıtlara dokunulmaz.
            </span>
          </span>
        </label>

        {temizle && (
          <div className="uyari uyari-hata alt-m">
            <span aria-hidden>⚠</span>
            <span>
              <strong>Bu geri alınamaz.</strong> Yükleme başlamadan önce mevcut
              bütün ülkeler, üniversiteler ve programlar silinecek. Devam
              etmeden önce güncel bir yedek indirdiğinden emin ol.
            </span>
          </div>
        )}

        <Gonder temizle={temizle} />
      </form>
    </section>
  )
}

function Gonder({ temizle }: { temizle: boolean }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      className={`dugme ${temizle ? 'dugme-tehlike' : 'dugme-sade'}`}
      disabled={pending}
    >
      {pending
        ? 'Yükleniyor…'
        : temizle ? 'Sil ve geri yükle' : 'Geri yükle'}
    </button>
  )
}
