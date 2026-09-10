import Link from 'next/link'
import {
  programlariGetir, programBelgeleriGetir, havuzGetir, ulkeleriGetir,
} from '@/lib/sorgular'
import { belgeTakvimi, acilBelgeler, takvimOzeti } from '@/lib/belge-takvim'
import {
  siraSkoru, turUyarisi, tarihFormat, tarihKisa, HAZIRLIK_ETIKET,
} from '@/lib/tarih'
import { KAPALI_DURUMLAR, belgeAdi } from '@/lib/sabitler'
import {
  DurumRozeti, UlkeEtiketi, GeriSayim, UygunlukRozeti, seritSinifi, BosDurum,
} from '@/bilesenler/Rozetler'
import type { ProgramGenis } from '@/lib/tipler'

export const metadata = { title: 'Panel — Program Takip' }
export const dynamic = 'force-dynamic'

/** Panelde kaç satır gösterilecek — "hepsi" değil, "şimdi bakman gerekenler". */
const PROGRAM_ADEDI = 6
const BELGE_ADEDI = 4

/**
 * Panel — açılışta görünen ekran.
 *
 * TEK SORUYU CEVAPLIYOR: bugün ne yapmam gerekiyor. Listelerin kendisi
 * kendi ekranlarında; burada yalnızca zaman baskısı olan şeyler var.
 *
 * Neden "hepsini göster" değil: her şey gösterilen bir panel hiçbir şeyi
 * göstermiyor demektir. Altı program ve dört belge sığdırılabilir bir liste;
 * gerisi için ekranların kendisi var ve her bölümün altında bağlantısı
 * duruyor.
 *
 * Sıralama `siraSkoru` ile — o da `etkinTarih`e bakıyor, yani merkezî tarih
 * ile SENİN turundan hangisi önceyse ona (PROJE.md §4.4 / §7.2 çelişkisinin
 * çözümü, lib/tarih.ts'te yazılı). AB turu paneli hiç etkilemiyor.
 */
