import Link from 'next/link'
import { BosDurum } from '@/bilesenler/Rozetler'

export default function Bulunamadi() {
  return (
    <main className="icerik">
      <div className="kart">
        <BosDurum
          simge="🔎"
          baslik="Bu program bulunamadı"
          aciklama="Kayıt silinmiş ya da adres yanlış olabilir. Bağlı olduğu üniversite silindiyse program da silinmiştir."
        >
          <Link href="/programlar" className="dugme dugme-ana">Program listesine dön</Link>
        </BosDurum>
      </div>
    </main>
  )
}
