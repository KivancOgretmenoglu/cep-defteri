/**
 * Uygulamaya gömülü hisse listesini (src/data/stocks.json) üretir: tüm BIST hisseleri + piyasa değerine
 * göre en büyük ABD hisseleri + yaygın ABD ETF'leri. Liste yalnız arama içindir (kod + ad); fiyatlar
 * uygulamada canlı alınır. Listede olmayan bir kod da uygulamada elle yazılıp eklenebilir.
 *
 * Kaynak dosyaları önce indir (tarayıcı kullanıcı ajanı gerekir):
 *   UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'
 *   curl -A "$UA" -o isy.html 'https://www.isyatirim.com.tr/tr-tr/analiz/hisse/Sayfalar/Temel-Degerler-Ve-Oranlar.aspx'
 *   curl -A "$UA" -o us.json  'https://api.nasdaq.com/api/screener/stocks?tableonly=true&limit=10000&download=true'
 *   curl -A "$UA" -o etf.json 'https://api.nasdaq.com/api/screener/etf?tableonly=true&limit=10000&download=true'
 * Sonra:
 *   node scripts/gen-stock-list.mjs isy.html us.json etf.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const [isyPath, usPath, etfPath] = process.argv.slice(2);
if (!isyPath || !usPath || !etfPath) {
  console.error('Kullanım: node scripts/gen-stock-list.mjs isy.html us.json etf.json');
  process.exit(1);
}

const US_LIMIT = 2000;
/** Türk yatırımcının sık aldığı ABD ETF'leri (ETF taramasında bulunanlar alınır). */
const POPULAR_ETFS = `VOO SPY IVV SPLG QQQ QQQM VTI ITOT SCHB SCHX VT VXUS IXUS VEA IEFA VWO IEMG EEM VUG VTV SCHG SCHD VYM DGRO
HDV NOBL SDY JEPI JEPQ DIA IWM IWF IWD RSP MGK SPYG SPYV USMV QUAL MTUM COWZ VGT XLK SMH SOXX XLF XLE XLV XLY XLP XLI XLU XLB
XLRE XLC VNQ ARKK ICLN TAN LIT URA KWEB FXI INDA EWJ EWZ TUR GLD IAU SLV GDX GDXJ USO UNG DBC BND AGG TLT IEF SHY SGOV BIL VGIT
IBIT FBTC ETHA BITO TQQQ SQQQ SOXL UPRO SPXL`.split(/\s+/).filter(Boolean);

const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();

// ── BIST: İş Yatırım "Temel Değerler" tablosu: <a …hisse=KOD">KOD</a></td><td>Ad</td>
const html = readFileSync(isyPath, 'utf8');
const bist = new Map();
for (const m of html.matchAll(/hisse=([A-Z0-9]{3,6})">\1<\/a><\/td><td>([^<]+)<\/td>/g)) {
  if (!bist.has(m[1])) bist.set(m[1], decode(m[2]));
}
if (bist.size < 300) throw new Error(`BIST listesi beklenenden kısa (${bist.size}); sayfa biçimi değişmiş olabilir.`);

// ── ABD hisseleri: Nasdaq taraması (NYSE + Nasdaq + AMEX). Tercihli, varant, hak, birim hariç.
const cleanName = (name) =>
  name
    .replace(/\s+(American Depositary Shares?|ADS|Sponsored ADR|Ordinary Shares?|Common Stock|Capital Stock|Common Shares?|Shares of Beneficial Interest)\b.*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
const us = JSON.parse(readFileSync(usPath, 'utf8')).data.rows
  .filter((r) => /^[A-Z]{1,5}(\/[A-Z])?$/.test(r.symbol))
  .filter((r) => !/\b(Warrants?|Rights?|Units?|Preferred|Depositary Shares? Each Representing|Notes due)\b/i.test(r.name))
  .map((r) => ({ symbol: r.symbol.replace('/', '.'), name: cleanName(r.name) || r.symbol, cap: Number(r.marketCap) || 0 }))
  .filter((r) => r.cap > 0)
  .sort((a, b) => b.cap - a.cap);
// Aynı şirketin iki sınıfı (GOOGL/GOOG, BRK.A/BRK.B) ikisi de kalır; sınıf adı yoksa koda göre ayrılır.
const usTop = us.slice(0, US_LIMIT);

// ── ETF'ler
const etfRows = JSON.parse(readFileSync(etfPath, 'utf8')).data.data.rows;
const etfMap = new Map(etfRows.map((r) => [r.symbol, decode(r.companyName)]));
const etfs = POPULAR_ETFS.filter((s) => etfMap.has(s)).map((s) => ({ symbol: s, name: etfMap.get(s) }));
const missing = POPULAR_ETFS.filter((s) => !etfMap.has(s));
if (missing.length) console.warn('ETF taramasında bulunmayanlar (atlandı):', missing.join(' '));

const usSyms = new Set(usTop.map((r) => r.symbol));
const out = {
  /** Üretim tarihi: listenin ne kadar eski olduğunu göstermek için. */
  asOf: new Date().toISOString().slice(0, 10),
  // [kod, ad]; BIST alfabetik, ABD piyasa değerine göre büyükten küçüğe (arama sırası için).
  bist: [...bist].sort((a, b) => (a[0] < b[0] ? -1 : 1)),
  us: usTop.map((r) => [r.symbol, r.name]),
  // ETF'ler ayrı: [kod, ad]
  etf: etfs.filter((e) => !usSyms.has(e.symbol)).map((e) => [e.symbol, e.name]),
};
const dest = fileURLToPath(new URL('../src/data/stocks.json', import.meta.url));
writeFileSync(dest, JSON.stringify(out) + '\n');
console.log(`BIST ${out.bist.length}, ABD ${out.us.length}, ETF ${out.etf.length} → ${dest}`);
