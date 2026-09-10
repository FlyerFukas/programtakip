import { redirect } from 'next/navigation'
import { oturumVar, korumaHazirMi } from '@/lib/auth'
import { veritabaniHazirMi } from '@/lib/veritabani'
import { UstBar } from '@/bilesenler/UstBar'

/**
 * Uygulama kabuğu.
 *
 * Buradaki oturum kontrolü GÖRÜNÜRLÜK içindir; yazma güvenliği her server
 * action'ın kendi `oturumZorunlu()` çağrısıyla sağlanır (app/eylemler.ts).
 */
export default async function UygulamaDuzeni({ children }: { children: React.ReactNode }) {
  if (!korumaHazirMi() || !veritabaniHazirMi()) redirect('/kurulum')
  if (!(await oturumVar())) redirect('/giris')

  return (
    <div className="kabuk">
      <UstBar />
      {children}
    </div>
  )
}
