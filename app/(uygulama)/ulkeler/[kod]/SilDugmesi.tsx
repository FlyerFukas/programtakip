'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { ulkeSilEylem } from '@/app/eylemler'

function Onayla() {
  const { pending } = useFormStatus()
  return (
    <button type="submit" className="dugme dugme-tehlike" disabled={pending}>
      {pending ? 'Siliniyor…' : 'Evet, sil'}
    </button>
  )
}

/**
 * İki adımlı silme.
 *
 * `confirm()` yerine satır içi onay: tarayıcı diyaloğu mobilde çirkin,
 * neyin silineceğini göstermez ve yanlışlıkla Enter'a basınca geçilebilir.
 * Burada ülkenin adı tekrar yazılı — yanlış kaydı sildiğini fark edersin.
 *
 * Altında üniversite varsa düğme hiç etkinleşmiyor. Veritabanı zaten
 * `on delete restrict` ile engelliyor ama kullanıcıyı "sil"e bastırıp
 * hatayla karşılamak yerine sebebi önden söylemek daha az sinir bozucu.
 */
export function SilDugmesi({
  kod, ad, universiteSayisi,
}: {
  kod: string
  ad: string
  universiteSayisi: number
}) {
  const [soruyor, setSoruyor] = useState(false)

  if (universiteSayisi > 0) {
    return (
      <button
        type="button"
        className="dugme dugme-tehlike"
        disabled
        title={`Önce bu ülkedeki ${universiteSayisi} üniversiteyi sil ya da başka ülkeye taşı.`}
      >
        Sil
      </button>
    )
  }

  if (!soruyor) {
    return (
      <button type="button" className="dugme dugme-tehlike" onClick={() => setSoruyor(true)}>
        Sil
      </button>
    )
  }

  return (
    <div className="uyari uyari-hata" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
      <div>
        <strong>{ad}</strong> kaydı ve içindeki göç yolu notları kalıcı olarak silinecek.
      </div>
      <div className="satir ust-s">
        <form action={ulkeSilEylem}>
          <input type="hidden" name="kod" value={kod} />
          <Onayla />
        </form>
        <button type="button" className="dugme" onClick={() => setSoruyor(false)}>
          Vazgeç
        </button>
      </div>
    </div>
  )
}
