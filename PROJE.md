# Bölüm Takip: Proje Şartnamesi

> **Bu dosya yeni bir Claude Code sohbetine verilecek eksiksiz brief'tir.**
> Okuyan oturumun bu projeye dair başka hiçbir bağlamı yok. İhtiyacın olan
> her şey burada ya da işaret edilen dosyalarda.

---

## 0. Bu belge nedir

Bölüm Takip'in şartnamesi ve tasarım günlüğü. Ne yapıldığını değil,
**neden öyle yapıldığını** anlatır: hangi kararın arkasında hangi gerçek
sorun var, hangi basitleştirme neyi bozar.

Koddaki yorumlar buraya bölüm numarasıyla atıf yapıyor (`PROJE.md §4.4`
gibi), o yüzden numaralandırma sabit tutuluyor.

Kurulum için [BASLA.md](BASLA.md), genel tanıtım için
[README.md](README.md).

---

## 1. Hedef kullanıcı ve amaç

Uygulama tek bir kullanıcı profili için tasarlandı: **AB/AEA dışı pasaportla
Avrupa'da yüksek lisans arayan bir aday.** Bu kısıt dekoratif değil, veri
modelinin merkezinde; sebebini §4.4'te göreceksin.

**Asıl hedef diploma değil:**

> yüksek lisans → çalışma → çalışma + oturum izni → uzun vadeli yerleşme

Yani bir program "iyi" olduğu için değil, **o ülkede kalmanın yolunu açtığı
için** değerli. Sıralaması yüksek ama mezuniyet sonrası çalışma izni vermeyen
bir program, bu ölçütle kötü bir programdır. Uygulama bu kararı verebilmeli;
`ulkeler` tablosunun göç yolu alanları (§4.2) bunun için var.

**Kırmızı çizgi:** geri dönüş yükümlülüğü. Mezuniyetten sonra ülkeye dönmeyi
zorunlu kılan burs/program kanalları elenir. `ulkeler.donus_yukumlulugu`
alanı ve `Rozetler.tsx` içindeki uyarı bunu görünür tutuyor.

### Dil ve isimlendirme

Arayüz, kod içindeki değişken/dosya adları ve veritabanı sütunları **Türkçe**
(`lib/tarih.ts`, `programKaydet`, `son_tarih_tipi`). Tutarlı; karışık dilde
isim yazma.

---

## 2. Mimari soyağacı

