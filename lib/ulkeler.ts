/**
 * Ülke listesi — ISO 3166-1 alpha-2 kodu, Türkçe ve İngilizce ad, bölge.
 *
 * Neden sabit liste: ülke serbest metin olsaydı "Almanya", "Germany",
 * "almanya", "Deutschland" dört ayrı ülke gibi görünür ve ülke filtresi
 * hiçbir işe yaramazdı. Kayıtta saklanan tek şey iki harflik `kod`.
 *
 * Bayrak emojisi koddan hesaplanıyor (bkz. `bayrak`), listede tutulmuyor.
 * İngilizce ad hem arama kutusunda ("germany" yazınca da bulsun) hem de
 * metin ayrıştırıcıda kullanılıyor.
 */

export type Bolge =
  | 'Avrupa'
  | 'Asya'
  | 'Kuzey Amerika'
  | 'Güney Amerika'
  | 'Afrika'
  | 'Okyanusya'

/**
 * NOT (BursTakip'ten fark): bu tip orada `Ulke` adındaydı. Burada `ulkeler`
 * birinci sınıf bir veritabanı tablosu ve satır tipi `lib/tipler.ts` içinde
 * `Ulke` adını taşıyor. İkisi aynı dosyada karşılaşınca ad çakışıyordu;
 * katalog tipi `UlkeSecenek` oldu. Katalog = ISO kodu + ad, kayıt değil.
 */
export type UlkeSecenek = {
  kod: string
  ad: string
  ingilizce: string
  bolge: Bolge
  /** Ayrıştırıcının tanıması için ek yazımlar (kısaltma, eski ad, yaygın hata). */
  takma?: string[]
}

