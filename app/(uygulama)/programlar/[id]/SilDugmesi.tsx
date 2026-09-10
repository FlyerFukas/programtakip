'use client'

import { useState } from 'react'
import { useFormStatus } from 'react-dom'
import { programSilEylem } from '@/app/eylemler'

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
 * Bir programı elemek istiyorsan silmek yerine durumu &quot;Vazgeçtim&quot; ya da
 * uygunluğu &quot;Uygun değil&quot; yapmak daha iyi: kayıt listeden düşer ama sebebi
 * durur. Onay kutusu bunu hatırlatıyor — altı ay sonra "bunu neden
 * elemiştim" sorusunun cevabı olsun diye.
 */
export function SilDugmesi({ id, ad }: { id: string; ad: string }) {
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
        <strong>{ad}</strong> kaydı, başvuru turları ve belge işaretleri kalıcı
        olarak silinecek.
      </div>
      <div className="k2 ust-s">
        Elemek istiyorsan silme: durumu &quot;Vazgeçtim&quot; yap ya da uygunluğu
        &quot;Uygun değil&quot; işaretle — kayıt listeden düşer, sebebi kalır.
      </div>
      <div className="satir ust-s">
        <form action={programSilEylem}>
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
