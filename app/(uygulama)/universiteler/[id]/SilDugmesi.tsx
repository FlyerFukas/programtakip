'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { universiteSilEylem } from '@/app/eylemler'

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
 * Ülke silmeden farkı: burada altındaki programlar CASCADE ile birlikte
 * gidiyor, yani düğme engellenmiyor — ama kaç kaydın gideceği onay metninde
 * açıkça yazıyor. Sessizce zincirleme silmek, silinen şeyi fark etmemek
 * demek olurdu.
 */
export function SilDugmesi({
  id, ad, programSayisi,
}: {
  id: string
  ad: string
  programSayisi: number
}) {
  const [soruyor, setSoruyor] = useState(false)

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
        <strong>{ad}</strong> kaydı silinecek.
        {programSayisi > 0 && (
          <>
            {' '}Altındaki <strong>{programSayisi} program</strong> ve o programların
            belge işaretleri de birlikte gidecek.
          </>
        )}
      </div>
      <div className="satir ust-s">
        <form action={universiteSilEylem}>
          <input type="hidden" name="id" value={id} />
          <Onayla />
        </form>
        <button type="button" className="dugme" onClick={() => setSoruyor(false)}>
          Vazgeç
        </button>
      </div>
    </div>
  )
}