export default async function PanelSayfasi() {
  const [programlar, programBelgeleri, havuz, ulkeler] = await Promise.all([
    programlariGetir(),
    programBelgeleriGetir(),
    havuzGetir(),
    ulkeleriGetir(),
  ])

  const takvim = belgeTakvimi(programlar, programBelgeleri, havuz)
  const ozet = takvimOzeti(takvim)
  const acil = acilBelgeler(takvim, BELGE_ADEDI)

  const acik = programlar.filter((p) => !KAPALI_DURUMLAR.includes(p.durum))
  const yaklasan = [...acik].sort((a, b) => siraSkoru(a) - siraSkoru(b)).slice(0, PROGRAM_ADEDI)

  /* Uygunluğa bakılmamış ya da şüpheli olanlar: başvuru hazırlarken
     öğrenilmesi en pahalı şey elenmiş olmak. */
  const uygunlukBekleyen = acik.filter(
    (p) => p.uygunluk === 'supheli' || p.uygunluk === 'bilinmiyor',
  )

  /* Turu geçmiş / sana kapalı programlar — sessiz kalırsa yıl kaybettirir. */
  const turUyarilari = acik
    .map((p) => ({ program: p, uyari: turUyarisi(p) }))
    .filter((x): x is { program: ProgramGenis; uyari: string } => Boolean(x.uyari))

  if (programlar.length === 0) {
    return (
      <main className="icerik">
        <h1 className="alt-l">Panel</h1>
        <div className="kart">
          <BosDurum
            simge="🎓"
            baslik="Henüz kayıt yok"
            aciklama={ulkeler.length === 0
              ? 'Sıra şöyle: önce ülke (göç yolu bilgisi orada), sonra üniversite, sonra program. Ya da program sayfasını yapıştırıp modele okut.'
              : 'Ülkeler hazır. Şimdi üniversite ve program ekle — ya da program sayfasını yapıştırıp modele okut.'}
          >
            <div className="satir-arasi" style={{ justifyContent: 'center', gap: 8 }}>
              <Link href="/ekle" className="dugme dugme-ana">Metinden ekle</Link>
              <Link href={ulkeler.length === 0 ? '/ulkeler/yeni' : '/programlar/yeni'}
                className="dugme dugme-sade">
                {ulkeler.length === 0 ? 'Ülke ekle' : 'Program ekle'}
              </Link>
            </div>
          </BosDurum>
        </div>
      </main>
    )
  }

  return (
    <main className="icerik">
      <div className="satir-arasi satir-sar alt-l">
        <div>
          <h1>Panel</h1>
          <p className="soluk k1 ust-s bosluk-0">
            Bugün {tarihFormat(ozet.bugunTarih)} — bütün geri sayımlar bu güne göre.
          </p>
        </div>
        <Link href="/ekle" className="dugme dugme-ana">＋ Metinden ekle</Link>
      </div>

      {/* ══════════════════════════════ sayaçlar ═══════════════════════ */}
      <div className="izgara izgara-4 alt-l">
        <div className="sayac">
          <div className="sayac-buyuk">{acik.length}</div>
          <div className="sayac-etiket">açık program</div>
        </div>
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
          <div className="sayac-buyuk">{uygunlukBekleyen.length}</div>
          <div className="sayac-etiket">uygunluğu belirsiz</div>
        </div>
      </div>

      {/* ═══════════════════════════ tur uyarıları ═════════════════════ */}
      {turUyarilari.length > 0 && (
        <div className="uyari uyari-dikkat alt-l">
          <span aria-hidden>⚠</span>
          <span>
            <strong>Başvuru turu uyarısı:</strong>
            <ul style={{ margin: '.4rem 0 0', paddingLeft: '1.1rem' }}>
              {turUyarilari.map(({ program, uyari }) => (
                <li key={program.id}>
                  <Link href={`/programlar/${program.id}`}>{program.ad}</Link> — {uyari}
                </li>
              ))}
            </ul>
          </span>
        </div>
      )}

      {/* ═══════════════════════ yaklaşan son tarihler ═════════════════ */}
      <section className="alt-l">
        <div className="satir-arasi alt-m">
          <h2 className="bosluk-0">Sıradaki son tarihler</h2>
          <Link href="/programlar" className="k1">Tümü ({acik.length}) →</Link>
        </div>

        {yaklasan.length === 0 ? (
          <div className="kart">
            <BosDurum
              simge="✅"
              baslik="Açık program yok"
              aciklama="Bütün kayıtlar sonuçlanmış ya da kapatılmış görünüyor."
            />
          </div>
        ) : (
          <div className="sutun" style={{ gap: 10 }}>
            {yaklasan.map((p) => (
              <Link key={p.id} href={`/programlar/${p.id}`}
                className={`kart kart-sik ${seritSinifi(p)}`}>
                <div className="satir-arasi satir-sar">
                  <div style={{ minWidth: 0 }}>
                    <div className="kalin tek-satir">{p.ad}</div>
                    <div className="k2 soluk-2 ust-s">
                      {p.universite?.ad}
                      {p.universite?.ulke_kodu && (
                        <> · <UlkeEtiketi kod={p.universite.ulke_kodu} kisa /></>
                      )}
                    </div>
                  </div>
                  <div className="satir" style={{ gap: 6, flexShrink: 0 }}>
                    <UygunlukRozeti kod={p.uygunluk} />
                    <DurumRozeti kod={p.durum} />
                    <GeriSayim program={p} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ══════════════════════════ acil belgeler ══════════════════════ */}
      <section className="alt-l">
        <div className="satir-arasi alt-m">
          <h2 className="bosluk-0">Şimdi başlaman gerekenler</h2>
          <Link href="/belgeler" className="k1">Belge takvimi →</Link>
        </div>

        {acil.length === 0 ? (
          <div className="kart">
            <BosDurum
              simge="🗂"
              baslik="Acil belge yok"
              aciklama={ozet.toplam > 0
                ? `${ozet.toplam} belge bekliyor ama hiçbirinin başlama tarihi gelmemiş. Takvimde hepsini görebilirsin.`
                : 'Programlarında istenen belge işaretlenmemiş. Program formundaki "İstenen belgeler" bölümünden seçince bu bölüm dolar.'}
            />
          </div>
        ) : (
          <div className="sutun" style={{ gap: 10 }}>
            {acil.map((b) => (
                <Link key={b.kod} href="/belgeler" className="kart kart-sik">
                  <div className="satir-arasi satir-sar">
                    <div style={{ minWidth: 0 }}>
                      <div className="kalin">
                        <span aria-hidden>{b.simge}</span> {belgeAdi(b.kod)}
                      </div>
                      <div className="k2 soluk-2 ust-s">
                        {b.toplam} program istiyor
                        {b.enYakinTarih && <> · en yakını {tarihKisa(b.enYakinTarih)}</>}
                        {' · '}hazırlık {b.hazirlikGun} gün
                        {b.hazirlikGun < b.tamHazirlikGun && (
                          <> (havuzda geçerli duruyor, {b.tamHazirlikGun} yerine)</>
                        )}
                      </div>
                    </div>
                    <span className={`rozet rozet-${b.hazirlik === 'gecikti' ? 'kirmizi' : 'turuncu'}`}>
                      {HAZIRLIK_ETIKET[b.hazirlik]}
                    </span>
                  </div>
                </Link>
            ))}
          </div>
        )}
      </section>

      {/* ════════════════════════ uygunluk kapısı ══════════════════════ */}
      {uygunlukBekleyen.length > 0 && (
        <div className="uyari uyari-bilgi">
          <span aria-hidden>ℹ</span>
          <span>
            <strong>{uygunlukBekleyen.length} programın</strong> ön koşullarına
            henüz bakmadın ya da şüpheli işaretledin. Belge hazırlamaya
            başlamadan önce bakmakta fayda var — elendiğini sonradan öğrenmek
            en pahalısı.{' '}
            <Link href="/programlar?uygunluk=supheli,bilinmiyor">Listeye git →</Link>
          </span>
        </div>
      )}
    </main>
  )
}
