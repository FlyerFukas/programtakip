import Link from 'next/link'
import { BosDurum } from '@/bilesenler/Rozetler'

export default function Bulunamadi() {
  return (
    <main className="icerik">
      <div className="kart">
        <BosDurum
          simge="🔎"
          baslik="Bu ülke bulunamadı"
          aciklama="Kayıt silinmiş ya da adres yanlış olabilir. Ülkeler iki harfli ISO koduyla adreslenir: /ulkeler/NL"
        >
          <Link href="/ulkeler" className="dugme dugme-ana">Ülke listesine dön</Link>
        </BosDurum>
      </div>
    </main>
  )
}
