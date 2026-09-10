'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { kurKaydetEylem, kurSifirlaEylem, type EylemSonucu } from '@/app/eylemler'
import { PARA_BIRIMLERI } from '@/lib/sabitler'
import { euroBasina, VARSAYILAN_KURLAR, KUR_TARIHI } from '@/lib/para'
import type { KurAyari } from '@/lib/tipler'

/**
 * Kur tablosu düzenleyici.
 *
 * FORM "1 EUR = N birim" DİYE SORUYOR — kurlar günlük hayatta böyle
 * yazılıyor (1 EUR = 55,96 TRY). Veritabanına ters çevrilmiş hâli gidiyor;
 * çevrimi eylem yapıyor, kullanıcının kafasında değil.
 *
 * Canlı kur çekilmiyor (PROJE.md §4.6): altı ay sonraki bir karar için günlük
 * dalgalanma gürültü. Liste her yenilendiğinde sıralamanın oynaması, kararı
 * değil kuru takip etmeye yol açardı.
 */

function Kaydet() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="dugme dugme-ana" disabled={pending}>
      {pending ? 'Kaydediliyor…' : 'Kurları kaydet'}
    </button>
  )
}

export function KurFormu({ kur }: { kur: KurAyari }) {
  const [sonuc, eylem] = useActionState<EylemSonucu, FormData>(kurKaydetEylem, {})
  const varsayilanMi = kur.tarih === KUR_TARIHI

  return (
    <form action={eylem}>
      {sonuc.hata && (
        <div className="uyari uyari-hata alt-m" role="alert">
          <span aria-hidden>⚠</span>
          <span>{sonuc.hata}</span>
        </div>
      )}
      {sonuc.tamam && (
        <div className="uyari uyari-basari alt-m">
          <span aria-hidden>✓</span>
          <span>{sonuc.mesaj}</span>
        </div>
      )}

      <div className="alan">
        <label className="alan-etiket" htmlFor="tarih">Kurların tarihi</label>
        <input
          id="tarih" name="tarih" type="date"
          defaultValue={kur.tarih}
          style={{ maxWidth: 200 }}
        />
        <span className="alan-ipucu">
          Maliyet ekranlarında bu tarih yazıyor — hangi güne ait olduğunu
          bilmeden karşılaştırma yapmak yanıltıcı olur.
        </span>
      </div>

      <div className="tablo-sar alt-m">
        <table>
          <thead>
            <tr>
              <th>Para birimi</th>
              <th className="sag">1 EUR = ?</th>
              <th className="sag">Başlangıç değeri</th>
            </tr>
          </thead>
          <tbody>
            {PARA_BIRIMLERI.filter((p) => p.kod !== 'EUR').map((p) => {
              const mevcut = kur.kurlar[p.kod]
              const varsayilan = VARSAYILAN_KURLAR[p.kod]
              return (
                <tr key={p.kod}>
                  <td>
                    <span className="kalin">{p.kod}</span>
                    <div className="k2 soluk-2">{p.ad}</div>
                  </td>
                  <td className="sag">
                    <input
                      type="text"
                      inputMode="decimal"
                      name={`kur_${p.kod}`}
                      defaultValue={mevcut ? euroBasina(mevcut).toFixed(4) : ''}
                      aria-label={`1 EUR kaç ${p.kod}`}
                      style={{ width: 120, textAlign: 'right' }}
                    />
                  </td>
                  <td className="sag k2 soluk-2">
                    {varsayilan ? euroBasina(varsayilan).toFixed(4) : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="satir satir-sar" style={{ justifyContent: 'flex-end' }}>
        {!varsayilanMi && (
          <button
            type="submit"
            className="dugme dugme-sade"
            formAction={kurSifirlaEylem}
          >
            Başlangıç değerlerine dön
          </button>
        )}
        <Kaydet />
      </div>
    </form>
  )
}