Bu uygulamanın bir kardeşi var: aynı kullanıcının burs programlarını takip
ettiği **Burs Takip** (https://burs-takip.vercel.app). Şasi oradan geldi ve
iki projede de aynı: parola + HMAC imzalı çerez, dört tipli son tarih mantığı,
belge takvimi, Türkçe metin normalizasyonu, tasarım sistemi (`app/globals.css`),
`/kurulum` teşhis ekranı, PWA kurulumu.

Devralınan ve burada da geçerli olan çekirdek dosyalar:

| Dosya | Ne yapıyor |
|---|---|
| `lib/auth.ts` | tek parola + imzalı çerez, sunucuda oturum durumu yok |
| `lib/metin.ts` | `sadelestir`: Türkçe aksan/büyük harf normalizasyonu |
| `lib/tarih.ts` | 4 tipli son tarihi tek sıralanabilir değere indirir |
| `lib/belge-takvim.ts` | veriyi kayıt ekseninden **belge eksenine** çevirir |
| `lib/suzgec.ts` | istemci tarafı süzme + sıralama, saf fonksiyonlar |
| `app/globals.css` | tasarım sistemi, açık/koyu tema |

Farklı olan: orada **para sana geliyor**, burada **senden gidiyor**; orada tek
düzlem var, burada üç katman (§4.1). Ayrıntılı fark listesi §3'te.

---

## 3. BursTakip'ten ne değişiyor

### 3.1 Aynı kalan

Son tarihin 4 tipli yapısı, belge sözlüğü ve belge takvimi, havuz belgeler,
durum/öncelik, etiketler, ham metin saklama, kural + YZ ayrıştırma, istemci
tarafı süzme + URL'ye yazma, parola + imzalı çerez, PWA, yedekleme.
(Erişim modeli değişti: `service_role` yerine doğrudan Postgres bağlantısı,
sebebi §8.3.)

### 3.2 Tersine dönen

| BursTakip | Bölüm Takip |
|---|---|
| `kapsam`: burs neyi karşılıyor | **maliyet**: program ne kadar tutuyor |
| `burs_tutari` (serbest metin) | `ogrenim_ucreti` (sayı) + `para_birimi` |
| `kontenjan`: kaç kişiye veriyor | `kontenjan` + `kabul_orani`: kaç kişi alıyor |
| tek düzlem: burs | **üç katman: ülke → üniversite → program** |

Para artık serbest metin değil **sayı + para birimi**, çünkü asıl soru
"DKK cinsinden Aalborg mu, EUR cinsinden Leiden mi daha ucuz" ve buna serbest
metinle cevap veremezsin. Karşılaştırma bu projenin varlık sebebi.

### 3.3 Yeni olan: dördü de önemli

**1. Başvuru turları.** Bir programın tek son tarihi olmayabilir. Kıta
Avrupası'nda yaygın kalıp: AB dışı başvuru AB başvurusundan haftalar, çoğu
zaman aylar önce kapanır. Kullanıcı AB dışı. Yanlış turu takip etmek bir yıl
kaybettirir. Ayrıntı §4.4.

**2. Uygunluk kapısı.** Programların ön koşulları var: "en az 30 ECTS
matematik", "ekonomi ya da ilgili bir lisans", "kanıtlanmış programlama
bilgisi". Kullanıcı başvurmadan önce **elenip elenmeyeceğini** görmeli. Bu,
belge takvimiyle aynı ağırlıkta bir özellik: ikisi de "sonradan öğrenmek
yerine şimdi gör" işi yapıyor.

**3. Göç yolu (ülke katmanında).** Mezuniyet sonrası çalışma izni kaç ay,
oturum izni kaç yılda geliyor, oturum için dil şartı var mı, yabancı mülk
alabiliyor mu, çifte vatandaşlık kabul ediliyor mu. **Kullanıcının gerçek karar
ekseni bu.** Programa değil ülkeye ait, o yüzden `ulkeler` tablosunda.

**4. Karşılaştırma ekranı.** 2–4 programı yan yana koyup karar verme.
BursTakip'te gerekmiyordu (burs kazanırsan alırsın), burada tek programa
kayıt olacak, seçim yapması gerekiyor.

### 3.4 Taşınmayan

`kaynak_tipi` (Türkiye çıkışlı / global): burs kavramı, programda karşılığı yok.
`KAPSAMLAR` kod listesi; yerini maliyet alanları alıyor.

---

## 4. Veri modeli

### 4.1 Katmanlar ve gerekçe

```
ulkeler (kod PK)          ~10 satır    göç yolu, yaşam gideri, vize
   └── universiteler       ~40 satır    sıralama, şehir, başvuru platformu, ücretler
          └── programlar   ~120 satır   BAŞVURU BİRİMİ: son tarih, ücret, koşul, belge
                 └── program_belgeler   belge hazırlık durumu
havuz_belgeler                          elindeki kalıcı belgeler (IELTS, transkript…)
```

**Neden üç tablo, neden tek düz tablo değil:** Aalborg'un şehri, QS sırası,
başvuru platformu ve başvuru ücreti o üniversitedeki **bütün** programlar için
aynı. Düz tabloda 5 program girmek aynı bilgiyi 5 kez yazmak, güncellemek 5
düzenleme demek. Ayrıca kullanıcı "üniversiteleri görmek" istiyor; üniversitenin
kendi sayfası olmalı.

**`ulke_kodu` programlar tablosuna KOPYALANMIYOR.** Üniversiteden geliyor,
PostgREST gömme sorgusuyla tek istekte çekiliyor:

```sql
select p.*, jsonb_build_object('ad', u.ad, 'sehir', u.sehir, …) as universite
  from programlar p join universiteler u on u.id = p.universite_id
```

(Şartname ilk yazıldığında burada Supabase'in PostgREST gömme sorgusu vardı:
`.select('*, universite:universiteler(*)')`. Neon'da PostgREST yok, join elle
yazılıyor; gerekçe aynı, uygulaması `lib/sorgular.ts` içinde tek yerde.)

Kopyalanan alan er geç sapar; bu ölçekte (yüzlerce satır) gömme sorgusunun
maliyeti sıfır. Sapabilecek bir alan yaratmaktansa join'i öde.

### 4.2 SQL şeması

**Şemanın kaynağı `veritabani/sema.sql` dosyasıdır.** Bu bölümde daha önce
şemanın tam bir kopyası duruyordu; Neon'a geçişte ikisi ayrışmaya başlayınca
kopya kaldırıldı. İki yerde duran şema er geç birbirini tutmaz; `ulke_kodu`
programlara neden kopyalanmıyorsa (§4.1) aynı gerekçe.

Dosyanın kendi başında neyin neden öyle olduğu yazılı. Değişmeyen kararlar:

- Üç katman: `ulkeler` → `universiteler` → `programlar`, artı
  `program_belgeler`, `havuz_belgeler`, `ayarlar`.
- Son tarihin dört tipli yapısı ve `prg_son_tarih_tutarli` CHECK'i.
- `basvuru_turlari` `jsonb`; AB dışı / AB ayrımı bu dizide.
- Tamamı `if not exists`: tekrar tekrar çalıştırmak güvenli.

> **SIRA ÖNEMLİ:** Sonradan sütun ekleyeceğin zaman `alter table ... add column
> if not exists` bloğunu **indekslerden ÖNCE** koy. BursTakip'te bu blok dosya
> sonundayken, var olan bir veritabanında `create table if not exists` tabloyu
> atladığı için `column ... does not exist` hatası alındı.

**`ayarlar` tablosu şartnamenin ilk hâlinde yoktu.** §4.6 kur oranlarının
veritabanında saklandığını söylüyordu ama §4.2'de bunu tutacak tablo yoktu;
Aşama 1'de eklendi (anahtar-değer, `jsonb`).

**Uygulama:** `npm run sema`. Betik `.env.local`deki `DATABASE_URL`i okur,
dosyayı çalıştırır ve tablo tablo satır sayısı raporlar. Panele girip SQL
kopyalamak gerekmiyor; Supabase'de gereken adım buydu, Neon'da bağlantı
dizgesi elimizde olduğu için betik hallediyor.

**RLS YOK.** Şartname ilk yazıldığında "RLS açık + hiçbir politika yok"
diyordu; o kurgu Supabase'in PostgREST'i anon anahtarıyla internete
açmasından doğuyordu; kapatılması gereken bir kapı vardı. Neon'da halka açık
HTTP API yok; veritabanına yalnızca `DATABASE_URL` ile gidiliyor ve o dizge
sunucudan çıkmıyor. Kapatacak kapı olmadığı için RLS de yok. Tek savunma
hattı uygulama katmanı: yazan her server action `oturumZorunlu()` ile başlar
(§6.6).


### 4.3 TypeScript tipleri

`lib/tipler.ts`: alan adları veritabanı sütunlarıyla **birebir aynı**, böylece
sorgu sonucu doğrudan tipe oturuyor, arada eşleme katmanı olmuyor.

```ts
export type BasvuruTuru = {
  ad: string                    // "Tur 1; AB dışı"
  son_tarih: string | null      // YYYY-MM-DD
  /** Bu tur kimin için açık. Kullanıcı AB DIŞI. */
  kimin_icin: 'ab_disi' | 'ab' | 'herkes' | null
  baslangic: string | null      // "2027 Güz"
  sonuc_tarihi: string | null   // sonucun açıklanacağı gün
  not: string | null
}

export type Ulke = { kod: string; ad: string; /* … §4.2'deki sütunlar … */ }
export type Universite = { id: string; ad: string; ulke_kodu: string; /* … */ }
export type Program = { id: string; ad: string; universite_id: string; /* … */ }

/** Liste ve detay sorgularının döndürdüğü, üniversitesi gömülü hâli. */
export type ProgramGenis = Program & {
  universite: Pick<Universite,
    'id' | 'ad' | 'ulke_kodu' | 'sehir' | 'qs_sirasi' |
    'basvuru_ucreti' | 'basvuru_ucreti_para' | 'depozito' | 'depozito_para'>
}
```

### 4.4 Başvuru turları: bu projenin en kritik detayı

Danimarka'da AB/AEA dışı başvuru **15 Ocak**, AB başvurusu **15 Mart**
kapanır. Hollanda, Belçika ve İskandinavya'da da kalıp aynı: AB dışı tur önce
kapanıyor, fark haftalarla aylar arasında değişiyor. **Kullanıcı AB dışı.**
Programın sayfasında büyük puntoyla yazan tarih çoğunlukla AB tarihidir;
ona bakarsa geç kalır.

> Bu şartname somut tarih ezberletmiyor; her programın kendi turu kayda
> girecek. Önemli olan **yapının** iki turu ayrı tutması ve uygulamanın
> Kullanıcıya ait olanı seçmesi.

Bu yüzden `etkinTarih()` merkezî tarihe değil, **kendisine açık olan tura**
bakmalı:

```ts
/**
 * Kullanıcının takip etmesi gereken tur.
 *
 * AB dışı pasaportu olduğu için yalnızca 'ab_disi' ve 'herkes' turları
 * bağlayıcı; 'ab' turları bilgi amaçlı gösterilir ama tarihi belirlemez.
 *
 * Turlar tekrarlıyor (her yıl açılıyor), o yüzden "en erken" değil
 * "GEÇMEMİŞ EN YAKIN" tur alınır. Hepsi geçmişse en sonuncusu döner -
 * o zaman kart "kaçırdın" diye gösterilsin, tarihsiz görünmesin.
 */
export function siradakiTur(p: TarihliProgram): BasvuruTuru | null
```

`etkinTarih()` sırası: `siradakiTur()?.son_tarih` → yoksa merkezî
`son_tarih` / `son_tarih_baslangic` → yoksa `null`.

Bu, BursTakip'teki `enErkenUniversiteTarihi()` fonksiyonunun tam
karşılığıdır; orada çatı burs üniversitelere kota dağıtıyordu, burada
program başvuruyu turlara bölüyor. **`lib/tarih.ts`'te o fonksiyona ve
çevresindeki testlere bak, aynı kalıbı uygula.**

Arayüzde AB turu da görünsün ama farkı belli olsun: senin turun kalın ve
geri sayımlı, diğerleri soluk.

### 4.5 Uygunluk kapısı

Üç durumlu ışık + kod listesi + serbest metin.

`uygunluk` alanını **Kullanıcı elle işaretler**: otomatik hesaplama yapma.
Ön koşulun tutup tutmadığına ancak transkriptine bakarak karar verebilir;
uygulamanın tahmin etmesi yanlış güven verir. Uygulamanın işi, kararı
görünür ve süzülebilir tutmak.

`lib/sabitler.ts` içinde, kullanıcının alanına göre:

```ts
export const ON_KOSULLAR: Secenek[] = [
  { kod: 'matematik_ects',   ad: 'Matematik ECTS/kredi şartı',   simge: '➗',
    esanlam: ['ects in mathematics', 'mathematics credits', 'calculus',
              'linear algebra', 'matematik kredisi'] },
  { kod: 'istatistik_dersi', ad: 'İstatistik / olasılık dersi',  simge: '📊',
    esanlam: ['statistics course', 'probability', 'istatistik dersi'] },
  { kod: 'programlama',      ad: 'Programlama bilgisi',           simge: '💻',
    esanlam: ['programming', 'python', ' r ', 'stata', 'coding experience'] },
  { kod: 'ekonometri',       ad: 'Ekonometri',                    simge: '📈', esanlam: [...] },
  { kod: 'arastirma_yontem', ad: 'Araştırma yöntemleri dersi',    simge: '🔬', esanlam: [...] },
  { kod: 'lisans_alani',     ad: 'Belirli lisans alanı şartı',    simge: '🎓', esanlam: [...] },
  { kod: 'lisans_tezi',      ad: 'Lisans tezi şartı',             simge: '📝', esanlam: [...] },
  { kod: 'is_deneyimi',      ad: 'İş deneyimi şartı',             simge: '🏢', esanlam: [...] },
  { kod: 'gre_gmat',         ad: 'GRE / GMAT',                    simge: '🧮', esanlam: [...] },
  { kod: 'mulakat',          ad: 'Mülakat',                       simge: '🎙️', esanlam: [...] },
  { kod: 'on_odev',          ad: 'Giriş sınavı / ön ödev',        simge: '✍️', esanlam: [...] },
  { kod: 'ulke_dili',        ad: 'Ülke dili şartı',               simge: '🗣️',
    aciklama: 'Hollandaca/Danca gibi. İngilizce program olsa bile bazı derslerde isteniyor.',
    esanlam: [...] },
]
```

Panelde ve listede uyarı: *"3 program 'şüpheli' işaretli; transkriptini
kontrol et"*. Bir program `uygun_degil` işaretlenirse listeden düşer
(kapalı durum gibi davranır) ama silinmez, sebebi `uygunluk_not`'ta kalır.

### 4.6 Maliyet ve para birimi

```ts
// lib/para.ts
/**
 * Karşılaştırma için sabit kurlar.
 *
 * Canlı kur ÇEKMİYORUZ: 6 ay sonraki bir karar için günlük dalgalanma
 * gürültü, ama çevrimdışı belirlilik değerli. Kullanıcı Ayarlar ekranından
 * güncelleyebiliyor; değer `ayarlar` tablosunda saklanıyor, kod dağıtımı
 * gerekmiyor. (O tablo şartnamenin ilk hâlinde yoktu, Aşama 1'de eklendi.)
 */
export const VARSAYILAN_KURLAR: Record<string, number> = { /* → EUR */ }
export const KUR_TARIHI = 'YYYY-MM-DD'
```

> **Kur değerleri tahmin edilmez.** Koda yazılan her kurun yanında hangi güne
> ait olduğu `KUR_TARIHI` ile duruyor; tarihi olmayan kur, doğruluğu
> denetlenemeyen kurdur. Ayarlar ekranından güncellenebiliyor, dağıtım
> gerekmiyor.

**Toplam maliyet** (hem EUR hem TRY göster):

```
öğrenim ücreti × yıl
+ aylık yaşam gideri (ülkeden) × ay
+ başvuru ücreti (üniversiteden)
+ depozito (üniversiteden)
− ilgili burs (varsa, elle girilen tahmini tutar)
────────────────────────────────
= net maliyet
```

Eksik veri varsa **sıfır sayma, "eksik" göster.** 40.000 EUR'luk bir programı
yaşam gideri girilmediği için "20.000 EUR" diye göstermek, kararı bozan bir
yalandır. Hesaplanamayan kalemi açıkça listele: *"yaşam gideri girilmemiş"*.

### 4.7 Durum listesi

```ts
export const DURUMLAR: DurumSecenek[] = [
  { kod: 'arastiriliyor', ad: 'Araştırılıyor',      simge: '🔍', kapali: false, belgeBekliyor: true  },
  { kod: 'kisa_liste',    ad: 'Kısa listede',       simge: '⭐', kapali: false, belgeBekliyor: true  },
  { kod: 'hazirlaniyor',  ad: 'Belgeler hazırlanıyor', simge: '📋', kapali: false, belgeBekliyor: true },
  { kod: 'basvuruldu',    ad: 'Başvuruldu',         simge: '📤', kapali: false, belgeBekliyor: false },
  { kod: 'mulakat',       ad: 'Mülakat aşaması',    simge: '🎙️', kapali: false, belgeBekliyor: false },
  { kod: 'bekleme',       ad: 'Bekleme listesinde', simge: '🕐', kapali: false, belgeBekliyor: false },
  { kod: 'kabul',         ad: 'Kabul edildi',       simge: '🎉', kapali: true,  belgeBekliyor: false },
  { kod: 'kayit',         ad: 'Kayıt yaptım',       simge: '🏫', kapali: true,  belgeBekliyor: false },
  { kod: 'red',           ad: 'Reddedildi',         simge: '✖️', kapali: true,  belgeBekliyor: false },
  { kod: 'uygun_degil',   ad: 'Uygun değil',        simge: '🚫', kapali: true,  belgeBekliyor: false },
  { kod: 'kacirildi',     ad: 'Süresi geçti',       simge: '⏳', kapali: true,  belgeBekliyor: false },
  { kod: 'vazgectim',     ad: 'Vazgeçtim',          simge: '🙅', kapali: true,  belgeBekliyor: false },
]
```

`belgeBekliyor: false` olan durumlarda belge takvimi o programı saymaz -
gönderilmiş bir başvurunun belgesi "geciktin" demez.

### 4.8 Belge sözlüğü: BursTakip'ten devam, üç ekleme

`lib/sabitler.ts`'teki `BELGELER` listesini olduğu gibi al. `hazirlikGun`
değerleri (IELTS 90, denklik 60, referans 30, transkript 10…) zaten
düşünülmüş. Programlara özgü üç kalem ekle:

| Kod | Ad | hazirlikGun | Neden |
|---|---|---|---|
| `diploma_denklik_yurtdisi` | Yurt dışı diploma değerlendirmesi (WES/IQAS/Nuffic) | **90** | Kanada ve Hollanda'da şart, 8–12 hafta sürüyor. Programın son tarihinden değil, bu belgenin süresinden geriye sayılmalı. |
| `apostil_tercume` | Apostil + yeminli tercüme | 14 | Diplomanın ve transkriptin resmî çevirisi. |
| `basvuru_ucreti_odeme` | Başvuru ücreti ödemesi | 3 | Bazı portallarda ödeme yapılmadan başvuru "gönderilmiş" sayılmıyor. |

Ayrıca vize aşaması için `gelir_belgesi` (banka bakiyesi) zaten listede var -
`hazirlikGun` 7 yeterli.

---

## 5. Ekranlar

| Yol | İçerik |
|---|---|
| `/` | **Panel.** Yaklaşan son tarihler (senin turun), en geç başlaman gereken belgeler, uygunluğu şüpheli programlar, ülke bazlı maliyet özeti |
| `/programlar` | Ana liste + süzgeç. Kart: ad, üniversite, ülke, senin turun + geri sayım, uygunluk ışığı, yıllık ücret, süre, istenen belgelerden elinde olmayanlar |
| `/programlar/[id]` | Detay. **Formda girilebilen her alan burada görünmeli**: §7.3 |
| `/programlar/[id]/duzenle`, `/programlar/yeni` | Form |
| `/universiteler`, `/universiteler/[id]` | Üniversite ve altındaki programlar, ortak ücretler |
| `/ulkeler`, `/ulkeler/[id]` | **Göç yolu.** Çalışma izni, oturum, mülk, yaşam gideri + o ülkedeki üniversiteler |
| `/belgeler` | Belge takvimi; BursTakip'ten aynen |
| `/karsilastir` | 2–4 program yan yana |
| `/ekle` | Yapıştır / docx-txt yükle → ayrıştır → önizle → forma doldur |
| `/ayarlar` | Parola değiştir, yedek al/yükle, kur oranları, havuz belgeler |
| `/giris`, `/kurulum` | BursTakip'ten aynen |

### Karşılaştırma ekranının satırları

Ülke · Üniversite (QS) · Şehir · Süre · Öğretim dili · Tezli mi ·
**Yıllık ücret** · **Toplam net maliyet** · **Senin turun ve kalan gün** ·
Uygunluk · Elinde olmayan belgeler · **Mezuniyet sonrası izin** ·
**Oturum yolu** · İlgili burslar

En iyi değer sütunu vurgulansın (en ucuz, en uzun çalışma izni). Ama
"kazanan" ilan etme; ağırlıklar kullanıcının kafasında.

---

## 6. Bilinçli tasarım kararları

Bunlar BursTakip'te bedeli ödenerek öğrenildi. Değiştirmeden önce sebebini oku.

1. **Kapsam/belge/durum/ön koşul serbest metin DEĞİL, sabit kodlar.**
   `lib/sabitler.ts` tek kaynak. Sebep: filtreleme ancak yazım birliği varsa
   çalışır. "IELTS", "ielts 6.5", "İngilizce sınavı" üç ayrı satır olsaydı
   "IELTS isteyen programlar" diye süzemezdin.

2. **Son tarih dört tipli** (kesin / aralık / sürekli / bilinmiyor).
   `lib/tarih.ts` bunları tek sıralanabilir değere indiriyor. Tek bir `date`
   sütunu "Mart 2027'de açıklanacak" bilgisini taşıyamaz.

3. **Belge takvimi son tarihi değil BAŞLAMA tarihini gösterir.** IELTS 90 gün
   alıyorsa, 60 gün sonraki son tarih için "60 gün var" demek yanıltıcıdır -
   çoktan gecikmişsindir.

4. **Havuzda hazır duran kalıcı belge hazırlık süresi yemez** (`EKLEME_SURESI = 3`).
   Elinde geçerli IELTS varsa 90 gün değil 3 gün.

5. **Filtreler istemcide + URL'ye yazılıyor.** Veri kişisel ölçekte, tamamı
   zaten çekiliyor. Her tık için sunucuya gidiş yok, çapraz koşullar SQL'de
   değil düz TypeScript'te yazılıyor ve filtreli görünüm paylaşılabiliyor.
   Göreli tarih desteği var (`?son=+30` her gün doğru).

6. **Tüm veritabanı erişimi sunucudan, tek bağlantı dizgesiyle.**
   Her server action `oturumZorunlu()` ile başlar. Layout korumasına güvenmek
   yetmez: action'lar layout'tan geçmeden doğrudan POST edilebilir.

7. **Ham metin saklanır.** Ayrıştırıcı bir şeyi kaçırdıysa kaynağa dönebilmek
   için. Ayrıştırıcı ne kadar iyi olursa olsun asla tam değil.

8. **YZ ayrıştırıcı varsayılan yol değil, ayrı düğme.** `ANTHROPIC_API_KEY`
   yoksa düğme gizlenir, uygulama kural tabanlı yolla tam çalışır. Model
   çıktısına güvenilmez: dönen her alan kod listelerine karşı doğrulanır,
   uydurulmuş kodlar atılır. Model: **`claude-opus-5`**, `max_tokens: 8000`
   (uyarlanabilir düşünme de bu tavana sayılıyor), timeout 120 sn.

9. **Dinamik satır editörü gizli JSON alanı gönderir.** Satır sayısı değişken
   olduğu için düz FormData alan adlarıyla temsil etmek kırılgan olur (satır
   silince indeksler kayar). `bilesenler/UniversiteListesi.tsx` bu kalıbın
   çalışan örneği; başvuru turları için birebir uygula.

10. **Eksik veriyi sıfır sayma.** §4.6.

---

## 7. Doğrulama

`npm run dogrula` üç betik çalıştırır. Sözlüğe her dokunduğunda çalıştır.

### 7.1 Ayrıştırıcı testleri: `scripts/dogrula-ayristirici.ts`

Gerçek program metinleri üzerinde. BursTakip'te 126 test var; oradaki
tuzakların hepsi burada da geçerli:

- **Olumsuzlama hem önden hem arkadan kontrol edilmeli.** "tuition is not
  covered" ve "no IELTS required" gibi ifadeler kalıbı eşleştirip tersini
  kaydetmemeli.
- **İleri pencere karşıtlık bağlaçlarıyla kesilmeli** (`' but '`, `' ancak '`),
  yoksa olumsuzlama cümlenin öbür yarısına taşar.
- **Satır sınırları korunmalı.** BursTakip'te "8. e-Devlet…" madde numarası
  IELTS puanı sanılıp **uydurma "IELTS 8"** üretildi. Puan çıkarımı satır
  farkında olmalı + makul aralık kontrolü (IELTS 4–9, TOEFL 30–120).
- **Türkçe ek toleransı** kapalı bir sonek kümesiyle (`SONEKLER`), serbest
  regex'le değil.
- **AB dışı / AB tarih ayrımı**: "1 February (non-EU)" ve "1 May (EU/EEA)"
  aynı sayfadan iki ayrı tur olarak çıkmalı, birbirine karışmamalı.

### 7.2 Kural testleri: `scripts/dogrula-kurallar.ts`

Tarih mantığı, belge takvimi, süzgeç, maliyet hesabı. Kritik olanlar:

- Turu olan programda etkin tarih = **geçmemiş en yakın AB dışı tur**
- Hepsi geçmişse en sonuncusu döner (tarihsiz görünmez)
- Programın kendi merkezî tarihi varsa turlar onu ezmez
- `belgeBekliyor: false` durumda belge takvimi o programı saymaz
- Eksik veri toplam maliyette sıfır sayılmaz, "eksik" işaretlenir
- Kur çevrimi çift yönlü tutarlı

### 7.3 Alan kapsama kontrolü: `scripts/dogrula-alanlar.ts`

**Bu betiği mutlaka taşı.** Formda girilebilen her alanın detay sayfasında
göründüğünü statik olarak doğrular.

Neden var: BursTakip'te `kontenjan_not` alanı `{burs.kontenjan && …}`
bloğunun içine yazılmıştı; kontenjan sayısı boşsa not da görünmüyordu.
Kullanıcı bunu kendisi fark etti: *"Kontenjan notu gözükmüyor bu önemli problem."*
Aynı taramada `alanlar` dizisinin hiç gösterilmediği de ortaya çıktı.
Muafiyet listesi (`MUAF`) var ama **yazılı gerekçe zorunlu**.

---

## 8. Altyapı: Neon + Vercel

### 8.1 Veritabanı: Neon

Postgres'e `@neondatabase/serverless` ile doğrudan bağlanılıyor; ORM yok, düz
SQL (`lib/sorgular.ts`). Bağlantı dizgesi `DATABASE_URL`, **yalnızca sunucuda**
okunuyor; `NEXT_PUBLIC_` öneki almıyor, tarayıcıya asla gitmiyor.

**Sürücünün üç tuzağı** (üçü de `lib/veritabani.ts` içinde `setTypeParser` ile
çözüldü, `npm run sina` kanıtlıyor):

1. `numeric` varsayılanda **dizge** dönüyor. Ayarlanmasaydı `"40000" > "9000"`
   alfabetik karşılaştırılır, pahalı program ucuz görünürdü.
2. `date` ve `timestamptz` `Date` nesnesi dönüyor; gün kayması üretiyor.
3. `jsonb` sütununa JS dizisi doğrudan verilemiyor; sürücü onu Postgres
   dizisi sanıyor. `lib/sorgular.ts` içindeki `JSONB_SUTUNLAR` kümesi
   `JSON.stringify` uyguluyor.

`ON DELETE RESTRICT` ihlali `23503` değil **`23001`** dönüyor; hata eşlemesinde
ikisi de olmalı.

> **Ham sürücüyle veritabanına bakma.** `node -e "neon(...)"` ile doğrudan
> sorgularsan `setTypeParser` ayarları devrede olmaz, `date` sütunu bir gün
> kaymış ISO damgası görünür ve "veri bozuk" sanırsın. Uygulamanın gördüğünü
> görmek için `lib/sorgular.ts`'i import et.

### 8.2 Şema

`veritabani/sema.sql` tek kaynak. `npm run sema` dosyayı uygular ve tablo
tablo satır sayar. Tamamı `if not exists`: tekrar çalıştırmak güvenli.

> **Sıra önemli:** yeni sütun eklerken `alter table ... add column if not
> exists` bloğunu **indekslerden önce** koy. Var olan bir veritabanında
> `create table if not exists` tabloyu atlar, sütun oluşmaz ve indeks
> `column ... does not exist` ile patlar.

### 8.3 Dağıtım

Vercel'de repoyu içe aktar, ortam değişkenlerini gir (§8.4), dağıt. `main`
dalına her push otomatik dağıtım tetikler.

**Ortam değişkeni ekledikten sonra redeploy şart**: değişkenler yalnızca yeni
derlemede okunuyor. `NEXT_PUBLIC_` önekli bir değişken eklersen build cache'i
de kapat, çünkü o değerler derleme anında koda gömülüyor. (Bu projede
`NEXT_PUBLIC_` önekli zorunlu değişken yok.)

> Vercel'de `NEXT_PUBLIC_` önekli bir değişken **Secret/Sensitive olarak
> eklenemez**; API `invalid_visibility` döndürür ve panelden eklerken bu
> sessizce düşer. CLI'dan `--visibility config --no-sensitive` ile ekle.

### 8.4 Ortam değişkenleri

`.env.local.example` dosyasını `.env.local` adıyla kopyala. `APP_PAROLA` ve
`OTURUM_GIZLI` için `npm run gizli` rastgele değer üretir.

| Değişken | Zorunlu | Ne için |
|---|---|---|
| `DATABASE_URL` | evet | Neon Postgres bağlantı dizgesi |
| `APP_PAROLA` | evet | uygulamaya giriş parolası |
| `OTURUM_GIZLI` | evet | oturum çerezini imzalar, 32+ karakter |
| `ANTHROPIC_API_KEY` | isteğe bağlı | metinden ayrıştırma (Claude) |
| `GEMINI_API_KEY` | isteğe bağlı | metinden ayrıştırma (Gemini) |
| `ANTHROPIC_MODEL` / `GEMINI_MODEL` | isteğe bağlı | model adını dağıtımsız değiştir |

İki yapay zekâ anahtarı da boşsa uygulama tam çalışır; yalnızca "Metinden
ekle" ekranı kapanır ve kayıtlar elle girilir.

> **Model adları koddaki en çabuk eskiyen şey.** `gemini-2.5-pro` yayındayken
> emekliye ayrıldı ve 404 döndü; üstelik `ListModels` çıktısında hâlâ
> `generateContent` destekleyen bir ad olarak duruyordu. "Listede var" bile
> güvenilir değil. Bu yüzden model adı ortam değişkeninden okunuyor ve 404'te
> listeden uygun ad seçilip bir kez daha deneniyor.

---

## 9. Yapılacaklar: aşama aşama

Her aşama sonunda: `npx tsc --noEmit` temiz, `npm run dogrula` geçiyor,
`npx next build` başarılı, uygulama çalışır durumda. Yarım bırakma.

- [x] **Aşama 0; İskelet.** `create-next-app` yerine BursTakip'in
      `package.json` / `tsconfig.json` / `.eslintrc.json` dosyalarını kopyala,
      adları değiştir, `npm install`. §2'deki şasi dosyalarını kopyala.
      `.gitignore` + `.env.local.example`. `/kurulum` ve `/giris` çalışsın.
      → Boş ama açılan, parola soran bir uygulama.

- [x] **Aşama 1; Şema ve tipler.** `veritabani/sema.sql` yaz, `npm run sema` ile sen uygula.
      `lib/tipler.ts`, `lib/sabitler.ts` (BELGELER + ON_KOSULLAR + DURUMLAR),
      `lib/sorgular.ts`, `lib/dogrula.ts`. Bağlantıyı §8.3 ile doğrula.

- [x] **Aşama 2; Ülkeler.** Liste + detay + form. Göç yolu alanları.
      Kullanıcı birkaç ülke girsin, uçtan uca dene.

- [x] **Aşama 3; Üniversiteler.** Liste + detay + form, ülkeye bağlı.
      Detayda o üniversitenin programları listelensin (şimdilik boş).

- [x] **Aşama 4; Programlar.** En büyük iş. Form, detay, liste kartı.
      Başvuru turları dinamik editörü (§4.4, `UniversiteListesi.tsx` kalıbı).
      `lib/tarih.ts` uyarlaması + `siradakiTur()`.

- [x] **Aşama 5; Süzgeç ve sıralama.** `lib/suzgec.ts`, URL durumu, göreli
      tarih. Ülke, uygunluk, ücret aralığı, belge, ön koşul, durum, dil.

- [x] **Aşama 6; Belge takvimi.** `lib/belge-takvim.ts` uyarlaması + havuz
      belgeler ekranı. §4.8'deki üç yeni belge.

- [x] **Aşama 7; Maliyet.** `lib/para.ts`, toplam hesap, eksik veri işareti.
      Ayarlar ekranından kur güncelleme.

- [x] ~~**Aşama 8; Karşılaştırma.** 2–4 program yan yana.~~ **İPTAL
      (2026-09-05).** Program listesi zaten bütün ücretleri EUR'ya çevirip
      süzüyor ve sıralıyor (Aşama 5 + 7); yan yana koymak ayrı bir ekranın
      bakım yükünü hak etmedi. `/karsilastir` kaldırıldı, gezintiden çıktı.

- [x] **Aşama 9; Panel.** Yaklaşan tarihler, belge uyarıları, uygunluk
      uyarıları. Ülke özeti KAPSAM DIŞI: ülke başına maliyet toplamı
      program listesinde zaten süzülebiliyor, panelde ikinci kez göstermek
      "her şeyi gösteren panel" tuzağıydı.

- [x] ~~**Aşama 10; Ayrıştırıcı.** Kural tabanlı (`lib/ayristir.ts`).~~
      **İPTAL (2026-09-05).** BursTakip'teki karşılığı 932 satır ve her yeni
      üniversite sayfası için yeni kalıp istiyor; program sayfaları burs
      duyurularından çok daha çeşitli. Aşama 11 aynı işi yapıyor, iki
      ayrıştırıcıya birden bakmanın karşılığı yoktu. Gerekçe
      `lib/ayristir-yz.ts` başında.

- [x] **Aşama 11; YZ ayrıştırıcı.** `lib/ayristir-yz.ts`, araç şeması,
      `basvuru_turlari` dizisi dahil. Kod listelerine karşı doğrulama.
      **İKİ SAĞLAYICI:** Claude (`ANTHROPIC_API_KEY`) ve Gemini
      (`GEMINI_API_KEY`); biri yeter, ikisi varsa /ekle ekranında seçiliyor.
      Ağ çağrısı ile süzme katmanı ayrı dosyalarda (`ayristir-taslak.ts`
      `server-only` DEĞİL): yoksa süzme katmanı test edilemiyordu.

- [x] **Aşama 12; PWA + logo.** (Aşama 0'da yapıldı, doğrulandı.) `app/icon.svg` (sade, sekme için) ve
      `public/logo.svg` (tam) **ayrı olmalı**: tam logo 16 pikselde dağılıyor.
      `metadata.icons` tanımlarsan Next.js'in `app/icon.svg`'yi otomatik
      bağlaması devre dışı kalır, sekme ikonlarını açıkça yaz.
      `npm run simge` ile PNG üret.

- [x] **Aşama 13; Yayına alma.** §8. **YAYINDA:**
      program-takip-lime.vercel.app
      Canlı doğrulama yapıldı (2026-09-05): giriş, ülke/üniversite yazma ve
      düzenleme, Claude ile metinden program ekleme, belge işaretleme,
      /api/yedek indirme, silme + cascade, yetkisiz erişimde 401.
      Canlı test üç kusur çıkardı; üçü de yerelde görünmüyordu:
       1. `.gitignore`daki `yedek/` köke sabitlenmemişti ve
          `app/api/yedek/route.ts` depoya hiç girmemişti (yerelde build
          rotayı listeliyor, canlıda 404).
       2. Gemini varsayılan modeli emekliye ayrılmıştı.
       3. Üniversite detayında "Program ekranı Aşama 4'te geliyor" bayat
          metni duruyordu.

- [x] **Aşama 14; Yedekleme.** `/api/yedek` route (indir) + Ayarlar
      ekranında geri yükleme. CSV dışa aktarma KAPSAM DIŞI: yedeğin işi
      veriyi kurtarmak, JSON bunu yapıyor; CSV üç katmanlı veriyi düzleştirip
      geri yüklenemez hâle getiriyordu.

---

## 10. Kabul kriterleri

Bittiğinde şunlar doğru olmalı:

- [ ] Bir Hollanda programının **AB dışı** son tarihi kartta görünüyor; AB
      tarihi de yazıyor ama soluk, geri sayım AB dışı tarihe göre.
- [ ] Aynı belgeyi (ör. IELTS) isteyen 5 programda belge takvimi tek satır
      gösteriyor, **en erken** hedefe göre "ne zaman başlamalısın" diyor.
- [ ] Havuzda geçerli IELTS varsa o satırın hazırlık süresi 90 değil 3 gün.
- [ ] Geçerliliği başvurudan önce dolan IELTS uyarı üretiyor.
- [ ] `uygun_degil` işaretli program varsayılan listede görünmüyor ama sebebi
      kayıtta duruyor.
- [ ] Toplam maliyet eksik veriyle hesaplanmıyor, hangi kalemin eksik olduğu
      yazıyor.
- [ ] Karşılaştırma ekranı 4 programı yan yana gösteriyor, mezuniyet sonrası
      çalışma izni satırı ülkeden geliyor.
- [ ] Süzgeç durumu URL'de; bağlantıyı kopyalayıp açınca aynı görünüm geliyor.
- [ ] `npm run dogrula` üç betiği de geçiyor, alan kapsama kontrolü dahil.
- [ ] Formda girilebilen **her** alan detay sayfasında görünüyor.
- [ ] Canlı sitede giriş, ekleme, düzenleme, silme uçtan uca çalışıyor.
- [ ] `git ls-files | grep -i env` sadece `.env.local.example` döndürüyor.

---

## 11. Bilinen sınırlar

- **PDF doğrudan okunmuyor.** `/ekle` ekranı `.docx` ve `.txt` kabul ediyor;
  PDF için kopyala-yapıştır alanı var. Eski `.doc` desteklenmiyor.
- **Kural tabanlı ayrıştırıcı yok.** Metinden alan çıkarma yalnızca yapay
  zekâ yoluyla; gerekçe `lib/ayristir-yz.ts` başında ve §9'da.
- **Kur oranları elle güncelleniyor.** Canlı kur çekilmiyor; gerekçe §4.6.
  Ayarlar ekranından değiştirilebiliyor, dağıtım gerekmiyor.
- **Tek kullanıcı.** Hesap, rol, çok kullanıcı desteği yok; tek parola +
  imzalı çerez. Kişisel bir not defteri olarak tasarlandı.