export const ULKELER: UlkeSecenek[] = [
  /* ───────────────────────────────────────────────────────────── Avrupa */
  { kod: 'DE', ad: 'Almanya', ingilizce: 'Germany', bolge: 'Avrupa', takma: ['deutschland', 'alman'] },
  { kod: 'AT', ad: 'Avusturya', ingilizce: 'Austria', bolge: 'Avrupa', takma: ['osterreich'] },
  { kod: 'BE', ad: 'Belçika', ingilizce: 'Belgium', bolge: 'Avrupa' },
  { kod: 'BY', ad: 'Belarus', ingilizce: 'Belarus', bolge: 'Avrupa', takma: ['beyaz rusya'] },
  { kod: 'BA', ad: 'Bosna-Hersek', ingilizce: 'Bosnia and Herzegovina', bolge: 'Avrupa', takma: ['bosna'] },
  { kod: 'BG', ad: 'Bulgaristan', ingilizce: 'Bulgaria', bolge: 'Avrupa' },
  { kod: 'CZ', ad: 'Çekya', ingilizce: 'Czechia', bolge: 'Avrupa', takma: ['czech republic', 'cek cumhuriyeti', 'cekya'] },
  { kod: 'DK', ad: 'Danimarka', ingilizce: 'Denmark', bolge: 'Avrupa' },
  { kod: 'EE', ad: 'Estonya', ingilizce: 'Estonia', bolge: 'Avrupa' },
  { kod: 'FI', ad: 'Finlandiya', ingilizce: 'Finland', bolge: 'Avrupa' },
  { kod: 'FR', ad: 'Fransa', ingilizce: 'France', bolge: 'Avrupa', takma: ['fransiz'] },
  { kod: 'HR', ad: 'Hırvatistan', ingilizce: 'Croatia', bolge: 'Avrupa' },
  { kod: 'NL', ad: 'Hollanda', ingilizce: 'Netherlands', bolge: 'Avrupa', takma: ['holland', 'the netherlands', 'nederland'] },
  { kod: 'GB', ad: 'İngiltere / Birleşik Krallık', ingilizce: 'United Kingdom', bolge: 'Avrupa', takma: ['uk', 'britain', 'great britain', 'england', 'scotland', 'wales', 'ingiltere', 'birlesik krallik', 'iskocya'] },
  { kod: 'IE', ad: 'İrlanda', ingilizce: 'Ireland', bolge: 'Avrupa' },
  { kod: 'ES', ad: 'İspanya', ingilizce: 'Spain', bolge: 'Avrupa', takma: ['espana'] },
  { kod: 'SE', ad: 'İsveç', ingilizce: 'Sweden', bolge: 'Avrupa' },
  { kod: 'CH', ad: 'İsviçre', ingilizce: 'Switzerland', bolge: 'Avrupa', takma: ['swiss'] },
  { kod: 'IS', ad: 'İzlanda', ingilizce: 'Iceland', bolge: 'Avrupa' },
  { kod: 'IT', ad: 'İtalya', ingilizce: 'Italy', bolge: 'Avrupa', takma: ['italia'] },
  { kod: 'ME', ad: 'Karadağ', ingilizce: 'Montenegro', bolge: 'Avrupa' },
  { kod: 'CY', ad: 'Kıbrıs (GKRY)', ingilizce: 'Cyprus', bolge: 'Avrupa' },
  { kod: 'LV', ad: 'Letonya', ingilizce: 'Latvia', bolge: 'Avrupa' },
  { kod: 'LT', ad: 'Litvanya', ingilizce: 'Lithuania', bolge: 'Avrupa' },
  { kod: 'LU', ad: 'Lüksemburg', ingilizce: 'Luxembourg', bolge: 'Avrupa' },
  { kod: 'HU', ad: 'Macaristan', ingilizce: 'Hungary', bolge: 'Avrupa' },
  { kod: 'MT', ad: 'Malta', ingilizce: 'Malta', bolge: 'Avrupa' },
  { kod: 'MD', ad: 'Moldova', ingilizce: 'Moldova', bolge: 'Avrupa' },
  { kod: 'MC', ad: 'Monako', ingilizce: 'Monaco', bolge: 'Avrupa' },
  { kod: 'NO', ad: 'Norveç', ingilizce: 'Norway', bolge: 'Avrupa' },
  { kod: 'PL', ad: 'Polonya', ingilizce: 'Poland', bolge: 'Avrupa' },
  { kod: 'PT', ad: 'Portekiz', ingilizce: 'Portugal', bolge: 'Avrupa' },
  { kod: 'RO', ad: 'Romanya', ingilizce: 'Romania', bolge: 'Avrupa' },
  { kod: 'RU', ad: 'Rusya', ingilizce: 'Russia', bolge: 'Avrupa', takma: ['russian federation'] },
  { kod: 'RS', ad: 'Sırbistan', ingilizce: 'Serbia', bolge: 'Avrupa' },
  { kod: 'SK', ad: 'Slovakya', ingilizce: 'Slovakia', bolge: 'Avrupa' },
  { kod: 'SI', ad: 'Slovenya', ingilizce: 'Slovenia', bolge: 'Avrupa' },
  { kod: 'TR', ad: 'Türkiye', ingilizce: 'Türkiye', bolge: 'Avrupa', takma: ['turkey', 'turkiye'] },
  { kod: 'UA', ad: 'Ukrayna', ingilizce: 'Ukraine', bolge: 'Avrupa' },
  { kod: 'GR', ad: 'Yunanistan', ingilizce: 'Greece', bolge: 'Avrupa', takma: ['hellenic'] },
  { kod: 'AL', ad: 'Arnavutluk', ingilizce: 'Albania', bolge: 'Avrupa' },
  { kod: 'MK', ad: 'Kuzey Makedonya', ingilizce: 'North Macedonia', bolge: 'Avrupa', takma: ['macedonia'] },
  { kod: 'XK', ad: 'Kosova', ingilizce: 'Kosovo', bolge: 'Avrupa' },
  { kod: 'LI', ad: 'Liechtenstein', ingilizce: 'Liechtenstein', bolge: 'Avrupa' },
  { kod: 'AD', ad: 'Andorra', ingilizce: 'Andorra', bolge: 'Avrupa' },
  { kod: 'SM', ad: 'San Marino', ingilizce: 'San Marino', bolge: 'Avrupa' },
  { kod: 'VA', ad: 'Vatikan', ingilizce: 'Vatican City', bolge: 'Avrupa' },

  /* ─────────────────────────────────────────────────────────────── Asya */
  { kod: 'AZ', ad: 'Azerbaycan', ingilizce: 'Azerbaijan', bolge: 'Asya' },
  { kod: 'AE', ad: 'Birleşik Arap Emirlikleri', ingilizce: 'United Arab Emirates', bolge: 'Asya', takma: ['uae', 'dubai', 'abu dhabi', 'bae'] },
  { kod: 'CN', ad: 'Çin', ingilizce: 'China', bolge: 'Asya', takma: ['prc', 'cin'] },
  { kod: 'HK', ad: 'Hong Kong', ingilizce: 'Hong Kong', bolge: 'Asya' },
  { kod: 'IN', ad: 'Hindistan', ingilizce: 'India', bolge: 'Asya' },
  { kod: 'ID', ad: 'Endonezya', ingilizce: 'Indonesia', bolge: 'Asya' },
  { kod: 'IR', ad: 'İran', ingilizce: 'Iran', bolge: 'Asya' },
  { kod: 'IQ', ad: 'Irak', ingilizce: 'Iraq', bolge: 'Asya' },
  { kod: 'IL', ad: 'İsrail', ingilizce: 'Israel', bolge: 'Asya' },
  { kod: 'JP', ad: 'Japonya', ingilizce: 'Japan', bolge: 'Asya' },
  { kod: 'JO', ad: 'Ürdün', ingilizce: 'Jordan', bolge: 'Asya' },
  { kod: 'KZ', ad: 'Kazakistan', ingilizce: 'Kazakhstan', bolge: 'Asya' },
  { kod: 'KR', ad: 'Güney Kore', ingilizce: 'South Korea', bolge: 'Asya', takma: ['korea', 'republic of korea', 'kore'] },
  { kod: 'KW', ad: 'Kuveyt', ingilizce: 'Kuwait', bolge: 'Asya' },
  { kod: 'KG', ad: 'Kırgızistan', ingilizce: 'Kyrgyzstan', bolge: 'Asya' },
  { kod: 'LB', ad: 'Lübnan', ingilizce: 'Lebanon', bolge: 'Asya' },
  { kod: 'MY', ad: 'Malezya', ingilizce: 'Malaysia', bolge: 'Asya' },
  { kod: 'MN', ad: 'Moğolistan', ingilizce: 'Mongolia', bolge: 'Asya' },
  { kod: 'NP', ad: 'Nepal', ingilizce: 'Nepal', bolge: 'Asya' },
  { kod: 'OM', ad: 'Umman', ingilizce: 'Oman', bolge: 'Asya' },
  { kod: 'PK', ad: 'Pakistan', ingilizce: 'Pakistan', bolge: 'Asya' },
  { kod: 'PS', ad: 'Filistin', ingilizce: 'Palestine', bolge: 'Asya' },
  { kod: 'PH', ad: 'Filipinler', ingilizce: 'Philippines', bolge: 'Asya' },
  { kod: 'QA', ad: 'Katar', ingilizce: 'Qatar', bolge: 'Asya' },
  { kod: 'SA', ad: 'Suudi Arabistan', ingilizce: 'Saudi Arabia', bolge: 'Asya' },
  { kod: 'SG', ad: 'Singapur', ingilizce: 'Singapore', bolge: 'Asya' },
  { kod: 'LK', ad: 'Sri Lanka', ingilizce: 'Sri Lanka', bolge: 'Asya' },
  { kod: 'TW', ad: 'Tayvan', ingilizce: 'Taiwan', bolge: 'Asya' },
  { kod: 'TH', ad: 'Tayland', ingilizce: 'Thailand', bolge: 'Asya' },
  { kod: 'UZ', ad: 'Özbekistan', ingilizce: 'Uzbekistan', bolge: 'Asya' },
  { kod: 'VN', ad: 'Vietnam', ingilizce: 'Vietnam', bolge: 'Asya' },
  { kod: 'GE', ad: 'Gürcistan', ingilizce: 'Georgia', bolge: 'Asya' },
  { kod: 'AM', ad: 'Ermenistan', ingilizce: 'Armenia', bolge: 'Asya' },
  { kod: 'BH', ad: 'Bahreyn', ingilizce: 'Bahrain', bolge: 'Asya' },
  { kod: 'BD', ad: 'Bangladeş', ingilizce: 'Bangladesh', bolge: 'Asya' },
  { kod: 'BN', ad: 'Brunei', ingilizce: 'Brunei', bolge: 'Asya' },
  { kod: 'KH', ad: 'Kamboçya', ingilizce: 'Cambodia', bolge: 'Asya' },
  { kod: 'MO', ad: 'Makao', ingilizce: 'Macao', bolge: 'Asya' },
  { kod: 'MM', ad: 'Myanmar', ingilizce: 'Myanmar', bolge: 'Asya' },
  { kod: 'TJ', ad: 'Tacikistan', ingilizce: 'Tajikistan', bolge: 'Asya' },
  { kod: 'TM', ad: 'Türkmenistan', ingilizce: 'Turkmenistan', bolge: 'Asya' },
  { kod: 'SY', ad: 'Suriye', ingilizce: 'Syria', bolge: 'Asya' },
  { kod: 'YE', ad: 'Yemen', ingilizce: 'Yemen', bolge: 'Asya' },
  { kod: 'AF', ad: 'Afganistan', ingilizce: 'Afghanistan', bolge: 'Asya' },
  { kod: 'BT', ad: 'Butan', ingilizce: 'Bhutan', bolge: 'Asya' },
  { kod: 'LA', ad: 'Laos', ingilizce: 'Laos', bolge: 'Asya' },
  { kod: 'MV', ad: 'Maldivler', ingilizce: 'Maldives', bolge: 'Asya' },

  /* ────────────────────────────────────────────────────── Kuzey Amerika */
  { kod: 'US', ad: 'Amerika Birleşik Devletleri', ingilizce: 'United States', bolge: 'Kuzey Amerika', takma: ['usa', 'us', 'america', 'united states of america', 'abd', 'amerika'] },
  { kod: 'CA', ad: 'Kanada', ingilizce: 'Canada', bolge: 'Kuzey Amerika' },
  { kod: 'MX', ad: 'Meksika', ingilizce: 'Mexico', bolge: 'Kuzey Amerika' },
  { kod: 'CR', ad: 'Kosta Rika', ingilizce: 'Costa Rica', bolge: 'Kuzey Amerika' },
  { kod: 'CU', ad: 'Küba', ingilizce: 'Cuba', bolge: 'Kuzey Amerika' },
  { kod: 'DO', ad: 'Dominik Cumhuriyeti', ingilizce: 'Dominican Republic', bolge: 'Kuzey Amerika' },
  { kod: 'GT', ad: 'Guatemala', ingilizce: 'Guatemala', bolge: 'Kuzey Amerika' },
  { kod: 'HN', ad: 'Honduras', ingilizce: 'Honduras', bolge: 'Kuzey Amerika' },
  { kod: 'JM', ad: 'Jamaika', ingilizce: 'Jamaica', bolge: 'Kuzey Amerika' },
  { kod: 'NI', ad: 'Nikaragua', ingilizce: 'Nicaragua', bolge: 'Kuzey Amerika' },
  { kod: 'PA', ad: 'Panama', ingilizce: 'Panama', bolge: 'Kuzey Amerika' },
  { kod: 'SV', ad: 'El Salvador', ingilizce: 'El Salvador', bolge: 'Kuzey Amerika' },
  { kod: 'TT', ad: 'Trinidad ve Tobago', ingilizce: 'Trinidad and Tobago', bolge: 'Kuzey Amerika' },
  { kod: 'BS', ad: 'Bahamalar', ingilizce: 'Bahamas', bolge: 'Kuzey Amerika' },
  { kod: 'BB', ad: 'Barbados', ingilizce: 'Barbados', bolge: 'Kuzey Amerika' },
  { kod: 'BZ', ad: 'Belize', ingilizce: 'Belize', bolge: 'Kuzey Amerika' },
  { kod: 'HT', ad: 'Haiti', ingilizce: 'Haiti', bolge: 'Kuzey Amerika' },

  /* ────────────────────────────────────────────────────── Güney Amerika */
  { kod: 'AR', ad: 'Arjantin', ingilizce: 'Argentina', bolge: 'Güney Amerika' },
  { kod: 'BO', ad: 'Bolivya', ingilizce: 'Bolivia', bolge: 'Güney Amerika' },
  { kod: 'BR', ad: 'Brezilya', ingilizce: 'Brazil', bolge: 'Güney Amerika' },
  { kod: 'CL', ad: 'Şili', ingilizce: 'Chile', bolge: 'Güney Amerika' },
  { kod: 'CO', ad: 'Kolombiya', ingilizce: 'Colombia', bolge: 'Güney Amerika' },
  { kod: 'EC', ad: 'Ekvador', ingilizce: 'Ecuador', bolge: 'Güney Amerika' },
  { kod: 'GY', ad: 'Guyana', ingilizce: 'Guyana', bolge: 'Güney Amerika' },
  { kod: 'PY', ad: 'Paraguay', ingilizce: 'Paraguay', bolge: 'Güney Amerika' },
  { kod: 'PE', ad: 'Peru', ingilizce: 'Peru', bolge: 'Güney Amerika' },
  { kod: 'SR', ad: 'Surinam', ingilizce: 'Suriname', bolge: 'Güney Amerika' },
  { kod: 'UY', ad: 'Uruguay', ingilizce: 'Uruguay', bolge: 'Güney Amerika' },
  { kod: 'VE', ad: 'Venezuela', ingilizce: 'Venezuela', bolge: 'Güney Amerika' },

  /* ───────────────────────────────────────────────────────────── Afrika */
  { kod: 'ZA', ad: 'Güney Afrika', ingilizce: 'South Africa', bolge: 'Afrika' },
  { kod: 'EG', ad: 'Mısır', ingilizce: 'Egypt', bolge: 'Afrika' },
  { kod: 'MA', ad: 'Fas', ingilizce: 'Morocco', bolge: 'Afrika' },
  { kod: 'DZ', ad: 'Cezayir', ingilizce: 'Algeria', bolge: 'Afrika' },
  { kod: 'TN', ad: 'Tunus', ingilizce: 'Tunisia', bolge: 'Afrika' },
  { kod: 'LY', ad: 'Libya', ingilizce: 'Libya', bolge: 'Afrika' },
  { kod: 'NG', ad: 'Nijerya', ingilizce: 'Nigeria', bolge: 'Afrika' },
  { kod: 'KE', ad: 'Kenya', ingilizce: 'Kenya', bolge: 'Afrika' },
  { kod: 'ET', ad: 'Etiyopya', ingilizce: 'Ethiopia', bolge: 'Afrika' },
  { kod: 'GH', ad: 'Gana', ingilizce: 'Ghana', bolge: 'Afrika' },
  { kod: 'TZ', ad: 'Tanzanya', ingilizce: 'Tanzania', bolge: 'Afrika' },
  { kod: 'UG', ad: 'Uganda', ingilizce: 'Uganda', bolge: 'Afrika' },
  { kod: 'SN', ad: 'Senegal', ingilizce: 'Senegal', bolge: 'Afrika' },
  { kod: 'CI', ad: 'Fildişi Sahili', ingilizce: 'Ivory Coast', bolge: 'Afrika', takma: ['cote divoire'] },
  { kod: 'CM', ad: 'Kamerun', ingilizce: 'Cameroon', bolge: 'Afrika' },
  { kod: 'RW', ad: 'Ruanda', ingilizce: 'Rwanda', bolge: 'Afrika' },
  { kod: 'BW', ad: 'Botsvana', ingilizce: 'Botswana', bolge: 'Afrika' },
  { kod: 'NA', ad: 'Namibya', ingilizce: 'Namibia', bolge: 'Afrika' },
  { kod: 'ZW', ad: 'Zimbabve', ingilizce: 'Zimbabwe', bolge: 'Afrika' },
  { kod: 'ZM', ad: 'Zambiya', ingilizce: 'Zambia', bolge: 'Afrika' },
  { kod: 'MU', ad: 'Mauritius', ingilizce: 'Mauritius', bolge: 'Afrika' },
  { kod: 'SD', ad: 'Sudan', ingilizce: 'Sudan', bolge: 'Afrika' },
  { kod: 'MZ', ad: 'Mozambik', ingilizce: 'Mozambique', bolge: 'Afrika' },
  { kod: 'AO', ad: 'Angola', ingilizce: 'Angola', bolge: 'Afrika' },
  { kod: 'ML', ad: 'Mali', ingilizce: 'Mali', bolge: 'Afrika' },
  { kod: 'MW', ad: 'Malavi', ingilizce: 'Malawi', bolge: 'Afrika' },
  { kod: 'SO', ad: 'Somali', ingilizce: 'Somalia', bolge: 'Afrika' },

  /* ──────────────────────────────────────────────────────────── Okyanusya */
  { kod: 'AU', ad: 'Avustralya', ingilizce: 'Australia', bolge: 'Okyanusya' },
  { kod: 'NZ', ad: 'Yeni Zelanda', ingilizce: 'New Zealand', bolge: 'Okyanusya' },
  { kod: 'FJ', ad: 'Fiji', ingilizce: 'Fiji', bolge: 'Okyanusya' },
  { kod: 'PG', ad: 'Papua Yeni Gine', ingilizce: 'Papua New Guinea', bolge: 'Okyanusya' },
]

