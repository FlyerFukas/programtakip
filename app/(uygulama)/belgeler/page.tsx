import Link from 'next/link'
import { programlariGetir, programBelgeleriGetir, havuzGetir } from '@/lib/sorgular'
import { belgeTakvimi, havuzListesi, takvimOzeti } from '@/lib/belge-takvim'
import { BELGE_BEKLEYEN_DURUMLAR } from '@/lib/sabitler'
import { tarihFormat } from '@/lib/tarih'
import { BosDurum } from '@/bilesenler/Rozetler'
import { BelgeSatiriKarti } from './BelgeSatiriKarti'
import { HavuzKarti } from './HavuzKarti'

export const metadata = { title: 'Belgeler — Bölüm Takip' }
export const dynamic = 'force-dynamic'

/**
 * Belge takvimi — bu uygulamanın asıl değeri.
 *
 * Program listesi "nereye başvurabilirim" sorusunu cevaplıyor; bu ekran
 * "bugün ne yapmam gerekiyor" sorusunu. İkisi farklı sorular ve ikincisi
 * daha çok iş kaybettiriyor.
 *
 * Üç kural burada birleşiyor:
 *  §6.3 Son tarih değil BAŞLAMA tarihi gösterilir.
 *  §6.4 Havuzda geçerli duran belge hazırlık süresi yemez (3 gün).
 *  §4.7 Başvurusu gönderilmiş programın belgesi "geciktin" demez.
 */
export default async function BelgelerSayfasi() {
  const [programlar, programBelgeleri, havuz] = await Promise.all([
    programlariGetir(),
    programBelgeleriGetir(),
    havuzGetir(),
  ])

  const takvim = belgeTakvimi(programlar, programBelgeleri, havuz)
  const ozet = takvimOzeti(takvim)
  const havuzSatirlari = havuzListesi(havuz, takvim)

  const acikProgram = programlar.filter((p) => BELGE_BEKLEYEN_DURUMLAR.includes(p.durum)).length
  const bekleyen = takvim.filter((s) => !s.bitti)
  const biten = takvim.filter((s) => s.bitti)

  return (
    <main className="icerik">
      <div className="alt-l">
        <h1>Belge takvimi</h1>
        <p className="soluk k1 ust-s bosluk-0">
          Son tarihi değil <strong>başlama tarihini</strong> gösteriyor. IELTS
          90 gün sürüyorsa, 60 gün kalan bir başvuru için &quot;60 gün var&quot; demek
          yanıltıcı — çoktan gecikmişsindir.
        </p>
      </div>

      {/* ══════════════════════════════ sayaçlar ═══════════════════════ */}
      {takvim.length > 0 && (
        <div className="izgara izgara-4 alt-l">
          <div className="sayac">
            <div
              className="sayac-buyuk"
              style={{ color: ozet.geciken > 0 ? 'var(--kirmizi)' : undefined }}
            >
              {ozet.geciken}
            </div>
            <div className="sayac-etiket">geciken belge</div>
          </div>
          <div className="sayac">
            <div
              className="sayac-buyuk"
              style={{ color: ozet.baslamali > 0 ? 'var(--turuncu)' : undefined }}
            >
              {ozet.baslamali}
            </div>
            <div className="sayac-etiket">şimdi başlamalı</div>
          </div>
          <div className="sayac">
            <div className="sayac-buyuk">{ozet.toplam}</div>
            <div className="sayac-etiket">bekleyen belge</div>
          </div>
          <div className="sayac">
            <div className="sayac-buyuk">{acikProgram}</div>
            <div className="sayac-etiket">belge bekleyen program</div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════ takvim ═════════════════════════ */}
      {takvim.length === 0 ? (
        <div className="kart alt-l">
          <BosDurum
            simge="📋"
            baslik="Takvim boş"
            aciklama={programlar.length === 0
              ? 'Henüz program yok. Program ekleyip istediği belgeleri işaretlediğinde bu ekran kendiliğinden dolar.'
              : 'Programların hiçbirinde belge işaretlenmemiş ya da hepsinin başvurusu gönderilmiş. Program formundaki "İstenen belgeler" bölümünden seç.'}
          >
            <Link href="/programlar" className="dugme dugme-ana">Programlara git</Link>
          </BosDurum>
        </div>
      ) : (
        <>
          <div className="sutun alt-l" style={{ gap: 12 }}>
            {bekleyen.map((s) => <BelgeSatiriKarti key={s.kod} satir={s} />)}
          </div>

          {biten.length > 0 && (
            <>
              <h2 className="alt-m soluk">Tamamlananlar</h2>
              <div className="sutun alt-l" style={{ gap: 12 }}>
                {biten.map((s) => <BelgeSatiriKarti key={s.kod} satir={s} />)}
              </div>
            </>
          )}
        </>
      )}

      {/* ═════════════════════════════ belge havuzu ════════════════════ */}
      <section className="ust-l">
        <div className="alt-m">
          <h2>Elindeki kalıcı belgeler</h2>
          <p className="soluk k1 ust-s bosluk-0">
            Bir kere alıp her başvuruda kullandıkların. Burada &quot;hazır&quot;
            işaretlediğin bir belgenin hazırlık süresi takvimde{' '}
            <strong>3 güne</strong> düşer — sıfırdan üretmen değil, yüklemen
            gerekiyor.
          </p>
        </div>

        <div className="izgara izgara-2">
          {havuzSatirlari.map((b) => <HavuzKarti key={b.kod} belge={b} />)}
        </div>
      </section>

      <p className="k2 soluk-2 ust-l">
        Bugün {tarihFormat(ozet.bugunTarih)} — bütün hesaplar bu güne göre.
      </p>
    </main>
  )
}
