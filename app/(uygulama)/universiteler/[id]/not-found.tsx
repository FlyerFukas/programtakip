import Link from 'next/link'
import { BosDurum } from '@/bilesenler/Rozetler'

export default function Bulunamadi() {
  return (
    <main className="icerik">
      <div className="kart">
        <BosDurum
          simge="🔎"
          baslik="Bu üniversite bulunamadı"
          aciklama="Kayıt silinmiş ya da adres yanlış olabilir. Bağlı olduğu ülke silindiyse üniversite de silinmiş olabilir."
        >
          <Link href="/universiteler" className="dugme dugme-ana">Üniversite listesine dön</Link>
        </BosDurum>
      </div>
    </main>
  )
}