/* ══════════════════════════════════════════════════════════ YARDIMCILAR */

/**
 * Birden fazla ülkeyi kapsayan programlar için sahte kod.
 * Erasmus Mundus gibi konsorsiyum bursları tek ülkeye sığmıyor; ülke
 * filtresinde ayrı bir satır olarak görünsün diye listeye ekli değil ama
 * geçerli bir değer.
 */
export const COK_ULKELI = 'XX'

const ulkeHarita = new Map(ULKELER.map((u) => [u.kod, u]))

export function ulkeBul(kod: string): UlkeSecenek | undefined {
  return ulkeHarita.get(kod)
}

export function ulkeAdi(kod: string): string {
  if (kod === COK_ULKELI) return 'Birden fazla ülke'
  return ulkeHarita.get(kod)?.ad ?? kod
}

/**
 * ISO alpha-2 kodundan bayrak emojisi.
 * 'TR' → 🇹🇷. Her harf, Regional Indicator Symbol bloğundaki karşılığına
 * kaydırılır ('A' = U+1F1E6).
 */
export function bayrak(kod: string): string {
  if (kod === COK_ULKELI) return '🌍'
  if (!/^[A-Za-z]{2}$/.test(kod)) return '🏳️'
  return kod
    .toUpperCase()
    .split('')
    .map((h) => String.fromCodePoint(0x1f1e6 + h.charCodeAt(0) - 65))
    .join('')
}

/** Açılır listeler için bölgeye, sonra Türkçe alfabeye göre gruplu liste. */
export function ulkelerBolgeye(): { bolge: Bolge; ulkeler: UlkeSecenek[] }[] {
  const bolgeler: Bolge[] = ['Avrupa', 'Kuzey Amerika', 'Asya', 'Okyanusya', 'Güney Amerika', 'Afrika']
  return bolgeler.map((bolge) => ({
    bolge,
    ulkeler: ULKELER.filter((u) => u.bolge === bolge).sort((a, b) => a.ad.localeCompare(b.ad, 'tr')),
  }))
}
