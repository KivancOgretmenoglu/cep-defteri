/* Faydalı bilgi reelsleri: hook görselleri ve bilgi kartları. */

/** "12.000" gibi Türkçe biçimli sayıyı sayar; metindeki {n} yerine konur */
function countText(tpl, lt, a, d, to, dec = 0) {
  const v = E.out(prog(lt, a, d)) * to;
  return tpl.replace('{n}', dec ? v.toFixed(dec).replace('.', ',') : fmt(v));
}


/* Kahve bardakları (aynı hücre boyunda üç boy) ve mont */
const CUP_S = ['oooooo..', 'oKKKKoo.', 'oWWWWo.o', 'oWWWWo.o', 'oWWWWooo', '.oooo...'];
const CUP_M = ['ooooooo..', 'oKKKKKoo.', 'oWWWWWo.o', 'oWWWWWo.o', 'oWWWWWo.o', 'oWWWWWooo', 'oWWWWWo..', '.ooooo...'];
const CUP_L = ['oooooooo..', 'oKKKKKKoo.', 'oWWWWWWo.o', 'oWWWWWWo.o', 'oWWWWWWo.o', 'oWWWWWWo.o', 'oWWWWWWooo', 'oWWWWWWo..', 'oWWWWWWo..', '.oooooo...'];
const CUPS_C = { o: '#2A1E1A', K: '#6B4226', W: '#F5EFE6' };
const COAT = ['..oo..oo..', '.oCCooCCo.', 'oCCCddCCCo', 'oCCCddCCCo', 'oCoCddCoCo', 'oCoCddCoCo', 'oCoCddCoCo', 'ooCCddCCoo', '.oCCddCCo.', '.oooooooo.'];
const COAT_C = { o: '#2A1E1A', C: '#C0392B', d: '#8E2A20' };
/* Pixel kulaklık (maskotun kulaklığıyla aynı renkler) */
const HEADPH = ['....oooooo....', '..ooccccccoo..', '.occoooooocco.', '.oco......oco.', 'oco........oco', 'oco........oco', 'oddo......oddo', 'oDDdo....oDDdo', 'oDDdo....oDDdo', 'oDDdo....oDDdo', '.ooo......ooo.'];
const HEADPH_C = { o: '#2A1E1A', c: '#9B7BC6', d: '#745C94', D: '#5E4A7A' };
const PTAG = ['..oooooo', '.oWWWWWo', 'oW.WWWWo', 'oWWWWWWo', '.oWWWWWo', '..oooooo'];
const PTAG_C = { o: '#C9A27E', W: '#FFF6EA' };

/* Sinema: salyangozlu sıkıcı film, yıldız, patlamış mısır, koltuk, seyirci başı, tik */
const SNAIL = ['..o.o.........', '..o.o..oooo...', '..oBo.oSSSSo..', '..oBBoSsssSSo.', '..oBBoSsSSsSo.', '..oBBoSsssSSo.', '.oBBBBoSSSSoo.', 'oBBBBBBooooBBo', '.oooooooooooo.'];
const SNAIL_C = { o: '#2A1E1A', B: '#D8C08A', S: '#C0703F', s: '#7A3A1E' };
const STAR = ['...o...', '..oYo..', 'ooYYYoo', 'oYYYYYo', '.oYYYo.', '.oYoYo.', '.oo.oo.'];
const STAR_ON = { o: '#2A1E1A', Y: '#F2B63C' }, STAR_OFF = { o: '#2A1E1A', Y: '#6E6680' };
const POPCORN = ['..w.yw.w..', '.wywwywyw.', 'wwywwwywww', 'oooooooooo', 'oRRWWRRWWo', 'oRRWWRRWWo', '.oRWWRRWo.', '.oRWWRRWo.', '.oRWWRRWo.', '..oWRRWo..', '..oooooo..'];
const POPCORN_C = { o: '#2A1E1A', R: '#E8322A', W: '#FFF6EA', w: '#FFF1C9', y: '#F2C14E' };
const KERNEL = ['.ww.', 'wyww', 'wwyw', '.ww.'];
const KERNEL_C = { w: '#FFF1C9', y: '#F2C14E' };
const SEAT = ['...oooooooooo...', '..oRRRRRRRRRRo..', '.oRRrRRRRRRrRRo.', '.oRRrRRRRRRrRRo.', '.oRRrRRRRRRrRRo.', '.oRRrRRRRRRrRRo.', '.oRRrRRRRRRrRRo.', '.oRRRRRRRRRRRRo.', 'ooooRRRRRRRRoooo', 'oDDoRRRRRRRRoDDo', 'oDDoRRRRRRRRoDDo', 'oDDooooooooooDDo', 'oDDo........oDDo', 'oooo........oooo'];
const SEAT_C = { o: '#120D1C', R: '#B3263A', r: '#8E1B2C', D: '#6B4A3A' };
const HEAD = ['...rrrr...', '..roooor..', '.roooooor.', '.oooooooo.', '.oooooooo.', '..oooooo..', '...oooo...', '.oooooooo.', 'oooooooooo', 'oooooooooo'];
const HEAD_C = { o: '#0B0814', r: '#3B3355' };
const CHECK = ['......o', '.....oo', 'o...oo.', 'oo.oo..', '.ooo...', '..o....'];
const CHECK_C = { o: '#2F8F5A' };
const FFWD = ['o...o...', 'oo..oo..', 'ooo.ooo.', 'oooooooo', 'ooo.ooo.', 'oo..oo..', 'o...o...'];
const BUBL = ['.o.', 'o.o', '.o.'];
const CLOCKF = ['....ooooo....', '..ooWWWWWoo..', '.oWWWWoWWWWo.', '.oWWWWWWWWWo.', 'oWWWWWWWWWWWo', 'oWWWWWWWWWWWo', 'ooWWWWWWWWWoo', 'oWWWWWWWWWWWo', 'oWWWWWWWWWWWo', '.oWWWWWWWWWo.', '.oWWWWoWWWWo.', '..ooWWWWWoo..', '....ooooo....'];
const ARROWP = ['..o..', '...o.', 'ooooo', '...o.', '..o..'];

/* Ödeme acısı: kart, POS, temassız dalga, sepet ve atıştırmalıklar; acı-metre yayı kodla çizilir */
const CARDP = ['oooooooooooo', 'oBBBBBBBBBBo', 'oBYYBBBBBBBo', 'oBYYBBBBBBBo', 'oBBBBBBBBBBo', 'oBWWBWWBWWBo', 'oooooooooooo'];
const CARDP_C = { o: '#1E2A4A', B: '#4351A3', Y: '#F2B63C', W: '#DEE2F6' };
const POSP = ['.oooooo.', 'oKKKKKKo', 'oKGGGGKo', 'oKGGGGKo', 'oKKKKKKo', 'oKWKWKWo', 'oKKKKKKo', 'oKWKWKWo', 'oKKKKKKo', '.oooooo.'];
const POSP_C = { o: '#1E2228', K: '#3A3F4A', G: '#5FD38D', W: '#C9CCD2' };
const WAVESP = ['o.o.o..', '.o.o.o.', '..o.o.o', '..o.o.o', '..o.o.o', '.o.o.o.', 'o.o.o..'];
const BASKETP = ['.....oooo.....', '....o....o....', '...o......o...', 'oooooooooooooo', 'oRRRRRRRRRRRRo', '.oRWRRWRRWRRo.', '.oRRRRRRRRRRo.', '..oRWRRWRRWo..', '..oRRRRRRRRo..', '...oooooooo...'];
const BASKETP_C = { o: '#2A1E1A', R: '#E8322A', W: '#FFD9C7' };
const CHOCP = ['ooooooooo', 'oRRWWWRRo', 'oRRWWWRRo', 'ooooooooo'];
const CHOCP_C = { o: '#2A1E1A', R: '#7A3A1E', W: '#F2C14E' };
const CHIPSP = ['.ooooo.', 'oYYYYYo', 'oYRRRYo', 'oYRRRYo', 'oYYYYYo', 'oYYYYYo', 'oYYYYYo', '.ooooo.'];
const CHIPSP_C = { o: '#2A1E1A', Y: '#F2C14E', R: '#E8322A' };
const CANP = ['.ooo.', 'oSSSo', 'oGGGo', 'oGWGo', 'oGWGo', 'oGGGo', 'oSSSo', '.ooo.'];
const CANP_C = { o: '#2A1E1A', S: '#C9CCD2', G: '#2F8F5A', W: '#FFF6EA' };
/** Yarım daire pixel acı-metre: soldan sağa yeşil → sarı → kırmızı */
function gaugeRows(w = 19, h = 10) {
  const rows = [], cx = (w - 1) / 2, cy = h - 0.5, R = w / 2 - 0.2, r0 = R * 0.55;
  for (let y = 0; y < h; y++) {
    let row = '';
    for (let x = 0; x < w; x++) {
      const dx = x - cx, dy = cy - y, r = Math.hypot(dx, dy);
      if (r > R || r < r0) { row += '.'; continue; }
      if (r > R - 1 || r < r0 + 1 || dy < 1) { row += 'o'; continue; }
      const t = 1 - Math.atan2(dy, dx) / Math.PI;
      row += t < 0.4 ? 'G' : t < 0.7 ? 'Y' : 'R';
    }
    rows.push(row);
  }
  return rows;
}
/* Bulunmuş para: harçlık zarfı, bayrak, pizza, oyun kolu, tepsi */
const ZARF = ['oooooooooo', 'oWoWWWWoWo', 'oWWoWWoWWo', 'oWWWooWWWo', 'oWWWRRWWWo', 'oWWWWWWWWo', 'oooooooooo'];
const ZARF_C = { o: '#2A1E1A', W: '#FFFDF4', R: '#E8322A' };
const FLAGP = ['ooooo', 'oCCCo', '.oCo.', '..o..'];
const PIZZAP = ['ooooooooo', 'oYYRYYYYo', '.oYYYYRo.', '.oYRYYYo.', '..oYYYo..', '..oYRYo..', '...oYo...', '....o....'];
const PIZZAP_C = { o: '#7A3A1E', Y: '#F2C14E', R: '#C0392B' };
const PADP = ['.oooooooooo.', 'oGGGGGGGGGGo', 'oGWGGGGGRGGo', 'oWWWGGGRGRGo', 'oGWGGGGGRGGo', 'oGGGooooGGGo', '.ooo....ooo.'];
const PADP_C = { o: '#2A1E1A', G: '#4351A3', W: '#FFF6EA', R: '#F2B63C' };
const ANCHORP = ['.....ooo.....', '....oSSSo....', '....oS.So....', '....oSSSo....', '.....oSo.....', '..ooooSoooo..', '..oSSSSSSSo..', '..ooooSoooo..', '.....oSo.....', '.....oSo.....', 'o....oSo....o', 'oo...oSo...oo', 'oSo..oSo..oSo', '.oSoooSoooSo.', '..oSSSSSSSo..', '...ooooooo...'];
const ANCHORP_C = { o: '#2A1E1A', S: '#7D8A99' };
const MONTP = ['......oooooo......', '.....offffffo.....', '....offhhhhffo....', '.ooooffhhhhffoooo.', 'oCCCoCCCPZCCCoCCCo', 'oCCCoCCCZZCCCoCCCo', 'odddodddZZdddodddo', 'oCCCoCCCZZCCCoCCCo', 'oCCCoCCCZZCCCoCCCo', 'odddodddZZdddodddo', 'oCCCoCCCZZCCCoCCCo', 'oCCCoCCCZZCCCoCCCo', 'odddodddZZdddodddo', 'okkkoCCCZZCCCokkko', 'ooooodddZZdddooooo', '....oCCCZZCCCo....', '....oooooooooo....'];
const MONTP_C = { o: '#2A1E1A', C: '#E0893A', d: '#B8652A', Z: '#5B4636', P: '#F2B63C', f: '#F3E1C7', h: '#7A4A24', k: '#8B5A2B' };
const PLANEP = ['oo............', 'oWoo..........', '.oWWoo........', '.oWWWWoo......', '..oWWWWWoo....', '..oWWWWWWWoo..', '...oWWWWWWWWWo', '..oGGGGGGGoo..', '.oGGGGGoo.....', 'oGGGoo........', 'ooo...........'];
const PLANEP_C = { o: '#2A1E1A', W: '#FFFFFF', G: '#C9D6E8' };
const PAWP = ['.o.o.o.', 'oBoBoBo', 'oBBBBBo', 'oBBBBBo', 'oBBBBBo', '.oBBBo.', '..ooo..'];
const PAWP_C = { o: '#2A1E1A', B: '#A07C5C' };
const PERSONP = ['..ooo..', '.oSSSo.', '.oSSSo.', '..ooo..', '.ooooo.', 'oCCCCCo', 'oCCCCCo', 'oCCCCCo', '.oo.oo.', '.oo.oo.'];
const HEARTP = ['.oo.oo.', 'oRRoRRo', 'oRRRRRo', '.oRRRo.', '..oRo..', '...o...'];
const HEARTP_C = { o: '#2A1E1A', R: '#E8507A' };
const PLATEP = ['oooooooooooo', '.oSSSSSSSSo.', '..oooooooo..'];
const PLATEP_C = { o: '#2A1E1A', S: '#C9CCD2' };
const MAGP = ['..oooo....', '.oLLLLo...', 'oLLWLLLo..', 'oLWLLLLo..', 'oLLLLLLo..', 'oLLLLLLo..', '.oLLLLoo..', '..ooooHHo.', '......oHHo', '.......oo.'];
const MAGP_C = { o: '#2A1E1A', L: '#BFD3EA', W: '#FFFFFF', H: '#AE4716' };
const TIMERP = ['...oooo...', '....oo....', '..oooooo..', '.oRRRRRRo.', 'oRRRRWRRRo', 'oRRRRWRRRo', 'oRRRRWWWRo', 'oRRRRRRRRo', '.oRRRRRRo.', '..oooooo..'];
const TIMERP_C = { o: '#2A1E1A', R: '#E8322A', W: '#FFFFFF' };
const WARNP = ['....oo....', '...oYYo...', '...oYYo...', '..oYooYo..', '..oYooYo..', '.oYYooYYo.', '.oYYYYYYo.', 'oYYYooYYYo', 'oYYYYYYYYo', 'oooooooooo'];
const WARNP_C = { o: '#2A1E1A', Y: '#F2B63C' };

/** Dikkat dağıtmayan arka plan canlılığı: dönen ışık hüzmeleri, süzülen soluk pikseller, patlama kıvılcımları */
function ambient(root, o = {}) {
  const cx = o.cx ?? 540, cy = o.cy ?? 1010;
  const rays = el('div', 'abs', root, { left: px(cx - 900), top: px(cy - 900), width: '1800px', height: '1800px', borderRadius: '50%', background: `repeating-conic-gradient(${o.ray || 'rgba(255,255,255,.55)'} 0 9deg, transparent 9deg 22deg)`, WebkitMaskImage: 'radial-gradient(circle, #000 18%, transparent 62%)', maskImage: 'radial-gradient(circle, #000 18%, transparent 62%)' });
  const glow = el('div', 'abs', root, { left: px(cx - 520), top: px(cy - 520), width: '1040px', height: '1040px', borderRadius: '50%', background: `radial-gradient(circle, ${o.glow || 'rgba(255,214,150,.55)'}, transparent 65%)` });
  const fl = Array.from({ length: 9 }, (_, i) => {
    const e = o.float ? pixEl(root, o.float[0], o.float[1], 10) : i % 3 === 0 ? pixEl(root, PTAG, PTAG_C, 10) : pixEl(root, TLCOIN, TLCOIN_C, 10);
    e.style.opacity = 0.45;
    return { e, x: 30 + ((i * 331) % 1000), y: (i * 419) % 1900, sp: 24 + (i % 4) * 10, ph: i * 1.3 };
  });
  const sparks = Array.from({ length: 14 }, (_, j) => el('div', 'abs', root, { width: '22px', height: '22px', background: ['#F2B63C', '#E86A9A', '#2F8F5A', '#4351A3'][j % 4], zIndex: 5, display: 'none' }));
  return (lt, burst = -9) => {
    const b = Math.exp(-Math.max(0, lt - burst) * 3) * (lt >= burst ? 1 : 0);
    rays.style.transform = `rotate(${lt * 12}deg) scale(${1 + 0.15 * b})`;
    rays.style.opacity = 0.35 + 0.5 * b;
    glow.style.transform = `scale(${1 + 0.04 * Math.sin(lt * 2.2) + 0.2 * b})`;
    fl.forEach((q) => {
      const y = (((q.y - lt * q.sp) % 2100) + 2100) % 2100 - 120;
      q.e.style.transform = `translate(${q.x + Math.sin(lt * 1.1 + q.ph) * 26}px,${y}px) rotate(${Math.sin(lt * 0.8 + q.ph) * 18}deg)`;
    });
    const sk = (lt - burst) / 0.55;
    sparks.forEach((e, j) => {
      const on = sk >= 0 && sk < 1;
      e.style.display = on ? 'block' : 'none';
      if (!on) return;
      const a = (j / sparks.length) * Math.PI * 2 + 0.2, r = 180 + E.out(sk) * (260 + (j % 3) * 60);
      e.style.transform = `translate(${cx + Math.cos(a) * r - 11}px,${cy + Math.sin(a) * r * 0.85 - 11}px) scale(${1 - sk * 0.8}) rotate(${sk * 180}deg)`;
    });
  };
}

/** Ceviz'den türetilen sprite'lar: 'ceviz60' (60 yaşında: gri tüy, altın çerçeveli gözlük, beyaz kaşlar)
 * ve 'cevizback' (arkadan: yüz, göğüs ve ceviz silinir, kuyruk izleyicinin solunda) */
function deriveCeviz() {
  if (SP['ceviz60|calm|null|mood']) return;
  const grid = (rs) => {
    const g = new Map();
    rs.forEach(([x, y, w, h, f]) => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) g.set(`${x + i},${y + j}`, f); });
    return g;
  };
  const rects = (g) => {  // aynı renkli yatay komşular tek dikdörtgen olur
    const rows = {};
    g.forEach((f, k) => { const [x, y] = k.split(',').map(Number); (rows[y] = rows[y] || []).push([x, f]); });
    const out = [];
    Object.entries(rows).forEach(([y, r]) => {
      r.sort((a, b) => a[0] - b[0]);
      r.forEach(([x, f]) => { const l = out[out.length - 1]; if (l && l[1] === +y && l[0] + l[2] === x && l[4] === f) l[2]++; else out.push([x, +y, 1, 1, f]); });
    });
    return out;
  };
  const GRAY = { '#A8683A': '#A39C94', '#7E4A26': '#6F6861', '#C27F48': '#BEB7AE', '#D9995F': '#D6D0C8', '#F6E3C8': '#F4F1EC' };
  const FACE = new Set(['#F6E3C8', '#EE8C9A', '#FFFFFF', '#E8577A', '#8A5A2B', '#B98450']);
  const GOLD = '#E0B04A', BROW = '#F4F1EC';
  Object.keys(SP).filter((k) => k.startsWith('ceviz|')).forEach((k) => {
    const rest = k.slice(5), g = grid(SP[k]);
    const old = new Map([...g].map(([p, f]) => [p, GRAY[f] || f]));
    [10, 11, 12, 13, 16, 17, 18, 19].forEach((x) => { old.set(`${x},11`, GOLD); old.set(`${x},14`, GOLD); old.set(`${x},10`, BROW); });
    for (let y = 11; y < 15; y++) [10, 13, 16, 19].forEach((x) => old.set(`${x},${y}`, GOLD));
    [8, 9, 14, 15].forEach((x) => old.set(`${x},12`, GOLD));
    SP['ceviz60' + rest] = rects(old);
    const back = new Map();
    g.forEach((f, p) => {
      const [x, y] = p.split(',').map(Number);
      const edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !g.has(`${x + dx},${y + dy}`));
      const face = (f === '#2A1E1A' && !edge) || (f === '#7E4A26' && !edge && x < 19 && y < 25) || FACE.has(f);
      back.set(`${31 - x},${y}`, face ? '#A8683A' : f);
    });
    SP['cevizback' + rest] = rects(back);
  });
}

// Ayın katili: yüzlü şüpheliler (kahve, yemek siparişi, taksi, abonelik) ve kapüşonlu "bu seferlik"
const SUS_CUP = ['....S..S....', '...S..S.....', '...oooooo...', '..oLLLLLLo..', '.oLLLLLLLLo.', 'oooooooooooo', '.oWWWWWWWWo.', '.oWEWWWWEWo.', '.oWEWWWWEWo.', '.oWWWMMWWWo.', '.oBBBBBBBBo.', '..oBBCCBBo..', '..oBBBBBBo..', '...oWWWWo...', '...oooooo...'];
const SUS_CUP_C = { o: '#2A1E1A', S: '#C9D2DC', L: '#F4F1EA', W: '#EFE4D2', E: '#2A1E1A', B: '#8B5A2B', C: '#E9B949', M: '#C0392B' };
const SUS_BAG = ['...oooooo...', '..oo....oo..', '.oooooooooo.', '.oKKKKKKKKo.', '.oKEKKKKEKo.', '.oKEKKKKEKo.', '.oKKKKKKKKo.', '.oKKKMMKKKo.', '.oKKKKKKKKo.', '.oRRRRRRRRo.', '.oRWWRRWWRo.', '.oKKKKKKKKo.', '.oooooooooo.'];
const SUS_BAG_C = { o: '#2A1E1A', K: '#C8A06A', E: '#2A1E1A', M: '#7A3A1E', R: '#E8322A', W: '#FFFCF6' };
const SUS_TAXI = ['.....oooooo.....', '.....oSSSSo.....', '...oooooooooo...', '..oYYYYYYYYYYo..', '.oYGGGGGGGGGGYo.', '.oYGEGGGGGGEGYo.', 'oYYYYYYYYYYYYYYo', 'oYWWYYYYYYYYWWYo', 'oYYYYYMMMMYYYYYo', 'oooooooooooooooo', '.oo..........oo.'];
const SUS_TAXI_C = { o: '#2A1E1A', S: '#FFFCF6', Y: '#F2C14E', G: '#9FD3E8', E: '#2A1E1A', W: '#FFF6D0', M: '#2A1E1A' };
const SUS_TV = ['...o......o...', '....o....o....', '.....o..o.....', 'oooooooooooooo', 'oDDDDDDDDDDDDo', 'oDDEDDDDDDEDDo', 'oDDDDDRRDDDDDo', 'oDDDDDRWRDDDDo', 'oDDDDDRRDDDDDo', 'oDDDDDDDDDDDDo', 'oooooooooooooo', '...oo....oo...'];
const SUS_TV_C = { o: '#2A1E1A', D: '#2B3A6B', E: '#FFFCF6', R: '#E8322A', W: '#FFFFFF' };
const SUS_HOOD = ['.....oooooo.....', '...ooHHHHHHoo...', '..oHHHHHHHHHHo..', '.oHHHkkkkkkHHHo.', '.oHHkkkkkkkkHHo.', 'oHHkkYkkkkYkkHHo', 'oHHkkkkkkkkkkHHo', 'oHHHkkkkkkkkHHHo', 'oHHHHkkkkkkHHHHo',
  'oHHHHHHHHHHHHHHo', 'oHHHHHHHHHHHHHHo', 'oHHHHHHHHHHHHHHo', 'oHHHHHHHHHHHHHHo', 'oHHHHHHHHHHHHHHo', 'oHHHHHHHHHHHHHHo', 'oHHHHHHHHHHHHHHo', 'oHHHHHHHHHHHHHHo', 'oHHHHHHHHHHHHHHo', 'oHHHHHHHHHHHHHHo', 'oHHHHHHHHHHHHHHo', '.oHHHHHHHHHHHHo.', '..oooooooooooo..'];
const SUS_HOOD_C = { o: '#0B0910', H: '#3B3550', k: '#0E0C14', Y: '#F2C14E' };

/** Dedektif Bilge: 'bilgedet' (Bilge + fötr şapka + trençkot). Şapka kaşların üstüne iner; kanatlar trençkotun kolları
 * olur, gövdede yaka, gömlek ve kravat, kemer ve düğmeler. Alt gövde (satır 17–25) bütün pozlarda aynı olduğundan tek kalıp yeter. */
const DET_WING = '#3E4A8C', DET_SLEEVE = '#A98550', DET_CUFF = '#7A5A30';
const DET_COAT = [  // satır 17–25, x 9–22; '.': Bilge'nin kendi pikseli kalır (yanaklar, gaga ucu, kollar)
  '..C........C..',
  '.CCDWW.WWWDCC.',
  '.CNCDWWWWDCNC.',
  '.CCCCDTTDCCCC.',  // koyu kravat düğümü gaganın iki sıra altında (kırmızı ve gagaya bitişik olunca ağız gibi duruyordu)
  '.BBBBBKKBBBBB.',
  '.CCCCCCDCCCCC.',
  'oCCNCCCDCCNCCo',
  '.oDCCCCDCCCDo.',
  '..oDDDDDDDDo..',
];
function deriveBilgeDet() {
  if (SP['bilgedet|calm|null|mood']) return;
  const O = '#2A1E1A', HAT = '#4A4550', CREASE = '#3A3540', BAND = '#8C2F2F';
  const COAT_C = { C: '#C9A46C', D: '#9E7A45', W: '#F5E9CF', T: '#2F2A3D', N: '#4A3420', B: '#5E4426', K: '#E6B23C', o: O };
  Object.keys(SP).filter((k) => k.startsWith('bilge|')).forEach((k) => {
    const g = new Map();
    SP[k].forEach(([x, y, w, h, f]) => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) g.set(`${x + i},${y + j}`, f); });
    const set = (x, y, f) => g.set(`${x},${y}`, f);
    for (let x = 11; x < 21; x++) { set(x, 3, O); set(x, 4, HAT); set(x, 5, HAT); }
    [4, 5].forEach((y) => { set(10, y, O); set(21, y, O); });
    set(15, 4, CREASE); set(16, 4, CREASE);
    for (let x = 10; x < 22; x++) { set(x, 6, HAT); set(x, 7, BAND); }
    [6, 7].forEach((y) => { set(9, y, O); set(22, y, O); });
    for (let x = 6; x < 26; x++) { set(x, 8, HAT); set(x, 9, O); }
    set(5, 8, O); set(26, 8, O);
    g.forEach((f, p) => { if (f === DET_WING) g.set(p, DET_SLEEVE); });
    [7, 8, 9, 22, 23, 24].forEach((x) => { if (g.get(`${x},22`) === DET_SLEEVE) set(x, 22, DET_CUFF); });
    DET_COAT.forEach((row, j) => [...row].forEach((c, i) => { if (c !== '.') set(9 + i, 17 + j, COAT_C[c]); }));
    const rows = {};
    g.forEach((f, p) => { const [x, y] = p.split(',').map(Number); (rows[y] = rows[y] || []).push([x, f]); });
    const out = [];
    Object.entries(rows).forEach(([y, r]) => {
      r.sort((a, b) => a[0] - b[0]);
      r.forEach(([x, f]) => { const l = out[out.length - 1]; if (l && l[1] === +y && l[0] + l[2] === x && l[4] === f) l[2]++; else out.push([x, +y, 1, 1, f]); });
    });
    SP['bilgedet' + k.slice(5)] = out;
  });
}

// Abonelik vampirleri: gövdesi uygulama simgesi olan minik vampirler (müzik, dizi, oyun, bulut) ve solgun "deneme üyeliği"
const VAMP_SYM = [
  ['...SS.', '...S.S', '...S..', '.SSS..', 'SSSS..', '.SS...'],  // müzik
  ['.S....', '.SSS..', '.SSSS.', '.SSSS.', '.SSS..', '.S....'],  // dizi
  ['......', '.SSSS.', 'S.SS.S', 'SSSSSS', 'SS..SS', '......'],  // oyun
  ['......', '..SS..', '.SSSS.', 'SSSSSS', '.SSSS.', '......'],  // bulut
  ['......', '......', '......', '......', '......', '......'],  // deneme üyeliği: simgesi bile solmuş
];
const VAMP_COL = ['#8E62D9', '#D9343E', '#3B63C9', '#4FA3D9', '#D9D4CA'];
const VAMP_FEE = [100, 250, 150, 50, 150];
/** Vampir gövdesi (16×18). awake=false: göz ve diş yok, telefonda uyuyan bir uygulama simgesi */
const vampRows = (i, awake = true) => [
  '...oooooooooo...', '..oCCCCCCCCCCo..', '.oCCCCCCCCCCCCo.',
  ...(awake ? ['oCCoCCCCCCCCoCCo', 'oCCRoCCCCCCoRCCo', 'oCCRRCCCCCCRRCCo'] : ['oCCCCCCCCCCCCCCo', 'oCCCCCCCCCCCCCCo', 'oCCCCCCCCCCCCCCo']),
  'oCCCCCCCCCCCCCCo',
  ...VAMP_SYM[i].map((r) => `oCCCC${r.replace(/\./g, 'C')}CCCCo`),
  'oCCCCCCCCCCCCCCo',
  ...(awake ? ['oCCCCKKKKKKCCCCo', '.oCCCKWKKWKCCCo.', '..ooooWooWoooo..', '......W..W......'] : ['oCCCCCCCCCCCCCCo', '.oCCCCCCCCCCCCo.', '..oooooooooooo..', '................']),
];
const vampCols = (i) => ({ o: '#160E1E', C: VAMP_COL[i], R: '#FF2A3A', W: '#FFFFFF', S: '#FFFFFF', K: '#2A0A14' });
const VWING_UP = ['oo........', 'oDo....o..', 'oDDo..oDo.', 'oDDDooDDo.', 'oDDDDDDDDo', '.oDDDDDDDo', '..oDooDDDo', '...o..oooo'];
const VWING_DN = ['..........', '..........', '..........', 'oooooooo..', 'oDDDDDDDoo', '.oDDDDDDDo', '..oDoDoDDo', '...o.o.ooo'];
const VWING_C = { o: '#160E1E', D: '#4A2E5C' };
// cam kumbara (30×20): o dış çizgi, g cam gövde (içi 3–16. satırlar), a kulak, l bacak, t kuyruk, s burun, n burun deliği, e göz, k para yarığı, h parıltı
const PIG = ['..............................', '.........oo...................', '........oaaoooooooooo.........', '.......oaaggggkkkkgggoo.......', '......oogggggggggggggggoo.....', '.....ogggggggggggggghhgggo..o.', '....oggggggggggggggggghgggooto', '.ooooggeggggggggggggggghggoto.', 'ossssggggggggggggggggggggggoto', 'ossssggggggggggggggggggggggto.', 'osnsnggggggggggggggggggggggo..', 'ossssggggggggggggggggggggggo..', 'ossssgggggggggggggggggggggo...', '.oooogggggggggggggggggggggo...', '.....ogggggggggggggggggggo....', '......oogggggggggggggggoo.....', '.......ollggggggggggglo.......', '.......ollloooooooolllo.......', '.......olllo......olllo.......', '........ooo........ooo........'];

// Ceviz'in telefonunun arkası (18×30, hücresi Ceviz'inkinin üçte biri): sol üstte kamera, ortada Apple logosu
const PHONE_CAM = ['.rrrrrr.', 'rLLLmmmr', 'rLgLmffr', 'rLLLmmmr', 'rmmmLLLr', 'rmmmLgLr', 'rmmmLLLr', '.rrrrrr.'];
const APPLE_LOGO = ['....W..', '...W...', '.WW.WW.', 'WWWWWWW', 'WWWWW..', 'WWWWW..', 'WWWWWWW', '.WW.WW.'];
const PHONE_BACK = [...Array(30)].map((_, j) => [...Array(18)].map((_, i) => {
  const cam = PHONE_CAM[j - 2]?.[i - 2], logo = APPLE_LOGO[j - 11]?.[i - 5];
  if (cam && cam !== '.') return cam;
  if (logo && logo !== '.') return logo;
  const e = Math.min(j, 29 - j), s = Math.min(i, 17 - i);  // köşeler yuvarlak
  return e + s < 2 ? '.' : e === 0 || s === 0 || e + s === 2 ? 'o' : 'P';
}).join(''));
const PHONE_BACK_C = { o: '#14151C', P: '#3A3E52', r: '#596079', m: '#2A2D3C', L: '#0B0C12', g: '#9DB4FF', f: '#F2E6B8', W: '#E6E9F0' };
// telefonu iki kenarından kavrayan patiler (Ceviz'in hücresiyle; aynalı sprite'ın 11–24. sütunları, 20–23. satırları)
const HOLD_PAWS = ['.AAA......AAA.', 'ADDDA....ADDDA', 'ADBDA....ADBDA', '.AAA......AAA.'];
// Ceviz'in gece şapkası (sprite'ın 0–8. satırları): siper iki kulağın arasında alnına oturur, ucu kuyruğun ters yanına, sola sarkar
const CEVIZ_CAP = [
  '................................',
  '.........AAAA...................',
  '.......AAJKKJA..................',
  '.....AANAKJKKJA.................',
  '....ANNNAJKKJKKA................',
  '....ANNOA.AKJKKJKA..............',
  '.....AOA..AJKKJKKA..............',
  '.........ANNNNNNNNA.............',
  '..........ANNNNNNA..............',
];
const CEVIZ_CAP_C = { A: '#2A1E1A', N: '#FBF6EC', O: '#E3D9C6', J: '#B8C4EE', K: '#6F82C8' };  // Fıstık'ın pijama şapkasının renkleri
// 'reach' pozu: sol omuzdan çıkıp dirsekten yukarı kalkan kol (6–17. satırlar); sahnede Ceviz aynalı durur, kol lambanın ipine uzanır
const CEVIZ_REACH = ['.AAA', 'ADDDA', 'ADBDA', 'ADDDA', '.ADDA', '.ADDA', '.ADDA', '..ADDA', '..ADDDA', '...ADDDA', '....ADDDA', '.....AADD'];

/** 'cevizcap': gece şapkalı Ceviz; patisiz pozların 'reach' (kol yukarıda) çeşidiyle */
function deriveCevizCap() {
  if (SP['cevizcap|calm|null|mood']) return;
  const grid = (rs) => { const g = new Map(); rs.forEach(([x, y, w, h, f]) => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) g.set(`${x + i},${y + j}`, f); }); return g; };
  const keys = Object.keys(SP).filter((k) => k.startsWith('ceviz|'));
  [...keys, ...keys.filter((k) => k.split('|')[2] === 'null').map((k) => k.replace('|null|', '|reach|'))].forEach((k) => {
    const reach = k.includes('|reach|'), g = grid(SP[k.replace('|reach|', '|null|')]);
    CEVIZ_CAP.forEach((r, y) => [...r].forEach((c, x) => c !== '.' && g.set(`${x},${y}`, CEVIZ_CAP_C[c])));
    if (reach) CEVIZ_REACH.forEach((r, j) => [...r].forEach((c, x) => c !== '.' && g.set(`${x},${6 + j}`, { A: '#2A1E1A', D: '#A8683A', B: '#7E4A26' }[c])));
    const rows = {};
    g.forEach((f, p) => { const [x, y] = p.split(',').map(Number); (rows[y] = rows[y] || []).push([x, f]); });
    const out = [];
    Object.entries(rows).forEach(([y, r]) => {
      r.sort((a, b) => a[0] - b[0]);
      r.forEach(([x, f]) => { const l = out[out.length - 1]; if (l && l[1] === +y && l[0] + l[2] === x && l[4] === f) l[2]++; else out.push([x, +y, 1, 1, f]); });
    });
    SP['cevizcap' + k.slice(5)] = out;
  });
}

function defineValue() {
  /* ── Bilgi kartları: her kart bir ipucu ── */
  SCENES.cards = (t0, o = {}) => {
    const s = scene(t0, o.bg || 'var(--paper)', o.wipe || [540, 1200], o.wdur ?? 0.3);
    s.root.style.isolation = 'isolate';  // başlık ve balonlar sonraki sahnenin üstüne taşmasın
    const bg = el('div', 'abs', s.root, { inset: 0 });
    pattern(s.root, 'rgba(0,0,0,.05)');
    const D = o.decor || null;
    let ghost = null, props = [], segs = [];
    if (D) {
      // sol altta soluk dev kart numarası
      ghost = el('div', 'abs it', s.root, { left: '24px', top: '1180px', fontSize: '760px', lineHeight: 0.8, opacity: 0.12, whiteSpace: 'nowrap' });
      // yavaşça süzülen pixel paralar / yüzdeler (maskotla aynı pixel dili)
      props = Array.from({ length: 8 }, (_, i) => {
        const p = D.props === 'percent'
          ? Object.assign(el('div', 'abs it', s.root, { fontSize: px(120 + (i % 3) * 40), color: 'rgba(42,30,26,.16)' }), { textContent: i % 3 === 2 ? '÷' : '%' })
          : i % 2 ? pixEl(s.root, NOTE, NOTE_CS[i % 3], 12) : pixEl(s.root, TLCOIN, TLCOIN_C, 14);
        p.style.opacity = D.props === 'percent' ? 1 : 0.5;
        return { p, x: 40 + ((i * 397) % 900), y: (i * 271) % 1900, sp: 30 + (i % 4) * 12, ph: i * 1.7 };
      });
    }
    const items = (o.items || []).map((it) => {
      const card = el('div', 'abs', s.root, { left: '56px', right: '56px', top: px(o.top ?? 470), borderRadius: '56px', background: '#FFFDF8', boxShadow: '0 40px 90px -30px rgba(40,20,10,.45)', padding: '56px 56px 60px', display: 'none' });
      const head = el('div', '', card, { display: 'flex', alignItems: 'center', gap: '30px' });
      const badge = el('div', 'it', head, { flex: 'none', minWidth: '130px', height: '130px', padding: '0 24px', borderRadius: '65px', background: it.color || 'var(--acc)', color: '#fff', fontSize: it.badge && it.badge.length > 2 ? '64px' : '104px', display: 'flex', alignItems: 'center', justifyContent: 'center' });
      badge.textContent = it.badge ?? it.num;
      const title = el('div', '', head, { fontSize: px(it.titleSize || 68), fontWeight: 800, letterSpacing: '-.03em', lineHeight: 1.05 });
      title.innerHTML = it.title;
      const body = el('div', '', card, { fontSize: px(it.bodySize || 50), fontWeight: 600, color: '#4A3B33', lineHeight: 1.3, marginTop: '34px', letterSpacing: '-.01em' });
      body.innerHTML = it.body;
      let ex = null, big = null, rows = [];
      if (it.ex || it.big) {
        ex = el('div', '', card, { marginTop: '40px', borderRadius: '36px', background: it.exBg || '#F6EEE6', padding: '34px 40px' });
        if (it.exLabel !== false) { const l = el('div', '', ex, { fontSize: '34px', fontWeight: 800, color: '#8a7d72', letterSpacing: '.06em' }); l.textContent = it.exLabel || 'ÖRNEK'; }
        rows = (it.ex || []).map((r) => { const e = el('div', '', ex, { fontSize: '46px', fontWeight: 700, marginTop: '10px', lineHeight: 1.25 }); e.innerHTML = r; return e; });
        if (it.big) big = el('div', 'it', ex, { fontSize: px(it.bigSize || 140), color: it.color || 'var(--acc)', marginTop: '10px', lineHeight: 1, display: 'inline-block', transformOrigin: '0 60%' });
      }
      const sparks = D && big ? Array.from({ length: 10 }, (_, j) => { ex.style.position = 'relative'; return el('div', 'abs', ex, { width: '18px', height: '18px', background: j % 3 ? it.color || 'var(--acc)' : '#F2B63C' }); }) : [];
      let say = null;
      if (D && it.mascot && it.mascot.say) {
        say = el('div', 'abs it', s.root, { right: px(1080 - (it.mascot.x ?? 800) + 250), top: '1470px', background: '#fff', border: '7px solid #2A1E1A', borderRadius: '30px', padding: '6px 30px 10px', fontSize: '76px', whiteSpace: 'nowrap', transformOrigin: '100% 100%', zIndex: 4, boxShadow: '0 8px 0 rgba(42,30,26,.25)' });
        say.textContent = it.mascot.say;
        el('div', 'abs', say, { right: '-22px', bottom: '22px', width: '30px', height: '30px', background: '#fff', borderRight: '7px solid #2A1E1A', borderBottom: '7px solid #2A1E1A', transform: 'rotate(-45deg)' });
      }
      const m = it.mascot ? new Mascot(s.root, { who: it.mascot.who || 'fistik', w: it.mascot.w || 576, outfit: it.mascot.outfit || null }) : null;
      return { ...it, bigTpl: it.big, card, rows, big, m, sparks, say };
    });
    const counter = el('div', 'pill', s.root, { right: '56px', top: D ? '236px' : '130px', fontSize: '38px', color: '#6e5f55', zIndex: 3 });
    if (D && D.topic) { const tp = el('div', 'pill', s.root, { left: '56px', top: '236px', fontSize: '38px', color: '#2A1E1A', zIndex: 3, whiteSpace: 'nowrap' }); tp.innerHTML = D.topic; }
    if (D) {
      const bar = el('div', 'abs', s.root, { left: '56px', right: '56px', top: '352px', height: '16px', display: 'flex', gap: '14px', zIndex: 3 });
      segs = items.map((it) => { const g = el('div', '', bar, { flex: 1, borderRadius: '8px', background: 'rgba(42,30,26,.12)', overflow: 'hidden' }); return el('div', '', g, { height: '100%', width: '0', background: it.color || 'var(--acc)' }); });
    }
    const RS = o.rowStart ?? 0.9, RG = o.rowGap ?? 0.45, CD = o.countDur ?? 0.7, FAST = !!o.fast;
    const pat = s.root.querySelector('.pattern');
    s.update = (lt) => {
      if (FAST) {  // akan zemin + her kartta kamera vuruşu
        pat.style.transform = `translate(${(lt * 90) % 72}px,${(lt * 60) % 72}px)`;
        const lastT = items.reduce((a, it) => (lt >= it.t ? it.t : a), -9);
        const pk = prog(lt, lastT, 0.25);
        s.root.style.transform = pk < 1 ? `scale(${1.06 - 0.06 * E.out(pk)}) rotate(${(1 - E.out(pk)) * 1.2}deg)` : 'none';
      }
      let idx = -1;
      items.forEach((it, i) => { if (lt >= it.t) idx = i; });
      counter.style.display = o.counter === false || idx < 0 ? 'none' : 'flex';
      if (idx >= 0) counter.textContent = `${idx + 1}/${items.length}`;
      if (idx >= 0) bg.style.background = items[idx].bg || 'transparent';
      if (D) {
        props.forEach((q) => {
          const y = (((q.y - lt * q.sp) % 2100) + 2100) % 2100 - 180;
          q.p.style.transform = `translate(${q.x + Math.sin(lt * 1.3 + q.ph) * 30}px,${y}px) rotate(${Math.sin(lt + q.ph) * 14}deg)`;
        });
        segs.forEach((f, i) => { const a = items[i].t, b = items[i + 1] ? items[i + 1].t : o.dur ?? a + 4.4; f.style.width = prog(lt, a, b - a) * 100 + '%'; });
        if (idx >= 0) {
          const it = items[idx], gk = E.out(prog(lt - it.t, 0, 0.45));
          ghost.textContent = it.badge ?? it.num;
          ghost.style.color = it.color || 'var(--acc)';
          ghost.style.transform = `translate(${(1 - gk) * -260}px,${Math.sin(lt * 1.5) * 12}px) rotate(${-6 + (1 - gk) * -10}deg)`;
        }
      }
      items.forEach((it, i) => {
        const on = i === idx;
        it.card.style.display = on ? 'block' : 'none';
        if (it.m) it.m.root.style.display = on ? 'block' : 'none';
        if (it.say && !on) it.say.style.display = 'none';
        if (!on) return;
        const k = lt - it.t;
        const sl = FAST ? E.back(prog(k, 0, 0.32)) : E.out(prog(k, 0, 0.3));
        it.card.style.transform = `translateX(${(1 - sl) * 900}px) rotate(${(1 - sl) * 6}deg)`;
        it.rows.forEach((r, j) => {
          const p = prog(k, RS + j * RG, 0.25);
          r.style.opacity = p;
          r.style.transform = `translateY(${(1 - E.out(p)) * 20}px)`;
        });
        if (it.big) {
          const a = RS + it.rows.length * RG;
          it.big.style.opacity = prog(k, a, 0.12);
          it.big.innerHTML = it.bigTo != null ? countText(it.bigTpl, k, a, CD, it.bigTo, it.bigDec || 0) : it.bigTpl;
          const hitK = prog(k, a + CD, 0.3);  // sayı yerine oturunca çarpar
          it.big.style.transform = FAST ? `scale(${1 + 0.3 * Math.sin(hitK * Math.PI)}) rotate(${Math.sin(hitK * Math.PI) * -4}deg)` : `scale(${1 + 0.12 * Math.sin(prog(k, a + CD, 0.3) * Math.PI)})`;
        }
        if (it.sparks.length) {  // sayı oturunca kıvılcım patlar
          const hitAt = RS + it.rows.length * RG + CD, sk = prog(k, hitAt, 0.45);
          const cx = it.big.offsetLeft + Math.min(it.big.offsetWidth, 520) * 0.5, cy = it.big.offsetTop + it.big.offsetHeight * 0.5;
          it.sparks.forEach((e, j) => {
            const ang = (j / it.sparks.length) * Math.PI * 2 + 0.3, r = 60 + E.out(sk) * (150 + (j % 3) * 40);
            e.style.display = sk > 0 && sk < 1 ? 'block' : 'none';
            e.style.transform = `translate(${cx + Math.cos(ang) * r * 1.4 - 9}px,${cy + Math.sin(ang) * r * 0.7 - 9}px) scale(${1 - sk * 0.7})`;
          });
        }
        if (it.say) {
          const sayAt = it.mascot.sayAt ?? (it.big ? RS + it.rows.length * RG + CD + 0.1 : RS + it.rows.length * RG + 0.2);
          const sp = prog(k, sayAt, 0.3);
          it.say.style.display = sp > 0 ? 'block' : 'none';
          it.say.style.transform = `scale(${E.back(sp)}) rotate(${-4 + Math.sin(lt * 6) * 2}deg)`;
        }
        if (it.m) {
          const M = it.mascot;
          const pop = E.back(prog(k, 0.35, 0.4));
          const late = k > (M.cheerAt ?? (FAST ? RS + (it.rows.length * RG) + CD : 2.6));
          const h = hop(k, FAST ? 0.42 : 0.6, late ? (FAST ? 50 : 26) : 0);
          it.m.set(late ? M.mood2 || 'happy' : M.mood || 'curious', late ? M.paws2 ?? 'up' : M.paws ?? null, blink(k));
          it.m.put(M.x ?? 800, (M.bottom ?? 1960) + (1 - pop) * 500 - h.y, { sx: h.sx, sy: h.sy, flip: !!M.flip });
        }
      });
    };
  };

  /* ── Hook: "Siparişi onayla" düğmesinin başında tereddüt ── */
  SCENES.cartHook = (t0, o = {}) => {
    const s = scene(t0, 'var(--soft)');
    pattern(s.root, 'rgba(174,71,22,.08)');
    const sheet = el('div', 'abs', s.root, { left: '70px', right: '70px', top: '520px', borderRadius: '56px', background: '#fff', padding: '50px 54px', boxShadow: '0 40px 90px -30px rgba(40,20,10,.45)' });
    sheet.innerHTML = `<div style="font-size:44px;font-weight:800">Sepetim (${(o.items || []).length})</div>` +
      (o.items || []).map(([n, p]) => `<div style="display:flex;justify-content:space-between;font-size:44px;font-weight:600;color:#4A3B33;margin-top:26px"><span>${n}</span><b>${p} TL</b></div>`).join('') +
      `<div style="height:2px;background:#eee;margin:34px 0 26px"></div><div style="display:flex;justify-content:space-between;font-size:52px;font-weight:800"><span>Toplam</span><span style="color:var(--acc)">${o.total} TL</span></div>`;
    const btn = el('div', 'abs', s.root, { left: '110px', right: '110px', top: px(o.btnY ?? 1180), height: '150px', borderRadius: '75px', background: 'var(--acc)', color: '#fff', fontSize: '60px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px -10px rgba(174,71,22,.6)' });
    btn.textContent = 'Siparişi onayla';
    const m = new Mascot(s.root, { w: 640 });
    const sweat = pixEl(s.root, SWEAT, SWEAT_C, 20);
    const STOP = o.stop;
    const stamp = STOP != null ? el('div', 'abs it', s.root, { left: '50%', top: '600px', fontSize: '300px', color: '#E8322A', textShadow: '0 12px 0 #7A1410', zIndex: 6, whiteSpace: 'nowrap' }) : null;
    if (stamp) stamp.textContent = 'DUR!';
    const paw = STOP != null ? pixEl(s.root, ['.oo.', 'oFFo', 'oFFo', 'oFFo', 'oFFo'], { o: '#2A1E1A', F: '#E8893C' }, 24, { zIndex: 5 }) : null;
    s.update = (lt) => {
      if (STOP != null) {
        const sh = shake(lt, STOP, 30, 0.35);
        sheet.style.transform = btn.style.transform = `translate(${sh}px,0)`;
        const sp = prog(lt, STOP, 0.18);
        stamp.style.opacity = sp > 0 ? 1 : 0;
        stamp.style.transform = `translateX(-50%) scale(${lerp(3, 1, E.out(sp))}) rotate(${-10 + Math.sin(lt * 12) * (lt > STOP + 0.3 ? 2 : 0)}deg)`;
        // pati düğmeye uzanır, Fıstık öne atlayıp engeller
        const reach = E.inOut(prog(lt, 0, STOP));
        paw.style.display = lt < STOP + 0.1 ? 'block' : 'none';
        paw.style.transform = `translate(${700 - reach * 80}px,${1700 - reach * 380}px) rotate(-20deg)`;
        const j = E.back(prog(lt, STOP - 0.05, 0.3));
        const blockH = lt > STOP ? hop(lt, 0.35, 30) : { y: 0, sx: 1, sy: 1 };
        m.set(lt > STOP ? 'curious' : 'thoughtful', lt > STOP ? 'up' : null, lt > STOP ? 'wide' : 'mood');
        m.put(540, 2080 - j * 360 - blockH.y + Math.sin(lt * 9) * (lt < STOP ? 6 : 0), { sx: blockH.sx, sy: blockH.sy });
        sweat.style.display = 'none';
        return;
      }
      btn.style.transform = `scale(${1 + 0.035 * Math.sin(lt * 8)})`;
      const reach = Math.sin(lt * 3.2);
      m.set('thoughtful', reach > 0.3 ? 'up' : null, lt % 1.4 < 0.12 ? 'closed' : 'wide');
      m.put(540, 1960 - Math.max(0, reach) * 40, { rot: Math.sin(lt * 30) * 1 });
      const sk = (lt % 0.8) / 0.8;
      sweat.style.transform = `translate(720px,${1460 + sk * 80}px)`;
      sweat.style.opacity = 1 - sk * 0.6;
    };
  };

  /* ── Hook: "Bölmezsen" — tek yığın para günler ilerledikçe erir ── */
  SCENES.drainHook = (t0, o = {}) => {
    const END = o.end ?? 1.5, TOTAL = o.total ?? 10000, DAY = o.day ?? 18;
    const s = scene(t0, 'var(--paper)');
    pattern(s.root);
    const cal = el('div', 'abs', s.root, { left: '120px', top: '560px', width: '300px', height: '340px', borderRadius: '22px', background: '#FFFDF8', overflow: 'hidden', boxShadow: '0 24px 50px -16px rgba(0,0,0,.35)' });
    cal.innerHTML = '<div style="height:84px;background:#D7372B;color:#fff;font-family:Pixel;font-size:70px;display:flex;align-items:center;justify-content:center">EKİM</div><div class="d it" style="text-align:center;font-size:230px;line-height:1;margin-top:6px"></div>';
    const dayEl = cal.querySelector('.d');
    const tank = el('div', 'abs', s.root, { left: '560px', top: '540px', width: '380px', height: '760px', borderRadius: '48px', background: '#E9E0D4', overflow: 'hidden', border: '10px solid #2A1E1A' });
    const fill = el('div', 'abs', tank, { left: 0, right: 0, bottom: 0 });
    const amt = el('div', 'abs it', s.root, { left: '480px', width: '540px', top: '1330px', textAlign: 'center', fontSize: '130px' });
    const coins = Array.from({ length: 12 }, () => pixEl(s.root, TLCOIN, TLCOIN_C, 12));
    const m = new Mascot(s.root, { w: 512 });
    s.update = (lt) => {
      const k = E.inOut(prog(lt, 0.15, END - 0.15));
      const left = 1 - k;
      fill.style.height = left * 100 + '%';
      fill.style.background = left > 0.5 ? '#2F8F5A' : left > 0.2 ? '#E0A030' : '#C0392B';
      amt.textContent = `${fmt(TOTAL * left)} TL`;
      amt.style.color = left > 0.2 ? 'var(--ink)' : '#C0392B';
      dayEl.textContent = String(Math.max(1, Math.round(1 + k * (DAY - 1))));
      dayEl.style.color = k >= 1 ? '#C0392B' : 'var(--ink)';
      cal.style.transform = `rotate(${Math.sin(lt * 20) * (k < 1 ? 3 : 0)}deg)`;
      coins.forEach((c, i) => {
        const p = ((lt * 1.6 + i / coins.length) % 1);
        c.style.display = k < 1 ? 'block' : 'none';
        c.style.transform = `translate(${750 + Math.sin(i * 2.3) * 180 * p - 36}px,${540 - p * 420 + p * p * 300}px) rotate(${p * 360}deg)`;
        c.style.opacity = 1 - p;
      });
      const broke = lt >= END;
      m.set(broke ? 'thoughtful' : 'happy', broke ? null : Math.floor(lt / 0.25) % 2 ? 'up' : 'wave', broke ? 'x' : 'mood');
      const sink = E.out(prog(lt, END, 0.3));
      m.put(270, 1960 + sink * 40 - (broke ? 0 : hop(lt, 0.5, 30).y), { rot: broke ? -6 * sink : 0 });
      s.root.style.transform = broke && lt < END + 0.3 ? `translate(${shake(lt, END, 24, 0.3)}px,0) scale(1.05)` : 'none';
    };
  };

  /* ── Hook: dönen pasta grafik (50/30/20) ── */
  SCENES.pieHook = (t0, o = {}) => {
    const s = scene(t0, 'var(--paper)');
    pattern(s.root);
    const parts = o.parts || [[50, '#AE4716', 'İhtiyaç'], [30, '#2F8F9D', 'İstek'], [20, '#E0A030', 'Birikim']];
    const pie = el('div', 'abs', s.root, { left: px(540 - 330), top: '560px', width: '660px', height: '660px', borderRadius: '50%', boxShadow: '0 40px 80px -30px rgba(40,20,10,.5)' });
    let acc = 0;
    pie.style.background = 'conic-gradient(' + parts.map(([p, c]) => { const a = acc; acc += p; return `${c} ${a}% ${acc}%`; }).join(',') + ')';
    const hole = el('div', 'abs', pie, { left: '150px', top: '150px', width: '360px', height: '360px', borderRadius: '50%', background: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    const center = el('div', 'it', hole, { fontSize: '96px', color: 'var(--ink)', textAlign: 'center', lineHeight: 0.9 });
    center.innerHTML = parts.map(([p]) => p).join('/');
    const labels = parts.map(([p, c, n], i) => {
      const e = el('div', 'pill', s.root, { fontSize: '44px', color: c, whiteSpace: 'nowrap' });
      e.innerHTML = `<b>%${p}</b> ${n}`;
      return e;
    });
    const m = new Mascot(s.root, { w: 448, outfit: 'scholar' });
    s.update = (lt) => {
      pie.style.transform = `rotate(${lt * 40}deg)`;
      hole.style.transform = `rotate(${-lt * 40}deg)`;
      const pos = [[60, 1290], [600, 1290], [330, 1400]];
      labels.forEach((e, i) => {
        e.style.left = px(pos[i][0]);
        e.style.top = px(pos[i][1] + Math.sin(lt * 4 + i) * 8);
      });
      const h = hop(lt, 0.7, 20);
      m.set('happy', Math.floor(lt / 0.35) % 2 ? 'up' : null, blink(lt));
      m.put(880, 1930 - h.y, { sx: h.sx, sy: h.sy, flip: true });
    };
  };

  /* ── Hook: okul maili bildirimi + kepli Fıstık ── */
  SCENES.mailHook = (t0, o = {}) => {
    const s = scene(t0, '#DEE2F6');
    pattern(s.root, 'rgba(67,81,163,.10)');
    const card = el('div', 'abs', s.root, { left: '80px', right: '80px', top: '560px', borderRadius: '48px', background: '#fff', padding: '44px 50px', boxShadow: '0 30px 70px -20px rgba(30,40,90,.4)' });
    card.innerHTML = `<div style="font-size:34px;color:#8a8fb0;font-weight:700;letter-spacing:.05em">E-POSTA ADRESİN</div><div style="font-size:64px;font-weight:800;letter-spacing:-.02em;margin-top:8px">ad.soyad@<span style="color:#4351A3">ogr.uni.edu.tr</span></div>`;
    const tags = (o.tags || []).map((t) => { const e = el('div', 'pill', s.root, { fontSize: '42px', color: '#4351A3', whiteSpace: 'nowrap' }); e.textContent = t; return e; });
    const m = new Mascot(s.root, { w: 640, outfit: 'cap' });
    s.update = (lt) => {
      card.style.transform = `translateY(${Math.sin(lt * 2) * 6}px)`;
      const pos = [[60, 900], [560, 980], [120, 1080], [600, 1160]];
      tags.forEach((e, i) => {
        const p = prog(lt, -1 + i * 0.25, 0.3);
        e.style.left = px(pos[i % 4][0]); e.style.top = px(pos[i % 4][1] + Math.sin(lt * 3 + i) * 10);
        e.style.opacity = p; e.style.transform = `rotate(${(i % 2 ? 4 : -4)}deg)`;
      });
      const h = hop(lt, 0.55, 40);
      m.set('celebrate', Math.floor(lt / 0.2) % 2 ? 'wave' : 'up', blink(lt));
      m.put(540, 1960 - h.y, { sx: h.sx, sy: h.sy });
    };
  };

  /* ── Hook: peşin etiketi ile taksit etiketi; "=" işareti "≠" olur ── */
  SCENES.tagHook = (t0, o = {}) => {
    const FLIP = o.flip ?? 0.6;
    const s = scene(t0, '#FBEAD0', undefined, o.wdur ?? 0.6);
    pattern(s.root, 'rgba(174,71,22,.08)');
    const tag = (x, head, val, sub, c) => {
      const e = el('div', 'abs', s.root, { left: px(x), top: '760px', width: '420px', borderRadius: '40px', background: '#fff', padding: '40px 30px 46px', textAlign: 'center', boxShadow: '0 30px 60px -20px rgba(40,20,10,.45)', border: `8px solid ${c}` });
      e.innerHTML = `<div style="font-size:44px;font-weight:800;color:${c};letter-spacing:.04em">${head}</div><div class="it" style="font-size:130px;line-height:1;margin-top:14px">${val}</div><div style="font-size:40px;font-weight:700;color:#6e5f55;margin-top:6px">${sub}</div>`;
      return e;
    };
    const a = tag(60, 'PEŞİN', o.cash || '12.000', 'TL, bugün', '#AE4716');
    const b = tag(600, 'TAKSİT', o.inst || '6 × 2.000', 'TL, 6 ayda', '#2F8F5A');
    const sign = el('div', 'abs it', s.root, { left: '540px', top: '860px', fontSize: '200px', color: '#2A1E1A', zIndex: 3 });
    const crown = el('div', 'abs pill', s.root, { left: '810px', top: '630px', fontSize: '48px', color: '#2F8F5A', whiteSpace: 'nowrap', zIndex: 4 });
    crown.textContent = o.win || 'daha ucuz!';
    const m = new Mascot(s.root, { w: 640, who: o.who || 'ceviz' });
    s.update = (lt) => {
      const fl = lt >= FLIP;
      sign.textContent = fl ? '≠' : '=';
      const sp = prog(lt, FLIP, 0.25);
      sign.style.color = fl ? '#D7372B' : '#2A1E1A';
      sign.style.transform = `translateX(-50%) scale(${fl ? 1 + 0.6 * Math.sin(sp * Math.PI) : 1}) rotate(${fl ? (1 - E.out(sp)) * 180 : Math.sin(lt * 10) * 8}deg)`;
      const sh = fl ? shake(lt, FLIP, 26, 0.3) : 0;
      a.style.transform = `translate(${sh}px,${fl ? E.out(sp) * 40 : Math.sin(lt * 5) * 8}px) rotate(${fl ? -4 * E.out(sp) : 0}deg) scale(${fl ? 1 - 0.08 * E.out(sp) : 1})`;
      b.style.transform = `translate(${-sh}px,${fl ? -E.out(sp) * 40 : Math.sin(lt * 5 + 1) * 8}px) rotate(${fl ? 3 * E.out(sp) : 0}deg) scale(${fl ? 1 + 0.08 * E.back(sp) : 1})`;
      const cp = E.back(prog(lt, FLIP + 0.1, 0.3));
      crown.style.opacity = cp > 0 ? 1 : 0;
      crown.style.transform = `translateX(-50%) scale(${cp}) rotate(6deg)`;
      const h = fl ? hop(lt, 0.4, 40) : { y: 0, sx: 1, sy: 1 };
      const look = Math.sin(lt * 7) > 0;
      m.set(fl ? 'happy' : 'thoughtful', fl ? 'up' : null, fl ? 'wide' : blink(lt));
      m.put(540, 1960 - h.y, { sx: h.sx, sy: h.sy, flip: fl ? false : look });
    };
  };

  /* ── Hook: hesap makinesi "%3 × 12 = %36" → "YANLIŞ" damgası ── */
  SCENES.percentHook = (t0, o = {}) => {
    const STOP = o.stop ?? 0.7;
    const s = scene(t0, '#DEE2F6', undefined, o.wdur ?? 0.6);
    pattern(s.root, 'rgba(67,81,163,.10)');
    const pc = Array.from({ length: 10 }, (_, i) => { const e = el('div', 'abs it', s.root, { fontSize: px(90 + (i % 3) * 50), color: 'rgba(67,81,163,.25)' }); e.textContent = '%'; return e; });
    const calc = el('div', 'abs', s.root, { left: '150px', right: '150px', top: '700px', borderRadius: '56px', background: '#2A2F45', padding: '44px', boxShadow: '0 40px 90px -30px rgba(20,25,60,.6)' });
    const scr = el('div', 'it', calc, { borderRadius: '28px', background: '#C9D8B6', color: '#1E2A16', fontSize: '128px', textAlign: 'right', padding: '24px 36px', lineHeight: 1, whiteSpace: 'nowrap' });
    const keys = el('div', '', calc, { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '22px', marginTop: '34px' });
    '789÷456×123−0%=+'.split('').forEach((k) => { const e = el('div', 'it', keys, { height: '86px', borderRadius: '24px', background: '=+−×÷%'.includes(k) ? '#4351A3' : '#454B66', color: '#fff', fontSize: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }); e.textContent = k; });
    const stamp = el('div', 'abs it', s.root, { left: '50%', top: '1000px', fontSize: '210px', color: '#E8322A', textShadow: '0 10px 0 #7A1410', zIndex: 6, whiteSpace: 'nowrap' });
    stamp.textContent = o.stamp || 'YANLIŞ!';
    const m = new Mascot(s.root, { w: 576, who: o.who || 'bilge', outfit: o.outfit || 'spy' });
    const full = o.text || '%3×12=%36';
    s.update = (lt) => {
      pc.forEach((e, i) => {
        const p = (lt * 0.5 + i / pc.length) % 1;
        e.style.transform = `translate(${(i * 233) % 1000}px,${1900 - p * 1700}px) rotate(${p * 90 - 45}deg)`;
      });
      const n = Math.min(full.length, Math.floor(prog(lt, 0, STOP - 0.1) * full.length + 0.999));
      scr.textContent = full.slice(0, Math.max(1, n));
      const st = lt >= STOP, sp = prog(lt, STOP, 0.18);
      scr.style.color = st ? '#C0392B' : '#1E2A16';
      calc.style.transform = `translate(${st ? shake(lt, STOP, 30, 0.35) : 0}px,0) rotate(${st ? -2 : 0}deg)`;
      stamp.style.opacity = st ? 1 : 0;
      stamp.style.transform = `translateX(-50%) scale(${lerp(3, 1, E.out(sp))}) rotate(${-10 + (lt > STOP + 0.3 ? Math.sin(lt * 12) * 2 : 0)}deg)`;
      const h = st ? hop(lt, 0.4, 30) : { y: 0, sx: 1, sy: 1 };
      m.set(st ? 'curious' : 'thoughtful', st ? 'up' : null, st ? 'wide' : blink(lt));
      m.put(820, 1980 - h.y, { sx: h.sx, sy: h.sy, flip: true });
    };
  };

  /* ── Quiz: soru, iki şık, 3-2-1 geri sayım, cevap ── */
  SCENES.quiz = (t0, o = {}) => {
    const s = scene(t0, o.bg || 'var(--paper)', o.wipe || [540, 1200], o.wdur ?? 0.3);
    s.root.style.isolation = 'isolate';
    const bg = el('div', 'abs', s.root, { inset: 0 });
    const pat = pattern(s.root, 'rgba(0,0,0,.05)');
    const OPT = o.optAt ?? 0.3, CD0 = o.countAt ?? 0.9, STEP = o.step ?? 0.6, REV = CD0 + 3 * STEP, WHY = REV + 0.45;
    const ghost = el('div', 'abs it', s.root, { left: '24px', top: '1240px', fontSize: '700px', lineHeight: 0.8, opacity: 0.1 });
    const top = el('div', 'pill', s.root, { left: '56px', top: '236px', fontSize: '38px', color: '#2A1E1A', zIndex: 3 });
    const qs = (o.items || []).map((it, qi) => {
      const card = el('div', 'abs', s.root, { left: '56px', right: '56px', top: '400px', borderRadius: '52px', background: '#FFFDF8', boxShadow: '0 40px 90px -30px rgba(40,20,10,.45)', padding: '50px 54px 54px', display: 'none' });
      const q = el('div', '', card, { fontSize: px(it.qSize || 70), fontWeight: 800, letterSpacing: '-.025em', lineHeight: 1.12, paddingRight: '150px' });
      q.innerHTML = it.q;
      const timer = el('div', 'abs it', card, { right: '40px', top: '40px', width: '130px', height: '130px', borderRadius: '50%', background: it.color, color: '#fff', fontSize: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' });
      const opts = it.opts.map((txt, i) => {
        const b = el('div', '', card, { marginTop: i ? '26px' : '50px', height: '170px', borderRadius: '40px', border: '6px solid #2A1E1A', background: '#fff', display: 'flex', alignItems: 'center', gap: '30px', padding: '0 34px', fontSize: '70px', fontWeight: 800, letterSpacing: '-.02em', position: 'relative' });
        b.innerHTML = `<span class="it" style="font-size:64px;width:76px;height:76px;border-radius:20px;background:#2A1E1A;color:#fff;display:flex;align-items:center;justify-content:center">${'AB'[i]}</span><span class="tx">${txt}</span><span class="it mark" style="margin-left:auto;font-size:58px"></span>`;
        return b;
      });
      const why = el('div', '', card, { marginTop: '36px', fontSize: '50px', fontWeight: 700, color: '#4A3B33', lineHeight: 1.25, textAlign: 'center' });
      why.innerHTML = it.why || '';
      const m = it.mascot ? new Mascot(s.root, { who: it.mascot.who, w: 512, outfit: it.mascot.outfit || null }) : null;
      return { ...it, card, timer, opts, why, m, qi };
    });
    s.update = (lt) => {
      pat.style.transform = `translate(${(lt * 90) % 72}px,${(lt * 60) % 72}px)`;
      let idx = -1;
      qs.forEach((it, i) => { if (lt >= it.t) idx = i; });
      top.textContent = `SORU ${Math.max(1, idx + 1)}/${qs.length}`;
      if (idx >= 0) { bg.style.background = qs[idx].bg; ghost.textContent = idx + 1; ghost.style.color = qs[idx].color; }
      qs.forEach((it, i) => {
        const on = i === idx;
        it.card.style.display = on ? 'block' : 'none';
        if (it.m) it.m.root.style.display = on ? 'block' : 'none';
        if (!on) return;
        const k = lt - it.t;
        const sl = E.back(prog(k, 0, 0.32));
        const rev = k >= REV;
        it.card.style.transform = `translateX(${(1 - sl) * 900}px) rotate(${(1 - sl) * 6}deg) translateX(${rev ? shake(k, REV, 14, 0.3) : 0}px)`;
        ghost.style.transform = `translate(${(1 - E.out(prog(k, 0, 0.45))) * -260}px,${Math.sin(lt * 1.5) * 12}px) rotate(-6deg)`;
        // geri sayım
        const n = 3 - Math.floor((k - CD0) / STEP);
        it.timer.style.display = k >= CD0 && !rev ? 'flex' : 'none';
        it.timer.textContent = String(Math.max(1, n));
        const tp = ((k - CD0) % STEP) / STEP;
        it.timer.style.transform = `scale(${1 + 0.25 * Math.max(0, 1 - tp * 4)})`;
        it.opts.forEach((b, j) => {
          const p = E.back(prog(k, OPT + j * 0.12, 0.28));
          const good = j === it.correct;
          const mark = b.querySelector('.mark');
          b.style.opacity = clamp(p * 3) * (rev && !good ? 0.55 : 1);
          let tr = `translateX(${(1 - p) * (j ? 400 : -400)}px)`;
          if (!rev && k > CD0) tr += ` scale(${1 + 0.015 * Math.sin(lt * 14 + j * 2)})`;
          if (rev && good) tr += ` scale(${1 + 0.08 * Math.sin(prog(k, REV, 0.35) * Math.PI)})`;
          if (rev && !good) tr += ` translateX(${shake(k, REV, 22, 0.35)}px) rotate(${-2 * E.out(prog(k, REV, 0.2))}deg)`;
          b.style.transform = tr;
          b.style.background = rev ? (good ? '#2F8F5A' : '#F2D4CF') : '#fff';
          b.style.color = rev ? (good ? '#fff' : '#C0392B') : 'var(--ink)';
          b.style.borderColor = rev ? (good ? '#1E6B40' : '#C0392B') : '#2A1E1A';
          b.querySelector('.tx').style.textDecoration = rev && !good ? 'line-through' : 'none';
          mark.textContent = rev ? (good ? 'DOĞRU' : 'YANLIŞ') : '';
        });
        const wp = prog(k, WHY, 0.25);
        it.why.style.opacity = wp;
        it.why.style.transform = `translateY(${(1 - E.out(wp)) * 20}px)`;
        if (it.m) {
          const pop = E.back(prog(k, 0.35, 0.4));
          const h = rev ? hop(k, 0.42, 50) : { y: 0, sx: 1, sy: 1 };
          it.m.set(rev ? 'happy' : 'thoughtful', rev ? 'up' : null, rev ? 'wide' : blink(k));
          it.m.put(it.mascot.x ?? 830, 1990 + (1 - pop) * 500 - h.y + (!rev && k > CD0 ? Math.sin(lt * 20) * 3 : 0), { sx: h.sx, sy: h.sy, flip: true });
        }
      });
    };
  };

  /* ── Fırsat maliyeti: sallanan fiyat etiketi döner, arkasından karşılıklar çıkar; salak Pamuk ── */
  SCENES.oppTag = (t0, o = {}) => {
    const s = scene(t0, '#FBEAD0', undefined, o.wdur ?? 0.5);
    s.root.style.isolation = 'isolate';
    pattern(s.root, 'rgba(174,71,22,.08)');
    const amb = ambient(s.root, { cy: 1010 });
    const FL = o.flips || [];  // [t, html, renk]
    const notes = Array.from({ length: 5 }, (_, i) => pixEl(s.root, NOTEP, { o: ['#E86A9A', '#9B7BC6', '#4351A3'][i % 3] }, 14));
    const string = el('div', 'abs', s.root, { left: '538px', top: '640px', width: '6px', height: '130px', background: '#6e5f55', transformOrigin: '50% 0%' });
    const tag = el('div', 'abs', s.root, { left: '250px', top: '760px', width: '580px', height: '500px', transformOrigin: '50% 0%' });
    const face = el('div', '', tag, { position: 'absolute', inset: 0, borderRadius: '44px 44px 60px 60px', background: '#FFFDF8', border: '10px solid #2A1E1A', boxShadow: '0 30px 60px -20px rgba(40,20,10,.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '20px' });
    el('div', 'abs', tag, { left: '265px', top: '22px', width: '50px', height: '50px', borderRadius: '50%', background: '#FBEAD0', border: '8px solid #2A1E1A' });
    const front = o.front || "<div style='margin-top:56px'>{HEADPH}</div><div style='font-size:40px;font-weight:800;color:#8a7d72;letter-spacing:.06em;margin-top:6px'>KULAKLIK</div><div class='it' style='font-size:140px;line-height:.95'>3.000 TL</div>";
    const timer = el('div', 'abs it', s.root, { left: '790px', top: '700px', width: '170px', height: '170px', borderRadius: '50%', background: '#4351A3', color: '#fff', fontSize: '130px', display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: 4 });
    const qs = Array.from({ length: 3 }, (_, i) => { const e = el('div', 'abs it', s.root, { fontSize: '120px', color: '#4351A3' }); e.textContent = '?'; return e; });
    const m = new Mascot(s.root, { who: 'pamuk', w: 576, outfit: 'headphones' });
    const b = o.bilge ? new Mascot(s.root, { who: 'bilge', w: 448, outfit: 'scholar' }) : null;
    const sweat = pixEl(s.root, SWEAT, SWEAT_C, 20);
    const CD = o.countdown;  // [başlangıç, adım]
    s.update = (lt) => {
      amb(lt, FL.reduce((a, f) => (lt >= f[0] ? f[0] : a), -9));
      // hangi yüz görünüyor
      let fi = -1;
      FL.forEach(([t], i) => { if (lt >= t - 0.15) fi = i; });
      const ft = fi >= 0 ? FL[fi][0] : -9;
      const fk = clamp((lt - (ft - 0.15)) / 0.3);  // 0→1 dönüş
      const shown = fk < 0.5 && fi >= 0 ? fi - 1 : fi;
      const html = (shown < 0 ? front : FL[shown][1]).replace('{TRAY}', pix(TRAY, TRAY_C, 18)).replace('{CUP}', pix(CUP, CUP_C, 24)).replace('{COIN}', pix(TLCOIN, TLCOIN_C, 18)).replace('{HEADPH}', pix(HEADPH, HEADPH_C, 13));
      if (face.dataset.k !== String(shown)) { face.innerHTML = html; face.dataset.k = String(shown); face.style.background = shown < 0 ? '#FFFDF8' : (FL[shown][2] || '#FFFDF8'); }
      const cnt = face.querySelector('.cnt');
      if (cnt && shown >= 0) {
        const to = +cnt.dataset.to, cp = E.out(prog(lt, FL[shown][0], 0.55));
        cnt.textContent = fmt(to * cp);
        cnt.style.display = 'inline-block';
        cnt.style.transform = `scale(${1 + 0.25 * Math.sin(prog(lt, FL[shown][0] + 0.55, 0.25) * Math.PI)})`;
      }
      const sx = fi >= 0 && fk < 1 ? Math.abs(Math.cos(fk * Math.PI)) : 1;
      const swing = Math.sin(lt * 2.4) * 5 + (fi >= 0 ? Math.sin((lt - ft) * 12) * 10 * Math.exp(-(lt - ft) * 3) * (lt > ft ? 1 : 0) : 0);
      tag.style.transform = `rotate(${swing}deg) scaleX(${Math.max(0.02, sx)}) scale(${fi >= 0 && lt > ft && lt < ft + 0.3 ? 1 + 0.08 * Math.sin((lt - ft) / 0.3 * Math.PI) : 1})`;
      string.style.transform = `rotate(${swing}deg)`;
      // geri sayım
      if (CD) {
        const k = Math.floor((lt - CD[0]) / CD[1]);
        timer.style.display = k >= 0 && k < 3 ? 'flex' : 'none';
        timer.textContent = String(3 - k);
        const tp = ((lt - CD[0]) % CD[1]) / CD[1];
        timer.style.transform = `scale(${1 + 0.3 * Math.max(0, 1 - tp * 4)})`;
      }
      // Pamuk: önce kafasına göre dans, sonra şaşkın, sonunda bayılır
      const P = o.pamuk || [];  // [t, durum]
      const st = P.reduce((a, p) => (lt >= p[0] ? p[1] : a), 'dance');
      const stT = P.reduce((a, p) => (lt >= p[0] ? p[0] : a), 0);
      const k = lt - stT;
      let x = 540, y = 1990, rot = 0, sxm = 1, sym = 1, flip = false;
      if (b && lt >= o.bilge[0]) x += 130 * E.out(prog(lt, o.bilge[0], 0.4));
      notes.forEach((n) => (n.style.display = 'none'));
      qs.forEach((q) => (q.style.display = 'none'));
      sweat.style.display = 'none';
      if (st === 'dance') {
        const beat = Math.floor(lt / 0.27);
        m.set('happy', beat % 2 ? 'up' : 'wave2', 'squeeze');
        y -= Math.abs(Math.sin(lt * 11.6)) * 40; rot = Math.sin(lt * 5.8) * 9; flip = beat % 4 > 1;
        notes.forEach((n, i) => { const p = (lt * 0.7 + i / 5) % 1; n.style.display = 'block'; n.style.transform = `translate(${300 + i * 110 + Math.sin(p * 6 + i) * 30}px,${1500 - p * 500}px) rotate(${Math.sin(p * 9) * 20}deg)`; n.style.opacity = 1 - p; });
      } else if (st === 'shock') {
        m.set('curious', 'face', 'wide');
        const j = E.back(prog(k, 0, 0.25)); y -= j * 90 - (k > 0.25 ? 90 * E.out(prog(k, 0.25, 0.3)) : 0); sym = 1 + 0.1 * Math.sin(Math.min(1, k / 0.3) * Math.PI);
      } else if (st === 'dumb') {  // aval aval bakar, kafası yana yatık
        m.set('thoughtful', null, Math.floor(lt / 1.3) % 2 ? 'half' : 'mood');
        rot = -12 + Math.sin(lt * 1.5) * 3;
        qs.forEach((q, i) => { const p = (lt * 0.6 + i / 3) % 1; q.style.display = 'block'; q.style.transform = `translate(${560 + (i - 1) * 140}px,${1380 - p * 160}px) rotate(${(i - 1) * 15}deg)`; q.style.opacity = Math.sin(p * Math.PI); });
      } else if (st === 'think') {  // tahmin: ter, titreme
        m.set('thoughtful', 'face', 'squeeze');
        x += Math.sin(lt * 40) * 4; sweat.style.display = 'block';
        const sk = (lt % 0.7) / 0.7;  // alnın yanından süzülür
        sweat.style.transform = `translate(${x + 95}px,${y - 360 + sk * 70}px)`; sweat.style.opacity = 1 - sk * 0.6;
      } else if (st === 'hit') {  // her karşılıkta geriye savrulur
        m.set('curious', 'up', 'x');
        const j = Math.exp(-k * 5); rot = 14 * Math.sin(k * 18) * j; y -= 50 * j; sxm = 1 + 0.12 * j;
      } else if (st === 'faint') {  // bayılır
        m.set('thoughtful', null, 'x');
        const f = E.inOut(prog(k, 0, 0.5)); rot = 84 * f; x -= 230 * f; y -= 250 * f;
      }
      m.put(x, y, { rot, sx: sxm, sy: sym, flip });
      if (b) {
        const bp = E.back(prog(lt, o.bilge[0], 0.4));
        b.root.style.display = lt >= o.bilge[0] ? 'block' : 'none';
        b.set('curious', Math.floor(lt / 0.5) % 2 ? 'wave' : null, blink(lt));
        b.put(150 - (1 - bp) * 400, 1990 - hop(lt, 0.8, 14).y, {});
        // Pamuk sağa kayar ki Bilge'ye yer açılsın
      }
    };
  };

  /* ── Fırsat maliyeti dersi: "Buna değer mi?" çizilir, "Bunun yerine ne alırdım?" damgalanır ── */
  SCENES.lesson = (t0, o = {}) => {
    const s = scene(t0, '#DDEFE9', [540, 1200], 0.35);
    s.root.style.isolation = 'isolate';
    pattern(s.root, 'rgba(47,143,90,.10)');
    const amb = ambient(s.root, { cy: 900, ray: 'rgba(255,255,255,.6)', glow: 'rgba(255,255,255,.5)' });
    const A = o.a ?? 0.2, X = o.strike ?? 1.4, B = o.b ?? 2.4;
    const l1 = el('div', 'abs', s.root, { left: '70px', right: '70px', top: '460px', textAlign: 'center' });
    l1.innerHTML = `<span style="display:inline-block;position:relative;background:#fff;border:8px solid #2A1E1A;border-radius:36px;padding:18px 44px;font-size:${o.q1Size || 96}px;font-weight:800;letter-spacing:-.03em">${o.q1 || 'Buna değer mi?'}<span class="st" style="position:absolute;left:-10px;right:-10px;top:50%;height:16px;background:#C0392B;border-radius:8px;transform-origin:0 50%"></span></span>`;
    const st = l1.querySelector('.st');
    const no = el('div', 'abs it', s.root, { left: '820px', top: '380px', fontSize: '150px', color: '#C0392B', zIndex: 3 }); no.textContent = 'X';
    const l2 = el('div', 'abs', s.root, { left: '50px', right: '50px', top: '780px', textAlign: 'center' });
    l2.innerHTML = `<span style="display:inline-block;background:#2F8F5A;color:#fff;border:8px solid #1E6B40;border-radius:40px;padding:22px 40px;font-size:92px;font-weight:800;letter-spacing:-.03em;line-height:1.08;box-shadow:0 18px 0 #1E6B40">${o.q2 || 'Bunun yerine<br>ne alırdım?'}</span>`;
    const ex = o.extra ? el('div', 'abs', s.root, { left: 0, right: 0, top: px(o.extraY ?? 1070), textAlign: 'center' }) : null;
    if (ex) ex.innerHTML = o.extra;
    const p = new Mascot(s.root, { who: o.who || 'pamuk', w: 512, outfit: o.outfit === undefined ? 'headphones' : o.outfit });
    const bm = new Mascot(s.root, { who: 'bilge', w: 448, outfit: 'scholar' });
    const hp = el('div', 'abs it', s.root, { fontSize: '40px' });
    s.update = (lt) => {
      amb(lt, B);
      const zk = Math.exp(-Math.max(0, lt - B) * 2.5) * (lt >= B ? 1 : 0);
      s.root.style.transform = lt >= B ? `scale(${1 + 0.07 * zk}) translate(${shake(lt, B, 18, 0.35)}px,${shake(lt + 0.05, B, 12, 0.35)}px)` : 'none';
      const a = E.back(prog(lt, A, 0.3));
      l1.style.opacity = clamp(a * 3); l1.style.transform = `scale(${0.7 + 0.3 * a})`;
      const sx = E.out(prog(lt, X, 0.25));
      st.style.transform = `scaleX(${sx}) rotate(-3deg)`;
      l1.style.filter = lt > X + 0.25 ? 'grayscale(.8) opacity(.7)' : 'none';
      const np = prog(lt, X + 0.15, 0.2);
      no.style.display = np > 0 ? 'block' : 'none';
      no.style.transform = `scale(${lerp(2.5, 1, E.out(np))}) rotate(-8deg)`;
      const bp = prog(lt, B, 0.22);
      l2.style.opacity = bp > 0 ? 1 : 0;
      l2.style.transform = `scale(${lerp(o.q2From ?? 2.2, 1, E.out(bp))}) rotate(${(1 - E.out(bp)) * -8 + Math.sin(lt * 3) * 1.2}deg)`;
      // Pamuk: kafa kaşır (salak), sonra aydınlanır
      const got = lt > B + 0.3;
      p.set(got ? 'celebrate' : 'thoughtful', got ? 'up' : 'face', got ? 'happy' : (Math.floor(lt / 0.9) % 2 ? 'half' : 'mood'));
      const h = got ? hop(lt, 0.45, 40) : { y: 0, sx: 1, sy: 1 };
      p.put(720, (o.floor ?? 1990) - h.y, { rot: got ? 0 : -10 + Math.sin(lt * 8) * 4, sx: h.sx, sy: h.sy });
      bm.set(got ? 'happy' : 'curious', got ? 'wave' : null, blink(lt));
      bm.put(260, (o.floor ?? 1990) - (got ? hop(lt + 0.2, 0.5, 20).y : 0), {});
      hp.style.display = 'none';
      if (ex) { const xp = E.back(prog(lt, o.extraAt ?? B + 0.2, 0.35)); ex.style.opacity = lt < (o.extraUntil ?? 99) ? clamp(xp * 3) : 0; ex.style.transform = `scale(${0.6 + 0.4 * xp})`; }
    };
  };

  /* ── Tuzak seçenek: kafe menü panosu, üç boy kahve ── */
  SCENES.menuBoard = (t0, o = {}) => {
    const s = scene(t0, '#F3E3CC', undefined, o.wdur ?? 0.5);
    s.root.style.isolation = 'isolate';
    pattern(s.root, 'rgba(110,70,30,.08)');
    const amb = ambient(s.root, { cy: 930, glow: 'rgba(255,220,160,.6)' });
    const board = el('div', 'abs', s.root, { left: '60px', right: '60px', top: '600px', height: '640px', background: '#2F4A3C', border: '22px solid #8B5A2B', borderRadius: '26px', boxShadow: '0 30px 70px -20px rgba(40,20,10,.55), inset 0 0 0 6px #6E4420' });
    const ttl = el('div', 'abs it', board, { left: 0, right: 0, top: '22px', textAlign: 'center', color: '#F3EEE2', fontSize: '92px', letterSpacing: '.08em' }); ttl.textContent = 'KAHVE';
    const P = o.prices || [120, 170, 175], N = o.names || ['Küçük', 'Orta', 'Büyük'];
    const cols = [CUP_S, CUP_M, CUP_L].map((cup, i) => {
      const c = el('div', 'abs', board, { left: px(28 + i * 300), width: '280px', bottom: '34px', height: '470px', borderRadius: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' });
      c.innerHTML = `<div>${pix(cup, CUPS_C, 18)}</div><div style="font-size:48px;font-weight:800;color:#F3EEE2;margin-top:14px">${N[i]}</div><div class="it" style="font-size:96px;line-height:1;color:#FFD25A">${P[i]} TL</div>`;
      return c;
    });
    const xMark = el('div', 'abs it', board, { left: '328px', top: '140px', width: '280px', textAlign: 'center', fontSize: '300px', color: '#E8322A', display: 'none', lineHeight: 1 }); xMark.textContent = 'X';
    const gap = el('div', 'abs', board, { left: '160px', right: '160px', top: '120px', textAlign: 'center', display: 'none' });
    gap.innerHTML = `<div style="font-size:64px;font-weight:800;color:#F3EEE2">${o.gapLabel || 'Küçük → Büyük'}</div><div class="it" style="font-size:130px;color:#FF8A5B;line-height:1">+${P[2] - P[0]} TL</div><div style="height:10px;margin:10px 30px 0;background:#FF8A5B;border-radius:5px"></div>`;
    const trap = el('div', 'abs it', board, { left: '330px', top: '200px', width: '276px', textAlign: 'center', fontSize: '84px', color: '#fff', background: '#E8322A', borderRadius: '18px', padding: '4px 0', display: 'none', zIndex: 3 }); trap.textContent = 'TUZAK';
    const timer = el('div', 'abs it', s.root, { left: '820px', top: '520px', width: '170px', height: '170px', borderRadius: '50%', background: '#4351A3', color: '#fff', fontSize: '130px', display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: 4 });
    const f = new Mascot(s.root, { who: 'fistik', w: 576 });
    const b = o.bilge ? new Mascot(s.root, { who: 'bilge', w: 448, outfit: 'scholar' }) : null;
    const say = el('div', 'abs it', s.root, { left: '60px', top: '1560px', background: '#fff', border: '7px solid #2A1E1A', borderRadius: '34px', padding: '8px 40px 14px', fontSize: '104px', whiteSpace: 'nowrap', zIndex: 4, display: 'none', transformOrigin: '30% 100%', boxShadow: '0 10px 0 rgba(42,30,26,.25)' });
    say.textContent = o.say || '5 TL fark!';
    const sweat = pixEl(s.root, SWEAT, SWEAT_C, 18);
    const ev = (k) => o[k] ?? 99;
    s.update = (lt) => {
      amb(lt, [ev('pick'), ev('hide'), ev('trap')].reduce((a, t) => (lt >= t ? t : a), -9));
      board.style.transform = `rotate(${Math.sin(lt * 1.3) * 0.6}deg)`;
      const hid = lt >= ev('hide') && lt < ev('trap');
      cols.forEach((c, i) => {
        const pk = i === 2 && lt >= ev('pick');
        const pp = prog(lt, ev('pick'), 0.3);
        c.style.background = pk && !hid ? 'rgba(255,210,90,.18)' : 'transparent';
        c.style.boxShadow = pk && !hid ? '0 0 0 8px #FFD25A' : 'none';
        let tr = pk && lt < ev('hide') ? `scale(${1 + 0.1 * Math.sin(pp * Math.PI)})` : (lt < ev('pick') ? `translateY(${-Math.abs(Math.sin(lt * 5 + i * 1.1)) * 16}px)` : '');
        if (i === 1) {
          const hp = E.out(prog(lt, ev('hide'), 0.4)), rp = E.back(prog(lt, ev('trap'), 0.4));
          c.style.opacity = lt >= ev('trap') ? 1 : 1 - 0.5 * hp;
          tr += lt >= ev('trap') ? ` translateY(${(1 - rp) * -300}px)` : ` translateY(${hp * 40}px)`;
        }
        c.style.transform = tr;
      });
      xMark.style.display = hid && lt < ev('hide') + 0.6 ? 'block' : 'none';
      xMark.style.transform = `scale(${lerp(2, 1, E.out(prog(lt, ev('hide'), 0.2)))})`;
      gap.style.display = lt >= ev('gap') && lt < ev('trap') ? 'block' : 'none';
      gap.style.transform = `scale(${E.back(prog(lt, ev('gap'), 0.35))})`;
      const tp = prog(lt, ev('trap') + 0.25, 0.2);
      trap.style.display = tp > 0 ? 'block' : 'none';
      trap.style.transform = `scale(${lerp(2.4, 1, E.out(tp))}) rotate(${-8 + Math.sin(lt * 5) * 2}deg)`;
      if (o.countdown) {
        const [c0, st] = o.countdown, k = Math.floor((lt - c0) / st);
        timer.style.display = k >= 0 && k < 3 ? 'flex' : 'none'; timer.textContent = String(3 - k);
        timer.style.transform = `scale(${1 + 0.3 * Math.max(0, 1 - (((lt - c0) % st) / st) * 4)})`;
      }
      // Fıstık
      const S = (o.fistik || []).reduce((a, p) => (lt >= p[0] ? p : a), [0, 'idle']);
      const k = lt - S[0];
      let x = 760, y = o.floor ?? 1990, rot = 0, sx = 1, sy = 1;
      sweat.style.display = 'none';
      if (S[1] === 'idle') { f.set('curious', null, blink(lt)); rot = Math.sin(lt * 2) * 3; }
      else if (S[1] === 'think') { f.set('thoughtful', 'face', 'squeeze'); x += Math.sin(lt * 40) * 4; sweat.style.display = 'block'; const q = (lt % 0.7) / 0.7; sweat.style.transform = `translate(${x + 110}px,${y - 380 + q * 70}px)`; sweat.style.opacity = 1 - q * 0.6; }
      else if (S[1] === 'pick') { f.set('celebrate', Math.floor(lt / 0.25) % 2 ? 'up' : 'wave', 'happy'); const h = hop(lt, 0.4, 50); y -= h.y; sx = h.sx; sy = h.sy; }
      else if (S[1] === 'shock') { f.set('curious', 'face', 'wide'); const j = Math.exp(-k * 5); y -= 60 * j; rot = 10 * Math.sin(k * 18) * j; }
      else if (S[1] === 'dumb') { f.set('thoughtful', null, Math.floor(lt / 1.2) % 2 ? 'half' : 'mood'); rot = -10 + Math.sin(lt * 1.5) * 3; }
      f.put(x, y, { rot, sx, sy, flip: true });
      const sp = prog(lt, ev('pick') + 0.2, 0.3);
      say.style.display = sp > 0 && lt < ev('hide') ? 'block' : 'none';
      say.style.transform = `scale(${E.back(sp)}) rotate(${-4 + Math.sin(lt * 6) * 2}deg)`;
      if (b) {
        const bp = E.back(prog(lt, o.bilge[0], 0.4));
        b.root.style.display = lt >= o.bilge[0] ? 'block' : 'none';
        b.set('curious', Math.floor(lt / 0.5) % 2 ? 'wave' : null, blink(lt));
        b.put(270 - (1 - bp) * 500, (o.floor ?? 1990) - hop(lt, 0.8, 14).y, {});
      }
    };
  };

  /* ── İndirim yanılgısı: indirim etiketi, kibirli Pamuk, sonra cüzdan gerçeği ── */
  SCENES.saleTag = (t0, o = {}) => {
    const s = scene(t0, '#FBE3E8', undefined, o.wdur ?? 0.5);
    s.root.style.isolation = 'isolate';
    pattern(s.root, 'rgba(192,57,43,.07)');
    const ev = (k) => o[k] ?? 99;
    const amb = ambient(s.root, { cy: 960, glow: 'rgba(255,200,210,.6)' });
    const tag = el('div', 'abs', s.root, { left: '230px', width: '620px', top: '640px', height: '560px', borderRadius: '44px 44px 60px 60px', background: '#FFFDF8', border: '10px solid #2A1E1A', boxShadow: '0 30px 60px -20px rgba(40,20,10,.5)', textAlign: 'center', transformOrigin: '50% 0%' });
    el('div', 'abs', tag, { left: '285px', top: '22px', width: '50px', height: '50px', borderRadius: '50%', background: '#FBE3E8', border: '8px solid #2A1E1A' });
    const str = el('div', 'abs', s.root, { left: '538px', top: '520px', width: '6px', height: '130px', background: '#6e5f55', transformOrigin: '50% 0%' });
    tag.insertAdjacentHTML('beforeend', `<div style="margin-top:96px">${pix(COAT, COAT_C, 14)}</div><div style="font-size:44px;font-weight:800;color:#8a7d72;letter-spacing:.06em">MONT</div><div class="old it" style="font-size:110px;line-height:1;position:relative;display:inline-block">2.000 TL<span class="sl" style="position:absolute;left:-10px;right:-10px;top:50%;height:12px;background:#C0392B;border-radius:6px;transform-origin:0 50%"></span></div><div class="nw it" style="font-size:150px;line-height:1;color:#2F8F5A">1.000 TL</div>`);
    const sl = tag.querySelector('.sl'), old = tag.querySelector('.old'), nw = tag.querySelector('.nw');
    const badge = el('div', 'abs it', s.root, { left: '700px', top: '560px', width: '220px', height: '220px', borderRadius: '50%', background: '#E8322A', color: '#fff', fontSize: '110px', display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: 3, boxShadow: '0 10px 0 #7A1410' }); badge.textContent = '%50';
    const wal = el('div', 'abs', s.root, { left: 0, right: 0, top: '600px', textAlign: 'center', display: 'none' });
    wal.innerHTML = `<div class="w" style="margin-top:60px">${pix(WALLET_O, WALLET_COL, 26)}</div><div style="font-size:52px;font-weight:800;color:#6e5f55;margin-top:10px">CÜZDAN</div><div class="wv it" style="font-size:180px;line-height:1;position:relative;display:inline-block"><span class="wt">?</span></div><div class="kp" style="display:none;margin-top:18px"><span style="font-size:54px;font-weight:800;color:#6e5f55">almasaydın: </span><span class="it" style="font-size:150px;color:#2F8F5A;line-height:1">+1.000 TL</span></div>`;
    const wv = wal.querySelector('.wv'), ww = wal.querySelector('.w'), kp = wal.querySelector('.kp'), wt = wal.querySelector('.wt');
    const ks = el('span', 'abs', wv, { left: '-10px', right: '-10px', top: '45%', height: '16px', background: '#2A1E1A', borderRadius: '8px', transformOrigin: '0 50%', display: 'none' });
    const coins = Array.from({ length: 8 }, () => pixEl(s.root, TLCOIN, TLCOIN_C, 16));
    const think = el('div', 'abs', s.root, { left: o.thinkX ?? '20px', top: o.thinkY ?? '1330px', background: '#fff', border: '7px solid #2A1E1A', borderRadius: '40px', padding: '10px 34px 16px', zIndex: 4, display: 'none', transformOrigin: '80% 100%' });
    think.innerHTML = `<span style="font-size:${o.thinkS ?? 48}px;font-weight:800;color:#6e5f55">Pamuk sanıyor ki:</span><br><span class="it" style="font-size:${(o.thinkS ?? 48) * 2.17}px;color:#2F8F5A">+1.000 TL</span><br><span style="font-size:${(o.thinkS ?? 48) * 1.2}px;font-weight:800">kazandım!</span>`;
    const timer = el('div', 'abs it', s.root, { left: '820px', top: '540px', width: '170px', height: '170px', borderRadius: '50%', background: '#4351A3', color: '#fff', fontSize: '130px', display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: 4 });
    const m = new Mascot(s.root, { who: 'pamuk', w: 576, outfit: 'winter' });
    s.update = (lt) => {
      amb(lt, [ev('sale'), ev('reveal')].reduce((a, t) => (lt >= t ? t : a), -9));
      const W = lt >= ev('wallet');
      const out = E.inOut(prog(lt, ev('wallet') - 0.2, 0.3));
      const swing = Math.sin(lt * 2.4) * 5;
      tag.style.display = str.style.display = out < 1 ? 'block' : 'none';
      tag.style.transform = `rotate(${swing}deg) translateY(${-out * 1300}px)`;
      str.style.transform = `rotate(${swing}deg) translateY(${-out * 1300}px)`;
      sl.style.transform = `scaleX(${E.out(prog(lt, ev('sale'), 0.25))}) rotate(-4deg)`;
      old.style.color = lt >= ev('sale') ? '#9a8f86' : 'var(--ink)';
      old.style.fontSize = lt >= ev('sale') ? '80px' : '110px';
      const np = prog(lt, ev('sale') + 0.2, 0.3);
      nw.style.display = np > 0 ? 'block' : 'none';
      nw.style.transform = `scale(${E.back(np)})`;
      const bp = prog(lt, ev('sale'), 0.25);
      badge.style.display = bp > 0 && !W ? 'flex' : 'none';
      badge.style.transform = `scale(${lerp(2.4, 1, E.out(bp))}) rotate(${12 + Math.sin(lt * 4) * 4}deg)`;
      const tp = prog(lt, ev('brag'), 0.3);
      think.style.display = tp > 0 && lt < ev('wallet') - 0.2 ? 'block' : 'none';
      think.style.transform = `scale(${E.back(tp)}) rotate(${-3 + Math.sin(lt * 5) * 2}deg)`;
      // cüzdan
      const wp = E.back(prog(lt, ev('wallet') - 0.1, 0.4));
      wal.style.display = lt >= ev('wallet') - 0.1 ? 'block' : 'none';
      wal.style.transform = `scale(${wp})`;
      const R = lt >= ev('reveal');
      if (R) { wt.textContent = '-1.000 TL'; wv.style.color = '#C0392B'; }
      else { wt.textContent = '?'; wv.style.color = 'var(--ink)'; }
      wv.style.transform = R ? `scale(${lerp(2.2, 1, E.out(prog(lt, ev('reveal'), 0.25)))})` : 'none';
      const K = lt >= ev('keep');
      ks.style.display = K ? 'block' : 'none';
      ks.style.transform = `scaleX(${E.out(prog(lt, ev('keep'), 0.25))}) rotate(-4deg)`;
      if (K) wv.style.opacity = 0.45; else wv.style.opacity = 1;
      const kpp = prog(lt, ev('keep') + 0.25, 0.3);
      kp.style.display = kpp > 0 ? 'block' : 'none';
      kp.style.transform = `scale(${E.back(kpp)})`;
      ww.style.transform = R ? `translate(${shake(lt, ev('reveal'), 26, 0.5)}px,0)` : `rotate(${Math.sin(lt * 3) * 3}deg)`;
      coins.forEach((c, i) => {
        const p = (lt - ev('reveal')) / 1.2 - i * 0.06;
        c.style.display = R && p > 0 && p < 1 ? 'block' : 'none';
        c.style.transform = `translate(${520 + Math.sin(i * 2.1) * 380 * p}px,${780 - p * 300 + p * p * 900}px) rotate(${p * 400}deg)`;
      });
      if (o.countdown) {
        const [c0, st] = o.countdown, k = Math.floor((lt - c0) / st);
        timer.style.display = k >= 0 && k < 3 ? 'flex' : 'none'; timer.textContent = String(3 - k);
        timer.style.transform = `scale(${1 + 0.3 * Math.max(0, 1 - (((lt - c0) % st) / st) * 4)})`;
      }
      // Pamuk: kibirli dans → düşünür → şok
      let x = 540, y = o.floor ?? 1990, rot = 0, sx = 1, sy = 1;
      if (!W && lt >= ev('brag') && o.bragX) x = o.bragX;
      if (!W) { m.set('celebrate', Math.floor(lt / 0.3) % 2 ? 'up' : 'wave2', lt >= ev('brag') ? 'happy' : 'squeeze'); const h = hop(lt, 0.55, 36); y -= h.y; sx = h.sx; sy = h.sy; rot = Math.sin(lt * 5) * 6; }
      else if (!R) { m.set('thoughtful', 'face', 'squeeze'); x += Math.sin(lt * 40) * 4; }
      else { const k = lt - ev('reveal'); m.set('curious', 'face', 'x'); const j = Math.exp(-k * 4); y -= 70 * j; rot = 12 * Math.sin(k * 16) * j; }
      m.put(x, y, { rot, sx, sy });
    };
  };

  /* ── Batık maliyet: sinema salonu. Düşünce balonunda KAL/ÇIK, bilet Diken'in elinde, zaman atlama,
        KALSA/ÇIKSA karşılaştırması, bilet perdedeki suya batar, sonra Diken bu filmden çıkar ── */
  SCENES.cinema = (t0, o = {}) => {
    const s = scene(t0, '#1F1A2E', undefined, o.wdur ?? 0.5);
    s.root.style.isolation = 'isolate';
    pattern(s.root, 'rgba(255,255,255,.035)');
    const ev = (k) => o[k] ?? 99;
    const PRICE = o.price || 300, FLOOR = o.floor ?? 1700;
    const amb = ambient(s.root, { cy: 700, ray: 'rgba(170,180,255,.10)', glow: 'rgba(110,120,255,.30)', float: [KERNEL, KERNEL_C] });
    // koridor ışıkları (alt bant, arayüzün altında kalsa da boş durmasın)
    for (let i = 0; i < 6; i++) pixEl(s.root, ['oo', 'oo'], { o: '#F2B63C' }, 8, { left: px(90 + i * 180), top: '1800px', opacity: 0.55 });
    // perde (iç alan 912×452, sahnede 84..996 × 469..921)
    const scr = el('div', 'abs', s.root, { left: '70px', width: '940px', top: '455px', height: '480px', boxSizing: 'border-box', background: '#0B0814', border: '14px solid #0B0814', borderRadius: '14px', boxShadow: '0 0 90px 14px rgba(140,150,255,.32)', overflow: 'hidden' });
    const film = el('div', 'abs', scr, { inset: 0, background: 'linear-gradient(#AEB9C6, #919DAB 70%, #6F7D62 70%)' });
    const clouds = [0, 1, 2].map(() => pixEl(film, CLOUD, CLOUD_C, 10));
    const snail = pixEl(film, SNAIL, SNAIL_C, 11, { top: px(452 * 0.7 - 9 * 11 + 8) });
    const ff = pixEl(film, FFWD, { o: '#fff' }, 12, { right: '30px', top: '22px', display: 'none' });
    const clk = el('div', 'abs', film, { left: '378px', top: '148px', width: '156px', height: '156px', display: 'none' });
    clk.innerHTML = pix(CLOCKF, { o: '#2A1E1A', W: '#FFF6EA' }, 12);
    const hands = [[10, 44], [8, 62]].map(([w, h]) => el('div', 'abs', clk, { left: px(78 - w / 2), top: px(78 - h), width: px(w), height: px(h), background: '#2A1E1A', transformOrigin: '50% 100%' }));
    const fin = el('div', 'abs it', scr, { inset: 0, background: '#0B0814', color: '#F3EEE2', fontSize: '210px', display: 'none', alignItems: 'center', justifyContent: 'center', letterSpacing: '.1em' }); fin.textContent = 'SON';
    // karşılaştırma
    const cmp = el('div', 'abs', scr, { inset: 0, background: '#141021', display: 'none' });
    const strike = (txt) => `<span style="position:relative;display:inline-block">${txt}<span class="sl" style="position:absolute;left:-10px;right:-10px;top:46%;height:12px;background:#F3EEE2;border-radius:6px;transform-origin:0 50%;transform:scaleX(0)"></span></span>`;
    cmp.innerHTML = `<div class="abs" style="left:453px;top:18px;bottom:18px;width:6px;background:#3B3355"></div>`
      + ['KALSA', 'ÇIKSA'].map((h, i) => `<div class="abs it hd" style="left:${i * 456}px;width:456px;top:14px;text-align:center;font-size:80px;color:${i ? '#FF8A5B' : '#8E9BEA'}">${h}</div>`).join('')
      + [0, 1].map((i) => `<div class="abs it r1" style="left:${i * 456}px;width:456px;top:108px;text-align:center;font-size:96px;color:#FF6B6B">${strike(`-${fmt(PRICE)} TL`)}</div>`).join('')
      + `<div class="abs it same" style="left:456px;top:96px;background:#F2B63C;color:#2A1E1A;font-size:60px;padding:4px 22px;border-radius:14px;border:6px solid #2A1E1A;display:none;z-index:2">AYNI</div>`
      + `<div class="abs it r2" style="left:0;width:456px;top:236px;text-align:center;font-size:112px;color:#FF6B6B;display:none">-2 saat</div>`
      + `<div class="abs r3" style="left:456px;width:456px;top:236px;text-align:center;display:none"><div class="it" style="font-size:112px;line-height:1;color:#5FD38D">+2 saat</div><div style="font-size:40px;font-weight:800;color:#BFE8CF;margin-top:14px">kahve · ödev · uyku</div></div>`;
    const hds = [...cmp.querySelectorAll('.hd')], r1 = [...cmp.querySelectorAll('.r1')], sls = [...cmp.querySelectorAll('.sl')];
    const same = cmp.querySelector('.same'), r2 = cmp.querySelector('.r2'), r3 = cmp.querySelector('.r3');
    // su (perde içi, bilet altında kalır)
    const water = el('div', 'abs', s.root, { left: '84px', width: '912px', top: '921px', height: '0px', background: 'rgba(46,111,163,.72)', zIndex: 7, display: 'none' });
    const crest = el('div', 'abs', water, { left: 0, right: 0, top: '-14px', height: '14px', backgroundImage: 'linear-gradient(90deg,#7FC6EE 50%,rgba(127,198,238,0) 50%)', backgroundSize: '56px 14px' });
    const bubs = Array.from({ length: 7 }, () => pixEl(s.root, BUBL, { o: '#CDEBFB' }, 12, { zIndex: 8, display: 'none' }));
    // ÇIKIŞ tabelası ve seyirciler
    const exit = el('div', 'abs', s.root, { left: '866px', top: '950px', width: '190px', height: '74px', boxSizing: 'border-box', background: '#17A34A', border: '6px solid #0B5E2A', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' });
    exit.innerHTML = `<span class="it" style="font-size:46px;color:#fff;line-height:1">ÇIKIŞ</span>${pix(ARROWP, { o: '#fff' }, 7)}`;
    const HX = [110, 260, 540, 690];
    const heads = HX.map((x) => ({ x, e: pixEl(s.root, HEAD, { o: '#140F22', r: '#5A4E7A' }, 12, { left: px(x), top: '826px', zIndex: 2 }) }));
    const headT = (i) => (i === 1 && o.leave1 != null ? o.leave1 : ev('sleep') + 0.2 + [0, 0, 0.35, 0.7][i]);
    // koltuk, Diken, mısır
    pixEl(s.root, SEAT, SEAT_C, 34, { left: '268px', top: px(FLOOR - 14 * 34) });
    const d = new Mascot(s.root, { who: 'diken', w: 576 });
    const corn = pixEl(s.root, POPCORN, POPCORN_C, 16, { left: '790px', top: px(FLOOR - 370), zIndex: 3 });
    const kern = Array.from({ length: 8 }, () => pixEl(s.root, KERNEL, KERNEL_C, 9, { display: 'none' }));
    const zs = [60, 76, 92].map((f) => { const z = el('div', 'abs it', s.root, { fontSize: px(f), color: '#DEE2F6', display: 'none', textShadow: '4px 4px 0 #0B0814' }); z.textContent = 'Z'; return z; });
    // düşünce balonu (KAL / ÇIK) ve konuşma balonu
    const chip = (t, c) => `<div class="it ch" style="position:relative;width:236px;height:84px;margin:0 auto 12px;border-radius:22px;border:6px solid #2A1E1A;box-sizing:border-box;display:flex;align-items:center;justify-content:center;font-size:70px;line-height:1;color:${c};background:#fff">${t}<span class="ck" style="display:none;position:absolute;right:-26px;top:-26px">${pix(CHECK, { o: '#2F8F5A' }, 9)}</span></div>`;
    const think = el('div', 'abs', s.root, { left: '24px', top: '1176px', width: '300px', padding: '22px 0 10px', boxSizing: 'border-box', background: '#fff', border: '7px solid #2A1E1A', borderRadius: '44px', zIndex: 6, transformOrigin: '90% 100%', boxShadow: '0 10px 0 rgba(0,0,0,.35)' });
    think.innerHTML = chip('KAL', '#4351A3') + chip('ÇIK', '#E8322A');
    const dots = [[322, 1420, 30], [352, 1458, 18]].map(([x, y, r]) => el('div', 'abs', s.root, { left: px(x), top: px(y), width: px(r), height: px(r), borderRadius: '50%', background: '#fff', border: '5px solid #2A1E1A', zIndex: 6 }));
    const chips = [...think.querySelectorAll('.ch')], cks = [...think.querySelectorAll('.ck')];
    const say = el('div', 'abs it', s.root, { left: '24px', top: '1190px', background: '#fff', border: '7px solid #2A1E1A', borderRadius: '34px', padding: '10px 34px 16px', fontSize: '84px', lineHeight: '.95', zIndex: 6, display: 'none', transformOrigin: '80% 100%', boxShadow: '0 10px 0 rgba(0,0,0,.35)' });
    say.innerHTML = o.say || 'Paraya<br>yazık!';
    // bilet
    const tk = el('div', 'abs', s.root, { left: '24px', top: '486px', width: '300px', height: '160px', boxSizing: 'border-box', background: '#F2B63C', border: '8px solid #2A1E1A', borderRadius: '18px', textAlign: 'center', zIndex: 9, boxShadow: '0 12px 0 rgba(0,0,0,.35)',
      WebkitMaskImage: 'radial-gradient(circle at 0 50%, transparent 22px, #000 23px), radial-gradient(circle at 100% 50%, transparent 22px, #000 23px)', WebkitMaskSize: '51% 100%', WebkitMaskPosition: 'left, right', WebkitMaskRepeat: 'no-repeat' });
    tk.innerHTML = `<div style="font-size:34px;font-weight:800;color:#6B4A1A;margin-top:12px;letter-spacing:.1em">ÖĞRENCİ</div><div class="it" style="font-size:94px;line-height:1;color:#2A1E1A">${fmt(PRICE)} TL</div>`;

    s.update = (lt) => {
      amb(lt, [ev('pick'), ev('cmp2'), ev('sink'), ev('choose2')].reduce((a, t) => (lt >= t ? t : a), -9));
      const SL = ev('sleep'), END = ev('end'), CMP = ev('cmp'), SK = ev('sink'), RU = ev('rule'), LV = ev('leave');
      // film, zaman atlama
      const tl = lt >= SL ? E.inOut(prog(lt, SL, Math.max(0.1, END - SL - 0.15))) : 0;
      const FFon = lt >= SL && lt < END;
      snail.style.left = px(lt >= RU ? 760 - (lt - RU) * 10 : lerp(760 - Math.min(lt, SL) * 8, 20, tl));
      snail.style.transform = `scaleY(${1 + 0.04 * Math.sin(lt * 3)})`;
      clouds.forEach((c, i) => { c.style.left = px(((i * 330 + 60 + lt * 8 + tl * 900) % 1060) - 140); c.style.top = px(36 + i * 52); });
      ff.style.display = FFon && Math.floor(lt / 0.25) % 2 === 0 ? 'block' : 'none';
      clk.style.display = FFon ? 'block' : 'none';
      clk.style.transform = `scale(${E.back(prog(lt, SL, 0.3))})`;
      hands[0].style.transform = `rotate(${300 + tl * 60}deg)`; hands[1].style.transform = `rotate(${tl * 720}deg)`;
      film.style.filter = FFon ? 'contrast(1.15) brightness(1.08)' : 'none';
      const filmOn = lt < END || lt >= RU + 0.2;
      film.style.display = filmOn ? 'block' : 'none';
      film.style.opacity = lt >= RU ? E.out(prog(lt, RU + 0.2, 0.3)) : 1;
      fin.style.display = lt >= END && lt < CMP ? 'flex' : 'none';
      fin.style.transform = `scale(${lerp(1.6, 1, E.out(prog(lt, END, 0.2)))})`;
      // karşılaştırma
      const C = lt >= CMP && lt < SK + 0.3;
      cmp.style.display = C ? 'block' : 'none';
      if (C) {
        hds.forEach((h, i) => (h.style.transform = `scale(${E.back(prog(lt, CMP + i * 0.1, 0.3))})`));
        r1.forEach((r, i) => { const p = prog(lt, ev('cmp1') + i * 0.12, 0.3); r.style.opacity = p > 0 ? (lt > ev('same') + 0.25 ? 0.45 : 1) : 0; r.style.transform = `scale(${E.back(p)})`; });
        sls.forEach((l) => (l.style.transform = `scaleX(${E.out(prog(lt, ev('same'), 0.25))}) rotate(-4deg)`));
        const ap = prog(lt, ev('same') + 0.15, 0.25);
        same.style.display = ap > 0 ? 'block' : 'none';
        same.style.transform = `translateX(-50%) scale(${lerp(2.2, 1, E.out(ap))}) rotate(-8deg)`;
        const p2 = prog(lt, ev('cmp2'), 0.3), p3 = prog(lt, ev('cmp3'), 0.35);
        r2.style.display = p2 > 0 ? 'block' : 'none';
        r2.style.transform = `scale(${lerp(2.4, 1, E.out(p2))}) rotate(${Math.sin(lt * 6) * 2}deg)`;
        r3.style.display = p3 > 0 ? 'block' : 'none';
        r3.style.transform = `scale(${E.back(p3)})`;
        cmp.style.opacity = lt >= SK ? 1 - prog(lt, SK, 0.25) : 1;
      }
      scr.style.transform = `translate(${shake(lt, ev('cmp2'), 16, 0.35)}px,${shake(lt + 0.05, ev('same') + 0.15, 8, 0.25)}px)`;
      // su: tablo kaybolduktan sonra yükselir, kuralda çekilir
      const wh = (E.out(prog(lt, SK + 0.2, 0.4)) - E.inOut(prog(lt, RU, 0.4))) * 300;
      water.style.display = lt >= SK + 0.2 && lt < RU + 0.45 ? 'block' : 'none';
      water.style.top = px(921 - wh); water.style.height = px(Math.max(0, wh));
      crest.style.backgroundPosition = `${lt * 70}px 0`;
      // bilet: başta köşede, KAL'da Diken'in eline geçer, batışta suya düşer
      let tx = o.tkX ?? 24, ty = o.tkY ?? 486, tsc = 1 + 0.22 * Math.sin(prog(lt, ev('ticket'), 0.3) * Math.PI), trot = -10 + Math.sin(lt * 2.2) * 3;
      const hold = E.inOut(prog(lt, ev('pick') + 0.15, 0.35));
      if (hold > 0) { tx = lerp(24, 180, hold); ty = lerp(486, 1400, hold); tsc = lerp(tsc, 0.6, hold); trot = lerp(trot, 8 + Math.sin(lt * 7) * 2, hold); }
      const S2 = lt >= SK;
      if (S2) {
        const f1 = E.inOut(prog(lt, SK + 0.1, 0.45)), f2 = prog(lt, SK + 0.55, 1.3);
        tx = lerp(180, 390, f1); ty = lerp(1400, 470, f1) + (1 - (1 - f2) ** 2) * 300;
        tsc = lerp(0.6, 1, f1); trot = lerp(8, -6, f1) + Math.sin(f2 * 9) * 10 * (1 - f2);
      }
      tk.style.display = lt < RU ? 'block' : 'none';
      tk.style.left = px(tx); tk.style.top = px(ty);
      tk.style.transform = `rotate(${trot}deg) scale(${tsc})`;
      tk.style.filter = S2 && ty + 80 > 921 - wh ? 'brightness(.85) saturate(.8)' : 'none';
      bubs.forEach((b, i) => {
        const p = (lt - SK - 0.75 - i * 0.16) / 1.1;
        b.style.display = S2 && lt < RU && p > 0 && p < 1 ? 'block' : 'none';
        b.style.transform = `translate(${tx + 60 + (i % 3) * 80 + Math.sin(p * 9 + i) * 14}px,${ty + 30 - p * 230}px)`;
      });
      // seyirciler ÇIKIŞ'a yürür
      let glow = 0;
      heads.forEach((h, i) => {
        const p = prog(lt, headT(i), 1.0);
        h.e.style.transform = `translate(${(890 - h.x) * E.inOut(p)}px,${-Math.abs(Math.sin(p * Math.PI * 4)) * 12 * (p > 0 && p < 1 ? 1 : 0)}px)`;
        h.e.style.opacity = p < 0.85 ? 1 : Math.max(0, 1 - (p - 0.85) / 0.15);
        if (p > 0.8 && p < 1) glow = 1;
      });
      if (lt >= LV + 0.5 && lt < LV + 1.1) glow = 1;
      exit.style.boxShadow = `0 0 ${30 + glow * 40}px ${6 + glow * 10}px rgba(40,220,120,${0.45 + glow * 0.35})`;
      exit.style.transform = `scale(${1 + 0.06 * glow * Math.abs(Math.sin(lt * 14))})`;
      // Diken
      const D = (o.diken || []).reduce((a, p) => (lt >= p[0] ? p : a), [0, 'bored']);
      const k = lt - D[0];
      let x = 540, y = FLOOR, rot = 0, sx = 1, sy = 1;
      zs.forEach((z) => (z.style.display = 'none'));
      if (D[1] === 'bored') {
        const yp = o.yawn != null ? prog(lt, o.yawn, 0.8) : 0, yw = yp > 0 && yp < 1;
        d.set('calm', yw ? 'up' : null, yw ? 'closed' : Math.floor(lt / 1.5) % 3 === 2 ? 'closed' : 'half');
        rot = yw ? 0 : Math.sin(lt * 1.3) * 4; sy = 1 + (yw ? 0.07 * Math.sin(yp * Math.PI) : 0.02 * Math.sin(lt * 2));
      }
      else if (D[1] === 'clutch') { d.set('curious', 'face', 'squeeze'); y -= 46 * Math.exp(-k * 4) * Math.abs(Math.sin(k * 11)); rot = -4 + Math.sin(lt * 9) * 2; }
      else if (D[1] === 'sleep') {
        d.set('calm', null, 'closed'); rot = -14 + Math.sin(lt * 2) * 2; sy = 1 + 0.03 * Math.sin(lt * 3.2);
        zs.forEach((z, i) => { const p = (lt * 0.7 + i / 3) % 1; z.style.display = 'block'; z.style.transform = `translate(${700 + i * 44 + p * 60}px,${1300 - p * 120 - i * 16}px) rotate(${-12 + p * 20}deg)`; z.style.opacity = Math.sin(p * Math.PI); });
      }
      else if (D[1] === 'shock') { d.set('curious', 'face', 'wide'); const j = E.back(prog(k, 0, 0.25)); y -= j * 80 - (k > 0.25 ? 80 * E.out(prog(k, 0.25, 0.3)) : 0); }
      else if (D[1] === 'hit') { d.set('curious', 'up', 'x'); const j = Math.exp(-k * 5); rot = 14 * Math.sin(k * 18) * j; y -= 40 * j; sx = 1 + 0.1 * j; }
      else if (D[1] === 'watch') { d.set('curious', null, 'wide'); rot = Math.sin(lt * 2) * 3; }
      else if (D[1] === 'think') { d.set('thoughtful', 'face', 'mood'); rot = -6 + Math.sin(lt * 1.6) * 3; }
      if (lt >= LV) { d.set('celebrate', 'up', 'happy'); const p = E.inOut(prog(lt, LV, 0.9)); x += p * 780; const h = hop(lt, 0.3, 50); y -= h.y; sx = h.sx; sy = h.sy; rot = 0; }
      d.put(x, y, { rot, sx, sy });
      // mısır: uyuyunca kafasına devrilir, çıkarken fırlar
      const rr = (rot * Math.PI) / 180, hh = FLOOR - 1238;
      const headX = x + Math.sin(rr) * hh - 80, headY = y - Math.cos(rr) * hh - 88;
      const fp = E.inOut(prog(lt, SL + 0.6, 0.35));
      let cx = 790, cy = FLOOR - 370, crot = 0, cop = 1;
      if (fp > 0) { cx = lerp(790, headX, fp); cy = lerp(FLOOR - 370, headY, fp) - Math.sin(fp * Math.PI) * 220; crot = lerp(0, 180 + rot, fp); }
      const off = prog(lt, LV - 0.35, 0.5);
      if (off > 0) { cx = headX - off * 360; cy = headY - Math.sin(off * Math.PI) * 300 + off * 200; crot = 180 + off * 400; cop = 1 - off; }
      corn.style.left = px(cx); corn.style.top = px(cy); corn.style.opacity = cop;
      corn.style.transform = `rotate(${crot}deg)`;
      kern.forEach((e, i) => {
        const q = lt - (SL + 0.7 + i * 0.05);
        e.style.display = q > 0 && lt < LV + 1 ? 'block' : 'none';
        const kx = 700 + i * 26 + q * (40 + i * 16) * (i % 2 ? 1 : -1), ky = Math.min(FLOOR - 20, 1340 + q * 80 + 0.5 * 2600 * q * q);
        e.style.transform = `translate(${kx}px,${ky}px) rotate(${q * 500 + i * 40}deg)`;
      });
      // düşünce balonu: başta KAL/ÇIK, KAL'da tik; kuralda yeniden açılır, ÇIK seçilir
      const T1 = lt < ev('pick') + 0.55, T2 = lt >= RU + 0.9 && lt < LV + 0.2;
      think.style.display = T1 || T2 ? 'block' : 'none';
      dots.forEach((e) => (e.style.display = think.style.display));
      const tp = T2 ? E.back(prog(lt, RU + 0.9, 0.3)) : 1 - E.out(prog(lt, ev('pick') + 0.4, 0.15));
      think.style.transform = `scale(${tp}) rotate(${Math.sin(lt * 2) * 1.5}deg) translateY(${Math.sin(lt * 2.4) * 4}px)`;
      const kal = lt >= ev('pick') && lt < RU, cik = lt >= ev('choose2');
      chips[0].style.background = kal ? '#DEE2F6' : '#fff'; chips[0].style.transform = `scale(${kal ? 1 + 0.12 * Math.exp(-(lt - ev('pick')) * 6) : 1})`;
      chips[1].style.background = cik ? '#D7F2E1' : '#fff'; chips[1].style.transform = `scale(${cik ? 1 + 0.12 * Math.exp(-(lt - ev('choose2')) * 6) : 1})`;
      chips[0].style.opacity = cik ? 0.4 : 1; chips[1].style.opacity = kal ? 0.4 : 1;
      cks[0].style.display = kal ? 'block' : 'none'; cks[1].style.display = cik ? 'block' : 'none';
      const sp = prog(lt, o.sayAt ?? ev('pick') + 0.5, 0.3);
      say.style.display = sp > 0 && lt < SL - 0.05 ? 'block' : 'none';
      say.style.transform = `scale(${E.back(sp)}) rotate(${-4 + Math.sin(lt * 6) * 2}deg)`;
    };
  };


  /* ── Ödeme acısı: NAKİT | KART bölünmüş ekran, iki acı-metre, Ceviz ikizleri ── */
  SCENES.payPain = (t0, o = {}) => {
    const s = scene(t0, '#F3E9DC', undefined, o.wdur ?? 0.5);
    s.root.style.isolation = 'isolate';
    pattern(s.root, 'rgba(110,70,30,.06)');
    const ev = (k) => o[k] ?? 99;
    const amb = ambient(s.root, { cy: 900, glow: 'rgba(255,230,190,.5)' });
    const L = 277, R = 802, FL = o.floor ?? 1470;
    [[30, '#FBEBD6', 'NAKİT', '#B5501E'], [555, '#DDF1EA', 'KART', '#2F6B9A']].forEach(([x, bg, t, c]) => {
      el('div', 'abs', s.root, { left: px(x), top: '550px', width: '495px', height: '950px', background: bg, borderRadius: '40px', border: '6px solid rgba(42,30,26,.10)', boxSizing: 'border-box' });
      const l = el('div', 'abs it', s.root, { left: px(x), width: '495px', top: '578px', textAlign: 'center', fontSize: '64px', color: c }); l.textContent = t;
    });
    const vs = el('div', 'abs it', s.root, { left: '490px', top: '566px', width: '100px', height: '100px', borderRadius: '50%', background: '#2A1E1A', color: '#FFD25A', fontSize: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3 }); vs.textContent = 'VS';
    const GR = gaugeRows();
    const gauge = (cx) => {
      const g = el('div', 'abs', s.root, { left: px(cx - 152), top: '670px', width: '304px', height: '210px' });
      g.innerHTML = pix(GR, { o: '#2A1E1A', G: '#5FD38D', Y: '#F2C14E', R: '#E8322A' }, 16);
      const nd = el('div', 'abs', g, { left: '147px', top: '28px', width: '10px', height: '124px', background: '#2A1E1A', transformOrigin: '50% 100%' });
      el('div', 'abs', g, { left: '138px', top: '138px', width: '28px', height: '28px', background: '#2A1E1A' });
      const lb = el('div', 'abs it', g, { left: 0, right: 0, top: '164px', textAlign: 'center', fontSize: '46px', color: '#4a3b33' }); lb.textContent = 'ACI';
      const q = el('div', 'abs it', g, { left: '128px', top: '26px', fontSize: '80px', color: '#4351A3' }); q.textContent = '?';
      return { g, nd, q, lb };
    };
    const gl = gauge(L), gr = gauge(R);
    const price = [L, R].map((cx) => { const p = el('div', 'abs it', s.root, { left: px(cx - 200), width: '400px', top: '888px', textAlign: 'center', fontSize: '84px', color: '#2A1E1A' }); p.textContent = '450 TL'; return p; });
    const cl = new Mascot(s.root, { who: 'ceviz', w: 380 }), cr = new Mascot(s.root, { who: 'ceviz', w: 380 });
    // nakit: 200 + 200 + 50
    const bills = [[0, '200'], [0, '200'], [2, '50']].map(([ci, v]) => {
      const b = el('div', 'abs', s.root, { width: '154px', height: '70px', zIndex: 4 });
      b.innerHTML = pix(NOTE, NOTE_CS[ci], 14) + `<span class="it" style="position:absolute;left:18px;top:14px;font-size:38px;color:#2A1E1A">${v}</span>`;
      return b;
    });
    const ahs = [0, 1, 2].map(() => { const a = el('div', 'abs it', s.root, { fontSize: '72px', color: '#E8322A', display: 'none', zIndex: 5, textShadow: '4px 4px 0 #fff' }); a.textContent = 'AH!'; return a; });
    const sweat = pixEl(s.root, SWEAT, SWEAT_C, 16, { display: 'none', zIndex: 5 });
    // kart
    const card = pixEl(s.root, CARDP, CARDP_C, 12, { zIndex: 4 });
    const pos = pixEl(s.root, POSP, POSP_C, 13, { left: '920px', top: '990px', zIndex: 3 });
    const waves = pixEl(s.root, WAVESP, { o: '#2F8F5A' }, 10, { left: '950px', top: '915px', display: 'none', zIndex: 4 });
    const bip = el('div', 'abs it', s.root, { left: '628px', top: '972px', fontSize: '88px', color: '#2F8F5A', display: 'none', zIndex: 5, textShadow: '5px 5px 0 #fff, -3px -3px 0 #fff' }); bip.textContent = 'BİP';
    // sepet, atıştırmalıklar
    const basket = pixEl(s.root, BASKETP, BASKETP_C, 14, { left: '590px', top: '950px', zIndex: 5, display: 'none' });
    const extras = [[CHOCP, CHOCP_C, '+45'], [CHIPSP, CHIPSP_C, '+55'], [CANP, CANP_C, '+60']].map(([r, c, t]) => {
      const e = pixEl(s.root, r, c, 11, { zIndex: 4, display: 'none' });
      const g = el('div', 'abs it', s.root, { left: '912px', top: '892px', fontSize: '60px', color: '#C0392B', display: 'none', zIndex: 6, textShadow: '3px 3px 0 #fff' }); g.textContent = t;
      return { e, g };
    });
    // ekstre
    const ek = el('div', 'abs', s.root, { left: '585px', top: '880px', width: '440px', height: '205px', boxSizing: 'border-box', background: '#FFFDF8', border: '6px solid #2A1E1A', borderRadius: '10px', textAlign: 'center', zIndex: 6, display: 'none', boxShadow: '0 18px 0 rgba(0,0,0,.18)' });
    ek.innerHTML = `<div style="font-size:36px;font-weight:800;letter-spacing:.08em;color:#6e5f55;margin-top:18px">EKSTRE · EKİM</div><div style="height:6px;margin:12px 40px 14px;background:repeating-linear-gradient(90deg,#2A1E1A 0 14px,transparent 14px 24px)"></div><div class="ekv" style="white-space:nowrap"><span class="it" style="font-size:100px;line-height:1;color:#C0392B">4.300 TL</span><span class="it" style="font-size:64px;color:#C0392B;margin-left:10px">?!</span></div>`;
    const ekv = ek.querySelector('.ekv');
    // defter
    const nb = el('div', 'abs', s.root, { left: '600px', top: '882px', width: '400px', height: '196px', boxSizing: 'border-box', background: 'repeating-linear-gradient(#FFFDF4 0 46px, #BFD3EA 46px 49px)', border: '6px solid #2A1E1A', borderRadius: '14px', zIndex: 6, display: 'none', padding: '44px 34px' });
    el('div', 'abs', nb, { left: '18px', top: '6px', fontSize: '26px', fontWeight: 800, letterSpacing: '.12em', color: '#AE4716' }).textContent = 'CEP DEFTERİ';
    const nbt = el('div', 'it', nb, { fontSize: '88px', color: '#C0392B', lineHeight: '1', whiteSpace: 'nowrap' });
    const tick = pixEl(s.root, CHECK, CHECK_C, 11, { left: '912px', top: '930px', display: 'none', zIndex: 7 });
    const ah2 = el('div', 'abs it', s.root, { left: '915px', top: '1090px', fontSize: '84px', color: '#D9622B', display: 'none', zIndex: 6, textShadow: '4px 4px 0 #fff, -2px -2px 0 #fff' }); ah2.textContent = 'ah';
    const ST = (arr, lt, d) => (arr || []).reduce((a, p) => (lt >= p[0] ? p : a), [0, d]);
    s.update = (lt) => {
      amb(lt, [ev('pay'), ev('bip'), ev('ekR'), ev('name'), ev('feel')].reduce((a, t) => (lt >= t ? t : a), -9));
      const PAY = ev('pay'), BIP = ev('bip'), EX = ev('extras'), EKS = ev('ekS'), EKR = ev('ekR'), W = ev('write'), FEEL = ev('feel');
      // tahmin: soru işaretleri
      [gl, gr].forEach((g) => { g.q.style.display = lt < PAY ? 'block' : 'none'; g.q.style.transform = `scale(${1 + 0.15 * Math.sin(lt * 7)})`; });
      const amp = lt < PAY ? 1 - E.out(prog(lt, PAY - 0.35, 0.35)) : 0, hunt = (ph) => amp * (0.17 + 0.15 * Math.sin(lt * 4.4 + ph));
      const hopL = 34 * Math.sin(prog(lt, 1.35, 0.32) * Math.PI), hopR = 34 * Math.sin(prog(lt, 1.75, 0.32) * Math.PI);
      vs.style.transform = `scale(${1 + 0.3 * (1 - E.out(prog(lt, 0, 0.45))) + 0.08 * Math.sin(prog(lt, 1.35, 0.4) * Math.PI)})`;
      const say450 = 0.16 * Math.sin(prog(lt, 0.35, 0.6) * Math.PI);
      price[0].style.transform = `scale(${1 + say450})`;
      // ad anında "ACI" etiketleri kırmızı nabız
      const nm = prog(lt, ev('name'), 0.6);
      [gl, gr].forEach((g) => {
        g.lb.textContent = lt >= ev('name') ? 'ÖDEME ACISI' : 'ACI';
        g.lb.style.transform = `scale(${1 + 0.45 * Math.sin(nm * Math.PI)})`;
        g.lb.style.color = nm > 0 && nm < 1 ? '#E8322A' : lt >= ev('name') ? '#B5501E' : '#4a3b33';
      });
      // sol ibre: her banknotta yükselir
      let vl = 0;
      [0, 1, 2].forEach((i) => { vl += 0.32 * E.back(prog(lt, PAY + i * 0.4 + 0.15, 0.3)); });
      vl = Math.min(1, vl) + (vl > 0.6 ? Math.sin(lt * 37) * 0.015 : 0) + hunt(0);
      gl.nd.style.transform = `rotate(${-90 + 180 * vl}deg)`;
      // sağ ibre: bip'te kıpırdar, ekstrede tavan, yazınca orta
      let vr = 0.03 + 0.07 * Math.exp(-Math.max(0, lt - BIP) * 6) * (lt >= BIP ? 1 : 0);
      if (lt >= EKR) vr = 0.03 + 0.97 * E.back(prog(lt, EKR, 0.35)) + Math.sin(lt * 31) * 0.015;
      if (lt >= W) vr = lerp(vr, 0.04, E.out(prog(lt, W, 0.3)));
      const CK = o.check ?? W + 1.58;
      if (lt >= CK && lt < FEEL) vr = 0.04 + 0.14 * prog(lt, CK, FEEL - CK) + Math.sin(lt * 23) * 0.012;
      if (lt >= FEEL) vr = 0.04 + 0.5 * E.back(prog(lt, FEEL, 0.45)) + Math.sin(lt * 9) * 0.01;
      gr.nd.style.transform = `rotate(${-90 + 180 * Math.min(1.05, vr + hunt(Math.PI))}deg)`;
      // fiyat: sepet büyüdükçe artar
      const INC = [45, 55, 60], land = (i) => EX + i * 0.35 + 0.3;
      const pc = INC.reduce((a, v, i) => a + (lt >= land(i) ? v : 0), 0);
      price[1].textContent = `${fmt(450 + pc)} TL`;
      price[1].style.transform = `scale(${1 + say450 + INC.reduce((a, v, i) => a + 0.14 * Math.sin(prog(lt, land(i), 0.25) * Math.PI), 0)})`;
      price[1].style.color = pc > 1 && lt < ev('cta') ? '#C0392B' : '#2A1E1A';
      price[1].style.display = lt >= EKS + 0.3 && lt < ev('cta') ? 'none' : 'block';  // ekstre ve defter boyunca gizli: 610 TL arada geri görünmesin
      // banknotlar kasaya uçar
      bills.forEach((b, i) => {
        const p = prog(lt, PAY + i * 0.4, 0.55);
        const x0 = L + 30 + i * 26, y0 = 1250 - i * 14, e = E.inOut(p);
        b.style.display = p < 1 ? 'block' : 'none';
        b.style.transform = `translate(${lerp(x0, L, e) - 77}px,${lerp(y0, 895, e) - Math.sin(p * Math.PI) * 90 - hopL}px) rotate(${(-12 + i * 10) * (1 - e) + Math.sin(p * Math.PI) * 20}deg) scale(${1 - 0.6 * e})`;
        b.style.opacity = 1 - Math.max(0, p - 0.7) * 3.3;
      });
      ahs.forEach((a, i) => {
        const p = prog(lt, PAY + i * 0.4 + 0.15, 0.6);
        a.style.display = p > 0 && p < 1 ? 'block' : 'none';
        a.style.transform = `translate(${[40, 130, 34][i]}px,${[1075, 1010, 945][i] - p * 40}px) scale(${E.back(Math.min(1, p * 3))}) rotate(${[-10, 4, -6][i]}deg)`;
        a.style.opacity = 1 - Math.max(0, p - 0.7) * 3.3;
      });
      // kart POS'a gider, bip
      const go = E.inOut(prog(lt, BIP - 0.35, 0.3)), back = E.inOut(prog(lt, BIP + 0.45, 0.3));
      const SRc = ST(o.right, lt, 'idle'), kc = lt - SRc[0];  // kart pençede: Ceviz zıplarken onunla birlikte
      const pawY = SRc[1] === 'greedy' ? hop(lt, 0.32, 40).y : SRc[1] === 'tap' ? hop(lt, 0.5, 24).y : SRc[1] === 'happy' ? hop(lt + 0.2, 0.45, 30).y : SRc[1] === 'shock' ? 60 * Math.exp(-kc * 4) : 0;
      let cpx = lerp(R + 30, 850, go - back), cpy = lerp(1260 - pawY, 1035, go - back) - hopR;
      const tri = (lt - (EKS - 0.42)) / 0.14;  // ay boyu bip, bip, bip: üç hızlı dokunuş
      if (tri >= 0 && tri < 3) { const g = Math.sin((tri % 1) * Math.PI) * 0.9; cpx = lerp(cpx, 850, g); cpy = lerp(cpy, 1035, g); }
      [0, 1, 2].forEach((i) => { const g = Math.sin(prog(lt, land(i) - 0.16, 0.16) * Math.PI) * 0.9; cpx = lerp(cpx, 850, g); cpy = lerp(cpy, 1035, g); });  // her ürün: bir bip daha
      card.style.transform = `translate(${cpx - 72}px,${cpy - 42}px) rotate(${lerp(-14, 8, go - back)}deg)`;
      card.style.display = lt >= W + 0.2 && lt < ev('cta') ? 'none' : 'block';
      const bp = prog(lt, BIP, 0.8);
      waves.style.display = bip.style.display = bp > 0 && bp < 1 ? 'block' : 'none';
      if ((tri >= 0 && tri < 3) || [0, 1, 2].some((i) => lt >= land(i) - 0.16 && lt < land(i) + 0.1)) waves.style.display = 'block';
      waves.style.transform = `scale(${1 + 0.25 * Math.sin(bp * Math.PI * 4)})`;
      pos.style.display = lt >= EKS - 0.1 && lt < ev('cta') ? 'none' : 'block';
      bip.style.transform = `scale(${E.back(Math.min(1, bp * 4))}) rotate(-8deg)`;
      // sepet büyür
      basket.style.display = lt >= EX - 0.2 && lt < EKS ? 'block' : 'none';
      extras.forEach((x, i) => {
        const p = prog(lt, EX + i * 0.35, 0.4);
        const on = p > 0 && lt < EKS;
        x.e.style.display = on ? 'block' : 'none';
        const [fx, fy, fr] = [[630, 950, 16], [602, 924, -8], [668, 946, 7]][i];
        x.e.style.transform = `translate(${fx}px,${lerp(fy - 170, fy, p * p)}px) rotate(${fr + (1 - p) * [150, -130, 190][i]}deg) scale(${0.4 + 0.6 * Math.min(1, p * 2)})`;
        const q = prog(lt, land(i), 0.5);
        x.g.style.display = q > 0 && q < 1 && lt < EKS ? 'block' : 'none';
        x.g.style.transform = `translateY(${-q * 34}px) scale(${E.back(Math.min(1, q * 3))})`;
        x.g.style.opacity = 1 - Math.max(0, q - 0.7) * 3.3;
      });
      // ekstre iner
      const ekIn = E.out(prog(lt, EKS, 0.35)), ekOut = E.inOut(prog(lt, W - 0.25, 0.3));
      ek.style.display = ekIn > 0 && ekOut < 1 ? 'block' : 'none';
      ek.style.transform = `translateX(${(1 - ekIn) * 560 + ekOut * 640}px) rotate(${(1 - ekIn) * 8}deg)`;
      ekv.style.transform = `scale(${1 + 0.16 * Math.sin(prog(lt, EKR, 0.35) * Math.PI)})`;
      s.root.style.transform = lt >= EKR && lt < EKR + 0.5 ? `translate(${shake(lt, EKR, 16, 0.4)}px,0)` : 'none';
      // defter: -450 TL yazılır
      const np = prog(lt, W + 0.3, 0.3);
      nb.style.display = np > 0 && lt < ev('cta') ? 'block' : 'none';
      nb.style.transform = `scale(${E.back(np)}) rotate(-3deg)`;
      const txt = '-610 TL', nch = Math.floor(Math.max(0, Math.min(txt.length, (lt - (W + 0.6)) / 0.12)));
      nbt.textContent = txt.slice(0, nch);
      const tk = prog(lt, o.check ?? W + 1.58, 0.3);
      tick.style.display = tk > 0 && lt < ev('cta') ? 'block' : 'none';
      tick.style.transform = `scale(${E.back(tk)}) rotate(-8deg)`;
      const ap = prog(lt, FEEL, 0.8);
      ah2.style.display = ap > 0 && ap < 1 ? 'block' : 'none';
      ah2.style.transform = `translateY(${-ap * 40}px) scale(${E.back(Math.min(1, ap * 3))})`;
      // Ceviz'ler
      const SL = ST(o.left, lt, 'idle'), SR = ST(o.right, lt, 'idle');
      let x = L, y = FL, rot = 0, sx = 1, sy = 1, k = lt - SL[0];
      sweat.style.display = 'none';
      if (SL[1] === 'idle') { cl.set('calm', null, blink(lt)); rot = Math.sin(lt * 2) * 3; y -= hopL; }
      else if (SL[1] === 'pay') {
        cl.set('thoughtful', 'face', 'squeeze');
        const j = [0, 1, 2].reduce((a, i) => a + Math.exp(-Math.max(0, lt - (PAY + i * 0.4 + 0.15)) * 7) * (lt >= PAY + i * 0.4 + 0.15 ? 1 : 0), 0);
        y += 0; rot = -10 * Math.min(1, j) + Math.sin(lt * 40) * 2; sx = 1 - 0.06 * Math.min(1, j);
        sweat.style.display = 'block'; const q = (lt % 0.6) / 0.6; sweat.style.transform = `translate(${x + 70}px,${y - 300 + q * 60}px)`; sweat.style.opacity = 1 - q * 0.6;
      }
      else if (SL[1] === 'sad') { cl.set('thoughtful', null, 'half'); rot = -6 + Math.sin(lt * 1.5) * 2; }
      else if (SL[1] === 'happy') { cl.set('celebrate', 'up', 'happy'); const h = hop(lt, 0.45, 30); y -= h.y; sx = h.sx; sy = h.sy; }
      cl.put(x, y, { rot, sx, sy });
      x = R; y = FL; rot = 0; sx = 1; sy = 1; k = lt - SR[0];
      if (SR[1] === 'idle') { cr.set('calm', null, blink(lt + 0.7)); rot = Math.sin(lt * 2 + 1) * 3; y -= hopR; }
      else if (SR[1] === 'sad') { cr.set('thoughtful', null, 'half'); rot = -6 + Math.sin(lt * 1.5) * 2; y += 10 * E.out(Math.min(1, k * 3)); }
      else if (SR[1] === 'tap') { cr.set('happy', 'up', 'happy'); const h = hop(lt, 0.5, 24); y -= h.y; sx = h.sx; sy = h.sy; }
      else if (SR[1] === 'greedy') { cr.set('celebrate', 'up', 'happy'); const h = hop(lt, 0.32, 40); y -= h.y; sx = h.sx; sy = h.sy; rot = Math.sin(lt * 9) * 6; }
      else if (SR[1] === 'shock') { cr.set('curious', 'up', 'x'); const j = Math.exp(-k * 4); rot = 14 * Math.sin(k * 18) * j; y -= 60 * j; }
      else if (SR[1] === 'think') { cr.set('thoughtful', 'face', 'mood'); rot = -6 + Math.sin(lt * 1.6) * 3; }
      else if (SR[1] === 'nod') { cr.set('calm', null, 'happy'); rot = Math.sin(lt * 6) * 4; }
      else if (SR[1] === 'happy') { cr.set('celebrate', 'up', 'happy'); const h = hop(lt + 0.2, 0.45, 30); y -= h.y; sx = h.sx; sy = h.sy; }
      cr.put(x, y, { rot, sx, sy, flip: true });
    };
  };

  /* ── Bulunmuş para: bayram harçlığı, üç günde biten bakiye, HEDİYE/MAAŞ etiketleri düşer ── */
  SCENES.harclik = (t0, o = {}) => {
    const s = scene(t0, '#FFF1DC', undefined, o.wdur ?? 0.5);
    s.root.style.isolation = 'isolate';
    pattern(s.root, 'rgba(192,57,43,.06)');
    const ev = (k) => o[k] ?? 99;
    const amb = ambient(s.root, { cy: 760, glow: 'rgba(255,214,140,.55)' });
    const FL = o.floor ?? 1480;
    // bayrak dizisi
    el('div', 'abs', s.root, { left: '20px', right: '20px', top: '554px', height: '6px', background: '#8B5A2B', borderRadius: '3px' });
    const flags = Array.from({ length: 11 }, (_, i) => pixEl(s.root, FLAGP, { o: '#2A1E1A', C: ['#E8322A', '#2F8F5A', '#F2B63C', '#4351A3'][i % 4] }, 14, { left: px(30 + i * 94), top: '558px', transformOrigin: '50% 0%' }));
    // cüzdan + bakiye
    const wal = el('div', 'abs', s.root, { left: 0, right: 0, top: '640px', textAlign: 'center', zIndex: 2 });
    wal.innerHTML = `<div>${pix(WALLET_O, WALLET_COL, 18)}</div><div style="font-size:40px;font-weight:800;letter-spacing:.1em;color:#8a7d72">CÜZDAN</div><div class="it bal" style="font-size:118px;line-height:1">1.500 TL</div>`;
    const bal = wal.querySelector('.bal');
    // takvim
    const cal = el('div', 'abs', s.root, { left: '56px', top: '650px', width: '200px', height: '220px', boxSizing: 'border-box', background: '#FFFDF8', border: '6px solid #2A1E1A', borderRadius: '14px', textAlign: 'center', overflow: 'hidden', display: 'none' });
    cal.innerHTML = `<div style="background:#E8322A;color:#fff;font-weight:800;font-size:40px;letter-spacing:.1em;padding:8px 0">GÜN</div><div class="it cd" style="font-size:130px;line-height:1.1;color:#2A1E1A">1</div>`;
    const cd = cal.querySelector('.cd');
    // zarflar
    const envs = Array.from({ length: 7 }, (_, i) => pixEl(s.root, ZARF, ZARF_C, 11, { zIndex: 1 }));
    // harcamalar
    const led = el('div', 'abs', s.root, { left: '776px', top: '626px', width: '284px', height: '344px', boxSizing: 'border-box', background: 'repeating-linear-gradient(#FFFDF4 0 86px, #BFD3EA 86px 89px)', backgroundPosition: '0 52px', border: '6px solid #2A1E1A', borderRadius: '14px', display: 'none', zIndex: 3, transformOrigin: '50% 0%' });
    el('div', 'abs', led, { left: '16px', top: '8px', fontSize: '26px', fontWeight: 800, letterSpacing: '.12em', color: '#AE4716' }).textContent = 'CEP DEFTERİ';
    const buys = [[PIZZAP, PIZZAP_C, 10, '-450', 0], [PADP, PADP_C, 8, '-600', 12], [HEADPH, HEADPH_C, 7, '-450', 2]].map(([r, c, cell, t, dy], i) => {
      const row = el('div', 'abs', s.root, { left: '792px', top: px(690 + i * 90), width: '260px', height: '90px', display: 'none', zIndex: 4 });
      row.innerHTML = `<div style="position:absolute;left:0;top:${dy}px">${pix(r, c, cell)}</div><div class="it" style="position:absolute;left:112px;top:4px;font-size:68px;line-height:1;color:#C0392B;text-shadow:4px 4px 0 #fff">${t}</div>`;
      return row;
    });
    // kafe
    const cafe = el('div', 'abs', s.root, { left: '250px', width: '580px', top: '650px', textAlign: 'center', display: 'none' });
    cafe.innerHTML = `<div class="it" style="display:inline-block;background:#2F4A3C;color:#F3EEE2;font-size:76px;padding:16px 40px;border:10px solid #8B5A2B;border-radius:16px">KAFE</div><div style="font-size:46px;font-weight:800;color:#6e5f55;margin-top:18px">3 akşam · 12 saat mesai</div><div class="it earn" style="font-size:104px;color:#2F8F5A;line-height:1.1">+1.500 TL</div>`;
    const earn = cafe.querySelector('.earn');
    const tray = el('div', 'abs', s.root, { width: '156px', zIndex: 4, display: 'none', textAlign: 'center' });
    tray.innerHTML = `<div style="display:flex;justify-content:center;gap:6px">${pix(CUP, CUP_C, 10)}${pix(CUP, CUP_C, 10)}</div>${pix(PLATEP, PLATEP_C, 13)}`;
    const sweat = [0, 1].map(() => pixEl(s.root, SWEAT, SWEAT_C, 16, { display: 'none', zIndex: 5 }));
    // etiketli iki deste
    const stack = (x, lbl, col) => {
      const d = el('div', 'abs', s.root, { left: px(x), top: '660px', width: '232px', height: '240px', display: 'none' });
      d.innerHTML = [0, 1, 2].map((i) => `<div style="position:absolute;left:${i * 6}px;top:${70 - i * 22}px">${pix(NOTE, NOTE_CS[0], 20)}</div>`).join('')
        + `<div class="it" style="position:absolute;left:24px;top:84px;font-size:46px;color:#2A1E1A">1.500</div>`;
      const tg = el('div', 'abs it', s.root, { left: px(x + 16), top: '862px', fontSize: '64px', color: '#fff', background: col, padding: '6px 22px', borderRadius: '12px', border: '5px solid #2A1E1A', display: 'none', transformOrigin: '50% 0%', zIndex: 3 });
      tg.textContent = lbl;
      return { d, tg };
    };
    const st1 = stack(110, 'HEDİYE', '#E8322A'), st2 = stack(738, 'MAAŞ', '#4351A3');
    const same = el('div', 'abs it', s.root, { left: '540px', top: '872px', fontSize: '72px', color: '#2A1E1A', background: '#F2B63C', padding: '8px 26px', borderRadius: '14px', border: '6px solid #2A1E1A', display: 'none', zIndex: 4, whiteSpace: 'nowrap' }); same.textContent = 'AYNI PARA';
    const eq = el('div', 'abs', s.root, { left: '486px', top: '738px', width: '108px', height: '74px', display: 'none' });
    eq.innerHTML = '<div style="height:22px;background:#2A1E1A;border-radius:4px"></div><div style="height:22px;margin-top:30px;background:#2A1E1A;border-radius:4px"></div>';
    const qm = el('div', 'abs it', s.root, { left: '440px', top: '626px', width: '200px', textAlign: 'center', fontSize: '250px', color: '#C0392B', display: 'none', textShadow: '6px 6px 0 #fff' }); qm.textContent = '?';
    const clock = el('div', 'abs it', s.root, { left: '96px', top: '812px', fontSize: '44px', color: '#fff', background: '#2F8F5A', padding: '6px 18px', borderRadius: '12px', border: '5px solid #2A1E1A', display: 'none', zIndex: 3, whiteSpace: 'nowrap', transformOrigin: '50% 0%' }); clock.textContent = '= 12 SAAT MESAİ';
    const bub = el('div', 'abs', s.root, { left: '742px', top: '1078px', width: '300px', height: '150px', boxSizing: 'border-box', background: '#fff', border: '6px solid #2A1E1A', borderRadius: '40px', display: 'none', zIndex: 5, transformOrigin: '15% 100%' });
    bub.innerHTML = `<div style="position:absolute;left:22px;top:30px">${pix(PIZZAP, PIZZAP_C, 8)}</div><div style="position:absolute;left:104px;top:44px">${pix(PADP, PADP_C, 6)}</div><div style="position:absolute;left:186px;top:28px">${pix(HEADPH, HEADPH_C, 6)}</div>`
      + '<div style="position:absolute;left:-26px;top:118px;width:28px;height:28px;border-radius:50%;background:#fff;border:5px solid #2A1E1A"></div><div style="position:absolute;left:-50px;top:150px;width:16px;height:16px;border-radius:50%;background:#fff;border:4px solid #2A1E1A"></div>';
    const bq = el('div', 'abs it', s.root, { left: '992px', top: '1040px', fontSize: '110px', color: '#C0392B', display: 'none', zIndex: 6, textShadow: '5px 5px 0 #fff' }); bq.textContent = '?';
    const m = new Mascot(s.root, { who: 'karamel', w: 520 });
    const ST = (arr, lt, d) => (arr || []).reduce((a, p) => (lt >= p[0] ? p : a), [0, d]);
    s.update = (lt) => {
      amb(lt, [ev('zero'), ev('peel'), ev('name')].reduce((a, t) => (lt >= t ? t : a), -9));
      flags.forEach((f, i) => (f.style.transform = `rotate(${Math.sin(lt * 3 + i) * 8}deg)`));
      const D1 = ev('day1'), D2 = ev('day2'), D3 = ev('day3'), ZR = ev('zero'), WK = ev('work'), LB = ev('labels'), PL = ev('peel');
      // bakiye
      let b = 1500;
      [[D1, 450], [D2, 600], [D3, 450]].forEach(([t, v]) => (b -= v * E.out(prog(lt, t + 0.15, 0.3))));
      bal.textContent = `${fmt(Math.max(0, b))} TL`;
      bal.style.color = lt >= ZR ? '#C0392B' : '#2A1E1A';
      bal.style.transform = `scale(${1 + 0.3 * Math.sin(prog(lt, ZR, 0.35) * Math.PI) + 0.06 * Math.sin(prog(lt, 0.2, 0.4) * Math.PI)})`;
      wal.style.display = lt < WK ? 'block' : 'none';
      // takvim
      const day = lt >= D3 ? 3 : lt >= D2 ? 2 : 1;
      cal.style.display = lt >= D1 - 0.1 && lt < WK ? 'block' : 'none';
      cd.textContent = String(day);
      const fl = [D1, D2, D3].reduce((a, t) => (lt >= t ? t : a), -9);
      cal.style.transform = `scaleY(${lt - fl < 0.15 ? Math.abs(Math.cos((lt - fl) / 0.15 * Math.PI)) : 1}) rotate(-6deg)`;
      // zarf yağmuru
      envs.forEach((e, i) => {
        const p = ((lt * 0.55 + i / 7) % 1);
        const on = lt < D1 || lt >= ev('rain2');
        e.style.display = on ? 'block' : 'none';
        e.style.transform = `translate(${[30, 770, 140, 880, 240, 950, 85][i]}px,${600 + p * 1000}px) rotate(${Math.sin(lt * 3 + i) * 25}deg)`;  // yan şeritler: cüzdan ve bakiye sütunu boş kalsın
        e.style.opacity = 0.95;
      });
      // harcamalar cüzdandan uçar
      const lp = prog(lt, D1 - 0.1, 0.25);
      led.style.display = lp > 0 && lt < WK ? 'block' : 'none';
      led.style.transform = `scaleY(${E.back(lp)})`;
      buys.forEach((row, i) => {
        const p = prog(lt, [D1, D2, D3][i], 0.3);
        row.style.display = p > 0 && lt < WK ? 'block' : 'none';
        row.style.transform = `translateX(${(1 - E.out(p)) * -260}px) scale(${E.back(p)})`;
        row.style.opacity = Math.min(1, p * 3);
      });
      // kafe: çalışarak kazanmak
      const cp = prog(lt, WK, 0.35);
      cafe.style.display = cp > 0 && lt < LB ? 'block' : 'none';
      cafe.style.transform = `scale(${E.back(cp)})`;
      earn.style.opacity = prog(lt, WK + 1.0, 0.4);
      earn.style.transform = `scale(${1 + 0.2 * Math.sin(prog(lt, WK + 1.0, 0.4) * Math.PI)})`;
      // etiketler
      [st1, st2].forEach((st, i) => {
        const p = prog(lt, LB + i * 0.15, 0.35);
        st.d.style.display = p > 0 ? 'block' : 'none';
        st.d.style.transform = `scale(${E.back(p)}) rotate(${(i ? 4 : -4) + Math.sin(lt * 2 + i) * 2}deg)`;
        const f = prog(lt, PL + i * 0.12, 0.7);
        st.tg.style.display = p > 0 && f < 1 ? 'block' : 'none';
        st.tg.style.transform = `translate(${f * (i ? 140 : -140)}px,${f * f * 700}px) rotate(${f * (i ? 70 : -70) + Math.sin(lt * 5 + i) * 4 * (1 - f)}deg)`;
      });
      const sp = prog(lt, ev('stamp'), 0.25);
      same.style.display = sp > 0 ? 'block' : 'none';
      same.style.transform = `translateX(-50%) scale(${lerp(2.2, 1, E.out(sp))}) rotate(-6deg)`;
      const SAME = o.same ?? LB + 0.3;  // tahmin anı: önce "?", cevapla "="
      qm.style.display = lt >= LB + 0.3 && lt < SAME ? 'block' : 'none';
      qm.style.transform = `scale(${E.back(prog(lt, LB + 0.3, 0.3)) * (1 + 0.12 * Math.sin(lt * 9))}) rotate(${Math.sin(lt * 5) * 8}deg)`;
      eq.style.display = lt >= SAME ? 'block' : 'none';
      eq.style.transform = `scale(${E.back(prog(lt, SAME, 0.3))})`;
      const ck = prog(lt, ev('clock'), 0.35);
      clock.style.display = ck > 0 ? 'block' : 'none';
      clock.style.transform = `translateY(${(1 - E.out(ck)) * -70}px) rotate(${-4 + (1 - ck) * -10}deg) scale(${E.back(ck)})`;
      const bp = prog(lt, ev('ask'), 0.35);
      bub.style.display = bq.style.display = bp > 0 && lt < ev('cta') ? 'block' : 'none';
      bub.style.transform = `scale(${E.back(bp)})`;
      bq.style.transform = `scale(${E.back(prog(lt, ev('ask') + 0.25, 0.3))}) rotate(${Math.sin(lt * 6) * 10}deg)`;
      // Karamel
      const S = ST(o.karamel, lt, 'rich'), k = lt - S[0];
      let x = 540, y = FL, rot = 0, sx = 1, sy = 1;
      tray.style.display = 'none'; sweat.forEach((w) => (w.style.display = 'none'));
      if (S[1] === 'rich') { m.set('celebrate', 'up', 'happy'); const h = hop(lt, 0.42, 44); y -= h.y; sx = h.sx; sy = h.sy; }
      else if (S[1] === 'spend') { m.set('happy', Math.floor(lt / 0.25) % 2 ? 'wave' : 'up', 'happy'); const h = hop(lt, 0.3, 30); y -= h.y; rot = Math.sin(lt * 10) * 5; }
      else if (S[1] === 'broke') { m.set('curious', 'up', 'x'); const j = Math.exp(-k * 4); rot = 14 * Math.sin(k * 18) * j; y -= 60 * j; }
      else if (S[1] === 'work') {
        m.set('thoughtful', 'up', 'squeeze'); x += Math.sin(lt * 5) * 30; rot = Math.sin(lt * 10) * 4;
        tray.style.display = 'block'; tray.style.transform = `translate(${x + 190}px,${y - 410 + Math.sin(lt * 10) * 6}px) rotate(${Math.sin(lt * 5) * 6}deg)`;
        sweat.forEach((w, i) => { const q = ((lt + i * 0.35) % 0.7) / 0.7; w.style.display = 'block'; w.style.transform = `translate(${x - 120 + i * 230}px,${y - 420 + q * 70}px)`; w.style.opacity = 1 - q * 0.6; });
      }
      else if (S[1] === 'aha') { m.set('curious', 'up', 'wide'); const j = Math.exp(-k * 5); y -= 50 * Math.sin(Math.min(1, k * 3) * Math.PI) * j + 0; rot = Math.sin(lt * 2) * 3; }
      else if (S[1] === 'shrug') { m.set('curious', null, 'wide'); rot = Math.sin(lt * 2) * 4; }
      else if (S[1] === 'think') { m.set('thoughtful', null, 'mood'); rot = -6 + Math.sin(lt * 1.6) * 3; }
      else if (S[1] === 'ok') { m.set('celebrate', 'up', 'happy'); const h = hop(lt, 0.45, 34); y -= h.y; sx = h.sx; sy = h.sy; }
      m.put(x, y, { rot, sx, sy });
    };
  };


  /* ── Çapa etkisi: üstü çizili fiyat, 5 dk önceki yan dükkân (geri sarma), çapa, Cep Defteri bütçesi ── */
  SCENES.anchor = (t0, o = {}) => {
    const s = scene(t0, '#F6EEE6', undefined, o.wdur ?? 0.5);
    s.root.style.isolation = 'isolate';
    const ev = (k) => o[k] ?? 99;
    const wallA = el('div', 'abs', s.root, { inset: 0, background: 'repeating-linear-gradient(90deg, #F6EEE6 0 64px, #F0E1D3 64px 128px)' });
    const wallB = el('div', 'abs', s.root, { inset: 0, background: 'radial-gradient(circle, #CFE3D8 8px, transparent 9px) 0 0 / 60px 60px, #E8F2EC', display: 'none' });
    // zemin: butikte ahşap parke ve halı, yan dükkânda karo; aşağı indikçe sıralar kalınlaşır (perspektif)
    const FY = 1410;  // ayakların (≈1505) gerisinde yer derinliği kalsın
    const floor = (base, row) => {
      const f = el('div', 'abs', s.root, { left: 0, width: '1080px', top: px(FY), height: px(1920 - FY), overflow: 'hidden' });
      el('div', 'abs', f, { left: 0, right: 0, top: 0, height: '18px', background: base });  // süpürgelik
      let y = 18;
      [26, 30, 34, 40, 46, 54, 62, 72, 84, 98].forEach((h, i) => { row(f, y, h, i); y += h; });
      el('div', 'abs', f, { inset: 0, background: 'linear-gradient(rgba(42,30,26,0) 30%, rgba(42,30,26,.14))' });
      return f;
    };
    const floorA = floor('linear-gradient(#B57A45 0 4px, #8B5A2B 4px 15px, #6E4522 15px)', (f, y, h, i) => {
      const L = 150 + i * 26;  // tahta boyu öne doğru uzar, derzler sıra sıra kayar
      el('div', 'abs', f, { left: 0, right: 0, top: px(y), height: px(h), background: `linear-gradient(#A06B3C 0 3px, #E3B47E 3px 6px, ${i % 2 ? '#CB9661' : '#D4A06A'} 6px)` });
      el('div', 'abs', f, { left: px(-((i * 137) % L)), width: px(1080 + L), top: px(y + 3), height: px(h - 3), background: `repeating-linear-gradient(90deg, transparent 0 ${L - 4}px, #AA7444 ${L - 4}px ${L}px)` });
    });
    el('div', 'abs', floorA, { left: '250px', top: '49px', width: '580px', height: '92px', boxSizing: 'border-box', borderRadius: '50%', background: '#D98E6E', border: '7px solid #A85E43', boxShadow: 'inset 0 0 0 9px #E9B08F, inset 0 0 0 13px #F6D2B4' });  // halı
    const floorB = floor('linear-gradient(#B9D8C6 0 4px, #8FB8A2 4px 15px, #77A08A 15px)', (f, y, h, i) => {
      const T = Math.round(h * 1.7), off = i % 2 ? T : 0;  // dama karo
      el('div', 'abs', f, { left: 0, right: 0, top: px(y), height: px(h), background: `linear-gradient(#B5CFC1 0 3px, transparent 3px), repeating-linear-gradient(90deg, #B5CFC1 0 3px, transparent 3px ${T}px), repeating-linear-gradient(90deg, #E8F2EC 0 ${T}px, #D3E6DB ${T}px ${2 * T}px)`, backgroundPosition: `0 0, ${off}px 0, ${off}px 0` });
    });
    const amb = ambient(s.root, { cy: 860, glow: 'rgba(255,214,190,.5)' });
    const sign = el('div', 'abs it', s.root, { left: '330px', width: '420px', top: '582px', height: '84px', boxSizing: 'border-box', background: '#2A1E1A', color: '#FFD25A', fontSize: '58px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px', border: '6px solid #8B5A2B', letterSpacing: '.06em' });
    // mağaza: askı demiri, askıda mont, ipte etiket
    const shop = el('div', 'abs', s.root, { left: 0, top: 0, width: '1080px', height: '1920px' });
    el('div', 'abs', shop, { left: '60px', width: '500px', top: '690px', height: '14px', background: '#6e5f55', borderRadius: '7px' });
    const coat = el('div', 'abs', shop, { left: '155px', top: '676px', width: '270px', textAlign: 'center', transformOrigin: '50% 4%' });
    coat.innerHTML = `<svg width="260" height="70" viewBox="0 0 260 70"><path d="M130 8 q10 0 10 9 q0 8-10 13 L22 66 h216 L130 30" fill="none" stroke="#2A1E1A" stroke-width="8" stroke-linejoin="round"/></svg><div style="margin-top:-14px">${pix(MONTP, MONTP_C, 15)}</div>`;
    const str = el('div', 'abs', shop, { left: '548px', top: '700px', width: '5px', height: '38px', background: '#6e5f55', transformOrigin: '50% 0%' });
    const tag = el('div', 'abs', shop, { left: '560px', top: '734px', width: '440px', height: '250px', boxSizing: 'border-box', background: '#FFFDF8', border: '8px solid #2A1E1A', borderRadius: '24px', textAlign: 'center', transformOrigin: '0% 0%', boxShadow: '0 18px 0 rgba(42,30,26,.15)' });
    tag.innerHTML = `<div style="font-size:38px;font-weight:800;color:#8a7d72;letter-spacing:.08em;margin-top:14px">MONT</div><div class="old it" style="font-size:84px;line-height:1;color:#776c64;position:relative;display:inline-block">4.000 TL<span class="sl" style="position:absolute;left:-10px;right:-10px;top:52%;height:11px;background:#C0392B;border-radius:6px;transform-origin:0 50%"></span></div><div class="nw it" style="font-size:104px;line-height:1;color:#C0392B">2.500 TL</div>`;
    const sl = tag.querySelector('.sl'), oldp = tag.querySelector('.old'), nw = tag.querySelector('.nw');
    const stars = [0, 1, 2].map(() => pixEl(shop, STAR, STAR_ON, 7, { zIndex: 3 }));
    // karşılaştırma kartları (şimdi): BUTİK ve YAN DÜKKÂN
    const card = (x, name, old, verdict, col) => {
      const c = el('div', 'abs', s.root, { left: px(x), top: '640px', width: '460px', height: '330px', boxSizing: 'border-box', background: '#FFFDF8', border: '8px solid #2A1E1A', borderRadius: '24px', textAlign: 'center', display: 'none', overflow: 'visible' });
      c.innerHTML = `<div class="it" style="background:#2A1E1A;color:#FFD25A;font-size:46px;padding:8px 0 10px;border-radius:14px 14px 0 0;letter-spacing:.06em">${name}</div>`
        + (old ? `<div class="old it" style="font-size:70px;line-height:1;color:#776c64;position:relative;display:inline-block;margin-top:14px">4.000 TL<span style="position:absolute;left:-8px;right:-8px;top:52%;height:9px;background:#C0392B;border-radius:5px"></span></div>` : '<div style="height:84px"></div>')
        + `<div class="it" style="font-size:106px;line-height:1;color:${old ? '#C0392B' : '#2A1E1A'}">2.500 TL</div>`;
      const st = el('div', 'abs it', c, { left: '50%', bottom: '-46px', fontSize: '60px', color: '#fff', background: col, padding: '4px 26px 8px', borderRadius: '14px', border: '6px solid #2A1E1A', whiteSpace: 'nowrap', transformOrigin: '50% 50%' });
      st.textContent = verdict;
      return { c, st, old: c.querySelector('.old') };
    };
    const cA = card(40, 'BUTİK', true, 'UCUZ!', '#2F8F5A'), cB = card(580, 'YAN DÜKKÂN', false, 'PAHALI!', '#C0392B');
    const eq = el('div', 'abs', s.root, { left: '510px', top: '832px', width: '60px', height: '50px', display: 'none' });
    eq.innerHTML = '<div style="height:16px;background:#2A1E1A;border-radius:3px"></div><div style="height:16px;margin-top:18px;background:#2A1E1A;border-radius:3px"></div>';
    const ring = el('div', 'abs', s.root, { left: '86px', top: '690px', width: '370px', height: '110px', border: '8px solid #F2B63C', borderRadius: '60px', display: 'none', boxSizing: 'border-box' });
    const first = el('div', 'abs it', s.root, { left: '100px', top: '566px', fontSize: '54px', color: '#2A1E1A', background: '#F2B63C', padding: '4px 22px 8px', borderRadius: '14px', border: '6px solid #2A1E1A', display: 'none', whiteSpace: 'nowrap' }); first.textContent = 'İLK GÖRDÜĞÜ SAYI ↓';
    // Cep Defteri: kendi bütçen
    const nb = el('div', 'abs', s.root, { left: '580px', top: '640px', width: '460px', height: '330px', boxSizing: 'border-box', background: 'repeating-linear-gradient(#FFFDF4 0 58px, #BFD3EA 58px 61px)', backgroundPosition: '0 40px', border: '8px solid #2A1E1A', borderRadius: '24px', textAlign: 'center', display: 'none' });
    nb.innerHTML = `<div style="font-size:48px;font-weight:800;letter-spacing:.06em;color:#AE4716;margin-top:10px;line-height:1.1">CEP DEFTERİ</div><div style="font-size:44px;font-weight:800;color:#6e5f55;margin-top:14px">MONT BÜTÇEM</div><div class="it nbv" style="font-size:100px;line-height:1;color:#2F8F5A;margin-top:12px">2.000 TL</div>`;
    const ring2 = el('div', 'abs', s.root, { left: '640px', top: '785px', width: '350px', height: '110px', border: '8px solid #F2B63C', borderRadius: '60px', display: 'none', boxSizing: 'border-box', zIndex: 4 });
    const over = el('div', 'abs it', s.root, { left: '270px', top: '934px', fontSize: '48px', color: '#fff', background: '#C0392B', padding: '4px 20px 8px', borderRadius: '14px', border: '6px solid #2A1E1A', display: 'none', whiteSpace: 'nowrap', zIndex: 4, transformOrigin: '50% 50%' }); over.textContent = 'BÜTÇEYİ 500 TL AŞIYOR';
    // çapa ve zinciri
    const chain = el('div', 'abs', s.root, { width: '12px', background: 'repeating-linear-gradient(#5b6573 0 16px, transparent 16px 22px)', display: 'none', zIndex: 5 });
    const anc = pixEl(s.root, ANCHORP, ANCHORP_C, 9, { display: 'none', zIndex: 6, transformOrigin: '50% 0%' });
    // Pamuk, gölgesi, konuşma balonu, kalpler
    const shadow = el('div', 'abs', s.root, { left: 0, top: 0, width: '300px', height: '44px', borderRadius: '50%', background: 'rgba(42,30,26,.24)' });
    const m = new Mascot(s.root, { who: 'pamuk', w: 440 });
    const bub = el('div', 'abs it', s.root, { left: '760px', top: '1128px', fontSize: '66px', background: '#fff', border: '7px solid #2A1E1A', borderRadius: '30px', padding: '4px 26px 10px', display: 'none', zIndex: 6, whiteSpace: 'nowrap', transformOrigin: '0% 100%', boxShadow: '0 8px 0 rgba(42,30,26,.2)' });
    const hearts = [0, 1, 2, 3].map(() => pixEl(s.root, HEARTP, HEARTP_C, 9, { display: 'none', zIndex: 5 }));
    const plane = pixEl(s.root, PLANEP, PLANEP_C, 7, { display: 'none', zIndex: 7 });
    // VHS geri sarma katmanı
    const vhs = el('div', 'abs', s.root, { inset: 0, background: 'repeating-linear-gradient(rgba(0,0,0,.13) 0 3px, transparent 3px 7px)', display: 'none', zIndex: 8, pointerEvents: 'none' });
    const band = el('div', 'abs', s.root, { left: 0, right: 0, height: '120px', background: 'linear-gradient(transparent, rgba(255,255,255,.75), transparent)', display: 'none', zIndex: 9 });
    const rwl = el('div', 'abs it', s.root, { right: '30px', top: '594px', fontSize: '50px', color: '#FFD25A', background: '#2A1E1A', padding: '4px 22px 8px', borderRadius: '12px', display: 'none', zIndex: 9, whiteSpace: 'nowrap' });
    const ST = (arr, lt, d) => (arr || []).reduce((a, p) => (lt >= p[0] ? p : a), [0, d]);
    s.update = (lt) => {
      const ASK = ev('ask'), REV = ev('reveal'), RW = ev('rewind'), BAD = ev('pricey'), BK = ev('back'), FIRST = ev('first'), NM = ev('name'), LS = ev('lesson'), OV = ev('over'), CTA = ev('cta');
      amb(lt, [REV, CTA].reduce((a, t) => (lt >= t ? t : a), -9));  // kartlar okunurken konfeti patlatma
      const B = lt >= RW + 0.18 && lt < BK + 0.15;   // geri dönüş: yan dükkân, 5 dk önce
      const C = lt >= BK + 0.15;                     // şimdi: karşılaştırma ve ders
      // geçişler: VHS bantları
      const tr = Math.max(prog(lt, RW, 0.36) * (lt < RW + 0.36 ? 1 : 0), prog(lt, BK, 0.3) * (lt < BK + 0.3 ? 1 : 0));
      const inTr = (lt >= RW && lt < RW + 0.36) || (lt >= BK && lt < BK + 0.3);
      vhs.style.display = inTr || B ? 'block' : 'none';
      vhs.style.opacity = inTr ? 1 : 0.45;
      band.style.display = inTr ? 'block' : 'none';
      band.style.top = px(1920 * ((tr * 3.3) % 1) - 60);
      s.root.style.filter = B ? 'sepia(.55) saturate(.8)' : 'none';
      shop.style.transform = inTr ? `translateX(${Math.sin(lt * 90) * 24}px)` : 'none';
      rwl.style.display = B || inTr ? 'block' : 'none';
      rwl.textContent = lt < BK ? '◀◀ 5 DK ÖNCE' : '▶▶ ŞİMDİ';
      wallA.style.display = floorA.style.display = B ? 'none' : 'block';
      wallB.style.display = floorB.style.display = B ? 'block' : 'none';
      // tabela ve mağaza (A ya da B)
      shop.style.display = C ? 'none' : 'block';
      sign.style.display = C ? 'none' : 'flex';
      sign.textContent = B ? 'YAN DÜKKÂN' : 'BUTİK';
      const tick = [REV - 0.75, REV - 0.5, REV - 0.25].reduce((a, t) => a + (lt >= t && lt < t + 0.2 ? Math.sin(prog(lt, t, 0.2) * Math.PI) : 0), 0);  // tahmin anındaki tıkırtılar
      const swing = Math.sin(lt * 2.6) * 3 + 16 * Math.exp(-lt * 3) * Math.cos(lt * 9) + tick * 6;
      tag.style.transform = `rotate(${swing}deg)`;
      str.style.transform = `rotate(${swing * 0.6}deg)`;
      coat.style.transform = `rotate(${Math.sin(lt * 1.7) * 2}deg)`;
      oldp.style.display = B ? 'none' : 'inline-block';
      sl.style.transform = `scaleY(${1 + 0.8 * Math.sin(prog(lt, 0.05, 0.3) * Math.PI)}) rotate(-4deg)`;  // çizgi ilk karede hazır (kapak, döngü)
      nw.style.color = B ? '#2A1E1A' : '#C0392B';
      nw.style.fontSize = B ? '120px' : '104px';
      nw.style.marginTop = B ? '18px' : '0';
      const glow = lt >= REV && lt < REV + 0.6 ? 1 + 0.18 * Math.sin(prog(lt, REV, 0.6) * Math.PI) : 1 + 0.03 * Math.sin(lt * 6);
      nw.style.transform = `scale(${glow})`;
      stars.forEach((e, i) => {
        const on = !B && !C && lt > 0.3;
        e.style.display = on ? 'block' : 'none';
        const a = lt * 1.6 + i * 2.1, k = (Math.sin(lt * 5 + i * 2) + 1) / 2;
        e.style.transform = `translate(${780 + Math.cos(a) * 250}px,${880 + Math.sin(a) * 150}px) scale(${0.5 + k * 0.7}) rotate(${lt * 90}deg)`;
      });
      // şimdi: kartlar, eşittir, ilk sayı, çapa, Cep Defteri
      const cp = prog(lt, BK + 0.15, 0.35);
      [cA, cB].forEach((k, i) => {
        k.c.style.display = C ? 'block' : 'none';
        k.c.style.transform = `translateY(${(1 - E.back(cp)) * 120}px) rotate(${i ? 1.5 : -1.5}deg)`;
        k.c.style.opacity = Math.min(1, cp * 3);
        k.st.style.transform = `translateX(-50%) scale(${E.back(prog(lt, BK + 0.6 + i * 0.25, 0.3))}) rotate(${i ? 5 : -5}deg)`;
      });
      const lout = E.inOut(prog(lt, LS, 0.4));
      cB.c.style.transform += ` translateX(${lout * 600}px)`;
      cB.c.style.display = C && lout < 1 ? 'block' : 'none';
      nb.style.display = lt >= LS ? 'block' : 'none';
      nb.style.transform = `translateX(${(1 - E.out(prog(lt, LS + 0.15, 0.4))) * 600}px) rotate(1.5deg)`;
      eq.style.display = C && lt < LS ? 'block' : 'none';
      eq.style.transform = `scale(${E.back(prog(lt, BK + 0.5, 0.3))})`;
      const fp = prog(lt, FIRST, 0.3), fon = lt >= FIRST && lt < LS;
      ring.style.display = fon ? 'block' : 'none';
      first.style.display = fon && lt < NM + 0.3 ? 'block' : 'none';  // çapa inince işaret görevini çapa alır
      ring.style.transform = `scale(${E.back(fp) * (1 + 0.05 * Math.sin(lt * 10))})`;
      first.style.transform = `scale(${E.back(fp)})`;
      // A kartının damgası: önce UCUZ!, bütçeyle karşılaşınca BÜTÇEYİ 500 TL AŞIYOR
      over.style.display = lt >= OV ? 'block' : 'none';
      over.style.transform = `translateX(-50%) scale(${lerp(2, 1, E.out(prog(lt, OV, 0.25)))}) rotate(-4deg) translateX(${shake(lt, OV + 0.2, 12, 0.35)}px)`;
      cA.st.style.opacity = lt >= OV ? 0 : 1;
      // çapa: ad anında yukarıdan düşer, derste deftere taşınır
      const dp = prog(lt, NM, 0.35), mv = E.inOut(prog(lt, LS + 0.5, 0.7));
      const ax = lerp(74, 596, mv), ay = lerp(lerp(-260, 656, dp * dp), 740, mv) - Math.sin(mv * Math.PI) * 160;  // çapa sayıyı örtmez, halkanın ucuna takılır
      const r2 = prog(lt, LS + 1.15, 0.3);
      ring2.style.display = r2 > 0 ? 'block' : 'none';
      ring2.style.transform = `scale(${E.back(r2) * (1 + 0.05 * Math.sin(lt * 10))})`;
      const aon = lt >= NM;
      anc.style.display = chain.style.display = aon ? 'block' : 'none';
      const bounce = Math.exp(-Math.max(0, lt - NM - 0.35) * 6) * Math.sin(Math.max(0, lt - NM - 0.35) * 22) * 12;
      anc.style.transform = `translate(${ax - 58}px,${ay + bounce}px) rotate(${Math.sin(lt * 2) * 3}deg) scale(${1 + 0.3 * mv})`;  // kendi çapan (bütçe) daha büyük
      chain.style.left = px(ax - 6); chain.style.top = '0px'; chain.style.height = px(Math.max(0, ay + bounce + 6));
      s.root.style.transform = (lt >= NM + 0.33 && lt < NM + 0.7) || (lt >= LS + 1.2 && lt < LS + 1.5) ? `translate(${shake(lt, lt < LS ? NM + 0.33 : LS + 1.2, 14, 0.3)}px,0)` : 'none';
      // Pamuk
      const S = ST(o.pamuk, lt, 'wow'), k = lt - S[0];
      let x = 540, y = 1534, rot = 0, sx = 1, sy = 1, flip = false;
      bub.style.display = 'none'; hearts.forEach((h) => (h.style.display = 'none'));
      const say = (t, col, d = 0) => { bub.style.display = 'block'; bub.textContent = t; bub.style.color = col; bub.style.transform = `scale(${E.back(Math.min(1, (k - d) * 4))}) rotate(${-3 + Math.sin(lt * 5) * 2}deg)`; };
      if (S[1] === 'wow') { m.set('curious', null, 'wide'); y -= 40 * Math.sin(prog(lt, 0.25, 0.35) * Math.PI); rot = Math.sin(lt * 2.5) * 4; }
      else if (S[1] === 'think') { m.set('thoughtful', 'face', 'mood'); rot = Math.sin(lt * 3.2) * 9; say('?', '#4351A3'); bub.style.fontSize = '90px'; bub.style.transform += ` scale(${1 + 0.35 * tick})`; }
      else if (S[1] === 'love') {
        m.set('celebrate', 'up', 'happy'); const h = hop(lt, 0.42, 36); y -= h.y; sx = h.sx; sy = h.sy; say('KELEPİR!', '#2F8F5A'); bub.style.fontSize = '66px';
        hearts.forEach((e, i) => { const q = ((k * 0.8 + i * 0.27) % 1); e.style.display = 'block'; e.style.transform = `translate(${400 + i * 70 + Math.sin(lt * 4 + i) * 20}px,${1144 - q * 260}px) scale(${1 - q * 0.4})`; e.style.opacity = 1 - q; });
      }
      else if (S[1] === 'walk') { m.set('happy', null, 'mood'); x = lerp(-240, 540, E.out(prog(lt, S[0], 0.9))); const h = hop(lt, 0.3, 12); y -= h.y; rot = Math.sin(lt * 10) * 3; }
      else if (S[1] === 'look') { const ln = E.inOut(prog(lt, S[0] + 0.2, 0.6)); m.set('curious', null, 'mood'); x = 540 + 30 * ln; rot = 7 * ln + Math.sin(lt * 2) * 3; if (k > 1) { m.set('thoughtful', 'face', 'mood'); say('?', '#4351A3', 1); bub.style.fontSize = '90px'; } }
      else if (S[1] === 'nope') {
        m.set('curious', 'face', 'x'); rot = Math.sin(k * 30) * 8 * Math.exp(-k * 2); say('PAHALI!', '#C0392B'); bub.style.fontSize = '66px';
        const w = E.out(prog(lt, S[0] + 0.62, 0.3)); x = 540 + w * 760; flip = w > 0;
        if (w > 0.5) bub.style.display = 'none';
      }
      else if (S[1] === 'shrug') { m.set('curious', 'up', 'wide'); rot = Math.sin(lt * 2.2) * 5; }
      else if (S[1] === 'aha') { m.set('curious', 'up', 'wide'); y -= 50 * Math.sin(Math.min(1, k * 3) * Math.PI) * Math.exp(-k * 3); }
      else if (S[1] === 'budget') { m.set('thoughtful', 'face', 'mood'); rot = -6 + Math.sin(lt * 1.8) * 3; }
      else if (S[1] === 'nod') { m.set('happy', null, 'happy'); rot = Math.sin(lt * 9) * 5; if (k > 0.25) { say('ALMAM!', '#C0392B', 0.25); bub.style.fontSize = '66px'; } }
      else if (S[1] === 'happy') { m.set('celebrate', 'up', 'happy'); const h = hop(lt, 0.45, 34); y -= h.y; sx = h.sx; sy = h.sy; }
      m.put(x, y, { rot, sx, sy, flip });
      const sk = 1 - Math.min(0.45, Math.max(0, 1534 - y) / 220);  // zıpladıkça gölge küçülüp açılır
      shadow.style.transform = `translate(${x - 150}px,1480px) scale(${sk})`;
      shadow.style.opacity = sk;
      // çağrı: 'gönder' derken kâğıt uçak sağa, paylaş düğmesine doğru uçar
      const pl = prog(lt, CTA + 1.85, 0.42);
      plane.style.display = lt >= CTA + 1.6 && pl < 1 ? 'block' : 'none';
      plane.style.transform = `translate(${lerp(600, 1180, pl * pl)}px,${lerp(1190, 980, pl) - Math.sin(pl * Math.PI) * 90}px) rotate(${-12 - 14 * pl}deg) scale(${E.back(prog(lt, CTA + 1.6, 0.2))})`;
    };
  };

  /* Ültimatom oyunu: karanlık oda, tek lamba, masada 1.000 TL. Ceviz böler; Diken kabul ederse paylaşırlar, reddederse ikisi de 0.
     Sinema bölümü bantlı ve karanlık; ışıklar açılınca deney grafiği, sonra aydınlık masada adil bölüşüm. */
  SCENES.ultimatum = (t0, o = {}) => {
    const s = scene(t0, '#120D0B', undefined, o.wdur ?? 0.4);
    const ev = (k) => o[k] ?? 99;
    const RULES = ev('rules'), OFFER = ev('offer'), SPLIT = ev('split'), CUT = ev('cut'), SLIDE = ev('slide'), ASK = ev('ask'), KAB = ev('kabul'), RETW = ev('retw'), COUNT = ev('count'), RET = ev('ret');
    const SCI = ev('sci'), NAME = ev('name'), ULT = ev('ult'), FAIR = ev('fair'), YES = ev('yes'), CTA = ev('cta'), DIM = ev('dim');
    const REVEAL = o.reveal ?? (o.rules ? 1.42 : 99);  // "Ama bir şartla": para yakın planından geniş plana
    const DP = RULES + 0.8, BACK = RULES + 1.95;  // "Diken reddederse" yakın planı, "ikisi de sıfır" geniş planı
    // kamera: yakın çekimlerde bütün sahne bu katmanda ölçeklenir
    const cam = el('div', 'abs', s.root, { left: 0, top: 0, width: '1080px', height: '1920px', transformOrigin: '0 0' });
    const room = el('div', 'abs', cam, { inset: 0, background: 'radial-gradient(ellipse 700px 900px at 540px 1000px, #3B2B22 0%, #21180F 55%, #120D0B 100%)' });
    const day = el('div', 'abs', cam, { inset: 0, background: 'linear-gradient(#F3E7DA, #E5D3C0)', opacity: 0 });
    pattern(day, 'rgba(120,80,50,.08)');
    // tavandan sarkan lamba ve ışık konisi (ip ucundan sallanır)
    const lamp = el('div', 'abs', cam, { left: 0, top: 0, width: '1080px', height: '1920px', transformOrigin: '540px 0px' });
    const cone = el('div', 'abs', lamp, { left: '120px', top: '690px', width: '840px', height: '620px', clipPath: 'polygon(45% 0, 55% 0, 100% 100%, 0 100%)', background: 'linear-gradient(rgba(255,221,160,.36), rgba(255,221,160,.04))' });
    el('div', 'abs', lamp, { left: '533px', top: 0, width: '14px', height: '590px', background: '#2B2421' });
    el('div', 'abs', lamp, { left: '428px', top: '580px', width: '224px', height: '96px', clipPath: 'polygon(30% 0, 70% 0, 100% 100%, 0 100%)', background: 'linear-gradient(#6A5B51, #3B322D)' });
    el('div', 'abs', lamp, { left: '420px', top: '670px', width: '240px', height: '12px', background: '#2B2421', borderRadius: '6px' });
    const bulb = el('div', 'abs', lamp, { left: '512px', top: '680px', width: '56px', height: '38px', borderRadius: '0 0 28px 28px', background: '#FFF1C1', boxShadow: '0 10px 80px 40px rgba(255,214,140,.5)' });
    const dust = Array.from({ length: 16 }, (_, i) => ({ e: el('div', 'abs', cam, { width: '8px', height: '8px', background: '#FFE8BE' }), x: 330 + ((i * 197) % 420), y: (i * 331) % 560, sp: 10 + (i % 5) * 6, ph: i * 1.7 }));
    // oyuncular masanın arkasında
    const cz = new Mascot(cam, { who: 'ceviz', w: 420 }), dk = new Mascot(cam, { who: 'diken', w: 420 });
    const zeros = [230, 850].map((x) => { const z = el('div', 'abs it', cam, { left: px(x - 120), width: '240px', top: '880px', textAlign: 'center', fontSize: '88px', color: '#FF6B57', display: 'none', textShadow: '5px 0 0 #2A1E1A, -5px 0 0 #2A1E1A, 0 5px 0 #2A1E1A, 0 -5px 0 #2A1E1A' }); z.textContent = '0 TL'; return z; });
    // masa: perspektifli üst yüzey ve ön yüz
    el('div', 'abs', cam, { left: '70px', top: '1250px', width: '940px', height: '104px', clipPath: 'polygon(5% 0, 95% 0, 100% 100%, 0 100%)', background: 'linear-gradient(#80583A, #5F3F29)' });
    el('div', 'abs', cam, { left: '70px', top: '1352px', width: '940px', height: '260px', background: 'linear-gradient(#4A3020 0 10px, #3A261A 10px)' });
    // masa tabelası: oyunun adı, masanın önünde (hiçbir planda alt arayüz bandına inmez)
    const plate = el('div', 'abs it', cam, { left: '384px', top: '1284px', width: '232px', height: '58px', boxSizing: 'border-box', background: 'linear-gradient(#E0AE4C, #A8782A)', border: '5px solid #2A1E1A', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '38px', color: '#2A1E1A', letterSpacing: '.08em', zIndex: 1 });
    plate.textContent = 'ÜLTİMATOM';
    el('div', 'abs', cam, { left: '404px', top: '1340px', width: '192px', height: '12px', background: '#2A1E1A', borderRadius: '0 0 6px 6px' });
    // Cep Defteri: anlaşma deftere yazılır
    const led = el('div', 'abs', cam, { left: '80px', top: '1236px', width: '270px', height: '122px', boxSizing: 'border-box', background: 'repeating-linear-gradient(#FFFDF4 0 31px, #BFD3EA 31px 33px)', border: '5px solid #2A1E1A', borderRadius: '10px', transform: 'rotate(-4deg)', padding: '2px 12px', zIndex: 2 });
    led.innerHTML = '<div style="font-size:30px;font-weight:800;color:#AE4716;letter-spacing:.05em;line-height:34px">CEP DEFTERİ</div><div class="it la" style="font-size:36px;color:#2A1E1A;height:36px"></div><div class="it lb" style="font-size:36px;color:#2A1E1A;height:36px"></div>';
    const la = led.querySelector('.la'), lb = led.querySelector('.lb');
    const strike = el('div', 'abs', led, { left: '8px', right: '8px', top: '40px', height: '66px', display: 'none', background: 'linear-gradient(transparent 14px, #C0392B 14px 21px, transparent 21px 49px, #C0392B 49px 56px, transparent 56px)' });
    const stampLed = (txt, col, fs) => { const e = el('div', 'abs it', cam, { left: '112px', top: '1266px', fontSize: px(fs), color: '#fff', background: col, padding: '2px 14px 6px', borderRadius: '10px', border: '5px solid #2A1E1A', display: 'none', whiteSpace: 'nowrap', transformOrigin: '50% 50%', zIndex: 3 }); e.textContent = txt; return e; };
    const zeroStamp = stampLed('0 TL · 0 TL', '#C0392B', 38), okStamp = stampLed('TAMAM', '#2F8F5A', 48);
    // 1.000 TL: 4 × 200 + 2 × 100
    const notes = [1, 0, 0, 0, 0, 1].map((ci) => { const e = el('div', 'abs', cam, { left: 0, top: 0, width: '143px', height: '65px', transformOrigin: '50% 50%' }); e.innerHTML = pix(NOTE, NOTE_CS[ci], 13); return e; });
    // ışık parıltısı destenin üstünden geçer
    const glint = el('div', 'abs', cam, { left: '469px', top: '1131px', width: '143px', height: '125px', overflow: 'hidden', pointerEvents: 'none' });
    const glintBar = el('div', 'abs', glint, { top: '-40px', width: '34px', height: '220px', background: 'rgba(255,250,225,.75)', transform: 'rotate(24deg)' });
    // RET: para piksel piksel dağılır
    const pops = [
      new Burst(cam, { n: 26, t0: RET, ox: 371, oy: 1196, colors: ['#F4BCD8', '#A8467E', '#B5D0EE', '#2F5F9E'], speed: 700, grav: 2000, life: 1.1, size: [12, 24], upBias: 0.4 }),
      new Burst(cam, { n: 10, t0: RET, ox: 683, oy: 1222, colors: ['#B5D0EE', '#2F5F9E', '#6E9BD6'], speed: 600, grav: 2000, life: 1.0, size: [12, 22], upBias: 0.4 }),
    ];
    const lbl = (x, y) => el('div', 'abs it', cam, { left: px(x - 160), width: '320px', top: px(y), textAlign: 'center', fontSize: '66px', color: '#F2B63C', display: 'none' });
    const total = lbl(540, 1059), lC = lbl(371, 1071), lD = lbl(683, 1119);
    const ask = lbl(540, 930);
    ask.style.fontSize = '120px'; ask.textContent = '?';
    const pct = el('div', 'abs it', cam, { left: '640px', top: '1196px', width: '86px', textAlign: 'center', fontSize: '36px', color: '#fff', background: '#C0392B', border: '4px solid #2A1E1A', borderRadius: '10px', display: 'none', transformOrigin: '50% 50%' });
    pct.textContent = '%10';
    const ink = (e, lit) => { e.style.color = lit ? '#2A1E1A' : '#F2B63C'; const c = lit ? '#F2B63C' : '#2A1E1A'; e.style.textShadow = `5px 0 0 ${c}, -5px 0 0 ${c}, 0 5px 0 ${c}, 0 -5px 0 ${c}`; };
    // KABUL / RET düğmeleri
    const btn = (x, col, dark, label, lcol) => {
      const b = el('div', 'abs', cam, { left: px(x - 64), top: '1290px', width: '128px', height: '64px' });
      el('div', 'abs', b, { left: 0, top: '18px', width: '128px', height: '46px', borderRadius: '50%', background: '#2A1E1A' });
      const cap = el('div', 'abs', b, { left: '10px', top: 0, width: '108px', height: '50px', borderRadius: '50%', background: col, border: '5px solid #2A1E1A', boxSizing: 'border-box', boxShadow: `inset 0 -8px 0 ${dark}` });
      const t = el('div', 'abs it', cam, { left: px(x - 100), width: '200px', top: '1376px', textAlign: 'center', fontSize: '46px', color: lcol, letterSpacing: '.06em' });
      t.textContent = label;
      return cap;
    };
    const yesCap = btn(710, '#3FB06F', '#2F8F5A', 'KABUL', '#4FC47E'), noCap = btn(910, '#E04A3A', '#A8301F', 'RET', '#FF7A66');
    // Diken'in kolu ve pençesi düğmelerin üstünde gidip gelir
    const arm = el('div', 'abs', cam, { left: 0, top: 0, width: '30px', height: '10px', background: '#A07C5C', border: '5px solid #2A1E1A', borderRadius: '16px', transformOrigin: '0 50%', display: 'none' });
    const paw = pixEl(cam, PAWP, PAWP_C, 10, { display: 'none' });
    // sinema katmanları: kenar karartma, film çizikleri, bantlar
    const vig = el('div', 'abs', s.root, { inset: 0, zIndex: 17, pointerEvents: 'none', background: 'radial-gradient(ellipse 75% 62% at 50% 56%, transparent 52%, rgba(0,0,0,.62) 100%)' });
    const scr = [0, 1].map(() => el('div', 'abs', s.root, { top: '236px', width: '3px', height: '1364px', background: 'rgba(255,240,210,.13)', zIndex: 18, display: 'none' }));
    const flash = el('div', 'abs', s.root, { inset: 0, zIndex: 21, opacity: 0, pointerEvents: 'none' });
    const barT = el('div', 'abs', s.root, { left: 0, top: 0, width: '1080px', height: '236px', background: '#0B0807', zIndex: 30 });
    const barB = el('div', 'abs', s.root, { left: 0, top: '1600px', width: '1080px', height: '320px', background: '#0B0807', zIndex: 30 });
    // karar anı: gerçek 3 saniyelik sayım + yorum çağrısı (oyunun arayüzü gibi)
    const cdg = el('div', 'abs', s.root, { left: 0, right: 0, top: '628px', display: 'none', justifyContent: 'center', alignItems: 'center', zIndex: 24 });
    const ring = el('div', '', cdg, { position: 'relative', width: '156px', height: '156px', borderRadius: '50%', flex: 'none' });
    const num = el('div', 'abs it', ring, { left: '15px', top: '15px', width: '126px', height: '126px', borderRadius: '50%', background: 'rgba(18,13,11,.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '112px', color: '#fff' });
    const pill = el('div', 'it', cdg, { marginLeft: '18px', padding: '6px 26px 12px', background: 'rgba(18,13,11,.88)', border: '4px solid #F2B63C', borderRadius: '16px', textAlign: 'left', lineHeight: 1.05 });
    pill.innerHTML = '<div style="font-size:82px;color:#fff">KARAR VER</div><div style="font-size:58px;color:#F2B63C">K mı, R mi? Yoruma yaz</div>';
    // ışıklar yanınca: deney panosu (yaklaşık on kişiden beşi düşük teklife RET der)
    const sci = el('div', 'abs', s.root, { inset: 0, background: '#F6EEE6', zIndex: 10, display: 'none' });
    pattern(sci);
    const src = el('div', 'abs', sci, { left: 0, right: 0, top: '606px', textAlign: 'center', fontSize: '40px', fontWeight: 800, color: '#4A3B30' });
    src.textContent = 'Kaynak: Camerer 2003';
    const RED = [0, 2, 4, 6, 8];
    const people = Array.from({ length: 10 }, (_, i) => {
      const x = 97 + (i % 5) * 190, y = 880 + Math.floor(i / 5) * 290;
      const fig = (c, d) => pixEl(sci, PERSONP, { o: '#2A1E1A', S: '#F3C9A8', C: c }, 18, { left: px(x), top: px(y), transformOrigin: '50% 100%', display: d });
      const tag = (txt, bg) => { const t = el('div', 'abs it', sci, { left: px(x - 14), width: '154px', boxSizing: 'border-box', top: px(y + 186), textAlign: 'center', fontSize: '48px', color: '#fff', background: bg, border: '4px solid #2A1E1A', borderRadius: '10px', display: 'none' }); t.textContent = txt; return t; };
      return { g: fig('#9AA3AD', 'block'), r: fig('#E04A3A', 'none'), k: fig('#3FB06F', 'none'), tag: tag('RET', '#C0392B'), ok: tag('KABUL', '#2F8F5A') };
    });
    const kick = (lt, t, a) => (lt >= t ? a * Math.exp(-(lt - t) * 1.6) * Math.sin((lt - t) * 7) : 0);
    // kalp atışları (audio.py ile aynı takvim): sayımda giderek hızlanır
    const beats = [];
    for (let t = ASK + 0.2, k = 0; t < RET - 0.1; t += Math.max(0.42, 0.62 - 0.03 * k), k++) beats.push(t);
    s.update = (lt) => {
      const F = lt >= NAME;  // aydınlık masa: adil bölüşüm
      // kamera planları
      let z = 1, fx = 540, fy = 1060;
      const ramp = (a, d) => E.inOut(prog(lt, a, d));
      if (lt < REVEAL) { z = 1.6 + 0.12 * ramp(0, 1.42); fy = 1170; }                         // ışık altında 1.000 TL (etiketler alt arayüz bandının üstünde)
      else if (lt < RULES) { const k = E.out(prog(lt, REVEAL, 0.35)); z = lerp(1.72, 1, k) + 0.02 * prog(lt, REVEAL + 0.35, 0.7); fy = lerp(1170, 1060, k); }  // geniş plana açılır
      else if (lt < DP) { z = 1.38 + 0.04 * prog(lt, RULES, 0.8); fx = 330; fy = 1140; }       // "Ceviz böler"
      else if (lt < BACK) { z = 1.38 + 0.06 * prog(lt, DP, 1.15); fx = 820; fy = 1140; }       // "Diken reddederse"
      else if (lt < OFFER) { z = 1 + 0.04 * prog(lt, BACK, 1.3); }
      else if (lt < CUT) { z = 1.4 + 0.08 * prog(lt, OFFER, CUT - OFFER); fx = 380; fy = 1120; }
      else if (lt < SLIDE + 0.25) { z = 1; }
      else if (lt < RET) { z = 1.45 + 0.13 * ramp(SLIDE + 0.25, RET - SLIDE - 0.25); fx = 820; fy = 1150; }  // Diken: şok, sonra karar
      else if (lt < RET + 1.2) { z = 1; }
      else if (lt < RET + 1.9) { z = 1.8 + 0.05 * prog(lt, RET + 1.2, 0.7); fx = 215; fy = 1330; }  // defter yakın planı
      else if (lt < RET + 2.4) { z = 1.5; fx = 300; fy = 1130; }                                  // Ceviz: şaşkın
      else if (lt < SCI) { z = 1.32 + 0.06 * prog(lt, RET + 2.4, SCI - RET - 2.4); fx = 830; fy = 1130; }  // Diken: soğuk bakış
      else if (lt >= ULT - 0.1 && lt < ULT + 0.7) { z = 1.45 + 0.05 * prog(lt, ULT - 0.1, 0.8); fx = 500; fy = 1210; }  // "ültimatom": masa tabelası
      else if (lt >= YES + 0.1 && lt < YES + 0.65) { z = 1.8; fx = 215; fy = 1330; }             // TAMAM
      else if (lt >= CTA) { z = 1 + 0.12 * ramp(CTA, 2.4); fy = 1060 + 50 * ramp(CTA, 2.4); }    // soru: desteye yaklaş
      let beat = -9;
      beats.forEach((t) => { if (lt >= t) beat = t; });
      z *= 1 + 0.014 * Math.exp(-(lt - beat) * 10);
      const sx = shake(lt, RET, 22, 0.5) + shake(lt, YES, 8, 0.3) + shake(lt, REVEAL, 10, 0.25);
      cam.style.transform = `translate(${540 - fx * z + sx}px,${1060 - fy * z}px) scale(${z})`;
      // ışık: sinemada karanlık; RET sonrası floresan titreyerek yanar; döngüden önce yine karanlık
      const on = (t) => { const k = lt - t; return k < 0 ? 0 : k >= 0.4 ? 1 : [0.15, 0, 0.55, 0.1, 0.8, 0.35, 1, 1][Math.floor(k / 0.05)]; };
      const L = lt < SCI ? 0 : lt < DIM ? on(SCI) : 1 - E.inOut(prog(lt, DIM, 0.45));
      const Lb = lt < SCI ? 0 : lt < DIM ? E.inOut(prog(lt, SCI + 0.1, 0.4)) : 1 - E.inOut(prog(lt, DIM, 0.45));
      const fl0 = lt >= 0.12 && lt < 0.36 ? [1, 0.25, 1, 0.1, 0.85, 1][Math.floor((lt - 0.12) / 0.04)] : 1;  // ampul titrer
      const fl = lt >= RET && lt < RET + 0.7 ? [1, 0.25, 1, 0.1, 0.8, 1, 0.3, 1][Math.floor((lt - RET) * 12) % 8] : fl0;
      const pulse = lt >= ASK && lt < RET ? 1 - 0.15 * Math.exp(-(lt - beat) * 14) : 1;
      day.style.opacity = L;
      bulb.style.opacity = fl;
      cone.style.opacity = fl * pulse * (1 - L);
      room.style.filter = `brightness(${0.7 + 0.3 * fl})`;
      lamp.style.transform = `rotate(${7 * Math.cos(lt * 2.2) * Math.exp(-lt * 0.12) + 1.5 * Math.sin(lt * 1.3) + kick(lt, REVEAL, 6) + kick(lt, RET, 9) + kick(lt, CTA, 4)}deg)`;
      dust.forEach((d) => {
        d.e.style.transform = `translate(${d.x + Math.sin(lt + d.ph) * 14}px,${700 + ((((d.y - lt * d.sp) % 560) + 560) % 560)}px)`;
        d.e.style.opacity = (1 - L) * (0.25 + 0.35 * (Math.sin(lt * 2 + d.ph) + 1));
      });
      barT.style.transform = `translateY(${-250 * Lb}px)`;
      barB.style.transform = `translateY(${330 * Lb}px)`;
      vig.style.opacity = 1 - 0.85 * Lb;
      const fi = Math.floor(lt * 12);
      scr.forEach((e, i) => { e.style.display = Lb < 0.5 && (fi + i * 5) % 7 === 0 ? 'block' : 'none'; e.style.left = px((fi * 397 + i * 211) % 1080); });
      const plateGlow = Math.max(Math.sin(Math.PI * prog(lt, RULES, 1.6)), Math.sin(Math.PI * prog(lt, ULT - 0.1, 1.0)));
      plate.style.boxShadow = `0 0 ${46 * plateGlow}px ${14 * plateGlow}px rgba(242,182,60,.85)`;
      glintBar.style.transform = `translateX(${lerp(-60, 200, prog(lt, 0.4, 0.5))}px) rotate(24deg)`;
      glint.style.display = lt < 1.0 ? 'block' : 'none';
      // para: teklifte 900 Ceviz'e, 100 Diken'e; RET'te dağılır; adil sahnede 500 / 500; soruda yine ortada
      const sp1 = E.inOut(prog(lt, SPLIT, 0.5)), sp2 = E.out(prog(lt, SLIDE, 0.45)), fp = E.inOut(prog(lt, FAIR, 0.5)), cp = E.inOut(prog(lt, CTA, 0.45));
      const OFF = [[300, 1191], [300, 1179], [300, 1167], [300, 1155], [300, 1143], [612, 1191]];
      const FAIRP = [[300, 1191], [300, 1179], [612, 1191], [612, 1179], [300, 1167], [612, 1167]];
      notes.forEach((n, i) => {
        let x = 469, y = 1191 - i * 12, sc = 1, op = 1;
        if (!F) {
          const k = i < 5 ? sp1 : sp2;
          x = lerp(x, OFF[i][0], k); y = lerp(y, OFF[i][1], k) - Math.sin(k * Math.PI) * 26;
          if (lt >= RET) { const q = prog(lt, RET, 0.12); sc = 1 + 0.3 * q; op = 1 - q; }
        } else {
          const k = fp * (1 - cp);
          x = lerp(x, FAIRP[i][0], k); y = lerp(y, FAIRP[i][1], k) - Math.sin(fp * Math.PI) * 22 - Math.sin(cp * Math.PI) * 22;
        }
        n.style.transform = `translate(${x}px,${y}px) scale(${sc})`;
        n.style.opacity = op;
      });
      pops.forEach((b) => b.update(F ? -1 : lt));
      const lit = L > 0.5;
      [total, lC, lD, ask].forEach((e) => ink(e, lit));
      // "ikisi de sıfır": deste etiketi iki kez kırmızı "0 TL" yanıp söner
      const zf = lt >= BACK + 0.55 && lt < BACK + 1.05 && Math.floor((lt - BACK - 0.55) / 0.13) % 2 === 0;
      total.textContent = zf ? '0 TL' : '1.000 TL';
      if (zf) total.style.color = '#FF6B57';
      total.style.display = (!F && sp1 < 0.5) || (F && (fp < 0.5 || cp > 0.5)) ? 'block' : 'none';
      lC.textContent = F ? '500' : '900'; lD.textContent = F ? '500' : '100';
      lC.style.display = (!F && sp1 > 0.6 && lt < RET) || (F && fp > 0.6 && cp < 0.4) ? 'block' : 'none';
      lD.style.display = (!F && sp2 > 0.6 && lt < RET) || (F && fp > 0.6 && cp < 0.4) ? 'block' : 'none';
      const lp = (t) => `scale(${E.back(prog(lt, t, 0.25))})`;
      lC.style.transform = lp(F ? FAIR + 0.3 : SPLIT + 0.3); lD.style.transform = lp(F ? FAIR + 0.3 : SLIDE + 0.27);
      lC.style.top = px(F ? 1095 : 1071); lD.style.top = px(F ? 1095 : 1119);
      pct.style.display = !F && lt >= SLIDE + 0.3 && lt < RET ? 'block' : 'none';
      pct.style.transform = `${lp(SLIDE + 0.3)} rotate(-8deg)`;
      ask.style.display = F && lt >= CTA + 0.3 ? 'block' : 'none';
      ask.style.transform = `scale(${E.back(prog(lt, CTA + 0.3, 0.3)) * (1 + 0.06 * Math.sin(lt * 6))})`;
      // defter: harf harf yazılır; RET'te çizilir; adil sahnede yeni sayfa; soruda boş sayfa
      const typed = (txt, a) => txt.slice(0, Math.floor(prog(lt, a, 0.45) * txt.length));
      const Q = F && lt >= CTA + 0.2;
      la.textContent = Q ? typed('CEVİZ ?', CTA + 0.3) : F ? typed('CEVİZ 500', FAIR + 0.4) : typed('CEVİZ 900', SPLIT + 0.3);
      lb.textContent = Q ? typed('DİKEN ?', CTA + 0.45) : F ? typed('DİKEN 500', FAIR + 0.6) : typed('DİKEN 100', SLIDE + 0.2);
      strike.style.display = !F && lt >= RET + 1.25 ? 'block' : 'none';
      zeroStamp.style.display = !F && lt >= RET + 1.4 ? 'block' : 'none';
      zeroStamp.style.transform = `scale(${lerp(2, 1, E.out(prog(lt, RET + 1.4, 0.2)))}) rotate(-8deg)`;
      okStamp.style.display = F && !Q && lt >= YES + 0.2 ? 'block' : 'none';
      okStamp.style.transform = `scale(${lerp(2, 1, E.out(prog(lt, YES + 0.2, 0.2)))}) rotate(-8deg)`;
      zeros.forEach((e) => { e.style.display = !F && lt >= RET + 0.55 && z < 1.1 ? 'block' : 'none'; e.style.transform = `scale(${E.back(prog(lt, RET + 0.55, 0.3))})`; });
      // düğmeler: "Ama bir şartla"da sırayla yanar, "reddederse"de RET yine yanar; basılınca çöker
      const glowAmt = (t, d) => { const g = Math.sin(Math.PI * prog(lt, t, d)); return g > 0 ? g : 0; };
      const gy = glowAmt(REVEAL + 0.15, 0.7), gn = Math.max(glowAmt(REVEAL + 0.5, 0.7), glowAmt(DP + 0.05, 1.2));
      yesCap.style.filter = gy > 0 ? `drop-shadow(0 0 ${22 * gy}px #7CF2A8)` : 'none';
      noCap.style.filter = gn > 0 ? `drop-shadow(0 0 ${22 * gn}px #FF8A7A)` : 'none';
      const press = (t) => (lt >= t && lt < t + 0.45 ? 12 : 0);
      noCap.style.transform = `translateY(${F ? 0 : press(RET)}px)`;
      yesCap.style.transform = `translateY(${F ? press(YES) : 0}px)`;
      // pençe: "Kabul"de KABUL'e, "ret"te RET'e; sayımda kararsız gidip gelir; "1"de RET'in üstünde titrer ve basar
      let pv = false, ppx = 810, ppy = 1276;
      if (!F && lt >= KAB - 0.15 && lt < RET + 0.6) {
        pv = true;
        ppy = 1272 + Math.sin(lt * 7) * 6;
        if (lt < RETW - 0.1) ppx = lerp(810, 710, E.out(prog(lt, KAB - 0.15, 0.3)));
        else if (lt < COUNT) ppx = lerp(710, 910, E.inOut(prog(lt, RETW - 0.1, 0.35)));
        else if (lt < COUNT + 2) ppx = lerp(710, 910, (Math.cos((lt - COUNT) * 2.6) + 1) / 2);
        else { ppx = lerp(lerp(710, 910, (Math.cos(2 * 2.6) + 1) / 2), 910, E.out(prog(lt, COUNT + 2, 0.3))) + Math.sin(lt * 40) * 3; }
        const g = prog(lt, RET - 0.3, 0.3);
        ppy = lerp(ppy, 1302, g * g);
        if (lt >= RET) ppy = 1302 - 56 * E.out(prog(lt, RET + 0.15, 0.3));
      }
      if (F && lt >= YES - 0.5 && lt < YES + 0.6) {
        pv = true;
        const g = prog(lt, YES - 0.5, 0.5);
        ppx = lerp(830, 710, E.out(g)); ppy = lerp(1272, 1302, g * g);
        if (lt >= YES) ppy = 1302 - 56 * E.out(prog(lt, YES + 0.15, 0.3));
      }
      paw.style.display = arm.style.display = pv ? 'block' : 'none';
      paw.style.transform = `translate(${ppx - 35}px,${ppy - 70}px)`;
      // kol: Diken'in gövdesinden (masa kenarının hemen üstü) pençeye
      const ax = 820, ay = 1236, bx = ppx, by = ppy - 36, len = Math.hypot(bx - ax, by - ay);
      arm.style.width = px(len); arm.style.transform = `translate(${ax}px,${ay - 10}px) rotate(${Math.atan2(by - ay, bx - ax)}rad)`;
      // flaşlar: RET kırmızı, KABUL yeşil
      const fr = !F && lt >= RET ? 0.5 * Math.exp(-(lt - RET) * 5) : 0, fg = F && lt >= YES ? 0.32 * Math.exp(-(lt - YES) * 5) : 0;
      flash.style.background = fr >= fg ? '#E04A3A' : '#3FB06F'; flash.style.opacity = Math.max(fr, fg);
      // gerçek 3 saniyelik sayım: 3 · 2 · 1
      const cd = lt >= COUNT && lt < RET;
      cdg.style.display = cd ? 'flex' : 'none';
      if (cd) {
        const k = prog(lt, COUNT, RET - COUNT), st = Math.min(2, Math.floor(lt - COUNT)), loc = lt - COUNT - st;
        ring.style.background = `conic-gradient(#E04A3A ${360 * (1 - k)}deg, rgba(255,255,255,.18) 0)`;
        num.textContent = String(3 - st);
        num.style.transform = `scale(${1 + 0.35 * (1 - E.out(Math.min(1, loc * 4)))})`;
        cdg.style.opacity = Math.min(1, (lt - COUNT) * 8);
      }
      // deney panosu: ışıklar yandıktan sonra gelir; kişiler belirir, beşi RET, beşi KABUL der
      const S = lt >= SCI + 0.45 && lt < NAME + 0.3;
      sci.style.display = S ? 'block' : 'none';
      sci.style.opacity = Math.min(prog(lt, SCI + 0.45, 0.25), 1 - prog(lt, NAME, 0.25));
      if (S) people.forEach((p, i) => {
        const ri = RED.indexOf(i), red = ri >= 0 && lt >= SCI + 1.3 + ri * 0.3, green = ri < 0 && lt >= SCI + 2.75;
        const pop = `scale(${E.back(prog(lt, SCI + 0.55 + i * 0.05, 0.25))})`;
        p.g.style.transform = p.r.style.transform = p.k.style.transform = pop;
        p.g.style.display = red || green ? 'none' : 'block'; p.r.style.display = red ? 'block' : 'none'; p.k.style.display = green ? 'block' : 'none';
        p.tag.style.display = red ? 'block' : 'none';
        p.tag.style.transform = `scale(${E.back(prog(lt, SCI + 1.3 + ri * 0.3, 0.2))}) rotate(-6deg)`;
        p.ok.style.display = green ? 'block' : 'none';
        p.ok.style.transform = `scale(${E.back(prog(lt, SCI + 2.75, 0.2))}) rotate(-6deg)`;
      });
      // oyuncular
      let c = ['happy', null, 'half'], d = ['calm', null, 'half'];
      if (lt >= RULES) c = ['happy', 'face', 'half'];
      if (lt >= DP + 0.35) d = ['curious', null, 'wide'];
      if (lt >= BACK) d = ['calm', null, 'mood'];
      if (lt >= OFFER) c = ['happy', null, 'half'];
      if (lt >= SPLIT) c = ['happy', 'face', 'half'];
      if (lt >= SLIDE + 0.25) d = ['curious', null, 'wide'];
      if (lt >= ASK + 0.55) d = ['thoughtful', null, 'half'];
      if (lt >= KAB) d = ['thoughtful', null, 'mood'];
      if (lt >= RETW) d = ['thoughtful', null, 'half'];
      if (lt >= COUNT) d = ['thoughtful', 'face', 'squeeze'];
      if (lt >= COUNT + 2) d = ['curious', null, 'wide'];
      if (lt >= RET - 0.3) d = ['calm', null, 'squeeze'];
      if (lt >= RET) { c = ['curious', 'up', 'x']; d = ['calm', null, 'half']; }
      if (lt >= SCI && lt < SCI + 0.45) { c = ['calm', null, 'closed']; d = ['calm', null, 'closed']; }
      if (F) { c = ['calm', null, 'mood']; d = ['calm', null, 'mood']; }
      if (F && lt >= YES) { c = ['happy', 'wave', 'happy']; d = ['happy', 'up', 'happy']; }
      if (F && lt >= CTA) { c = ['curious', null, 'mood']; d = ['thoughtful', null, 'mood']; }
      const bl = (e, off) => (e === 'mood' && ((lt + off) * 1000) % 2900 < 120 ? 'closed' : e);
      cz.set(c[0], c[1], bl(c[2], 0.3)); dk.set(d[0], d[1], bl(d[2], 1.1));
      // ışık: girişte karanlıkta silüet, "Ama bir şartla"da yüzler aydınlanır; sayımda Diken gölgeye çekilir
      const base = lerp(0.84, 1, L), intro = lt < REVEAL ? 0.45 : lerp(0.45, 1, E.out(prog(lt, REVEAL, 0.35)));
      const tense = lt >= COUNT && lt < RET ? 1 - 0.18 * prog(lt, COUNT, RET - COUNT) : 1;
      const hit = lt >= RET && lt < RET + 0.12 ? 1.25 : 1;
      cz.root.style.filter = `brightness(${(base * intro * hit).toFixed(3)})`;
      dk.root.style.filter = `brightness(${(base * intro * tense * hit).toFixed(3)})`;
      let cx = 230, cy = 1310, cr = Math.sin(lt * 1.4) * 2, dy = 1310, dr = Math.sin(lt * 1.2 + 1) * 2;
      if (lt >= REVEAL && lt < REVEAL + 0.5) { const k = lt - REVEAL; cr -= 6 * Math.exp(-k * 6) * Math.sin(k * 20); dr += 6 * Math.exp(-k * 6) * Math.sin(k * 20); }  // ikisi birden irkilir
      if (!F && lt >= RET) { const k = lt - RET; cr = -10 * Math.exp(-k * 3) * Math.cos(k * 14); cx -= 18 * Math.exp(-k * 2); }
      if (F && lt >= YES && lt < CTA) { cy -= hop(lt, 0.48, 18).y; dy -= hop(lt, 0.48, 18, 0.24).y; }
      if (F && lt >= CTA) { cr = Math.sin(lt * 2.4) * 4; dr = Math.sin(lt * 2.4 + 1.2) * 4; }  // düşünür gibi sallanırlar
      cz.put(cx, cy, { rot: cr }); dk.put(850, dy, { rot: dr });
    };
  };

  /* Gece 02.00: sepet bombası. Yatakta Ceviz, telefonda %70 indirim ve geri sayım. Gerçek 3 saniyelik karar anı,
   * sayaç bitince "SÜRE DOLDU", sayfa yenilenince sayaç baştan başlar; araştırma panosu, Cep Defteri ekranı, soru.
   * İki dünya: A yatak odası, B telefon ekranı; kamera planları ikisi arasında keser. */
  SCENES.sepet = (t0, o = {}) => {
    const s = scene(t0, '#07080D', undefined, o.wdur ?? 0.4);
    const ev = (k) => o[k] ?? 99;
    const ROOM = ev('room'), PROD = ev('prod'), PRICE = ev('price'), PUSH = ev('push'), FACE = ev('face'), PAW = ev('paw'), COUNT = ev('count');
    const PULL = ev('pull'), RESET = ev('reset'), SHOCK = ev('shock'), SCI = ev('sci'), APP = ev('app'), DOWN = ev('down'), CTA = ev('cta'), BUZZ = ev('buzz');
    const ZERO = o.zero ?? 11.1, SPAN = 12;  // sayaç ZERO'da 00:00 olur; döngü kopyası açılıştaki rakamı göstersin diye kendi ZERO'sunu alır
    const SY = 1120;  // odak noktasının ekrandaki yüksekliği: üstteki kutu ve altyazının altında kalan sahne alanı
    const world = () => el('div', 'abs', s.root, { left: 0, top: 0, width: '1080px', height: '1920px', transformOrigin: '0 0' });

    // ── A · yatak odası (gece) ──
    const camA = world();
    el('div', 'abs', camA, { left: '-80px', top: '-80px', width: '1240px', height: '2080px', background: 'linear-gradient(#0A0E1C, #141A31 55%, #0F1328)' });
    const win = el('div', 'abs', camA, { left: '650px', top: '640px', width: '300px', height: '320px', boxSizing: 'border-box', border: '12px solid #2A2F48', background: 'linear-gradient(#121A3E, #22306A)', overflow: 'hidden' });
    el('div', 'abs', win, { left: '190px', top: '22px', width: '58px', height: '58px', borderRadius: '50%', background: '#F3EBC8', boxShadow: '0 0 40px 12px rgba(243,235,200,.25)' });
    [[24, 30], [84, 64], [150, 16], [40, 118], [236, 112], [112, 150]].forEach(([x, y]) => el('div', 'abs', win, { left: px(x), top: px(y), width: '6px', height: '6px', background: '#DDE3FF' }));
    [[0, 206, 62, 110], [56, 176, 52, 140], [104, 222, 70, 90], [170, 192, 46, 120], [212, 232, 80, 80]].forEach(([x, y, w, h], i) => {
      const b = el('div', 'abs', win, { left: px(x), top: px(y), width: px(w), height: px(h), background: '#0C1126' });
      for (let k = 0; k < 3; k++) el('div', 'abs', b, { left: px(10 + ((k * 17 + i * 7) % (w - 22))), top: px(14 + k * 22), width: '8px', height: '10px', background: (k + i) % 2 ? '#F2C14E' : '#343A5C' });
    });
    el('div', 'abs', win, { left: '132px', top: 0, width: '12px', height: '100%', background: '#2A2F48' });
    el('div', 'abs', win, { left: 0, top: '140px', width: '100%', height: '12px', background: '#2A2F48' });
    el('div', 'abs', camA, { left: '606px', top: '626px', width: '58px', height: '370px', background: 'linear-gradient(90deg, #241D44, #362C62)' });
    el('div', 'abs', camA, { left: '936px', top: '626px', width: '58px', height: '370px', background: 'linear-gradient(90deg, #362C62, #241D44)' });
    el('div', 'abs', camA, { left: '590px', top: '612px', width: '420px', height: '16px', background: '#1E1838' });
    el('div', 'abs', camA, { left: '300px', top: '960px', width: '700px', height: '760px', clipPath: 'polygon(50% 0, 93% 0, 58% 100%, 0 100%)', background: 'linear-gradient(rgba(150,170,255,.10), rgba(150,170,255,.02))' });  // ay ışığı
    // karyola başlığı ve yastık
    el('div', 'abs', camA, { left: '226px', top: '980px', width: '628px', height: '420px', boxSizing: 'border-box', border: '10px solid #22160F', borderRadius: '40px 40px 0 0', background: 'linear-gradient(#4A3428, #31221A)' });
    el('div', 'abs', camA, { left: '266px', top: '1024px', width: '548px', height: '12px', background: '#5C4335' });
    el('div', 'abs', camA, { left: '318px', top: '1166px', width: '444px', height: '150px', boxSizing: 'border-box', border: '8px solid #24273F', borderRadius: '60px', background: 'linear-gradient(#7C82AA, #5E6488)' });
    const cz = new Mascot(camA, { who: 'ceviz', w: 480 });
    // elindeki telefon (arkası görünür) ve iki pençe ucu
    const php = el('div', 'abs', camA, { left: 0, top: 0, width: '80px', height: '124px', boxSizing: 'border-box', border: '6px solid #2A1E1A', borderRadius: '16px', background: 'linear-gradient(#2A2D3E, #1A1C28)', zIndex: 3, transformOrigin: '50% 50%' });
    el('div', 'abs', php, { left: '8px', top: '8px', width: '18px', height: '18px', boxSizing: 'border-box', borderRadius: '50%', background: '#0B0C12', border: '3px solid #444A5E' });
    const fingers = [0, 1].map(() => el('div', 'abs', camA, { left: 0, top: 0, width: '26px', height: '34px', boxSizing: 'border-box', border: '5px solid #2A1E1A', borderRadius: '10px', background: '#A8683A', zIndex: 4 }));
    // battaniye
    el('div', 'abs', camA, { left: '170px', top: '1374px', width: '740px', height: '420px', boxSizing: 'border-box', border: '8px solid #1A1530', borderRadius: '44px 44px 0 0', background: 'repeating-conic-gradient(#3E3469 0 25%, #483E7A 0 50%) 0 0 / 80px 80px', zIndex: 2 });
    el('div', 'abs', camA, { left: '178px', top: '1382px', width: '724px', height: '40px', borderRadius: '36px 36px 0 0', background: '#5A4E92', zIndex: 2 });
    // battaniyenin üstünde Cep Defteri defteri: marka ilk oda planından itibaren görünür
    const book = el('div', 'abs', camA, { left: '648px', top: '1398px', width: '236px', height: '92px', boxSizing: 'border-box', border: '5px solid #2A1E1A', borderRadius: '8px 14px 14px 8px', background: 'linear-gradient(90deg, #7A2F0E 0 20px, #AE4716 20px 200px, #5C2209 200px 210px, #AE4716 210px)', transform: 'rotate(-7deg)', zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '10px', fontSize: '30px', fontWeight: 800, color: '#FFFCF6', letterSpacing: '.04em' });
    book.textContent = 'CEP DEFTERİ';
    // komodinler: solda telefonun bırakılacağı yer, sağda lamba ve saat
    [[-40, 230], [890, 230]].forEach(([x, w]) => {
      el('div', 'abs', camA, { left: px(x), top: '1296px', width: px(w), height: '420px', boxSizing: 'border-box', border: '8px solid #22160F', background: '#3A2A22', zIndex: 2 });
      el('div', 'abs', camA, { left: px(x - 10), top: '1280px', width: px(w + 20), height: '26px', boxSizing: 'border-box', border: '6px solid #22160F', background: '#4C372B', zIndex: 2 });
    });
    const nsGlow = el('div', 'abs', camA, { left: '-110px', top: '1120px', width: '400px', height: '260px', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(150,210,255,.6), rgba(150,210,255,0))', opacity: 0, zIndex: 1 });
    const lampGlow = el('div', 'abs', camA, { left: '700px', top: '840px', width: '560px', height: '560px', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,210,140,.55), rgba(255,210,140,0))', opacity: 0, zIndex: 1 });
    el('div', 'abs', camA, { left: '1000px', top: '1150px', width: '12px', height: '136px', background: '#5A4A3A', zIndex: 2 });
    const shade = el('div', 'abs', camA, { left: '936px', top: '1070px', width: '140px', height: '92px', clipPath: 'polygon(24% 0, 76% 0, 100% 100%, 0 100%)', background: '#6E604C', zIndex: 2 });
    const clock = el('div', 'abs it', camA, { left: '880px', top: '1188px', width: '184px', height: '96px', boxSizing: 'border-box', border: '6px solid #2A1E1A', borderRadius: '12px', background: '#14141B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', color: '#FF4A3A', textShadow: '0 0 14px rgba(255,74,58,.8)', zIndex: 3 });
    clock.innerHTML = '02<span>:</span>00';
    const colon = clock.querySelector('span');
    // telefon ışığı yüze vurur: soğuk beyaz; sayaç her saniye kırmızı nabız atar
    const glow = (rgb) => el('div', 'abs', camA, { left: '340px', top: '1085px', width: '400px', height: '340px', borderRadius: '50%', background: `radial-gradient(closest-side, rgba(${rgb},.5), rgba(${rgb},.18) 60%, rgba(${rgb},0))`, mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 5 });
    const glowC = glow('150,200,255'), glowR = glow('255,60,40');
    const beam = el('div', 'abs', camA, { left: '380px', top: '1110px', width: '320px', height: '200px', clipPath: 'polygon(0 0, 100% 0, 62% 100%, 38% 100%)', background: 'linear-gradient(rgba(150,200,255,0), rgba(150,200,255,.28))', mixBlendMode: 'screen', pointerEvents: 'none', zIndex: 5 });
    const warm = el('div', 'abs', camA, { left: '-80px', top: '-80px', width: '1240px', height: '2080px', background: 'rgba(255,190,120,.18)', mixBlendMode: 'screen', opacity: 0, zIndex: 6, pointerEvents: 'none' });
    const sweats = [0, 1].map(() => pixEl(camA, SWEAT, SWEAT_C, 9, { left: 0, top: 0, display: 'none', zIndex: 5 }));
    const zz = [0, 1, 2].map((i) => { const e = el('div', 'abs it', camA, { left: 0, top: 0, fontSize: px(70 - i * 14), color: '#DDE3FF', display: 'none', zIndex: 5 }); e.textContent = 'z'; return e; });

    // ── B · telefon ekranı (Ceviz'in gözünden) ──
    const camB = world();
    el('div', 'abs', camB, { left: '-300px', top: '-300px', width: '1680px', height: '2520px', background: 'radial-gradient(ellipse 760px 1000px at 840px 1300px, #1B2140, #07080D 70%)' });
    el('div', 'abs', camB, { left: '150px', top: '640px', width: '780px', height: '1520px', boxSizing: 'border-box', border: '8px solid #2B2D36', borderRadius: '86px', background: '#121318', boxShadow: '0 0 140px 40px rgba(150,190,255,.16)' });
    const scr = el('div', 'abs', camB, { left: '172px', top: '662px', width: '736px', height: '1476px', borderRadius: '64px', overflow: 'hidden', background: '#FFF8F2' });
    const sb = el('div', 'abs', scr, { left: '40px', right: '40px', top: '10px', height: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '30px', fontWeight: 800, color: '#1E1A18', zIndex: 3 });
    sb.innerHTML = '<span>02:00</span><span style="display:flex;gap:10px;align-items:center"><i style="display:block;width:30px;height:18px;background:#1E1A18;clip-path:polygon(0 100%,100% 0,100% 100%)"></i><i style="display:block;position:relative;width:46px;height:24px;box-sizing:border-box;border:3px solid #1E1A18;border-radius:6px"><b style="position:absolute;left:3px;top:3px;bottom:3px;width:9px;background:#E8322A"></b></i></span>';
    const page = el('div', 'abs', scr, { left: 0, top: 0, width: '736px', height: '1476px' });
    const search = el('div', 'abs', page, { left: '24px', right: '24px', top: '56px', height: '58px', boxSizing: 'border-box', borderRadius: '29px', background: '#F0E6DD', display: 'flex', alignItems: 'center', padding: '0 24px', fontSize: '28px', fontWeight: 600, color: '#9A8F88' });
    search.innerHTML = `Ürün ara…<span style="margin-left:auto;position:relative;display:block;width:42px;height:30px">${pix(BASKETP, BASKETP_C, 3)}<b style="position:absolute;right:-12px;top:-12px;width:24px;height:24px;border-radius:50%;background:#E8322A;color:#fff;font-size:17px;display:flex;align-items:center;justify-content:center">1</b></span>`;
    const ban = el('div', 'abs', page, { left: 0, right: 0, top: '124px', height: '226px', background: '#E8322A' });
    const l1 = el('div', 'abs it', ban, { left: 0, right: 0, top: '12px', textAlign: 'center', fontSize: '50px', color: '#FFE08A', letterSpacing: '.04em' });
    const dg = el('div', 'abs it', ban, { left: 0, right: 0, top: '54px', textAlign: 'center', fontSize: '166px', color: '#FFFFFF', letterSpacing: '.05em', textShadow: '0 8px 0 rgba(0,0,0,.22)', transformOrigin: '50% 55%' });
    const track = el('div', 'abs', ban, { left: '60px', right: '60px', top: '204px', height: '10px', borderRadius: '5px', background: 'rgba(0,0,0,.28)', overflow: 'hidden' });
    const fill = el('div', 'abs', track, { left: 0, top: 0, bottom: 0, width: '100%', background: '#FFE08A' });
    const card = el('div', 'abs', page, { left: '24px', right: '24px', top: '362px', height: '168px', borderRadius: '26px', background: '#F3ECE6' });
    el('div', 'abs', card, { left: px(344 - 77), top: '24px', width: '154px', height: '121px' }).innerHTML = pix(HEADPH, HEADPH_C, 11);
    const scarce = el('div', 'abs', card, { left: '18px', top: '16px', padding: '4px 14px', borderRadius: '14px', background: '#FFE3DE', color: '#C0392B', fontSize: '26px', fontWeight: 800 });
    scarce.textContent = 'Son 2 ürün!';
    el('div', 'abs', card, { left: '20px', top: '62px', fontSize: '24px', fontWeight: 700, color: '#C0392B' }).textContent = '37 kişi bakıyor';
    const badge = el('div', 'abs it', card, { right: '18px', top: '14px', padding: '0 16px 6px', borderRadius: '14px', border: '4px solid #2A1E1A', background: '#E8322A', color: '#fff', fontSize: '60px', transformOrigin: '50% 50%' });
    badge.textContent = '%70';
    el('div', 'abs', page, { left: '30px', top: '540px', fontSize: '38px', fontWeight: 700, color: '#2A1E1A' }).textContent = 'Kablosuz Kulaklık';
    const oldP = el('div', 'abs', page, { left: '30px', top: '596px', fontSize: '48px', fontWeight: 600, color: '#857A73' });
    oldP.textContent = '4.999 TL';
    const strikeL = el('div', 'abs', oldP, { left: '-4px', top: '31px', height: '7px', width: '0', borderRadius: '3px', background: '#E8322A' });
    const newP = el('div', 'abs', page, { right: '30px', top: '578px', fontSize: '90px', fontWeight: 800, color: '#E8322A', letterSpacing: '-.02em', transformOrigin: '100% 60%' });
    newP.textContent = '1.499 TL';
    const buy = el('div', 'abs', page, { left: '30px', right: '30px', top: '694px', height: '104px', borderRadius: '52px', background: '#F25C2A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '62px', fontWeight: 800, color: '#fff', letterSpacing: '.02em', transformOrigin: '50% 50%' });
    [0, 1, 2].forEach((i) => el('div', 'abs', page, { left: px(30 + i * 230), top: '830px', width: '216px', height: '216px', borderRadius: '22px', background: '#F0E6DD' }));
    const spin = el('div', 'abs', scr, { left: '336px', top: '60px', width: '64px', height: '64px', boxSizing: 'border-box', borderRadius: '50%', border: '9px solid #E8322A', borderTopColor: 'transparent', display: 'none', zIndex: 4 });
    const rflash = el('div', 'abs', scr, { inset: 0, background: '#fff', opacity: 0, zIndex: 5 });
    // Cep Defteri ekranı: elektronik bütçesinde kalan 300 TL
    const app = el('div', 'abs', scr, { inset: 0, background: '#F6EEE6', display: 'none', zIndex: 2 });
    const appHead = el('div', 'abs', app, { left: 0, right: 0, top: 0, height: '250px', background: '#AE4716' });
    el('div', 'abs', appHead, { left: '40px', top: '150px', fontSize: '54px', fontWeight: 800, color: '#FFFCF6', letterSpacing: '-.02em' }).textContent = 'Cep Defteri';
    const appCard = el('div', 'abs', app, { left: '30px', right: '30px', top: '270px', height: '330px', boxSizing: 'border-box', padding: '26px 34px', borderRadius: '34px', background: '#FFFCF6', boxShadow: '0 10px 30px rgba(60,20,0,.12)' });
    appCard.innerHTML = '<div style="font-size:34px;font-weight:700;color:#6B5A4E">Elektronik · bu ay kalan</div>'
      + '<div style="font-size:112px;font-weight:800;color:#2F8F5A;letter-spacing:-.03em;line-height:1.05;margin-top:6px">300 TL</div>'
      + '<div style="height:22px;border-radius:11px;background:#E7E0D5;overflow:hidden;margin-top:20px"><div style="height:100%;width:80%;background:#AE4716;border-radius:11px"></div></div>'
      + '<div style="font-size:28px;font-weight:600;color:#8A7D72;margin-top:10px">1.200 / 1.500 TL harcandı</div>';
    const ghost = el('div', 'abs', app, { left: '30px', right: '30px', top: '620px', height: '110px', boxSizing: 'border-box', padding: '0 30px', borderRadius: '28px', border: '5px dashed #E8322A', background: '#FFE3DE', display: 'flex', alignItems: 'center', fontSize: '40px', fontWeight: 700, color: '#2A1E1A', transformOrigin: '50% 50%' });
    ghost.innerHTML = 'Kulaklık<b style="margin-left:auto;color:#E8322A;font-size:46px">1.499 TL</b>';
    const over = el('div', 'abs it', app, { left: 0, right: 0, top: '744px', textAlign: 'center', fontSize: '62px', color: '#C0392B', transformOrigin: '50% 50%' });
    over.textContent = 'BÜTÇEYİ 1.199 TL AŞAR';
    // Ceviz'in pençesi ve kolu (alttan girer)
    const arm = el('div', 'abs', camB, { left: 0, top: 0, width: '72px', height: '900px', boxSizing: 'border-box', border: '6px solid #2A1E1A', borderRadius: '36px', background: '#A8683A', display: 'none' });
    const paw = pixEl(camB, PAWP, { o: '#2A1E1A', B: '#A8683A' }, 16, { left: 0, top: 0, display: 'none' });

    // ── üst katmanlar: araştırma panosu, kenar karartma, flaş, sinema bantları, karar çağrısı ──
    const sci = el('div', 'abs', s.root, { inset: 0, background: '#F6EEE6', zIndex: 10, display: 'none' });
    pattern(sci);
    const ic1 = pixEl(sci, MAGP, MAGP_C, 12, { left: '104px', top: '770px', transformOrigin: '50% 50%' });
    const ic2 = pixEl(sci, TIMERP, TIMERP_C, 12, { left: '104px', top: '1012px', transformOrigin: '50% 50%' });
    const big = (y, col) => el('div', 'abs it', sci, { left: '262px', top: px(y), fontSize: '170px', color: col, transformOrigin: '0 50%' });
    const n1 = big(744, '#2A1E1A'), n2 = big(988, '#E8322A');
    const lab = (y, txt) => { const e = el('div', 'abs', sci, { left: '268px', top: px(y), fontSize: '44px', fontWeight: 700, color: '#6B5A4E' }); e.textContent = txt; return e; };
    const lab1 = lab(902, 'alışveriş sitesi tarandı'), lab2 = lab(1146, 'sitede geri sayım sayacı');
    const ic3 = pixEl(sci, WARNP, WARNP_C, 12, { left: '104px', top: '1256px', transformOrigin: '50% 50%' });
    const n3 = big(1232, '#C0392B'), lab3 = lab(1390, 'sitede sayaç aldatıcıydı');
    const stampS = el('div', 'abs', sci, { left: '590px', top: '1256px', padding: '6px 22px', borderRadius: '16px', border: '8px solid #C0392B', background: 'rgba(255,255,255,.92)', color: '#C0392B', fontSize: '66px', fontWeight: 800, letterSpacing: '.02em', transformOrigin: '50% 50%' });
    stampS.textContent = 'BİTMEDİ!';
    const src = el('div', 'abs', sci, { left: 0, right: 0, top: '1448px', textAlign: 'center', fontSize: '34px', fontWeight: 800, color: '#4A3B30' });
    src.textContent = 'Kaynak: Mathur ve ark. 2019 (Princeton)';
    const vig = el('div', 'abs', s.root, { inset: 0, zIndex: 17, pointerEvents: 'none', background: 'radial-gradient(ellipse 78% 62% at 50% 58%, transparent 50%, rgba(0,0,0,.66) 100%)' });
    const flash = el('div', 'abs', s.root, { inset: 0, zIndex: 21, opacity: 0, pointerEvents: 'none' });
    el('div', 'abs', s.root, { left: 0, top: 0, width: '1080px', height: '236px', background: '#05060A', zIndex: 30 });
    el('div', 'abs', s.root, { left: 0, top: '1506px', width: '1080px', height: '414px', background: '#05060A', zIndex: 30 });  // alt bant: elde çekim titremesinde bile ekranda 1536'nın üstünde biter, sahne Instagram arayüzüne taşmaz
    const pill = el('div', 'abs it', s.root, { left: 0, right: 0, top: '608px', display: 'none', justifyContent: 'center', zIndex: 24 });
    const pin = el('div', '', pill, { padding: '4px 28px 10px', borderRadius: '16px', border: '4px solid #F2B63C', background: 'rgba(10,10,16,.9)', fontSize: '62px', color: '#fff', lineHeight: 1 });
    pin.innerHTML = 'AL mı, BIRAK mı? <span style="color:#F2B63C">Yoruma yaz</span>';

    // kalp atışları (audio.py ile aynı takvim): Ceviz terlemeye başlayınca gelir, sayımda hızlanır
    const beats = [];
    for (let t = FACE + 0.1, k = 0; t < ZERO - 0.1; t += Math.max(0.42, 0.62 - 0.03 * k), k++) beats.push(t);
    const mmss = (x) => `${String(Math.floor(x / 60)).padStart(2, '0')}:${String(x % 60).padStart(2, '0')}`;
    const on = (lt, t) => { const k = lt - t; return k < 0 ? 0 : k >= 0.4 ? 1 : [0.15, 0, 0.6, 0.1, 0.85, 0.4, 1, 1][Math.floor(k / 0.05)]; };
    s.update = (lt) => {
      const ramp = (a, d) => E.inOut(prog(lt, a, d));
      // sayaç: ZERO'ya kadar saniye saniye; sonra "SÜRE DOLDU"; yenilenince 10:00'dan yeniden
      const st = lt < ZERO ? 0 : lt < RESET ? 1 : 2;
      const left = Math.ceil(ZERO - lt - 1e-9);
      const since = st === 0 ? lt - ZERO + left : st === 2 ? (lt - RESET) % 1 : 9;  // son tıktan beri geçen süre
      const urgent = lt >= COUNT && lt < ZERO;
      dg.textContent = st === 0 ? mmss(left) : st === 1 ? '00:00' : mmss(600 - Math.floor(lt - RESET));
      dg.style.transform = `scale(${1 + (urgent ? 0.14 : 0.06) * Math.exp(-since * 10)})`;
      dg.style.color = urgent && since < 0.25 ? '#FFE08A' : '#FFFFFF';
      dg.style.opacity = st === 1 && lt < ZERO + 0.9 && Math.floor((lt - ZERO) / 0.15) % 2 ? 0.25 : 1;
      ban.style.background = st === 1 ? '#8C8580' : urgent && since < 0.12 ? '#FF4A3A' : '#E8322A';
      l1.textContent = st === 1 ? 'SÜRE DOLDU' : 'FLAŞ İNDİRİM BİTİYOR!';
      fill.style.width = (st === 0 ? clamp((ZERO - lt) / SPAN) : st === 1 ? 0 : 1 - (lt - RESET) / 600) * 100 + '%';
      // fiyat: ürün planı açılır açılmaz eski fiyat 4.999 TL çizilir, 1.499 TL parlar, %70 rozeti patlar
      // (1.499 indirimli fiyat olarak okunur); "Yüzde yetmiş" denince rozet bir kez daha büyür; süre dolunca her şey griye döner
      const gray = st === 1 ? 'grayscale(1) opacity(.7)' : 'none';
      [newP, buy, badge, card].forEach((e) => (e.style.filter = gray));
      newP.style.transform = `scale(${1 + 0.18 * Math.sin(Math.PI * prog(lt, PROD + 0.35, 0.4))})`;
      oldP.style.opacity = lt >= PROD ? 1 : 0;
      oldP.style.transform = `translateX(${(1 - E.out(prog(lt, PROD, 0.2))) * -60}px)`;
      strikeL.style.width = E.out(prog(lt, PROD + 0.1, 0.25)) * 222 + 'px';
      badge.style.display = lt >= PROD + 0.55 ? 'block' : 'none';
      badge.style.transform = `rotate(${-8 + 3 * Math.sin(lt * 5)}deg) scale(${E.back(prog(lt, PROD + 0.55, 0.3)) * (1 + 0.35 * Math.sin(Math.PI * prog(lt, PRICE, 0.4)))})`;
      buy.textContent = st === 1 ? 'SÜRE DOLDU' : 'SATIN AL';
      buy.style.transform = `scale(${st === 1 ? 1 : 1 + 0.025 * Math.sin(lt * 8)})`;
      buy.style.boxShadow = `inset 0 -10px 0 ${st === 1 ? '#6E6863' : '#B83C17'}, 0 0 ${st === 1 ? 0 : Math.round(30 + 20 * Math.sin(lt * 8))}px rgba(242,92,42,.55)`;
      // sayfayı aşağı çekip yenileme; bırakınca yükleniyor, sonra beyaz flaş ve yeni sayaç
      const drag = lt >= PULL && lt < PULL + 1.0 ? E.inOut(prog(lt, PULL, 0.85)) : lt >= PULL + 1.0 && lt < PULL + 1.3 ? 1 - E.out(prog(lt, PULL + 1.0, 0.25)) : 0;
      page.style.transform = `translateY(${170 * drag}px)`;
      page.style.opacity = lt >= PULL + 1.0 && lt < RESET ? 0.55 : 1;
      spin.style.display = lt >= PULL + 0.25 && lt < RESET ? 'block' : 'none';
      spin.style.top = px(lt < PULL + 1.0 ? 52 + 60 * drag : 60);
      spin.style.transform = `rotate(${Math.round(lt * 720)}deg)`;
      rflash.style.opacity = lt >= RESET ? 0.9 * Math.exp(-(lt - RESET) * 7) : 0;
      // Cep Defteri ekranı kayarak gelir; kulaklık bütçeyi aşar
      app.style.display = lt >= APP && lt < DOWN + 0.5 ? 'block' : 'none';
      app.style.transform = `translateX(${(1 - E.out(prog(lt, APP, 0.3))) * 100}%)`;
      ghost.style.opacity = prog(lt, APP + 0.35, 0.2);
      ghost.style.transform = `scale(${E.back(prog(lt, APP + 0.35, 0.3))})`;
      over.style.opacity = lt >= APP + 0.8 ? 1 : 0;
      over.style.transform = `scale(${lerp(1.8, 1, E.out(prog(lt, APP + 0.8, 0.2)))}) rotate(-3deg)`;
      // pençe: düğmenin yanında; sayımda yaklaşır, çekilir, titrer; süre dolunca iner; sonra sayfayı çeker
      let pv = false, ppx = 800, ppy = 1760;
      if (lt >= PAW && lt < ZERO + 0.6) {
        pv = true;
        ppy = lerp(1760, 1430, E.out(prog(lt, PAW, 0.45)));
        if (lt >= COUNT) {
          const k = lt - COUNT;
          ppy = 1430 - 26 * Math.max(0, Math.sin(k * 3.3)) + Math.sin(lt * 41) * 3;
          ppx = 800 - 30 * Math.max(0, Math.sin(k * 2.1));
        }
        if (lt >= ZERO) { const q = prog(lt, ZERO, 0.45); ppy += 360 * q * q; }
      }
      if (lt >= PULL - 0.35 && lt < PULL + 1.35) {
        pv = true;
        ppx = 860;
        ppy = lerp(1760, 1010, E.out(prog(lt, PULL - 0.35, 0.35))) + 170 * (lt < PULL + 1.0 ? drag : 1) + 760 * E.inOut(prog(lt, PULL + 1.0, 0.35));
      }
      paw.style.display = arm.style.display = pv ? 'block' : 'none';
      paw.style.transform = `translate(${ppx - 56}px,${ppy - 56}px)`;
      arm.style.transform = `translate(${ppx - 36}px,${ppy + 20}px)`;

      // oda: lamba SCI'de titreyerek yanar, DOWN'da söner
      const L = lt < SCI ? 0 : lt < DOWN + 0.5 ? on(lt, SCI) : 1 - E.inOut(prog(lt, DOWN + 0.5, 0.3));
      lampGlow.style.opacity = L;
      shade.style.background = L > 0.5 ? '#F6D9A0' : '#6E604C';
      warm.style.opacity = L;
      colon.style.opacity = Math.floor(lt * 2) % 2 ? 0.15 : 1;
      // telefon ışığı: elde tuttukça yüzde; sayaç tıklarında kırmızı nabız; SÜRE DOLDU'da söner; sıfırlanınca kırmızı patlama
      const held = lt < DOWN + 0.35, dkBeam = 1 - prog(lt, DOWN, 0.2);
      const cool = held ? (st === 1 ? 0.35 : 0.7) : Math.max(0, 0.7 * (1 - prog(lt, DOWN + 0.35, 0.3)));
      glowC.style.opacity = cool;
      beam.style.opacity = cool * (dkBeam);
      const red = st === 0 ? (urgent ? 0.85 : 0.5) * Math.exp(-since * 5) : st === 2 && lt < SCI ? 0.8 * Math.exp(-(lt - RESET) * 2.5) + 0.35 * Math.exp(-since * 5) : 0;
      glowR.style.opacity = held ? red : 0;
      // Ceviz
      let c = ['calm', null, 'half'];
      if (lt >= PROD) c = ['curious', null, 'wide'];
      if (lt >= FACE) c = ['thoughtful', 'face', 'squeeze'];
      if (lt >= ZERO) c = ['calm', null, 'wide'];
      if (lt >= SHOCK) c = ['curious', null, 'wide'];
      if (lt >= SCI) c = ['thoughtful', null, 'half'];
      if (lt >= DOWN) c = ['happy', null, 'closed'];
      if (lt >= CTA) c = ['calm', null, 'closed'];
      if (lt >= BUZZ + 0.25) c = ['curious', null, 'half'];
      if (lt >= BUZZ + 0.7) c = ['curious', null, 'wide'];
      cz.set(c[0], c[1], c[2] === 'half' && (lt * 1000) % 3100 < 110 ? 'closed' : c[2]);
      let cy = 1475, cr = Math.sin(lt * 1.3) * 1.5;
      if (lt >= SHOCK && lt < SCI) { const k = lt - SHOCK; cy -= 26 * Math.exp(-k * 5) * Math.abs(Math.sin(k * 16)); cr += 5 * Math.exp(-k * 4) * Math.sin(k * 24); }
      if (lt >= DOWN) cy += 46 * E.inOut(prog(lt, DOWN + 0.6, 0.6));
      const sleep = lt >= DOWN + 1.2 && lt < BUZZ ? 0.018 * Math.sin(lt * 2.4) : 0;  // uykuda nefes alır
      cz.put(540, cy, { rot: cr, sy: 1 + sleep, sx: 1 - sleep * 0.5, flip: lt >= BUZZ + 0.25 });  // titreşimde telefona döner
      cz.root.style.filter = `brightness(${(0.62 + 0.33 * L).toFixed(3)})`;
      // telefon: göğüs hizasında; DOWN'da sol komodine yüzüstü bırakılır; BUZZ'da titreyip parlar
      const dk = E.inOut(prog(lt, DOWN, 0.55));
      const pxp = lerp(540, 92, dk), pyp = lerp(1336, 1262, dk) - Math.sin(dk * Math.PI) * 90;
      const jit = lt >= BUZZ && lt < BUZZ + 0.9 ? Math.sin(lt * 90) * 4 : 0;
      php.style.transform = `translate(${pxp - 40 + jit}px,${pyp - 62}px) rotate(${-12 * Math.sin(dk * Math.PI)}deg) scale(${lerp(1, 1.25, dk)},${lerp(1, 0.2, dk)})`;
      php.style.boxShadow = held ? `0 -6px 40px 10px rgba(165,210,255,${(0.35 * cool).toFixed(2)})` : lt >= BUZZ ? `0 0 ${Math.round(30 + 20 * Math.sin(lt * 20))}px 12px rgba(150,210,255,.6)` : 'none';
      fingers.forEach((f, i) => {
        f.style.display = dk < 0.3 ? 'block' : 'none';
        f.style.transform = `translate(${pxp - 40 + (i ? 66 : -12)}px,${pyp - 12}px)`;
      });
      nsGlow.style.opacity = lt >= BUZZ ? 0.8 * (0.6 + 0.4 * Math.sin(lt * 20)) * (1 - prog(lt, BUZZ + 1.4, 0.4)) : 0;
      sweats.forEach((e, i) => {
        const a = FACE + 0.2 + i * 0.5, k = ((((lt - a) % 1.1) + 1.1) % 1.1) / 1.1;
        e.style.display = (lt >= a && lt < PAW) || (lt >= SHOCK + 0.2 + i * 0.3 && lt < SCI) ? 'block' : 'none';
        e.style.transform = `translate(${i ? 412 : 650}px,${1170 + k * 70}px)`;
        e.style.opacity = 1 - k * 0.6;
      });
      zz.forEach((e, i) => {
        const a = DOWN + 0.9 + i * 0.45, k = ((((lt - a) % 1.4) + 1.4) % 1.4) / 1.4;
        e.style.display = lt >= a && lt < BUZZ ? 'block' : 'none';
        e.style.transform = `translate(${640 + i * 40 + Math.sin(k * 6) * 14}px,${1100 - k * 170}px)`;
        e.style.opacity = Math.sin(Math.PI * k);
      });

      // araştırma panosu: tarama sayacı, geri sayım sayacı, örnek kart ve BİTMEDİ damgası
      const S = lt >= SCI + 0.45 && lt < APP;
      sci.style.display = S ? 'block' : 'none';
      sci.style.opacity = Math.min(prog(lt, SCI + 0.45, 0.2), 1 - prog(lt, APP - 0.15, 0.15));
      if (S) {
        const p1 = prog(lt, SCI + 0.55, 0.3), p2 = prog(lt, SCI + 1.8, 0.3);
        [ic1, n1, lab1].forEach((e) => popIn(e, p1, { fromX: -120, fromY: 0 }));
        [ic2, n2, lab2].forEach((e) => popIn(e, p2, { fromX: -120, fromY: 0 }));
        n1.textContent = fmt(E.out(prog(lt, SCI + 0.6, 1.0)) * 11000);
        n2.textContent = fmt(E.out(prog(lt, SCI + 1.9, 0.7)) * 361);
        ic1.style.transform += ` rotate(${Math.sin(lt * 9) * 10 * (1 - prog(lt, SCI + 1.6, 0.3))}deg)`;
        ic2.style.opacity = lt >= SCI + 2.6 && Math.floor(lt / 0.3) % 2 ? 0.4 : ic2.style.opacity;
        [ic3, n3, lab3].forEach((e) => popIn(e, prog(lt, SCI + 3.2, 0.3), { fromX: -120, fromY: 0 }));
        n3.textContent = fmt(E.out(prog(lt, SCI + 3.3, 0.6)) * 140);
        stampS.style.opacity = lt >= SCI + 4.6 ? 1 : 0;
        stampS.style.transform = `rotate(-8deg) scale(${lerp(2.2, 1, E.out(prog(lt, SCI + 4.6, 0.2)))})`;
        src.style.opacity = prog(lt, SCI + 0.8, 0.4);
      }
      vig.style.opacity = S ? 0.25 : 1;

      // kamera planları (A: oda, B: ekran)
      let W = 'B', z = 1, fx = 540, fy = SY;
      if (lt < ROOM) { z = 1.85 + 0.12 * ramp(0, ROOM); fy = 914; }                                         // sayacın yakın planı
      else if (lt < PROD) { W = 'A'; z = 1.08 - 0.08 * E.out(prog(lt, ROOM, 0.7)); fy = 1150; }             // oda: yatakta Ceviz, saat 02:00
      else if (lt < PRICE) { z = 1.08 + 0.03 * prog(lt, PROD, PRICE - PROD); fy = 1112; }                   // ürün ve fiyat
      else if (lt < PUSH) { z = 1.11 + 0.03 * prog(lt, PRICE, PUSH - PRICE); fy = 1116; }                   // "%70 indirim"
      else if (lt < FACE) { z = 1.66 + 0.08 * ramp(PUSH, FACE - PUSH); fy = 914; }                         // "süre bitiyor": sayacın yakın planı
      else if (lt < PAW) { W = 'A'; z = 1.75 + 0.06 * prog(lt, FACE, PAW - FACE); fy = 1225; }               // Ceviz terliyor
      else if (lt < PULL) { const k = ramp(PAW, ZERO - PAW); z = 1.1 + 0.06 * k; fy = 1120 + 30 * k; }      // karar: sayaç, düğme, pençe
      else if (lt < RESET) { z = 1.1; fy = 1110; }
      else if (lt < SHOCK) { const k = E.out(prog(lt, RESET, 0.2)); z = lerp(1.1, 1.75, k) + 0.04 * prog(lt, RESET + 0.2, 0.8); fy = lerp(1110, 914, k); }  // 10:00
      else if (lt < SCI) { W = 'A'; z = 1.55; fy = 1215; }                                                  // Ceviz: "?"
      else if (lt < APP) { W = 'A'; z = 1 + 0.03 * prog(lt, SCI, APP - SCI); fy = 1150; }                   // lamba yanar, pano gelir
      else if (lt < DOWN) { z = 1.1; fy = 1120; }                                                            // Cep Defteri
      else if (lt < CTA) { W = 'A'; z = 1.2 - 0.12 * ramp(DOWN, CTA - DOWN); fx = 420; fy = 1220; }        // telefonu bırakır, uyur
      else { W = 'A'; z = 1 + 0.06 * ramp(CTA, 3); fy = 1150; }                                             // soru
      let beat = -9;
      beats.forEach((t) => { if (lt >= t) beat = t; });
      z *= 1 + 0.012 * Math.exp(-(lt - beat) * 10) + (W === 'B' ? 0.008 * Math.exp(-since * 12) : 0);
      const sx = shake(lt, ZERO, 18, 0.45) + shake(lt, RESET, 24, 0.5) + shake(lt, SHOCK, 10, 0.3);
      camA.style.display = W === 'A' ? 'block' : 'none';
      camB.style.display = W === 'B' ? 'block' : 'none';
      (W === 'A' ? camA : camB).style.transform = `translate(${540 - fx * z + sx}px,${SY - fy * z}px) scale(${z})`;
      // flaşlar: süre dolunca kırmızı, sayaç sıfırlanınca beyaz
      const fr = lt >= ZERO ? 0.45 * Math.exp(-(lt - ZERO) * 5) : 0, fw = lt >= RESET ? 0.55 * Math.exp(-(lt - RESET) * 6) : 0;
      flash.style.background = fr >= fw ? '#E04A3A' : '#FFFFFF';
      flash.style.opacity = Math.max(fr, fw);
      // karar çağrısı (sayımda altyazının yerinde)
      pill.style.display = urgent ? 'flex' : 'none';
      pill.style.opacity = Math.min(1, (lt - COUNT) * 8);
      pin.style.transform = `scale(${1 + 0.04 * Math.exp(-since * 10)})`;
    };
  };

  /* Aynadaki sen: gece yarısı banyo, harçlık yattı. Ayna titrer, yansıma 60 yaşındaki Ceviz olur: "Bunun kaçı bana?"
   * Gerçek 3 saniyelik karar anı (ŞİMDİ / SONRA kavanozları, yaşlı Ceviz'in elinde kum saati), aynada araştırma panosu,
   * "Sensin": yarısı genç yarısı yaşlı yüz, Cep Defteri'nde hedef, soru; ışık söner, yaşlı yüz döner (döngü).
   * İki dünya: A banyo (ayna, tezgâh, arkadan Ceviz), B telefon ekranı; kamera planları ikisi arasında keser. */
  SCENES.ayna = (t0, o = {}) => {
    deriveCeviz();
    const s = scene(t0, '#06080C', undefined, o.wdur ?? 0.4);
    const ev = (k) => o[k] ?? 99;
    const LIGHT = ev('light'), NOTIF = ev('notif'), AMT = ev('amt'), DANCE = ev('dance'), FLICK = ev('flick'), AGE = ev('age'), OLD = ev('old');
    const ASK = ev('ask'), JARS = ev('jars'), COUNT = ev('count'), ZERO = ev('zero'), SCI = ev('sci'), LESSON = ev('lesson'), WAVE = ev('wave');
    const DROP = ev('drop'), SPLIT = ev('split'), APP = ev('app'), BACK = ev('back'), OFF = ev('off');
    const SY = 1080;  // odak noktasının ekrandaki yüksekliği: kutu ve altyazının altında kalan sahne alanı
    const world = () => el('div', 'abs', s.root, { left: 0, top: 0, width: '1080px', height: '1920px', transformOrigin: '0 0' });
    const tiles = (c, g, n) => ({ backgroundColor: c, backgroundImage: `linear-gradient(90deg, ${g} 0 6px, transparent 6px), linear-gradient(${g} 0 6px, transparent 6px)`, backgroundSize: `${n}px ${n}px` });

    // ── A · banyo ──
    const camA = world();
    const room = el('div', 'abs', camA, { left: 0, top: 0, width: '1080px', height: '1920px' });  // duvar, lamba, ayna çerçevesi
    el('div', 'abs', room, { left: '-200px', top: '-200px', width: '1480px', height: '1440px', ...tiles('#3A6A74', 'rgba(10,30,36,.35)', 108) });
    const lampGlow = el('div', 'abs', room, { left: '240px', top: '300px', width: '760px', height: '340px', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,240,200,.45), rgba(255,240,200,0))' });
    const lampBar = el('div', 'abs', room, { left: '390px', top: '426px', width: '460px', height: '34px', boxSizing: 'border-box', border: '6px solid #2A1E1A', borderRadius: '17px', background: '#FFF4D6' });
    el('div', 'abs', room, { left: '300px', top: '470px', width: '640px', height: '720px', boxSizing: 'border-box', border: '20px solid #8C6A4A', borderRadius: '14px', boxShadow: 'inset 0 0 0 6px #6B4E35, 0 18px 40px rgba(0,0,0,.35)' });
    // ayna: içinde yansıyan oda, yansıma, kum saati, pano, cızırtı katmanları
    const glass = el('div', 'abs', camA, { left: '320px', top: '490px', width: '600px', height: '680px', overflow: 'hidden', background: '#1C3A42' });
    const reflBg = el('div', 'abs', glass, { left: 0, top: 0, width: '600px', height: '680px' });  // aynadaki oda
    el('div', 'abs', reflBg, { left: '-20px', top: '-20px', width: '640px', height: '720px', ...tiles('#2E5761', 'rgba(10,30,36,.35)', 84) });
    el('div', 'abs', reflBg, { left: '26px', top: '110px', width: '150px', height: '620px', boxSizing: 'border-box', border: '10px solid #5E4330', background: '#7A5A40' });  // kapı
    el('div', 'abs', reflBg, { left: '150px', top: '420px', width: '14px', height: '14px', borderRadius: '50%', background: '#E0B04A' });
    el('div', 'abs', reflBg, { left: '470px', top: '238px', width: '104px', height: '14px', borderRadius: '7px', background: '#C9CCD2' });  // havluluk ve havlu
    el('div', 'abs', reflBg, { left: '480px', top: '248px', width: '84px', height: '230px', borderRadius: '0 0 12px 12px', background: 'repeating-linear-gradient(#CFC4B2 0 18px, #BDB09A 18px 30px)' });
    const refl = el('div', 'abs', glass, { left: 0, top: 0, width: '600px', height: '680px' });  // yansıma (karanlıkta aynanın ışığıyla parlar)
    const RX = 360, RB = 734;  // yansımanın alt-orta noktası (ayna içinde); yüz dünyada ≈ (707, 976)
    const ry = new Mascot(refl, { who: 'ceviz', w: 440 }), ro = new Mascot(refl, { who: 'ceviz60', w: 440 });
    const hg = el('div', 'abs', refl, { left: '126px', top: '400px', width: '90px', height: '140px', transformOrigin: '50% 50%', display: 'none' });  // kum saati
    hg.innerHTML = '<svg width="90" height="140" viewBox="0 0 90 140"><path d="M16 14 L74 14 L48 70 L74 126 L16 126 L42 70 Z" fill="rgba(215,240,255,.45)" stroke="#2A1E1A" stroke-width="4"/>'
      + '<polygon class="st" fill="#E9B949"/><polygon class="sb" fill="#E9B949"/><rect class="ss" x="43.5" y="70" width="3" height="54" fill="#E9B949"/>'
      + '<rect x="2" y="2" width="86" height="14" rx="4" fill="#8C6A4A" stroke="#2A1E1A" stroke-width="4"/><rect x="2" y="124" width="86" height="14" rx="4" fill="#8C6A4A" stroke="#2A1E1A" stroke-width="4"/></svg>';
    const hgT = hg.querySelector('.st'), hgB = hg.querySelector('.sb'), hgS = hg.querySelector('.ss');
    // araştırma panosu: aynanın içinde belirir
    const board = el('div', 'abs', glass, { inset: 0, background: '#F6EEE6', display: 'none' });
    pattern(board);
    const portrait = (x, who, label, tint) => {
      const f = el('div', 'abs', board, { left: px(x), top: '160px', width: '220px', height: '190px', boxSizing: 'border-box', border: '8px solid #2A1E1A', borderRadius: '20px', overflow: 'hidden', background: tint, transformOrigin: '50% 50%' });
      const m = new Mascot(f, { who, w: 340 });
      m.set('calm', null, 'mood'); m.put(123, 284);
      const l = el('div', 'abs', board, { left: px(x - 20), top: '356px', width: '260px', textAlign: 'center', fontSize: '34px', fontWeight: 800, color: '#6B5A4E' });
      l.textContent = label;
      return [f, l];
    };
    const pY = portrait(60, 'ceviz', 'kendi yüzü', '#DDE8EC'), pO = portrait(320, 'ceviz60', 'yaşlı yüzü', '#ECE6F4');
    const ring = el('div', 'abs', board, { left: '308px', top: '148px', width: '244px', height: '214px', boxSizing: 'border-box', border: '8px solid #F2B63C', borderRadius: '28px', opacity: 0 });
    const bjar = (x) => {
      const j = el('div', 'abs', board, { left: px(x), top: '410px', width: '150px', height: '150px', boxSizing: 'border-box', border: '6px solid #2A1E1A', borderRadius: '18px 18px 26px 26px', background: 'rgba(200,230,245,.5)', overflow: 'hidden', transformOrigin: '50% 100%' });
      const fl = el('div', 'abs', j, { left: 0, right: 0, bottom: 0, height: 0, background: '#2B7178' });
      el('div', 'abs', j, { left: 0, right: 0, top: '8px', textAlign: 'center', fontSize: '22px', fontWeight: 800, color: '#2A1E1A' }).textContent = 'emeklilik';
      return [j, fl];
    };
    const jY = bjar(95), jO = bjar(355);
    const drops = [[0, 152, 2.35], [0, 152, 2.67], [0, 152, 2.99], [1, 412, 2.3], [1, 412, 2.55], [1, 412, 2.8], [1, 412, 3.05], [1, 412, 3.3]]
      .map(([j, x, t]) => ({ j, x, t, e: pixEl(board, TLCOIN, TLCOIN_C, 6, { left: px(x - 18), top: 0, display: 'none' }) }));
    const up = pixEl(board, ARROWP, { o: '#2F8F5A' }, 12, { left: '516px', top: '432px', transform: 'rotate(-90deg)', opacity: 0 });
    const src = el('div', 'abs', board, { left: 0, right: 0, top: '598px', textAlign: 'center', fontSize: '24px', fontWeight: 800, color: '#4A3B30' });
    src.textContent = 'Kaynak: Hershfield ve ark. 2011 (Stanford)';
    const ghost = el('div', 'abs', glass, { inset: 0, background: 'radial-gradient(ellipse 55% 45% at 64% 72%, rgba(120,255,225,.42), rgba(120,255,225,0) 72%)', mixBlendMode: 'screen', opacity: 0, pointerEvents: 'none' });
    const scan = el('div', 'abs', glass, { inset: 0, background: 'repeating-linear-gradient(rgba(150,255,240,.16) 0 3px, transparent 3px 9px)', mixBlendMode: 'screen', opacity: 0, pointerEvents: 'none' });
    const gbars = [0, 1, 2].map(() => el('div', 'abs', glass, { left: '-20px', width: '640px', height: '26px', background: 'rgba(130,255,235,.4)', mixBlendMode: 'screen', display: 'none', pointerEvents: 'none' }));
    const gflash = el('div', 'abs', glass, { inset: 0, background: '#E8FFFB', opacity: 0, pointerEvents: 'none' });
    el('div', 'abs', glass, { left: '-140px', top: '-80px', width: '200px', height: '900px', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.09), rgba(255,255,255,0))', transform: 'rotate(18deg)', pointerEvents: 'none' });  // cam parıltısı

    // ön plan: tezgâh, lavabo, telefon, kavanozlar, arkadan Ceviz, kolu ve paralar
    const front = el('div', 'abs', camA, { left: 0, top: 0, width: '1080px', height: '1920px' });
    const sticky = el('div', 'abs', front, { left: '900px', top: '720px', width: '150px', height: '118px', boxSizing: 'border-box', paddingTop: '14px', background: '#F2B63C', boxShadow: '0 6px 10px rgba(0,0,0,.25)', transform: 'rotate(6deg)', textAlign: 'center', fontSize: '21px', fontWeight: 800, lineHeight: 1.15, color: '#5C2209' });
    sticky.innerHTML = 'CEP<br>DEFTERİ’NE<br>YAZ!';  // aynaya yapışık not: marka ilk plandan görünür
    el('div', 'abs', front, { left: '-200px', top: '1186px', width: '1480px', height: '54px', boxSizing: 'border-box', borderTop: '6px solid #2A1E1A', background: 'linear-gradient(#EFEAE1, #D8D0C4)' });
    el('div', 'abs', front, { left: '-200px', top: '1240px', width: '1480px', height: '500px', boxSizing: 'border-box', borderTop: '8px solid #2A1E1A', background: '#47565E' });
    [-60, 240, 540, 840].forEach((x) => el('div', 'abs', front, { left: px(x + 14), top: '1268px', width: '272px', height: '400px', boxSizing: 'border-box', border: '6px solid #36434A', borderRadius: '10px' }));
    el('div', 'abs', front, { left: '430px', top: '1192px', width: '220px', height: '30px', borderRadius: '50%', background: '#B9C3C9', boxShadow: 'inset 0 6px 0 #8E9BA3' });  // lavabo
    el('div', 'abs', front, { left: '528px', top: '1120px', width: '22px', height: '80px', boxSizing: 'border-box', border: '4px solid #2A1E1A', borderRadius: '8px', background: '#C9CCD2' });  // musluk
    el('div', 'abs', front, { left: '500px', top: '1112px', width: '70px', height: '22px', boxSizing: 'border-box', border: '4px solid #2A1E1A', borderRadius: '11px', background: '#C9CCD2' });
    const phGlow = el('div', 'abs', front, { left: '560px', top: '1040px', width: '280px', height: '200px', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(150,210,255,.6), rgba(150,210,255,0))', mixBlendMode: 'screen', opacity: 0 });
    const php = el('div', 'abs', front, { left: '640px', top: '1172px', width: '110px', height: '30px', boxSizing: 'border-box', border: '5px solid #2A1E1A', borderRadius: '10px', background: '#1A1C28' });
    const jar = (x, label, col) => {
      el('div', 'abs', front, { left: px(x + 8), top: '1046px', width: '96px', height: '22px', boxSizing: 'border-box', border: '5px solid #2A1E1A', borderRadius: '6px', background: '#C9CCD2' });  // kapak
      const j = el('div', 'abs', front, { left: px(x), top: '1062px', width: '112px', height: '146px', boxSizing: 'border-box', border: '6px solid #2A1E1A', borderRadius: '16px 16px 24px 24px', background: 'rgba(205,232,245,.55)', overflow: 'hidden' });
      const lb = el('div', 'abs', j, { left: '-6px', right: '-6px', top: '44px', height: '46px', boxSizing: 'border-box', borderTop: '4px solid #2A1E1A', borderBottom: '4px solid #2A1E1A', background: '#FFFCF6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '27px', fontWeight: 800, color: col });
      lb.textContent = label;
      return j;
    };
    const jNow = jar(740, 'ŞİMDİ', '#C0392B'), jLater = jar(958, 'SONRA', '#2B7178');
    [[14, 100], [50, 104]].forEach(([x, y]) => pixEl(jNow, TLCOIN, TLCOIN_C, 5, { left: px(x), top: px(y) }));
    const inJar = pixEl(jLater, NOTE, NOTE_CS[0], 6, { left: '17px', top: '100px', display: 'none' });
    const cz = new Mascot(front, { who: 'cevizback', w: 600 });
    // pençe, kavanozların arasından yükselir; alttaki eksen etrafında ŞİMDİ'ye ya da SONRA'ya eğilir
    const HX = 904;
    const hand = el('div', 'abs', front, { left: 0, top: 0, width: 0, height: 0, display: 'none' });
    const fan = el('div', 'abs', hand, { left: 0, top: '-772px', width: 0, height: 0 });
    const fanN = [-26, -13, 0, 13, 26].map((r) => pixEl(fan, NOTE, NOTE_CS[0], 9, { left: '-50px', top: '-46px', transformOrigin: '50% 100%', transform: `rotate(${r}deg)` }));
    el('div', 'abs', hand, { left: '-36px', top: '-712px', width: '72px', height: '760px', boxSizing: 'border-box', border: '6px solid #2A1E1A', borderRadius: '36px', background: '#A8683A' });
    pixEl(hand, PAWP, { o: '#2A1E1A', B: '#A8683A' }, 14, { left: '-49px', top: '-790px' });
    const fall = pixEl(front, NOTE, NOTE_CS[0], 9, { left: 0, top: 0, display: 'none' });
    const sweats = [0, 1].map(() => pixEl(front, SWEAT, SWEAT_C, 9, { left: 0, top: 0, display: 'none' }));
    const bang = el('div', 'abs', front, { left: '296px', top: '610px', fontSize: '230px', fontWeight: 800, lineHeight: 1, color: '#FFE08A', textShadow: '7px 0 0 #2A1E1A, -7px 0 0 #2A1E1A, 0 7px 0 #2A1E1A, 0 -7px 0 #2A1E1A, 5px 5px 0 #2A1E1A, -5px 5px 0 #2A1E1A, 5px -5px 0 #2A1E1A, -5px -5px 0 #2A1E1A, 0 14px 0 #2A1E1A', display: 'none', transformOrigin: '50% 100%' });
    bang.textContent = '!';

    // ── B · telefon ──
    const camB = world();
    el('div', 'abs', camB, { left: '-300px', top: '-300px', width: '1680px', height: '2520px', background: 'radial-gradient(ellipse 760px 1000px at 840px 1300px, #1B2140, #07080D 70%)' });
    el('div', 'abs', camB, { left: '150px', top: '640px', width: '780px', height: '1520px', boxSizing: 'border-box', border: '8px solid #2B2D36', borderRadius: '86px', background: '#121318', boxShadow: '0 0 140px 40px rgba(150,190,255,.16)' });
    const scr = el('div', 'abs', camB, { left: '172px', top: '662px', width: '736px', height: '1476px', borderRadius: '64px', overflow: 'hidden', background: '#0E1424' });
    const lock = el('div', 'abs', scr, { inset: 0, background: 'linear-gradient(#22345E, #0E1424 70%)' });
    el('div', 'abs', lock, { left: 0, right: 0, top: '110px', textAlign: 'center', fontSize: '176px', fontWeight: 700, color: '#EAF0FF', letterSpacing: '-.03em' }).textContent = '00:00';
    el('div', 'abs', lock, { left: 0, right: 0, top: '318px', textAlign: 'center', fontSize: '40px', fontWeight: 600, color: '#B8C4E0' }).textContent = '1 Kasım';
    const card = el('div', 'abs', lock, { left: '28px', right: '28px', top: '420px', height: '236px', boxSizing: 'border-box', padding: '24px 24px 0 132px', borderRadius: '36px', background: 'rgba(245,247,252,.94)' });
    el('div', 'abs', card, { left: '26px', top: '30px', width: '86px', height: '86px', borderRadius: '22px', background: '#2F8F5A' }).innerHTML = `<div style="position:absolute;left:13px;top:13px">${pix(TLCOIN, TLCOIN_C, 10)}</div>`;
    card.insertAdjacentHTML('beforeend', '<div style="font-size:27px;font-weight:700;color:#7A7F8C">BANKA · şimdi</div><div style="font-size:40px;font-weight:700;color:#1E1A18;margin-top:6px">Harçlık yattı</div>'
      + '<div class="amt" style="font-size:66px;font-weight:800;color:#2F8F5A;letter-spacing:-.02em;transform-origin:0 60%;margin-top:2px">+1.000 TL</div>');
    const amt = card.querySelector('.amt');
    const sparks = [0, 1, 2, 3, 4, 5].map(() => pixEl(lock, TLCOIN, TLCOIN_C, 6, { left: 0, top: 0, display: 'none' }));
    // Cep Defteri: Yatırım ekranında "Birikim hedefleri" (uygulamadaki adlarla)
    const app = el('div', 'abs', scr, { inset: 0, background: '#F6EEE6', display: 'none' });
    const head = el('div', 'abs', app, { left: 0, right: 0, top: 0, height: '250px', background: '#AE4716' });
    el('div', 'abs', head, { left: '40px', top: '92px', fontSize: '30px', fontWeight: 700, color: '#FFD9C4' }).textContent = 'Cep Defteri';
    el('div', 'abs', head, { left: '40px', top: '134px', fontSize: '66px', fontWeight: 800, color: '#FFFCF6', letterSpacing: '-.02em' }).textContent = 'Yatırım';
    const gcard = el('div', 'abs', app, { left: '30px', right: '30px', top: '280px', height: '340px', borderRadius: '34px', background: '#FFFCF6', boxShadow: '0 10px 30px rgba(60,20,0,.12)' });
    el('div', 'abs', gcard, { left: '34px', top: '32px', fontSize: '38px', fontWeight: 800, color: '#2A1E1A' }).textContent = 'Birikim hedefleri';
    const addB = el('div', 'abs', gcard, { right: '28px', top: '24px', padding: '4px 22px 8px', borderRadius: '28px', border: '4px solid #2B7178', color: '#2B7178', fontSize: '32px', fontWeight: 800, transformOrigin: '50% 50%' });
    addB.textContent = '+ Hedef';
    const empty = el('div', 'abs', gcard, { left: '34px', right: '34px', top: '130px', fontSize: '32px', fontWeight: 600, color: '#8A7D72' });
    empty.textContent = 'İstersen bir hedef koy.';
    const goal = el('div', 'abs', gcard, { left: '20px', right: '20px', top: '104px', height: '214px', boxSizing: 'border-box', padding: '26px 24px', borderRadius: '24px', background: '#EEF5F4', opacity: 0, transformOrigin: '50% 50%' });
    goal.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:40px;font-weight:800;color:#2A1E1A">Gelecekteki ben</span><span class="gv" style="font-size:32px;font-weight:800;color:#2B7178">0 / 2.000 TL</span></div>'
      + '<div style="height:24px;border-radius:12px;background:#E7DFD0;overflow:hidden;margin-top:28px"><div class="gf" style="height:100%;width:0;background:#2B7178;border-radius:12px"></div></div>'
      + '<div class="gc" style="font-size:30px;font-weight:700;color:#6B5A4E;margin-top:18px;opacity:0">%10 · 1.800 TL kaldı</div>';
    const gv = goal.querySelector('.gv'), gf = goal.querySelector('.gf'), gc = goal.querySelector('.gc');
    const armB = el('div', 'abs', camB, { left: 0, top: 0, width: '72px', height: '900px', boxSizing: 'border-box', border: '6px solid #2A1E1A', borderRadius: '36px', background: '#A8683A', display: 'none' });
    const pawB = pixEl(camB, PAWP, { o: '#2A1E1A', B: '#A8683A' }, 16, { left: 0, top: 0, display: 'none' });

    // ── üst katmanlar: kenar karartma, flaş, sinema bantları, karar çağrısı ──
    el('div', 'abs', s.root, { inset: 0, zIndex: 17, pointerEvents: 'none', background: 'radial-gradient(ellipse 78% 62% at 50% 58%, transparent 50%, rgba(0,0,0,.66) 100%)' });
    const flash = el('div', 'abs', s.root, { inset: 0, zIndex: 21, opacity: 0, pointerEvents: 'none' });
    el('div', 'abs', s.root, { left: 0, top: 0, width: '1080px', height: '236px', background: '#05060A', zIndex: 30 });
    el('div', 'abs', s.root, { left: 0, top: '1506px', width: '1080px', height: '414px', background: '#05060A', zIndex: 30 });  // alt bant: elde çekim titremesinde bile 1536'nın üstünde biter
    const pill = el('div', 'abs it', s.root, { left: 0, right: 0, top: '608px', display: 'none', justifyContent: 'center', zIndex: 24 });
    const pin = el('div', '', pill, { padding: '4px 28px 10px', borderRadius: '16px', border: '4px solid #F2B63C', background: 'rgba(10,10,16,.9)', fontSize: '62px', color: '#fff', lineHeight: 1 });
    pin.innerHTML = 'Kaçını ayırırsın? <span style="color:#F2B63C">Yoruma yaz</span>';

    // kalp atışları (audio.py ile aynı takvim): kavanozlar gelince başlar, sayımda hızlanır
    const beats = [];
    for (let t = JARS + 0.1, k = 0; t < ZERO - 0.1; t += Math.max(0.42, 0.62 - 0.03 * k), k++) beats.push(t);
    const hz = (k) => { const x = Math.sin(k * 12.9898 + 4.1) * 43758.5453; return x - Math.floor(x); };
    const on = (lt, t) => { const k = lt - t; return k < 0 ? 0 : k >= 0.4 ? 1 : [0.15, 0, 0.6, 0.1, 0.85, 0.4, 1, 1][Math.floor(k / 0.05)]; };
    const dips = [FLICK + 0.04, FLICK + 0.3, FLICK + 0.62, AGE + 0.15, AGE + 0.55, AGE + 0.9, AGE + 1.2, OLD - 0.08];  // lamba titremeleri
    const inDip = (lt, w = 0.08) => dips.some((d) => lt >= d && lt < d + w);
    s.update = (lt) => {
      const ramp = (a, d) => E.inOut(prog(lt, a, d));
      const fr = Math.floor(lt * 30);
      // ışık: karanlıkta açılır, ayna titrerken lamba göz kırpar, sonda söner
      let L = lt < LIGHT ? 0 : on(lt, LIGHT);
      if (inDip(lt)) L *= 0.25;
      if (lt >= OFF) L = lt < OFF + 0.12 ? 0.45 : 0;
      // aynadaki cızırtı (0–1)
      let G = lt < LIGHT ? 1 : lt < LIGHT + 0.3 ? 1 - prog(lt, LIGHT, 0.3) : 0;
      if (inDip(lt, 0.1)) G = Math.max(G, 0.7);
      if (lt >= AGE && lt < OLD + 0.35) G = Math.max(G, 0.35 + 0.65 * Math.sin(Math.PI * prog(lt, AGE, OLD + 0.35 - AGE)));
      [SCI, LESSON - 0.12, SPLIT].forEach((t) => { if (lt >= t && lt < t + 0.22) G = Math.max(G, 0.9 * (1 - (lt - t) / 0.22)); });
      if (lt >= OFF + 0.1) G = 1;
      // yansıma: kancada yaşlı yüz; ışık yanınca genç; titremede bir anlık yaşlı; AGE–OLD arası giderek yaşlı
      let old;
      if (lt < LIGHT) old = fr < 3 || hz(fr) > 0.16;
      else if (lt < AGE) old = lt >= FLICK && inDip(lt, 0.05);
      else if (lt < OLD) old = hz(fr + 99) < Math.pow(prog(lt, AGE, OLD - AGE), 0.7);
      else old = true;
      const split = lt >= SPLIT && lt < APP;  // "Sensin": yüzün izleyiciye göre sağ yarısı yaşlı
      const b = 0.2 + 0.8 * L;
      room.style.filter = front.style.filter = `brightness(${b.toFixed(3)})`;
      reflBg.style.filter = `brightness(${Math.max(b, 0.4 * G).toFixed(3)})`;
      refl.style.filter = `brightness(${Math.max(b, (lt < LIGHT ? 1 : 0.85) * G).toFixed(3)})`;
      lampBar.style.background = L > 0.5 ? '#FFF4D6' : '#57574C';
      lampGlow.style.opacity = L;
      ghost.style.opacity = G * (old ? (lt < LIGHT ? 0.7 : 1) : 0.45);
      scan.style.opacity = (lt < LIGHT ? 0.5 : 0.9) * G;
      gbars.forEach((e, i) => {
        const v = G > 0.3 && hz(fr * 3 + i) < 0.6 * G;
        e.style.display = v ? 'block' : 'none';
        if (v) { e.style.top = px(hz(fr * 7 + i) * 660); e.style.height = px(8 + 34 * hz(fr * 5 + i)); }
      });
      const jx = G > 0.2 ? (hz(fr * 11) - 0.5) * 36 * G : 0;
      const rgb = G > 0.05 ? `drop-shadow(${(9 * G).toFixed(1)}px 0 0 rgba(255,40,90,.55)) drop-shadow(${(-9 * G).toFixed(1)}px 0 0 rgba(40,230,255,.55))` : 'none';
      gflash.style.opacity = Math.max(lt >= OLD ? 0.45 * Math.exp(-(lt - OLD) * 7) : 0, lt >= SCI ? 0.9 * Math.exp(-(lt - SCI) * 8) : 0, lt >= SPLIT ? 0.6 * Math.exp(-(lt - SPLIT) * 7) : 0);

      // Ceviz (arkadan): bildirimde sevinçle zıplar, ayna titreyince donar ve titrer, yaşlıyı görünce sıçrar; derste ve sonda el sallar
      let c = ['calm', null], hop = 0;
      const dancing = lt >= DANCE && lt < FLICK + 0.45;
      if (dancing) {
        const ph = ((lt - DANCE) % 0.42) / 0.42;
        hop = 4 * 44 * ph * (1 - ph);
        c = ['celebrate', Math.floor((lt - DANCE) / 0.21) % 2 ? 'up' : 'wave2'];
      }
      const waving = (a, d) => lt >= a && lt < a + d;
      if (waving(WAVE, 1.0)) c = ['happy', Math.floor((lt - WAVE) / 0.18) % 2 ? 'wave' : 'wave2'];
      if (lt >= BACK + 0.2 && lt < OFF) c = ['happy', Math.floor((lt - BACK) / 0.2) % 2 ? 'wave' : 'wave2'];
      cz.set(c[0], c[1], 'mood');
      let cy = 1349 - hop, cx = 300;
      if (lt >= FLICK + 0.45 && lt < JARS) cx += Math.sin(lt * 40) * (lt >= AGE ? 4 : 2);
      if (lt >= OLD && lt < ASK) { const k = lt - OLD; cy -= 60 * Math.exp(-k * 6) * Math.abs(Math.sin(k * 14)); }
      cz.put(cx, cy);
      sweats.forEach((e, i) => {
        const a = AGE + 0.2 + i * 0.45, k = ((((lt - a) % 1.0) + 1.0) % 1.0) / 1.0;
        e.style.display = lt >= a && lt < JARS ? 'block' : 'none';
        e.style.transform = `translate(${i ? 452 : 214}px,${930 + k * 80}px)`;
        e.style.opacity = 1 - k * 0.6;
      });
      bang.style.display = lt >= OLD && lt < OLD + 0.9 ? 'block' : 'none';
      bang.style.transform = `scale(${E.back(prog(lt, OLD, 0.25))}) rotate(${Math.sin(lt * 30) * 4}deg)`;

      // yansımalar: genç olan önce Ceviz'i taklit eder (aynı sevinç, aynı zıplama), ayna titreyince donar
      const mimic = lt < FLICK + 0.15;
      ry.set(mimic ? c[0] : 'calm', mimic ? c[1] : null, mimic ? 'mood' : 'wide');
      ry.put(RX + jx, RB - (mimic ? hop * 0.73 : 0), { flip: true });
      let oc = ['calm', null];
      if (lt >= OLD) oc = ['curious', null];                      // '?' yaşlı Ceviz'in sorusu
      if (lt >= ASK) oc = ['curious', 'wave2'];                    // pençesiyle paraları gösterir
      if (lt >= JARS) oc = ['thoughtful', 'wave'];                 // elinde kum saati
      if (lt >= LESSON) oc = ['happy', null];
      if (waving(WAVE, 1.0)) oc = c;                               // aynı anda el sallarlar: o da sensin
      if (lt >= DROP + 0.25) oc = ['celebrate', null];
      if (lt >= SPLIT) oc = ['happy', null];
      if (lt >= BACK + 0.2 && lt < OFF) oc = c;
      if (lt >= OFF) oc = ['calm', null];
      const oe = oc[0] === 'calm' || oc[0] === 'thoughtful' || oc[0] === 'curious' ? blink(lt, 0.4) : 'mood';
      ro.set(oc[0], oc[1], oe);
      ro.put(RX + jx * 1.2, RB, { flip: true });
      ry.root.style.display = !old || split ? 'block' : 'none';
      ro.root.style.display = old || split ? 'block' : 'none';
      if (split) ry.set('happy', null, 'mood');
      ro.root.style.clipPath = split ? 'inset(0 56.25% 0 0)' : 'none';
      ry.root.style.filter = ro.root.style.filter = rgb;
      // kum saati: kavanozlarla gelir, sayımda kum tam 3 saniyede akar
      hg.style.display = lt >= JARS && lt < SCI ? 'block' : 'none';
      if (lt >= JARS && lt < SCI) {
        const r = lt < COUNT ? 1 : 1 - prog(lt, COUNT, ZERO - COUNT), h = 50 * r, w = (29 * h) / 56, hb = 40 * (1 - r);
        hgT.setAttribute('points', `45,70 ${45 - w},${70 - h} ${45 + w},${70 - h}`);
        hgB.setAttribute('points', `45,${124 - hb} 18,124 72,124`);
        hgS.style.display = r > 0 && r < 1 ? 'block' : 'none';
        hg.style.transform = `translate(${jx}px,${-6 * Math.exp(-Math.max(0, lt - COUNT) * 8) * (lt >= COUNT ? 1 : 0)}px) rotate(${(1 - E.out(prog(lt, JARS + 0.2, 0.4))) * -30 + Math.sin(lt * 2) * 2}deg) scale(${E.back(prog(lt, JARS + 0.2, 0.35))})`;
      }

      // telefon tezgâhta: bildirimde titrer ve parlar
      const buzz = lt >= NOTIF - 0.12 && lt < NOTIF + 0.6;
      php.style.transform = `translateX(${buzz ? Math.sin(lt * 90) * 4 : 0}px)`;
      phGlow.style.opacity = lt >= NOTIF - 0.12 && lt < FLICK ? 0.9 : 0;

      // kavanozlar ve pençe: karar anında 1.000 TL ŞİMDİ ile SONRA arasında gider gelir; derste bir 200'lük SONRA'ya düşer
      let hv = false, hy = 1700, th = 0, kept = 5;
      if (lt >= JARS && lt < SCI) {
        hv = true;
        hy = lerp(2350, 1700, E.out(prog(lt, JARS + 0.15, 0.45)));
        if (lt >= COUNT && lt < ZERO) th = -9 * Math.sin(Math.PI * (lt - COUNT)) + Math.sin(lt * 37) * 0.6;  // ŞİMDİ mi, SONRA mı: gider gelir
      }
      if (lt >= DROP - 0.45 && lt < DROP + 0.75) {
        hv = true;
        hy = lerp(2350, 1700, E.out(prog(lt, DROP - 0.45, 0.3))) + 650 * E.inOut(prog(lt, DROP + 0.35, 0.4));
        th = 9 * E.inOut(prog(lt, DROP - 0.3, 0.25));
        if (lt >= DROP) kept = 4;
      }
      hand.style.display = hv ? 'block' : 'none';
      if (hv) {
        hand.style.transform = `translate(${HX}px,${hy}px) rotate(${th}deg)`;
        fan.style.transform = `rotate(${Math.sin(lt * 5) * 3}deg)`;
        fanN.forEach((e, i) => (e.style.display = i < kept ? 'block' : 'none'));
      }
      const fq = prog(lt, DROP, 0.3);
      fall.style.display = lt >= DROP && lt < DROP + 0.3 ? 'block' : 'none';
      fall.style.transform = `translate(${lerp(1023, 1014, fq) - 50}px,${lerp(895, 1090, fq * fq)}px) rotate(${fq * 30}deg)`;
      inJar.style.display = lt >= DROP + 0.3 ? 'block' : 'none';
      jLater.style.transform = `scale(${1 + 0.08 * Math.exp(-Math.max(0, lt - DROP - 0.3) * 8) * (lt >= DROP + 0.3 ? 1 : 0)})`;

      // araştırma panosu (aynanın içinde): iki yüz, yaşlı yüz vurgulanır, paralar kavanozlara düşer, yaşlınınki daha çok dolar
      const S = lt >= SCI + 0.08 && lt < LESSON;
      board.style.display = S ? 'block' : 'none';
      front.style.visibility = S ? 'hidden' : 'visible';  // kamera aynaya yaklaştı: ön plan kadrajda değil
      if (S) {
        const k = lt - SCI;
        board.style.opacity = 1 - prog(lt, LESSON - 0.15, 0.15);
        popIn(pY[0], prog(k, 0.15, 0.3)); popIn(pY[1], prog(k, 0.25, 0.3), { fromY: 30 });
        popIn(pO[0], prog(k, 0.45, 0.3)); popIn(pO[1], prog(k, 0.55, 0.3), { fromY: 30 });
        ring.style.opacity = k >= 1.05 ? 0.6 + 0.4 * Math.sin(k * 9) : 0;
        [jY, jO].forEach(([j], i) => popIn(j, prog(k, 2.0 + i * 0.12, 0.3), { fromY: 40 }));
        const n = [0, 0];
        drops.forEach((d) => {
          const q = prog(k, d.t, 0.35);
          d.e.style.display = q > 0 && q < 1 ? 'block' : 'none';
          d.e.style.transform = `translateY(${lerp(250, 500, q * q)}px)`;
          if (q >= 1) n[d.j]++;
        });
        jY[1].style.height = n[0] * 14 + '%';
        jO[1].style.height = n[1] * 13 + '%';
        up.style.opacity = k >= 3.45 ? 1 : 0;
        up.style.transform = `rotate(-90deg) translateX(${8 * Math.abs(Math.sin(k * 6))}px) scale(${E.back(prog(k, 3.45, 0.25))})`;
        src.style.opacity = prog(k, 0.5, 0.4);
      }

      // telefon B: kilit ekranında bildirim; Cep Defteri'nde yeni hedef
      lock.style.filter = `brightness(${lt >= NOTIF - 0.1 ? 1 : 0.2})`;
      card.style.opacity = clamp(prog(lt, NOTIF + 0.05, 0.1));
      card.style.transform = `translateY(${(1 - E.back(prog(lt, NOTIF + 0.05, 0.35))) * -240}px)`;
      amt.style.transform = `scale(${1 + 0.28 * Math.sin(Math.PI * prog(lt, AMT, 0.4))})`;
      sparks.forEach((e, i) => {
        const q = prog(lt, AMT + 0.05, 0.6), a = [-0.45, 0, 0.45, Math.PI - 0.45, Math.PI, Math.PI + 0.45][i];  // tutarın iki yanına saçılır
        e.style.display = q > 0 && q < 1 ? 'block' : 'none';
        e.style.transform = `translate(${292 + Math.cos(a) * (200 + 120 * E.out(q))}px,${560 + Math.sin(a) * (60 + 60 * E.out(q)) - 50 * q}px)`;
        e.style.opacity = 1 - q;
      });
      app.style.display = lt >= APP ? 'block' : 'none';
      app.style.transform = `translateX(${(1 - E.out(prog(lt, APP, 0.3))) * 100}%)`;
      addB.style.transform = `scale(${lt >= APP + 0.45 && lt < APP + 0.58 ? 0.9 : 1})`;
      empty.style.opacity = lt < APP + 0.5 ? 1 : 0;
      goal.style.opacity = clamp(prog(lt, APP + 0.55, 0.12));
      goal.style.transform = `scale(${lerp(0.85, 1, E.back(prog(lt, APP + 0.55, 0.3)))})`;
      goal.style.boxShadow = lt >= APP + 1.5 ? `0 0 0 ${Math.round(4 + 3 * Math.sin(lt * 6))}px rgba(43,113,120,.35)` : 'none';
      const gp = E.out(prog(lt, APP + 0.9, 0.6));
      gf.style.width = gp * 10 + '%';
      gv.textContent = `${fmt(gp * 200)} / 2.000 TL`;
      gc.style.opacity = prog(lt, APP + 1.5, 0.2);
      const tapping = lt >= APP + 0.1 && lt < APP + 0.95;
      pawB.style.display = armB.style.display = tapping ? 'block' : 'none';
      if (tapping) {
        const py = lerp(1760, 1000, E.out(prog(lt, APP + 0.1, 0.3))) + 12 * (lt >= APP + 0.45 && lt < APP + 0.58 ? 1 : 0) + 800 * E.inOut(prog(lt, APP + 0.62, 0.33));
        pawB.style.transform = `translate(${765 - 56}px,${py - 56}px)`;
        armB.style.transform = `translate(${765 - 36}px,${py + 20}px)`;
      }

      // kamera planları (A: banyo, B: telefon)
      let W = 'A', z = 1, fx = 540, fy = SY;
      if (lt < LIGHT) { z = 1.55 + 0.08 * prog(lt, 0, 1); fx = 700; fy = 975; }                                   // kanca: aynada yaşlı yüz
      else if (lt < NOTIF) { z = 1.06 - 0.03 * E.out(prog(lt, LIGHT, 0.4)); fx = 600; fy = 1060; }                // ışık yanar: banyo
      else if (lt < DANCE) { W = 'B'; z = 1.1 + 0.04 * prog(lt, NOTIF, DANCE - NOTIF); fy = 1010; }                 // bildirim
      else if (lt < FLICK) { z = 1.12; fx = 560; fy = 1040; }                                                       // Ceviz sevinir
      else if (lt < AGE) { const k = ramp(FLICK, AGE - FLICK); z = 1.12 + 0.14 * k; fx = lerp(560, 660, k); fy = lerp(1040, 1000, k); }   // ayna titrer
      else if (lt < OLD) { const k = ramp(AGE, OLD - AGE); z = 1.26 + 0.34 * k; fx = lerp(660, 705, k); fy = lerp(1000, 975, k); }        // yaşlanır
      else if (lt < OLD + 0.6) { z = 1.66; fx = 705; fy = 975; }                                                    // yaşlı yüz
      else if (lt < ASK) { z = 1.14; fx = 520; fy = 1040; }                                                         // Ceviz sıçradı
      else if (lt < JARS) { z = 1.95 + 0.06 * prog(lt, ASK, JARS - ASK); fx = 707; fy = 975; }                      // "Bunun kaçı bana?"
      else if (lt < SCI) { const k = ramp(COUNT, ZERO - COUNT); z = 1.33 + 0.07 * k; fx = 820; fy = 1080; }         // kavanozlar, karar
      else if (lt < LESSON) { z = 1.45; fx = 620; fy = 887; }                                                       // pano (aynanın içi)
      else if (lt < DROP - 0.45) { z = 1.18; fx = 540; fy = 1035; }                                                 // aynı anda el sallarlar
      else if (lt < SPLIT) { z = 1.4; fx = 900; fy = 1060; }                                                        // SONRA'ya 200 TL
      else if (lt < APP) { z = 1.8 + 0.08 * prog(lt, SPLIT, APP - SPLIT); fx = 707; fy = 975; }                     // "Sensin"
      else if (lt < BACK) { W = 'B'; z = 1.04 + 0.04 * prog(lt, APP, BACK - APP); fy = 1090; }                      // Cep Defteri: hedef
      else if (lt < OFF) { z = 1.02 + 0.04 * prog(lt, BACK, OFF - BACK); fx = 590; fy = 1060; }                     // soru: iki Ceviz el sallar
      else { const k = E.inOut(prog(lt, OFF, 0.16)); z = lerp(1.06, 1.55, k); fx = lerp(590, 700, k); fy = lerp(1060, 975, k); }  // ışık söner → kanca
      let beat = -9;
      beats.forEach((t) => { if (lt >= t) beat = t; });
      z *= 1 + 0.012 * Math.exp(-(lt - beat) * 10);
      const sx = shake(lt, OLD, 16, 0.4) + shake(lt, ZERO, 8, 0.3) + shake(lt, AGE, 5, 1.4);
      camA.style.display = W === 'A' ? 'block' : 'none';
      camB.style.display = W === 'B' ? 'block' : 'none';
      (W === 'A' ? camA : camB).style.transform = `translate(${540 - fx * z + sx}px,${SY - fy * z}px) scale(${z})`;
      flash.style.background = '#FFFFFF';
      flash.style.opacity = Math.max(lt >= OLD ? 0.22 * Math.exp(-(lt - OLD) * 7) : 0, lt >= LIGHT ? 0.12 * Math.exp(-(lt - LIGHT) * 10) : 0);
      pill.style.display = lt >= COUNT && lt < ZERO ? 'flex' : 'none';
      pill.style.opacity = Math.min(1, (lt - COUNT) * 8);
      pin.style.transform = `scale(${1 + 0.04 * Math.exp(-((lt - COUNT) % 1) * 10)})`;
    };
  };

  /* Ayın katili: kara film. Ayın 18'i, yağmurlu ara sokakta tebeşirle çizilmiş bir cüzdan: Ceviz'in harçlığı ölü bulundu.
   * Şüpheli sırası (kahve, yemek siparişi, taksi, abonelik: "Sadece 90 TL!"), gerçek 3 saniyelik karar anı, ışıklar söner:
   * katil kapüşonlu "BU SEFERLİK". Dedektif panosu (Sussman ve Alter 2012), Cep Defteri'nde her ay "Bu seferlikler" planı,
   * soru; şimşek ve tebeşir silueti (döngü). Dünyalar: A sokak, B sıra odası, C pano, D telefon; kamera aralarında keser. */
  SCENES.katil = (t0, o = {}) => {
    deriveBilgeDet();
    const s = scene(t0, '#05060A', undefined, o.wdur ?? 0.4);
    const ev = (k) => o[k] ?? 99;
    const BILGE = ev('bilge'), LINEUP = ev('lineup'), IN = o.in || [99, 99, 99, 99], BUBBLE = ev('bubble'), ASK = ev('ask');
    const COUNT = ev('count'), ZERO = ev('zero'), DARK = ev('dark'), REVEAL = ev('reveal'), CARDS = ev('cards'), SCI = ev('sci');
    const NORMAL = ev('normal'), EXC = ev('exc'), APP = ev('app'), TAP = o.tap ?? APP + 0.45, CTA = ev('cta'), LURK = ev('lurk');
    const WIDE = ev('wide');  // şüpheliler tek tek girerken kamera sırayı yakından tarar; burada geniş plana keser
    const BOLTS = o.bolts || [0.3];
    // Sahne tüm kareyi doldurur (sinema bandı yok). Odak noktası kutu ve altyazının (300–720) altındaki alanın ortasına
    // düşer; önemli şeyler Instagram'ın alt yazı bandına (~1650 altı) girmez, zemin ve gök o bantların altında da sürer.
    const SY = 1180;
    const world = () => el('div', 'abs', s.root, { left: 0, top: 0, width: '1080px', height: '1920px', transformOrigin: '0 0' });
    const CARDD = [['Doğum günü', '#E8577A'], ['Konser', '#9B7BC6'], ['Bayram', '#2F8F5A'], ['İndirim vardı', '#E8322A']];
    const card = (parent, [txt, col], w, fs) => {
      const c = el('div', 'abs', parent, { left: 0, top: 0, width: px(w), boxSizing: 'border-box', padding: '14px 8px 10px', borderRadius: '10px', borderTop: `12px solid ${col}`, background: '#FFFCF6', boxShadow: '0 8px 16px rgba(0,0,0,.4)', textAlign: 'center', fontSize: px(fs), fontWeight: 800, color: '#2A1E1A', whiteSpace: 'nowrap', transformOrigin: '50% 50%' });
      c.textContent = txt;
      return c;
    };
    const book = (parent, w, fs) => {  // dedektifin defteri: CEP DEFTERİ
      const b = el('div', 'abs', parent, { left: 0, top: 0, width: px(w), height: px(w * 0.68), boxSizing: 'border-box', border: '5px solid #2A1E1A', borderRadius: '6px 12px 12px 6px', background: 'linear-gradient(90deg, #7A2F0E 0 14%, #AE4716 14% 88%, #5C2209 88% 92%, #AE4716 92%)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '8%', fontSize: px(fs), fontWeight: 800, color: '#FFFCF6', letterSpacing: '.03em', lineHeight: 1.05, textAlign: 'center', transformOrigin: '50% 50%' });
      b.innerHTML = 'CEP<br>DEFTERİ';
      return b;
    };

    // ── A · yağmurlu ara sokak ──
    const camA = world();
    el('div', 'abs', camA, { left: '-200px', top: '-700px', width: '1480px', height: '1120px', background: 'linear-gradient(#060912 40%, #111830)' });  // gök
    const bolt = el('div', 'abs', camA, { left: '560px', top: '150px', width: '260px', height: '300px', opacity: 0 });
    bolt.innerHTML = '<svg width="260" height="300" viewBox="0 0 260 300"><polyline points="150,0 112,96 160,104 96,212 146,220 84,300" fill="none" stroke="#EAF2FF" stroke-width="9"/></svg>';
    el('div', 'abs', camA, { left: '-200px', top: '380px', width: '1480px', height: '900px', backgroundColor: '#2B2530', backgroundImage: 'linear-gradient(rgba(0,0,0,.38) 0 6px, transparent 6px), linear-gradient(90deg, rgba(0,0,0,.38) 0 6px, transparent 6px)', backgroundSize: '120px 56px' });  // tuğla duvar
    const win = el('div', 'abs', camA, { left: '470px', top: '450px', width: '150px', height: '170px', boxSizing: 'border-box', border: '10px solid #1A161E', background: 'linear-gradient(#3A3322, #241F18)' });  // uzakta sarı bir pencere
    el('div', 'abs', win, { left: '55px', top: 0, width: '10px', height: '100%', background: '#1A161E' });
    const cal = el('div', 'abs', camA, { left: '736px', top: '740px', width: '190px', height: '220px', borderRadius: '8px', background: '#F4EFE4', boxShadow: '0 10px 20px rgba(0,0,0,.45)', overflow: 'hidden', transform: 'rotate(5deg)', transformOrigin: '50% 0' });
    cal.innerHTML = '<div style="height:56px;background:#C0392B;color:#fff;font-family:Pixel;font-size:46px;display:flex;align-items:center;justify-content:center;letter-spacing:.08em">EKİM</div><div style="text-align:center;font-family:Pixel;font-size:150px;line-height:1;color:#2A1E1A;margin-top:4px">18</div>';
    el('div', 'abs', camA, { left: '800px', top: '728px', width: '64px', height: '22px', background: 'rgba(240,230,200,.7)', transform: 'rotate(5deg)' });  // bant
    el('div', 'abs', camA, { left: '150px', top: '470px', width: '24px', height: '820px', background: '#14161C', borderLeft: '5px solid #2E323D' });  // lamba direği
    el('div', 'abs', camA, { left: '150px', top: '468px', width: '118px', height: '16px', background: '#14161C' });
    el('div', 'abs', camA, { left: '228px', top: '470px', width: '72px', height: '40px', clipPath: 'polygon(15% 0, 85% 0, 100% 100%, 0 100%)', background: '#2A2E38' });
    const bulb = el('div', 'abs', camA, { left: '247px', top: '506px', width: '34px', height: '14px', borderRadius: '0 0 17px 17px', background: '#FFE7A8', boxShadow: '0 0 44px 20px rgba(255,220,140,.5)' });
    const cone = el('div', 'abs', camA, { left: '40px', top: '516px', width: '460px', height: '800px', clipPath: 'polygon(45% 0, 55% 0, 100% 100%, 0 100%)', background: 'linear-gradient(rgba(255,214,140,.3), rgba(255,214,140,.05))' });
    el('div', 'abs', camA, { left: '-200px', top: '1250px', width: '1480px', height: '1000px', background: 'linear-gradient(#1C2029, #101218 60%)' });  // ıslak asfalt
    [[110, 1296, 320, 34], [690, 1452, 280, 28], [360, 1478, 210, 22]].forEach(([x, y, w, h]) => el('div', 'abs', camA, { left: px(x), top: px(y), width: px(w), height: px(h), borderRadius: '50%', background: 'linear-gradient(90deg, rgba(120,140,190,.16), rgba(255,214,140,.24), rgba(120,140,190,.1))' }));
    const chalk = el('div', 'abs', camA, { left: '392px', top: '1290px', width: '340px', height: '150px' });  // tebeşirle çizilmiş cüzdan
    chalk.innerHTML = '<svg width="340" height="150" viewBox="0 0 340 150" fill="none" stroke="#F4F1EA" stroke-width="7" stroke-dasharray="16 9" stroke-linecap="round">'
      + '<path d="M20 30 Q20 14 36 14 L300 14 Q318 14 318 30 L318 118 Q318 134 300 134 L36 134 Q20 134 20 118 Z"/>'
      + '<path d="M212 52 L318 52 L318 98 L212 98 Q196 98 196 84 L196 66 Q196 52 212 52 Z"/><circle cx="238" cy="75" r="9"/></svg>';
    [[300, 1440, 26], [708, 1436, 20], [800, 1458, 16]].forEach(([x, y, r]) => el('div', 'abs', camA, { left: px(x), top: px(y), width: px(r * 2), height: px(r * 2), boxSizing: 'border-box', borderRadius: '50%', border: '5px dashed #F4F1EA' }));  // tebeşir bozuk paralar
    const marker = (x, y, n) => { const m = el('div', 'abs it', camA, { left: px(x), top: px(y), width: '64px', height: '58px', clipPath: 'polygon(18% 0, 82% 0, 100% 100%, 0 100%)', background: '#F2C14E', color: '#2A1E1A', fontSize: '46px', textAlign: 'center', lineHeight: '64px' }); m.textContent = n; };
    marker(320, 1376, '1'); marker(770, 1392, '2');
    const cz = new Mascot(camA, { who: 'ceviz', w: 280 });  // şeridin arkasında üzgün Ceviz
    const tears = [0, 1].map(() => pixEl(camA, SWEAT, SWEAT_C, 6, { left: 0, top: 0 }));
    const tape = el('div', 'abs it', camA, { left: '-260px', top: '1188px', width: '1600px', height: '64px', background: '#F2C14E', color: '#1A1A1A', fontSize: '44px', lineHeight: '64px', whiteSpace: 'nowrap', overflow: 'hidden', transform: 'rotate(-5deg)', boxShadow: '0 6px 12px rgba(0,0,0,.35)' });
    tape.textContent = 'OLAY YERİ · GİRMEYİN · '.repeat(8);
    const bA = new Mascot(camA, { who: 'bilgedet', w: 440 });  // tebeşir çizimin sağında durur, delilin üstüne basmaz
    const mag = pixEl(camA, MAGP, MAGP_C, 9, { left: 0, top: 0, display: 'none', transformOrigin: '76px 85px' });  // büyüteç: sapı sol kolun ucunda
    const bookA = book(camA, 184, 22);  // kapanışta iki kolun arasında tuttuğu defter (yüzü ve ayakları kapatmasın diye yatık)
    Object.assign(bookA.style, { height: '76px', paddingRight: '8%' });  // yazı ortada: kenarlardaki kanat uçlarının altında kalmasın
    const armsA = el('div', 'abs', camA, { left: 0, top: 0, width: '440px', height: '412.5px', display: 'none' });  // kollar ve kanat uçları defterin üstünde: defter tutuluyor görünür
    armsA.innerHTML = `<svg viewBox="0 0 32 30" width="100%" height="100%" shape-rendering="crispEdges">${SP['bilgedet|happy|null|mood']
      .filter(([, y, , , f]) => y >= 17 && y <= 22 && (f === DET_SLEEVE || f === DET_CUFF))
      .concat([[10, 21, 1, 2, DET_WING], [21, 21, 1, 2, DET_WING]])
      .map(([x, y, w, h, f]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`).join('')}</svg>`;
    el('div', 'abs', camA, { left: '950px', top: '800px', width: '150px', height: '452px', background: '#0B0A0E', boxShadow: 'inset 14px 0 0 #1E1A24' });  // karanlık kapı aralığı
    const lurk = [0, 1].map(() => el('div', 'abs', camA, { left: 0, top: 0, width: '16px', height: '10px', borderRadius: '50%', background: '#F2C14E', boxShadow: '0 0 14px 4px rgba(242,193,78,.6)', display: 'none' }));  // karanlıkta bekleyen gözler
    const rain = Array.from({ length: 86 }, (_, i) => ({ x: ((i * 157) % 1400) - 160, y0: (i * 263) % 1800, v: 1500 + (i % 7) * 150, e: el('div', 'abs', camA, { left: 0, top: 0, width: '3px', height: px(42 + (i % 5) * 12), background: 'linear-gradient(rgba(170,190,230,0), rgba(170,190,230,.55))' }) }));

    // ── B · şüpheli sırası ──
    const camB = world();
    el('div', 'abs', camB, { left: '-700px', top: '-600px', width: '2500px', height: '1900px', background: '#262A33' });
    for (let k = -4; k < 9; k++) {  // boy çizgileri duvarı yazıların altından zemine kadar kaplar; sayılar kadrajın iki kenarında
      const y = 700 + k * 64;
      el('div', 'abs', camB, { left: '-700px', top: px(y), width: '2500px', height: k % 2 ? '4px' : '7px', background: `rgba(230,236,245,${k % 2 ? 0.14 : 0.24})` });
      if (k % 2 === 0) [55, 985].forEach((x) => (el('div', 'abs it', camB, { left: px(x), top: px(y - 44), fontSize: '40px', color: 'rgba(230,236,245,.4)' }).textContent = String(180 - k * 10)));
    }
    el('div', 'abs', camB, { left: '-700px', top: '1262px', width: '2500px', height: '1000px', backgroundColor: '#14161B', backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 0 3px, transparent 3px), linear-gradient(#1B1E25, #0E0F13 50%)', backgroundSize: '100% 58px, 100% 100%' });
    const XS = [150, 400, 650, 900, 1180];  // beşinci yer geniş planda kadraj dışında kalır
    XS.forEach((x) => el('div', 'abs', camB, { left: px(x - 46), top: '212px', width: '92px', height: '28px', borderRadius: '6px 6px 14px 14px', background: '#14161C', boxShadow: 'inset 0 -6px 0 #3A3F4C' }));  // tavandaki spot lambaları
    const spots = XS.map((x, i) => el('div', 'abs', camB, { left: px(x - 160), top: '236px', width: '320px', height: '1040px', clipPath: 'polygon(40% 0, 60% 0, 100% 100%, 0 100%)', background: i < 4 ? 'linear-gradient(rgba(255,248,220,.05), rgba(255,248,220,.2))' : 'linear-gradient(rgba(255,90,70,.06), rgba(255,90,70,.3))', opacity: 0 }));
    const pools = XS.map((x, i) => el('div', 'abs', camB, { left: px(x - 190), top: '1236px', width: '380px', height: '84px', borderRadius: '50%', background: `radial-gradient(closest-side, ${i < 4 ? 'rgba(255,248,220,.22)' : 'rgba(255,90,70,.3)'}, transparent)`, opacity: 0 }));  // spotun zemindeki ışığı
    const plate = (parent, txt, w, fs) => {
      const p = el('div', 'abs it', parent, { left: 0, top: 0, width: px(w), height: '58px', boxSizing: 'border-box', border: '5px solid #2A1E1A', borderRadius: '8px', background: '#F4F1EA', color: '#2A1E1A', fontSize: px(fs), textAlign: 'center', lineHeight: '50px' });
      p.textContent = txt;
      return p;
    };
    const sus = [[SUS_CUP, SUS_CUP_C], [SUS_BAG, SUS_BAG_C], [SUS_TAXI, SUS_TAXI_C], [SUS_TV, SUS_TV_C]].map(([rows, cols], i) => {
      const w = rows[0].length * 18, h = rows.length * 18;
      const wrap = el('div', 'abs', camB, { left: 0, top: 0, width: px(w), height: px(h), transformOrigin: '50% 100%' });
      wrap.innerHTML = pix(rows, cols, 18);
      const pl = plate(camB, String(i + 1), 96, 50);
      const bub = el('div', 'abs', camB, { left: 0, top: 0, padding: '8px 16px 10px', borderRadius: '22px', border: '5px solid #2A1E1A', background: '#FFFCF6', fontSize: '28px', fontWeight: 800, color: '#2A1E1A', whiteSpace: 'nowrap', display: 'none', transformOrigin: '50% 100%' });
      bub.innerHTML = 'Sadece <span style="color:#C0392B">90 TL!</span>';
      const sweat = pixEl(camB, SWEAT, SWEAT_C, 8, { left: 0, top: 0, display: 'none' });
      return { wrap, pl, bub, sweat, w, h };
    });
    const dimB = el('div', 'abs', camB, { left: '-700px', top: '-600px', width: '2500px', height: '2900px', background: '#030305', opacity: 0 });  // ışıklar söner
    const spot5 = spots[4];
    camB.appendChild(spot5);  // kırmızı spot karanlığın üstünde kalır
    camB.appendChild(pools[4]);
    const hood = el('div', 'abs', camB, { left: px(XS[4] - 144), top: px(1262 - 396), width: '288px', height: '396px', display: 'none', transformOrigin: '50% 100%' });
    hood.innerHTML = pix(SUS_HOOD, SUS_HOOD_C, 18);
    const eyesGlow = el('div', 'abs', hood, { left: '72px', top: '72px', width: '144px', height: '52px', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(242,193,78,.55), rgba(242,193,78,0))', mixBlendMode: 'screen' });
    const pl5 = plate(camB, 'BU SEFERLİK', 250, 44);
    pl5.style.display = 'none';
    const cardsB = CARDD.map((c) => card(camB, c, 170, 24));
    const bB = new Mascot(camB, { who: 'bilgedet', w: 560 });  // "Sence katil kim?"

    // ── C · dedektif panosu ──
    const camC = world();
    el('div', 'abs', camC, { left: '-200px', top: '-500px', width: '1480px', height: '2900px', background: '#18131A' });
    el('div', 'abs', camC, { left: '536px', top: '-500px', width: '8px', height: '930px', background: '#0C0A0E' });  // panonun üstünde sarkan lamba
    el('div', 'abs', camC, { left: '450px', top: '420px', width: '180px', height: '86px', clipPath: 'polygon(30% 0, 70% 0, 100% 100%, 0 100%)', background: 'linear-gradient(#3A4A3A, #1E2A1E)' });
    el('div', 'abs', camC, { left: '512px', top: '494px', width: '56px', height: '22px', borderRadius: '0 0 28px 28px', background: '#FFE7A8', boxShadow: '0 0 60px 26px rgba(255,220,140,.4)' });
    el('div', 'abs', camC, { left: '30px', top: '690px', width: '1020px', height: '820px', boxSizing: 'border-box', border: '22px solid #6B4A2E', background: 'radial-gradient(circle, rgba(0,0,0,.12) 2px, transparent 3px) 0 0 / 18px 18px, #B98A5A' });
    el('div', 'abs', camC, { left: '-60px', top: '1510px', width: '1200px', height: '60px', background: 'linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,0))' });  // panonun gölgesi
    const pinEl = (parent, x, y) => el('div', 'abs', parent, { left: px(x - 9), top: px(y - 9), width: '18px', height: '18px', borderRadius: '50%', background: '#C0392B', boxShadow: '0 3px 0 #7A1E14', zIndex: 2 });
    const pol = el('div', 'abs', camC, { left: '86px', top: '752px', width: '250px', height: '300px', boxSizing: 'border-box', padding: '16px 16px 0', background: '#F4F1EA', boxShadow: '0 10px 20px rgba(0,0,0,.4)', transform: 'rotate(-4deg)', transformOrigin: '50% 0' });
    el('div', 'abs', pol, { left: '16px', top: '16px', width: '218px', height: '200px', background: '#20202A', overflow: 'hidden' }).innerHTML = `<div style="position:absolute;left:45px;top:16px">${pix(SUS_HOOD, SUS_HOOD_C, 8)}</div>`;
    el('div', 'abs it', pol, { left: 0, right: 0, top: '222px', textAlign: 'center', fontSize: '38px', color: '#C0392B' }).textContent = 'BU SEFERLİK';
    pinEl(pol, 125, 8);
    const strings = el('div', 'abs', camC, { left: 0, top: 0, width: '1080px', height: '1920px' });
    strings.innerHTML = '<svg width="1080" height="1920" viewBox="0 0 1080 1920" fill="none" stroke="#C0392B" stroke-width="4">'
      + [[200, 1100], [440, 1100], [200, 1206], [440, 1206]].map(([x, y]) => `<line x1="211" y1="1046" x2="${x}" y2="${y}" stroke-dasharray="400" stroke-dashoffset="400"/>`).join('') + '</svg>';
    const lines = [...strings.querySelectorAll('line')];
    const cardsC = CARDD.map((c, i) => {
      const e = card(camC, c, 220, 28);
      e.style.left = px(i % 2 ? 330 : 90); e.style.top = px(i < 2 ? 1094 : 1200);
      pinEl(e, 110, -2);
      return e;
    });
    const chart = el('div', 'abs', camC, { left: '590px', top: '742px', width: '420px', height: '560px', boxSizing: 'border-box', padding: '20px 18px', background: '#FFFCF6', boxShadow: '0 10px 20px rgba(0,0,0,.4)', transform: 'rotate(2deg)', transformOrigin: '50% 0' });
    pinEl(chart, 210, 8);
    el('div', 'abs', chart, { left: 0, right: 0, top: '22px', textAlign: 'center', fontSize: '30px', fontWeight: 800, color: '#2A1E1A' }).textContent = 'Tahmin mi, gerçek mi?';
    const bars = [[40, '#8E8A86'], [120, '#2A1E1A'], [230, '#8E8A86'], [310, '#C0392B']].map(([x, c]) => el('div', 'abs', chart, { left: px(x), bottom: '150px', width: '56px', height: 0, background: c, borderRadius: '6px 6px 0 0' }));
    [[40, 'tahmin'], [120, 'gerçek'], [230, 'tahmin'], [310, 'gerçek']].forEach(([x, t]) => el('div', 'abs', chart, { left: px(x - 10), width: '76px', bottom: '120px', textAlign: 'center', fontSize: '19px', fontWeight: 700, color: '#6B5A4E' }).textContent = t);
    const grpL = (x, t) => { const e = el('div', 'abs', chart, { left: px(x), width: '170px', bottom: '64px', textAlign: 'center', fontSize: '25px', fontWeight: 800, color: '#2A1E1A', lineHeight: 1.1 }); e.innerHTML = t; return e; };
    grpL(23, 'Sıradan<br>harcama'); grpL(213, 'Bu<br>seferlikler');
    el('div', 'abs', chart, { left: 0, right: 0, bottom: '150px', height: '4px', background: '#2A1E1A' });
    const okM = pixEl(chart, CHECK, CHECK_C, 10, { left: '74px', top: '98px', opacity: 0 });
    const miss = el('div', 'abs', chart, { left: '150px', top: '120px', padding: '2px 16px 6px', borderRadius: '12px', border: '6px solid #C0392B', color: '#C0392B', fontSize: '44px', fontWeight: 800, background: 'rgba(255,255,255,.9)', opacity: 0, transformOrigin: '50% 50%' });
    miss.textContent = 'EKSİK!';
    const srcC = el('div', 'abs', chart, { left: 0, right: 0, bottom: '16px', textAlign: 'center', fontSize: '22px', fontWeight: 800, color: '#4A3B30' });
    srcC.textContent = 'Kaynak: Sussman ve Alter 2012';
    el('div', 'abs', camC, { left: '-40px', top: '506px', width: '1160px', height: '1060px', clipPath: 'polygon(46% 0, 54% 0, 100% 100%, 0 100%)', background: 'linear-gradient(rgba(255,214,140,.2), rgba(255,214,140,.04))', pointerEvents: 'none' });  // lambanın ışığı

    // ── D · telefon: Cep Defteri, Planlar ──
    const camD = world();
    el('div', 'abs', camD, { left: '-300px', top: '-300px', width: '1680px', height: '2520px', background: 'radial-gradient(ellipse 760px 1000px at 840px 1300px, #1B2140, #07080D 70%)' });
    el('div', 'abs', camD, { left: '150px', top: '640px', width: '780px', height: '1520px', boxSizing: 'border-box', border: '8px solid #2B2D36', borderRadius: '86px', background: '#121318', boxShadow: '0 0 140px 40px rgba(150,190,255,.16)' });
    const scr = el('div', 'abs', camD, { left: '172px', top: '662px', width: '736px', height: '1476px', borderRadius: '64px', overflow: 'hidden', background: '#F6EEE6' });
    const head = el('div', 'abs', scr, { left: 0, right: 0, top: 0, height: '250px', background: '#AE4716' });
    el('div', 'abs', head, { left: '40px', top: '92px', fontSize: '30px', fontWeight: 700, color: '#FFD9C4' }).textContent = 'Cep Defteri';
    el('div', 'abs', head, { left: '40px', top: '134px', fontSize: '66px', fontWeight: 800, color: '#FFFCF6', letterSpacing: '-.02em' }).textContent = 'Planlar';
    const pcard = el('div', 'abs', scr, { left: '30px', right: '30px', top: '280px', height: '412px', borderRadius: '34px', background: '#FFFCF6', boxShadow: '0 10px 30px rgba(60,20,0,.12)' });
    const prow = (y, name, sub, amt) => {
      const r = el('div', 'abs', pcard, { left: '20px', right: '20px', top: px(y), height: '112px', boxSizing: 'border-box', padding: '16px 22px', borderRadius: '22px', background: '#F6F1EA', transformOrigin: '50% 50%' });
      r.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:36px;font-weight:800;color:#2A1E1A">${name}</span><span style="font-size:36px;font-weight:800;color:#2A1E1A">${amt}</span></div>`
        + `<div style="font-size:26px;font-weight:700;color:#8A7D72;margin-top:6px">${sub}</div>`;
      return r;
    };
    prow(28, 'Yurt ödemesi', 'Ödeme · Her ay', '2.500 TL');
    prow(156, 'Telefon faturası', 'Ödeme · Her ay', '300 TL');
    const newRow = prow(284, 'Bu seferlikler', 'Ödeme · Her ay · doğum günü, konser…', '500 TL');
    newRow.style.background = '#FFF3D6';
    const addP = el('div', 'abs', pcard, { left: '20px', right: '20px', top: '430px', height: '96px', borderRadius: '22px', border: '4px dashed #2B7178', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2B7178', fontSize: '34px', fontWeight: 800, transformOrigin: '50% 50%' });
    addP.textContent = '+ Plan ekle';
    const lim = el('div', 'abs', scr, { left: '30px', right: '30px', top: '722px', height: '420px', boxSizing: 'border-box', padding: '30px 40px', borderRadius: '34px', background: '#FFFCF6', boxShadow: '0 10px 30px rgba(60,20,0,.12)' });  // altında kategori limitleri: ekranın altı boş kalmasın
    lim.innerHTML = '<div style="font-size:36px;font-weight:800;color:#2A1E1A">Kategori limitleri</div>'
      + [['Yemek & kafe', '1.370 TL / 2.500 TL', 55, '#AE4716'], ['Eğlence', '790 TL / 800 TL', 99, '#B8641E']].map(([n, a, p, c]) =>
        `<div style="display:flex;justify-content:space-between;margin-top:30px;font-size:30px;font-weight:800;color:#2A1E1A"><span>${n}</span><span style="color:#6B5A4E">${a}</span></div>`
        + `<div style="margin-top:12px;height:18px;border-radius:9px;background:#EDE3D8;overflow:hidden"><div style="width:${p}%;height:100%;background:${c}"></div></div>`).join('');
    const armD = el('div', 'abs', camD, { left: 0, top: 0, width: '72px', height: '900px', boxSizing: 'border-box', border: '6px solid #2A1E1A', borderRadius: '36px', background: '#A8683A', display: 'none' });
    const pawD = pixEl(camD, PAWP, { o: '#2A1E1A', B: '#A8683A' }, 16, { left: 0, top: 0, display: 'none' });

    // ── üst katmanlar: kenar karartma (sinema bandı yerine yumuşak geçiş), şimşek flaşı, karar çağrısı ──
    el('div', 'abs', s.root, { inset: 0, zIndex: 17, pointerEvents: 'none', background: 'radial-gradient(ellipse 100% 72% at 50% 56%, transparent 58%, rgba(0,0,0,.5) 100%)' });
    el('div', 'abs', s.root, { left: 0, right: 0, top: 0, height: '260px', zIndex: 17, pointerEvents: 'none', background: 'linear-gradient(rgba(5,6,10,.5), rgba(5,6,10,0))' });
    el('div', 'abs', s.root, { left: 0, right: 0, bottom: 0, height: '300px', zIndex: 17, pointerEvents: 'none', background: 'linear-gradient(rgba(5,6,10,0), rgba(5,6,10,.45))' });
    const flash = el('div', 'abs', s.root, { inset: 0, zIndex: 21, opacity: 0, pointerEvents: 'none', background: '#DCE8FF' });
    const pill = el('div', 'abs it', s.root, { left: 0, right: 0, top: '608px', display: 'none', justifyContent: 'center', zIndex: 24 });
    const pin = el('div', '', pill, { padding: '4px 28px 10px', borderRadius: '16px', border: '4px solid #F2B63C', background: 'rgba(10,10,16,.9)', fontSize: '62px', color: '#fff', lineHeight: 1 });
    pin.innerHTML = 'Katil kaç numara? <span style="color:#F2B63C">Yoruma yaz</span>';

    // kalp atışları (audio.py ile aynı takvim): soru sorulunca başlar, sayımda hızlanır
    const beats = [];
    for (let t = ASK + 0.3, k = 0; t < ZERO - 0.1; t += Math.max(0.42, 0.62 - 0.03 * k), k++) beats.push(t);
    const flick = (k) => (k < 0 ? 0 : k < 0.06 ? 1 : k < 0.12 ? 0.2 : k < 0.18 ? 0.85 : k < 0.24 ? 0.1 : 0.5 * Math.exp(-(k - 0.24) * 8));
    s.update = (lt) => {
      const ramp = (a, d) => E.inOut(prog(lt, a, d));
      // şimşek: gökte çatal çizgi, beyaz-mavi flaş (sokakta); ortaya çıkışta sıra odasında da
      let F = 0;
      BOLTS.forEach((b) => (F = Math.max(F, flick(lt - b))));
      F = Math.max(F, flick(lt - REVEAL));
      bolt.style.opacity = BOLTS.some((b) => lt >= b && lt < b + 0.2) ? 1 : 0;

      // sokak: yağmur, lamba titrer, Ceviz ağlar, dedektif gelir ve büyüteçle bakar; sonda defterine yazar, karanlıkta gözler
      rain.forEach((r) => {
        const y = ((r.y0 + r.v * lt) % 1800) - 20;
        r.e.style.transform = `translate(${r.x + y * 0.14}px,${y}px) rotate(8deg)`;
      });
      const lampOn = Math.floor(lt * 7.3) % 23 === 5 ? 0.55 : 1;
      bulb.style.opacity = cone.style.opacity = lampOn;
      cz.set('thoughtful', null, (lt * 1000) % 2600 < 140 ? 'closed' : 'squeeze');
      cz.put(300, 1250);
      tears.forEach((e, i) => {
        const k = ((lt + i * 0.45) % 0.9) / 0.9;
        e.style.transform = `translate(${i ? 308 : 252}px,${1092 + k * 70}px)`;
        e.style.opacity = 1 - k;
      });
      const closing = lt >= CTA;
      const bw = E.out(prog(lt, BILGE, 0.7));
      const walking = lt >= BILGE && lt < BILGE + 0.7;
      const looking = lt >= BILGE + 0.8 && !closing;
      const bx = closing ? 850 : lerp(1320, 850, bw), by = 1400 - (walking ? Math.abs(Math.sin(lt * 14)) * 14 : 0);
      bA.set(closing ? (lt >= LURK ? 'curious' : 'happy') : looking ? 'thoughtful' : 'calm', closing ? null : looking ? 'face' : null, blink(lt, 0.2));
      bA.put(bx, by);
      mag.style.display = looking ? 'block' : 'none';
      mag.style.transform = `translate(${bx - 186}px,${by - 188}px) rotate(${-14 + Math.sin(lt * 3) * 6}deg)`;
      bookA.style.display = closing ? 'flex' : 'none';
      armsA.style.display = closing ? 'block' : 'none';
      bookA.style.transform = `translate(${bx - 92}px,${by - 154}px)`;
      armsA.style.transform = `translate(${bx - 220}px,${by - 412.5}px)`;
      lurk.forEach((e, i) => {
        e.style.display = closing && lt >= LURK && (lt * 1000) % 1900 > 140 ? 'block' : 'none';
        e.style.transform = `translate(${976 + i * 30}px,930px)`;
      });

      // sıra odası: şüpheliler sırayla girer, tabelalar; "Sadece 90 TL!"; sayımda spot sırayla dolaşır; ışıklar söner, kapüşonlu belirir
      const hot = lt >= COUNT && lt < ZERO ? Math.min(3, Math.floor((lt - COUNT) / 0.75)) : -1;
      sus.forEach((u, i) => {
        const k = E.out(prog(lt, IN[i], 0.35));
        const x = lerp(1500, XS[i], k);
        let dy = lt >= IN[i] + 0.35 ? -5 * Math.abs(Math.sin((lt - IN[i]) * 2.6 + i)) : 0, rot = 0;
        if (hot === i) rot = Math.sin(lt * 42) * 3;
        if (lt >= REVEAL) rot = (i % 2 ? 1 : -1) * 4 * E.out(prog(lt, REVEAL + 0.2, 0.3));  // kapüşonluya döner gibi
        u.wrap.style.transform = `translate(${x - u.w / 2}px,${1262 - u.h + dy}px) rotate(${rot}deg)`;
        u.pl.style.transform = `translate(${x - 48}px,${1236}px)`;
        const bp = prog(lt, BUBBLE + i * 0.22, 0.3);
        u.bub.style.display = bp > 0 && lt < ASK ? 'block' : 'none';
        if (bp > 0) popIn(u.bub, bp, { fromY: 40, base: `translate(${clamp(x - 115, 40, 790)}px,${1262 - u.h - (i % 2 ? 136 : 76)}px)` });  // baloncuk kadrajda kalır
        u.sweat.style.display = hot === i ? 'block' : 'none';
        u.sweat.style.transform = `translate(${x + u.w / 2 - 14}px,${1262 - u.h + 10 + ((lt * 2) % 1) * 40}px)`;
        spots[i].style.opacity = pools[i].style.opacity = lt < IN[i] ? 0 : lt >= DARK ? 0 : hot >= 0 ? (hot === i ? 1 : 0.18) : 0.75;
      });
      dimB.style.opacity = lt >= DARK ? (lt < REVEAL ? 0.92 : 0.62) : 0;
      spot5.style.opacity = pools[4].style.opacity = lt >= REVEAL ? 1 : 0;
      hood.style.display = pl5.style.display = lt >= REVEAL ? 'block' : 'none';
      hood.style.transform = `translateY(${(1 - E.out(prog(lt, REVEAL, 0.3))) * 40}px)`;
      eyesGlow.style.opacity = 0.6 + 0.4 * Math.sin(lt * 9);
      pl5.style.transform = `translate(${XS[4] - 125}px,1236px)`;
      cardsB.forEach((c, i) => {
        const q = prog(lt, CARDS + i * 0.1, 0.3);
        c.style.display = q > 0 ? 'block' : 'none';
        const [cx2, cy2, r2] = [[850, 920, -8], [840, 1040, 6], [1340, 920, 8], [1330, 1040, -6]][i];
        popIn(c, q, { fromX: XS[4] - 85 - cx2, fromY: 1080 - cy2, base: `translate(${cx2}px,${cy2}px) rotate(${r2}deg)` });
      });
      const asking = lt >= ASK && lt < COUNT;
      bB.root.style.display = asking ? 'block' : 'none';
      bB.set('curious', null, blink(lt, 0.3));
      bB.put(230, 1620);

      // pano: polaroit, ipler, kartlar; sıradan harcamada tahmin = gerçek; bu seferliklerde gerçek tahminin çok üstünde
      const k = lt - SCI;
      popIn(pol, prog(k, 0.1, 0.3), { fromY: 60, base: 'rotate(-4deg)' });
      lines.forEach((l, i) => l.setAttribute('stroke-dashoffset', String(400 * (1 - E.out(prog(k, 0.45 + i * 0.1, 0.35))))));
      cardsC.forEach((c, i) => popIn(c, prog(k, 0.55 + i * 0.1, 0.3), { fromY: 40, base: `rotate(${(i % 2 ? 3 : -3)}deg)` }));
      popIn(chart, prog(k, 0.35, 0.3), { fromY: 60, base: 'rotate(2deg)' });
      const nb = E.out(prog(lt, NORMAL, 0.6));
      bars[0].style.height = px(170 * nb); bars[1].style.height = px(176 * nb);
      okM.style.opacity = lt >= NORMAL + 0.7 ? 1 : 0;
      bars[2].style.height = px(84 * E.out(prog(lt, EXC, 0.4)));
      bars[3].style.height = px(236 * E.out(prog(lt, EXC + 0.45, 0.7)));
      miss.style.opacity = lt >= EXC + 1.2 ? 1 : 0;
      miss.style.transform = `rotate(-10deg) scale(${lerp(2, 1, E.out(prog(lt, EXC + 1.2, 0.2)))})`;
      srcC.style.opacity = prog(k, 0.8, 0.4);

      // telefon: "+ Plan ekle" → "Bu seferlikler · Her ay · 500 TL" (pençe TAP anında düğmeye basar)
      const d = lt - TAP + 0.45;
      addP.style.transform = `scale(${d >= 0.45 && d < 0.58 ? 0.94 : 1})`;
      newRow.style.opacity = clamp(prog(d, 0.55, 0.12));
      newRow.style.transform = `scale(${lerp(0.85, 1, E.back(prog(d, 0.55, 0.3)))})`;
      newRow.style.boxShadow = d >= 0.9 ? `0 0 0 ${Math.round(5 + 3 * Math.sin(lt * 6))}px rgba(242,182,60,.55)` : 'none';
      const grow = 148 * E.out(prog(d, 0.55, 0.25));  // liste uzar: düğme, kart ve altındaki limitler aşağı kayar
      addP.style.top = px(284 + grow);
      pcard.style.height = px(412 + grow);
      lim.style.top = px(722 + grow);
      const tapping = d >= 0.1 && d < 0.95;
      pawD.style.display = armD.style.display = tapping ? 'block' : 'none';
      if (tapping) {
        const py = lerp(1840, 1318, E.out(prog(d, 0.1, 0.3))) + 12 * (d >= 0.45 && d < 0.58 ? 1 : 0) + 800 * E.inOut(prog(d, 0.62, 0.33));  // parmak uçları "+ Plan ekle"nin ortasında
        pawD.style.transform = `translate(${540 - 56}px,${py - 56}px)`;
        armD.style.transform = `translate(${540 - 36}px,${py + 20}px)`;
      }

      // kamera planları (A sokak, B sıra odası, C pano, D telefon): dünya noktası (fx, fy) ekranda (540, SY)'ye düşer
      let W = 'A', z = 1, fx = 540, fy = SY;
      if (lt < BILGE) { z = 1.2 + 0.04 * prog(lt, 0, 1.2); fy = 1050; }                                                          // olay yeri
      else if (lt < LINEUP) { const q = ramp(BILGE, LINEUP - BILGE); z = 1.24 + 0.12 * q; fx = lerp(540, 680, q); fy = lerp(1050, 1090, q); }   // dedektif bakar
      else if (lt < Math.min(WIDE, ASK)) { W = 'B'; z = 1.75; fx = lerp(230, 820, E.inOut(prog(lt, IN[0] - 0.4, IN[3] - IN[0] + 1))); fy = 1048; }   // şüpheliler girerken sırayı yakından tarar
      else if (lt < ASK) { W = 'B'; z = 1.06 + 0.02 * prog(lt, WIDE, ASK - WIDE); fx = 532; fy = 960; }                         // hepsi: "Sadece 90 TL!"
      else if (lt < COUNT) { W = 'B'; z = 1.3; fx = 340; fy = 1230; }                                                           // "Sence katil kim?"
      else if (lt < DARK) { W = 'B'; z = 1.06 + 0.02 * ramp(COUNT, ZERO - COUNT); fx = 532; fy = 960; }                         // karar
      else if (lt < REVEAL) { W = 'B'; z = 1.08; fx = 532; fy = 960; }
      else if (lt < SCI) { W = 'B'; const q = E.out(prog(lt, REVEAL - 0.1, 0.35)); z = lerp(1.08, 1.5, q); fx = lerp(532, 1175, q); fy = lerp(960, 1080, q); }   // sıranın sonunda: BU SEFERLİK
      else if (lt < EXC) { W = 'C'; z = 1.05 + 0.03 * prog(lt, SCI, EXC - SCI); fy = 1062; }                                    // pano
      else if (lt < APP) { W = 'C'; const q = E.out(prog(lt, EXC, 0.5)); z = lerp(1.08, 1.32, q); fx = lerp(540, 800, q); fy = lerp(1062, 1040, q); }   // grafik
      else if (lt < CTA) { W = 'D'; z = 1.28 + 0.03 * prog(lt, APP, CTA - APP); fy = 1119; }                                    // Cep Defteri
      else { z = 1.15 + 0.04 * prog(lt, CTA, 3); fx = 640; fy = 1060; }                                                         // soru
      let beat = -9;
      beats.forEach((t) => { if (lt >= t) beat = t; });
      z *= 1 + 0.012 * Math.exp(-(lt - beat) * 10);
      const sx = shake(lt, REVEAL, 16, 0.4) + shake(lt, DARK, 6, 0.25) + BOLTS.reduce((a, b) => a + shake(lt, b, 6, 0.3), 0);
      [camA, camB, camC, camD].forEach((c, i) => (c.style.display = 'ABCD'[i] === W ? 'block' : 'none'));
      ({ A: camA, B: camB, C: camC, D: camD })[W].style.transform = `translate(${540 - fx * z + sx}px,${SY - fy * z}px) scale(${z})`;
      flash.style.opacity = (W === 'A' || (lt >= REVEAL && lt < SCI) ? 0.6 : 0) * F;
      pill.style.display = lt >= COUNT && lt < ZERO ? 'flex' : 'none';
      pill.style.opacity = Math.min(1, (lt - COUNT) * 8);
      pin.style.transform = `scale(${1 + 0.04 * Math.exp(-((lt - COUNT) % 1) * 10)})`;
    };
  };

  /* Abonelik vampirleri: korku. Gece 03.00, Ceviz uyuyor; komodindeki cam kumbaradan karanlıkta biri pipetle içiyor. Telefon kendiliğinden
   * yanar, uygulama simgeleri vampire döner ve sırayla çıkar (müzik, dizi, oyun, bulut), pipetlerini kumbaraya sokarlar; etiketler: 550 TL.
   * Eski bir bildirimden solgun "deneme üyeliği" çıkar: ayda 700 TL. Defterde anket (C+R Research 2022: %42'si kullanmayı bıraktığı aboneliğe
   * hâlâ ödüyordu; 100 kişilik ızgara), Ceviz lambayı yakar, vampirler toza döner; Cep Defteri'nde abonelikler alt alta; soru ("önce tahmin et,
   * sonra say"), takip kartı; lamba söner, kumbaradaki kırmızı gözler döner (döngü).
   * Dünyalar: A yatak odası, B telefon ekranı (ana ekran, bildirim, Cep Defteri), C defter sayfası; kamera aralarında keser. */
  SCENES.vampir = (t0, o = {}) => {
    deriveCevizCap();
    const s = scene(t0, '#05060A', undefined, o.wdur ?? 0.4);
    const ev = (k) => o[k] ?? 99;
    const WIDE = ev('wide'), PIGT = ev('pig'), DRAIN = ev('drain'), PHONE = ev('phone'), SCREEN = ev('screen'), WAKE = ev('wake');
    const OUT = o.out || [99, 99, 99, 99], SIP = ev('sip'), TAGS = ev('tags'), SNEAK = ev('sneak');
    const NOTIF = ev('notif'), CRAWL = ev('crawl'), TOTAL = ev('total'), HIT = ev('hit'), SCI = ev('sci'), PCT = ev('pct');
    const MISS = ev('miss'), ROUSE = ev('rouse'), PULL = ev('pull'), LIGHT = ev('light'), APP = ev('app');
    const ROWS = o.rows || [99, 99, 99, 99, 99], CTA = ev('cta'), FOLLOW = ev('follow'), TAPF = ev('tapf'), LURK = ev('lurk'), OFF = ev('off');
    const SY = 1180;  // odak noktasının ekrandaki yüksekliği: kutu ve altyazının altında, Instagram'ın alt bandının üstünde
    const world = () => el('div', 'abs', s.root, { left: 0, top: 0, width: '1080px', height: '1920px', transformOrigin: '0 0' });
    const SLOT = [964, 1095];  // kumbaranın para yarığı (dünya A)

    // ── A · yatak odası (gece 03.00) ──
    const camA = world();
    const room = el('div', 'abs', camA, { left: 0, top: 0, width: '1080px', height: '1920px' });  // lamba yanınca aydınlanan her şey
    el('div', 'abs', room, { left: '-300px', top: '-400px', width: '1680px', height: '1900px', background: 'linear-gradient(#0B0F22, #161C38 55%, #11152C)' });
    el('div', 'abs', room, { left: '-300px', top: '-400px', width: '1680px', height: '1900px', background: 'repeating-linear-gradient(90deg, rgba(255,255,255,.035) 0 44px, transparent 44px 88px)' });  // duvar kâğıdı
    el('div', 'abs', room, { left: '-300px', top: '1490px', width: '1680px', height: '900px', background: 'repeating-linear-gradient(90deg, #24180F 0 150px, #1B120B 150px 156px)' });  // parke
    el('div', 'abs', room, { left: '-300px', top: '1478px', width: '1680px', height: '18px', background: '#2E2016' });
    // pencere: ay, yıldızlar, karşı binalar
    const win = el('div', 'abs', room, { left: '730px', top: '560px', width: '290px', height: '320px', boxSizing: 'border-box', border: '12px solid #2A2F48', background: 'linear-gradient(#121A3E, #22306A)', overflow: 'hidden' });
    el('div', 'abs', win, { left: '176px', top: '24px', width: '58px', height: '58px', borderRadius: '50%', background: '#F3EBC8', boxShadow: '0 0 40px 12px rgba(243,235,200,.25)' });
    [[24, 30], [84, 64], [140, 16], [40, 118], [226, 112], [112, 150]].forEach(([x, y]) => el('div', 'abs', win, { left: px(x), top: px(y), width: '6px', height: '6px', background: '#DDE3FF' }));
    [[0, 206, 62, 110], [56, 176, 52, 140], [104, 222, 70, 90], [170, 192, 46, 120], [212, 232, 80, 80]].forEach(([x, y, w, h], i) => {
      const b = el('div', 'abs', win, { left: px(x), top: px(y), width: px(w), height: px(h), background: '#0C1126' });
      for (let k = 0; k < 3; k++) el('div', 'abs', b, { left: px(10 + ((k * 17 + i * 7) % (w - 22))), top: px(14 + k * 22), width: '8px', height: '10px', background: (k + i) % 2 ? '#F2C14E' : '#343A5C' });
    });
    el('div', 'abs', win, { left: '127px', top: 0, width: '12px', height: '100%', background: '#2A2F48' });
    el('div', 'abs', win, { left: 0, top: '140px', width: '100%', height: '12px', background: '#2A2F48' });
    el('div', 'abs', room, { left: '688px', top: '548px', width: '58px', height: '360px', background: 'linear-gradient(90deg, #241D44, #362C62)' });
    el('div', 'abs', room, { left: '1004px', top: '548px', width: '58px', height: '360px', background: 'linear-gradient(90deg, #362C62, #241D44)' });
    el('div', 'abs', room, { left: '672px', top: '536px', width: '406px', height: '16px', background: '#1E1838' });
    // duvar saati: akrep 3'te, yelkovan 12'de; saniye kolu her saniye bir çentik
    const clock = el('div', 'abs', room, { left: '252px', top: '678px', width: '156px', height: '156px' });
    clock.innerHTML = '<svg width="156" height="156" viewBox="0 0 156 156"><circle cx="78" cy="78" r="71" fill="#EDE6D6" stroke="#3A2A22" stroke-width="10"/>'
      + [...Array(12)].map((_, k) => `<rect x="75" y="15" width="6" height="${k % 3 ? 9 : 16}" fill="#3A2A22" transform="rotate(${k * 30} 78 78)"/>`).join('')
      + '<line x1="78" y1="78" x2="116" y2="78" stroke="#2A1E1A" stroke-width="9" stroke-linecap="round"/>'
      + '<line x1="78" y1="78" x2="78" y2="28" stroke="#2A1E1A" stroke-width="6" stroke-linecap="round"/>'
      + '<line class="sec" x1="78" y1="90" x2="78" y2="20" stroke="#C0392B" stroke-width="3"/><circle cx="78" cy="78" r="6" fill="#2A1E1A"/></svg>';
    const sec = clock.querySelector('.sec');
    // karyola, yastık, gece şapkalı Ceviz, battaniye, battaniyenin üstünde CEP DEFTERİ defteri
    el('div', 'abs', room, { left: '40px', top: '960px', width: '580px', height: '560px', boxSizing: 'border-box', border: '10px solid #22160F', borderRadius: '40px 40px 0 0', background: 'linear-gradient(#4A3428, #31221A)' });
    el('div', 'abs', room, { left: '80px', top: '1004px', width: '500px', height: '12px', background: '#5C4335' });
    el('div', 'abs', room, { left: '100px', top: '1146px', width: '460px', height: '150px', boxSizing: 'border-box', border: '8px solid #24273F', borderRadius: '60px', background: 'linear-gradient(#7C82AA, #5E6488)' });
    // Ceviz bu sahnede aynalı: kuyruğu solda, boş yanı lambaya bakar. Lambanın ipi yatağın yanına sarkar; boncuk, Ceviz oturup
    // kolunu kaldırınca ('reach') patisinin ortasına gelir (Ceviz'in arkasında kalır, patisi kavrar)
    const CC = 420 / 32, BX = 640, BY = 1450 - 46 - 21.5 * CC, CZX = BX - 210 + 2.5 * CC;  // Ceviz'in sprite hücresi; boncuğun ortası; ipi çekerken Ceviz'in yeri
    const cord = el('div', 'abs', room, { left: px(BX - 2), top: '948px', width: '4px', height: px(BY - 948), background: '#C9B48A' });
    const bead = el('div', 'abs', room, { left: px(BX - 9), top: px(BY - 9), width: '18px', height: '18px', borderRadius: '50%', background: '#E0C890', boxShadow: 'inset -3px -3px 0 #A8925E' });
    const cz = new Mascot(room, { who: 'cevizcap', w: 420 });
    const zz = [0, 1, 2].map((i) => { const e = el('div', 'abs it', room, { left: 0, top: 0, fontSize: px(64 - i * 12), color: '#DDE3FF', display: 'none' }); e.textContent = 'z'; return e; });
    el('div', 'abs', room, { left: '20px', top: '1290px', width: '620px', height: '440px', boxSizing: 'border-box', border: '8px solid #1A1530', borderRadius: '44px 44px 0 0', background: 'repeating-conic-gradient(#3E3469 0 25%, #483E7A 0 50%) 0 0 / 80px 80px' });
    el('div', 'abs', room, { left: '28px', top: '1298px', width: '604px', height: '40px', borderRadius: '36px 36px 0 0', background: '#5A4E92' });
    const book = el('div', 'abs', room, { left: '360px', top: '1350px', width: '236px', height: '92px', boxSizing: 'border-box', border: '5px solid #2A1E1A', borderRadius: '8px 14px 14px 8px', background: 'linear-gradient(90deg, #7A2F0E 0 20px, #AE4716 20px 200px, #5C2209 200px 210px, #AE4716 210px)', transform: 'rotate(-6deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: '10px', fontSize: '30px', fontWeight: 800, color: '#FFFCF6', letterSpacing: '.04em' });
    book.textContent = 'CEP DEFTERİ';
    // komodin: çekmece ve açık raf (rafın karanlığında gözler)
    el('div', 'abs', room, { left: '660px', top: '1240px', width: '450px', height: '262px', boxSizing: 'border-box', border: '8px solid #22160F', background: '#3A2A22' });
    el('div', 'abs', room, { left: '648px', top: '1222px', width: '474px', height: '26px', boxSizing: 'border-box', border: '6px solid #22160F', background: '#4C372B' });
    el('div', 'abs', room, { left: '690px', top: '1270px', width: '390px', height: '96px', boxSizing: 'border-box', border: '6px solid #22160F', background: '#44302A' });
    el('div', 'abs', room, { left: '866px', top: '1308px', width: '28px', height: '18px', borderRadius: '9px', background: '#C9A46C', boxShadow: 'inset 0 -4px 0 #8C6A3A' });
    el('div', 'abs', room, { left: '690px', top: '1384px', width: '390px', height: '104px', background: '#0D0907', boxShadow: 'inset 0 10px 18px rgba(0,0,0,.8)' });
    // duvar lambası (yatak ile komodin arasında), ipi ve boncuğu
    el('div', 'abs', room, { left: '618px', top: '846px', width: '22px', height: '62px', borderRadius: '6px', background: '#2A2420' });
    el('div', 'abs', room, { left: '630px', top: '862px', width: '40px', height: '12px', background: '#2A2420' });
    const shade = el('div', 'abs', room, { left: '598px', top: '874px', width: '112px', height: '74px', clipPath: 'polygon(22% 0, 78% 0, 100% 100%, 0 100%)', background: '#6E604C' });
    // soruda Ceviz oturur; telefonu cevizini tuttuğu yerde iki patisiyle tutar, arkası bize dönük (sprite koordinatlarıyla yerleşir)
    const SIT = 94;  // oturunca ne kadar yükselir
    const held = el('div', 'abs', room, { left: px(330 - 210), top: px(1450 - SIT - 30 * CC), display: 'none', zIndex: 3 });
    pixEl(held, PHONE_BACK, PHONE_BACK_C, CC / 3, { left: px(15 * CC), top: px(17 * CC) });  // aynalı sprite'ta gövdenin ortası 18. sütun
    pixEl(held, HOLD_PAWS, { A: '#2A1E1A', D: '#A8683A', B: '#7E4A26' }, CC, { left: px(11 * CC), top: px(20 * CC) });
    const bang = el('div', 'abs', room, { left: '440px', top: '930px', fontSize: '160px', fontWeight: 800, lineHeight: 1, color: '#FFE08A', textShadow: '6px 0 0 #2A1E1A, -6px 0 0 #2A1E1A, 0 6px 0 #2A1E1A, 0 -6px 0 #2A1E1A, 4px 4px 0 #2A1E1A, -4px 4px 0 #2A1E1A, 4px -4px 0 #2A1E1A, -4px -4px 0 #2A1E1A', display: 'none', transformOrigin: '50% 100%' });
    bang.textContent = '!';
    const lurk = [0, 1].map((i) => el('div', 'abs', room, { left: px(904 + i * 34), top: '1440px', width: '16px', height: '10px', borderRadius: '50%', background: '#FF3A4A', boxShadow: '0 0 14px 5px rgba(255,40,60,.6)', display: 'none' }));

    // ay ışığı: pencereden kumbaraya düşer (lamba yanınca söner); telefon ve lamba ışıkları
    const moon = el('div', 'abs', camA, { left: '700px', top: '880px', width: '400px', height: '360px', clipPath: 'polygon(8% 0, 82% 0, 98% 100%, 34% 100%)', background: 'linear-gradient(rgba(170,190,255,.16), rgba(170,190,255,.07))', mixBlendMode: 'screen', pointerEvents: 'none' });
    const phGlow = el('div', 'abs', camA, { left: '508px', top: '860px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(150,170,255,.42), rgba(150,170,255,0))', mixBlendMode: 'screen', opacity: 0, pointerEvents: 'none' });
    const bulb = el('div', 'abs', camA, { left: '540px', top: '830px', width: '230px', height: '230px', borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,236,190,.95), rgba(255,220,150,0))', mixBlendMode: 'screen', opacity: 0, pointerEvents: 'none' });
    const warm = el('div', 'abs', camA, { left: '-300px', top: '-400px', width: '1680px', height: '2800px', background: 'radial-gradient(circle at 655px 1300px, rgba(255,200,130,.32), rgba(255,190,120,.12) 45%, rgba(255,190,120,.05))', mixBlendMode: 'screen', opacity: 0, pointerEvents: 'none' });

    // telefon şarj standında, ekranı bize dönük
    el('div', 'abs', camA, { left: '700px', top: '1204px', width: '116px', height: '22px', borderRadius: '6px 6px 2px 2px', background: '#1C1C24', boxShadow: 'inset 0 4px 0 #2C2C38' });
    const sph = el('div', 'abs', camA, { left: '694px', top: '988px', width: '128px', height: '222px', boxSizing: 'border-box', border: '6px solid #0E0F14', borderRadius: '20px', background: '#101118', overflow: 'hidden' });
    const sScr = el('div', 'abs', sph, { inset: '3px', borderRadius: '14px', overflow: 'hidden', background: 'linear-gradient(#2B1F4E, #120C24)', opacity: 0 });
    el('div', 'abs', sScr, { left: 0, right: 0, top: '10px', textAlign: 'center', fontSize: '28px', fontWeight: 700, color: '#EAF0FF' }).textContent = '03:00';
    const sIcons = [0, 1, 2, 3].map((i) => pixEl(sScr, vampRows(i, false), vampCols(i), 2, { left: px(i % 2 ? 62 : 18), top: px(i < 2 ? 64 : 116) }));
    const sNote = el('div', 'abs', sScr, { left: '6px', right: '6px', top: '52px', height: '34px', borderRadius: '8px', background: 'rgba(240,236,228,.92)', display: 'none' });
    el('div', 'abs', sNote, { left: '6px', top: '7px', width: '20px', height: '20px', borderRadius: '5px', background: VAMP_COL[4] });
    el('div', 'abs', sNote, { left: '32px', right: '8px', top: '9px', height: '6px', borderRadius: '3px', background: '#6E6680' });
    el('div', 'abs', sNote, { left: '32px', right: '30px', top: '20px', height: '5px', borderRadius: '3px', background: '#A8A29A' });

    // cam kumbara: arkada cam, ortada seviyesi düşen paralar, önde çizgi ve parıltı
    const PC = 8, PX = 836, PY = 1068;
    const pig = el('div', 'abs', camA, { left: px(PX), top: px(PY), width: px(30 * PC), height: px(20 * PC) });
    const inBody = (c) => c === 'g' || c === 'h';
    el('div', 'abs', pig, { left: 0, top: 0 }).innerHTML = pix(PIG.map((r) => [...r].map((c) => (inBody(c) ? 'g' : '.')).join('')), { g: 'rgba(242,184,200,.2)' }, PC);
    // pipetlerin kumbaradaki kısmı: yarıktan paraların içine iner (yığının arkasında kalır, uç paraların içinde)
    const STRAW = '<g><line stroke="#2A1E1A" stroke-width="13" stroke-linecap="round"/><line stroke="#F4F1EA" stroke-width="7" stroke-linecap="round"/><line stroke="#E8322A" stroke-width="7" stroke-dasharray="7 9"/></g>';
    const inner = el('div', 'abs', pig, { left: 0, top: 0, width: px(30 * PC), height: px(20 * PC) });
    inner.innerHTML = `<svg width="${30 * PC}" height="${20 * PC}" overflow="visible">${STRAW.repeat(5)}</svg>`;
    const innerG = [...inner.querySelectorAll('g')];
    const coin = (x, y) => 'YYYYyyyddpb'[(x * 7 + y * 13 + ((x * y) % 5)) % 11];
    const fill = el('div', 'abs', pig, { left: 0, top: 0 });
    fill.innerHTML = pix(PIG.map((r, y) => [...r].map((c, x) => (inBody(c) ? coin(x, y) : '.')).join('')), { Y: '#F2B63C', y: '#FFE08A', d: '#D9961E', p: '#F4BCD8', b: '#B5D0EE' }, PC);
    el('div', 'abs', pig, { left: 0, top: 0 }).innerHTML = pix(PIG.map((r) => r.replace(/g/g, 'v')), { o: '#3A1E2C', v: 'rgba(255,236,242,.07)', a: 'rgba(242,184,200,.6)', l: 'rgba(242,184,200,.6)', t: 'rgba(242,184,200,.75)', s: '#F49AB2', n: '#3A1E2C', e: '#3A1E2C', k: '#140A10', h: 'rgba(255,255,255,.9)' }, PC);
    // kumbaranın burnundan sarkan etiket: "AYDA 550 TL" → "700 TL"
    const pTag = el('div', 'abs', camA, { left: '868px', top: '1262px', width: '196px', height: '96px', boxSizing: 'border-box', border: '5px solid #2A1E1A', borderRadius: '12px 30px 30px 12px', background: '#FFFCF6', boxShadow: '0 8px 14px rgba(0,0,0,.45)', textAlign: 'center', display: 'none', transformOrigin: '20% 0' });
    pTag.innerHTML = '<div style="font-size:22px;font-weight:800;color:#8A7D72;letter-spacing:.08em;margin-top:6px">AYDA</div><div class="n" style="font-size:44px;font-weight:800;color:#2A1E1A;letter-spacing:-.02em;line-height:1">0 TL</div>';
    const pTagN = pTag.querySelector('.n');
    const tagStr = el('div', 'abs', camA, { left: '858px', top: '1150px', width: '4px', height: '128px', background: '#C9B48A', transformOrigin: '50% 0', transform: 'rotate(-14deg)', display: 'none' });

    // pipetler (her biri: beyaz gövde, kırmızı şerit) ve pipetten yukarı akan para kırıntıları
    const straws = el('div', 'abs', camA, { left: 0, top: 0, width: '1080px', height: '1920px', pointerEvents: 'none' });
    straws.innerHTML = '<svg width="1080" height="1920" viewBox="0 0 1080 1920" overflow="visible">' + STRAW.replace('</g>', '<rect width="9" height="9" fill="#FFE08A"/></g>').repeat(5) + '</svg>';
    const strawG = [...straws.querySelectorAll('g')];
    const setLine = (g, x1, y1, x2, y2) => g.querySelectorAll('line').forEach((l) => { l.setAttribute('x1', x1); l.setAttribute('y1', y1); l.setAttribute('x2', x2); l.setAttribute('y2', y2); });

    // vampirler: gövde, iki kanat, parlayan gözler, fiyat etiketi; ışıkta toza dönerler
    const VC = 4;
    const HOME = [[826, 1004], [928, 946], [1030, 952], [1122, 1002], [1000, 1050]];  // pipetle içerken; 4: kancada kumbaranın sırtında
    const PERCH = [748, 950];  // deneme üyeliği: sonra telefonun tepesine tüner
    const vamps = [0, 1, 2, 3, 4].map((i) => {
      const w = el('div', 'abs', camA, { left: 0, top: 0, width: px(16 * VC), height: px(18 * VC), transformOrigin: '50% 50%', display: 'none' });
      const wl = pixEl(w, VWING_UP, VWING_C, VC, { left: px(-9 * VC), top: px(3 * VC), transformOrigin: '100% 50%' });
      const wr = pixEl(w, VWING_UP, VWING_C, VC, { left: px(15 * VC), top: px(3 * VC), transform: 'scaleX(-1)', transformOrigin: '0 50%' });
      const body = pixEl(w, vampRows(i), vampCols(i), VC, { left: 0, top: 0 });
      const eyes = [3, 11].map((x) => el('div', 'abs', w, { left: px(x * VC), top: px(4 * VC), width: px(2 * VC), height: px(2 * VC), background: '#FF4A5A', boxShadow: '0 0 10px 4px rgba(255,40,60,.75)' }));
      let sash = null;
      if (i === 4) {  // solgun vampirin göğsünde soluk bir kuşak
        sash = el('div', 'abs', w, { left: px(-2), top: px(9 * VC), width: px(16 * VC + 4), height: px(3 * VC), background: '#8C8494', transform: 'rotate(-16deg)' });
        [[2, 1], [11, 0]].forEach(([x, y]) => pixEl(w, COBWEB, { w: '#F4F1EA' }, 2, { left: px(x * VC), top: px(y * VC), opacity: 0.8 }));
      }
      const tag = el('div', 'abs', camA, { left: 0, top: 0, padding: '1px 8px 3px', borderRadius: '9px', border: '3px solid #2A1E1A', background: '#FFFCF6', fontSize: '24px', fontWeight: 800, color: '#C0392B', whiteSpace: 'nowrap', display: 'none', transformOrigin: '50% 100%' });
      tag.textContent = `${VAMP_FEE[i]} TL`;
      const dust = new Burst(camA, { n: 18, t0: LIGHT + 0.12 + (i % 5) * 0.07, ox: 0, oy: 0, colors: [VAMP_COL[i], '#E8E2D8', '#B8B0C4', '#8C8494'], speed: 360, grav: -260, life: 0.85, size: [10, 22], upBias: 0.2 });
      return { w, wl, wr, body, eyes, sash, tag, dust };
    });
    vamps.forEach((v) => camA.appendChild(v.tag));  // etiketler vampirlerin üstünde kalsın

    // ── B · telefon ekranı: ana ekran → bildirim → Cep Defteri ──
    const camB = world();
    el('div', 'abs', camB, { left: '-300px', top: '-300px', width: '1680px', height: '2520px', background: 'radial-gradient(ellipse 760px 1000px at 840px 1300px, #1B2140, #07080D 70%)' });
    el('div', 'abs', camB, { left: '150px', top: '640px', width: '780px', height: '1520px', boxSizing: 'border-box', border: '8px solid #2B2D36', borderRadius: '86px', background: '#121318', boxShadow: '0 0 140px 40px rgba(150,190,255,.16)' });
    const scr = el('div', 'abs', camB, { left: '172px', top: '662px', width: '736px', height: '1476px', borderRadius: '64px', overflow: 'hidden', background: 'linear-gradient(#2B1F4E, #120C24 60%)' });
    const sb = el('div', 'abs', scr, { left: '48px', right: '48px', top: '18px', height: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '30px', fontWeight: 800, color: '#EAF0FF', zIndex: 3 });
    sb.innerHTML = '<span>03:00</span><span style="display:flex;gap:10px;align-items:center"><i style="display:block;width:30px;height:18px;background:#EAF0FF;clip-path:polygon(0 100%,100% 0,100% 100%)"></i><i style="display:block;position:relative;width:46px;height:24px;box-sizing:border-box;border:3px solid #EAF0FF;border-radius:6px"><b style="position:absolute;left:3px;top:3px;bottom:3px;width:9px;background:#E8322A"></b></i></span>';
    el('div', 'abs', scr, { left: 0, right: 0, top: '86px', textAlign: 'center', fontSize: '150px', fontWeight: 700, color: '#EAF0FF', letterSpacing: '-.03em', lineHeight: 1 }).textContent = '03:00';
    const IC = 12, ICW = 16 * IC, ICH = 18 * IC;
    const ICPOS = [[110, 290], [442, 290], [110, 578], [442, 578]];  // ekran içi sol-üst köşe
    ICPOS.forEach(([x, y]) => el('div', 'abs', scr, { left: px(x + 6), top: px(y + 6), width: px(ICW - 12), height: px(ICW - 12), boxSizing: 'border-box', borderRadius: '44px', border: '4px dashed rgba(234,240,255,.28)' }));  // simgeler uçunca kalan boş yerler
    const icons = ICPOS.map(([x, y], i) => {
      const e = pixEl(scr, vampRows(i, false), vampCols(i), IC, { left: px(x), top: px(y), transformOrigin: '50% 50%', zIndex: 2 });
      const lab = el('div', 'abs', scr, { left: px(x - 20), width: px(ICW + 40), top: px(y + ICH + 6), textAlign: 'center', fontSize: '36px', fontWeight: 700, color: '#EAF0FF' });
      lab.textContent = ['Müzik', 'Dizi', 'Oyun', 'Bulut'][i];
      return { e, lab, awake: false };
    });
    // simgeden çıkan vampirler (kameraya doğru uçar): kanatlar
    const flyers = ICPOS.map(([x, y], i) => {
      const f = el('div', 'abs', camB, { left: 0, top: 0, width: px(ICW), height: px(ICH), transformOrigin: '50% 50%', display: 'none', zIndex: 5 });
      const wl = pixEl(f, VWING_UP, VWING_C, IC, { left: px(-9 * IC), top: px(3 * IC), transformOrigin: '100% 50%' });
      const wr = pixEl(f, VWING_UP, VWING_C, IC, { left: px(15 * IC), top: px(3 * IC), transform: 'scaleX(-1)', transformOrigin: '0 50%' });
      pixEl(f, vampRows(i), vampCols(i), IC, { left: 0, top: 0 });
      return { f, wl, wr, cx: 172 + x + ICW / 2, cy: 662 + y + ICH / 2 };
    });
    const redFlash = el('div', 'abs', scr, { inset: 0, background: '#E8322A', opacity: 0, mixBlendMode: 'screen', zIndex: 4 });
    // eski bildirim: "Deneme süren bitti" (3 ay önce), arkasından solgun vampir çıkar
    const NX = 44, NY = 430;
    const ghost = el('div', 'abs', scr, { left: px(368 - ICW / 2), top: px(NY), width: px(ICW), height: px(ICH), display: 'none', zIndex: 5 });
    pixEl(ghost, vampRows(4), vampCols(4), IC, { left: 0, top: 0 });
    [3, 11].forEach((x) => el('div', 'abs', ghost, { left: px(x * IC), top: px(4 * IC), width: px(2 * IC), height: px(2 * IC), background: '#FF4A5A', boxShadow: '0 0 26px 10px rgba(255,40,60,.6)' }));
    [[1, 0, 6], [10, 1, 5]].forEach(([x, y, c]) => pixEl(ghost, COBWEB, { w: '#F4F1EA' }, c, { left: px(x * IC), top: px(y * IC), opacity: 0.85 }));
    const gSash = el('div', 'abs it', ghost, { left: px(-30), top: px(8.6 * IC), width: px(ICW + 60), height: '56px', background: '#6E6680', color: '#FFFCF6', fontSize: '40px', lineHeight: '54px', textAlign: 'center', whiteSpace: 'nowrap', transform: 'rotate(-14deg)', boxShadow: '0 6px 0 rgba(0,0,0,.25)' });
    gSash.innerHTML = '<span style="position:relative;color:#E9E4DA">ÜCRETSİZ<b style="position:absolute;left:-4px;right:-4px;top:52%;height:6px;background:#E8322A"></b></span> DENEME';
    const claws = [0, 1].map((i) => pixEl(scr, ['.oo.oo', 'oPPoPPo'.slice(0, 6), 'oPPPPo', '.oooo.'], { o: '#160E1E', P: '#D9D4CA' }, 9, { left: px(i ? 470 : 220), top: px(NY - 18), display: 'none', zIndex: 7 }));
    const NH = 214;
    const note = el('div', 'abs', scr, { left: px(NX), top: px(NY), width: px(736 - 2 * NX), height: px(NH), boxSizing: 'border-box', padding: '28px 30px 0 150px', borderRadius: '40px', background: 'rgba(240,236,228,.96)', boxShadow: '0 20px 40px rgba(0,0,0,.45)', display: 'none', zIndex: 6, transformOrigin: '50% 0' });
    el('div', 'abs', note, { left: '30px', top: '34px', width: '96px', height: '96px', borderRadius: '24px', background: VAMP_COL[4], boxShadow: 'inset 0 -6px 0 #B9B3A8' });
    note.insertAdjacentHTML('beforeend', '<div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:40px;font-weight:800;color:#2A1E1A">Deneme süren bitti</span></div>'
      + '<div style="font-size:31px;font-weight:600;color:#5E5650;margin-top:8px">Aboneliğin başladı: ayda 150 TL</div>');
    const ago = el('div', 'abs', note, { left: '150px', top: '150px', fontSize: '30px', fontWeight: 800, color: '#8A827A', transformOrigin: '0 50%' });
    ago.textContent = '3 ay önce';
    [[0, 0, false], [736 - 2 * NX - 60, 0, true]].forEach(([x, y, f]) => pixEl(note, COBWEB, { w: '#8E867C' }, 10, { left: px(x), top: px(y), transform: f ? 'scaleX(-1)' : 'none', opacity: 0.9 }));
    const motes = Array.from({ length: 10 }, (_, i) => el('div', 'abs', scr, { left: px(60 + ((i * 131) % 600)), top: 0, width: '8px', height: '8px', background: 'rgba(230,226,218,.55)', display: 'none', zIndex: 6 }));
    // Cep Defteri: Bütçe ve planlar → Tüm planlar (uygulamadaki satır biçimi: ⇄ ad / Her ay · Abonelikler · Banka / tutar)
    const app = el('div', 'abs', scr, { inset: 0, background: '#F6EEE6', display: 'none', zIndex: 8 });
    const head = el('div', 'abs', app, { left: 0, right: 0, top: 0, height: '250px', background: '#AE4716' });
    el('div', 'abs', head, { left: '40px', top: '92px', fontSize: '30px', fontWeight: 700, color: '#FFD9C4' }).textContent = 'Cep Defteri';
    el('div', 'abs', head, { left: '40px', top: '134px', fontSize: '62px', fontWeight: 800, color: '#FFFCF6', letterSpacing: '-.02em' }).textContent = 'Bütçe ve planlar';
    const pcard = el('div', 'abs', app, { left: '30px', right: '30px', top: '280px', height: '96px', borderRadius: '34px', background: '#FFFCF6', boxShadow: '0 10px 30px rgba(60,20,0,.12)', overflow: 'hidden' });
    el('div', 'abs', pcard, { left: '34px', top: '28px', fontSize: '38px', fontWeight: 800, color: '#2A1E1A' }).textContent = 'Tüm planlar';
    const REP = '<svg width="34" height="34" viewBox="0 0 34 34" fill="none" stroke="#8A7D72" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h20l-5-5M28 22H8l5 5"/></svg>';
    const PLANS = [['Bulut depolama', 50], ['Deneme üyeliği', 150], ['Dizi aboneliği', 250], ['Müzik aboneliği', 100], ['Oyun aboneliği', 150]];
    const prows = PLANS.map(([n, a], i) => {
      const r = el('div', 'abs', pcard, { left: '18px', right: '18px', top: px(90 + i * 92), height: '88px', boxSizing: 'border-box', padding: '8px 22px 0 76px', borderRadius: '22px', background: i === 1 ? '#FFF3D6' : 'transparent', borderTop: i ? '2px solid #EFE6DA' : 'none', opacity: 0, transformOrigin: '50% 50%' });
      r.innerHTML = `<div style="position:absolute;left:20px;top:26px">${REP}</div><div style="display:flex;justify-content:space-between;align-items:baseline"><span style="font-size:36px;font-weight:800;color:#2A1E1A">${n}</span><span style="font-size:36px;font-weight:800;color:#2A1E1A">${a} TL</span></div>`
        + '<div style="font-size:25px;font-weight:600;color:#8A7D72;margin-top:6px">Her ay · Abonelikler · Banka</div>';
      return r;
    });

    // ── C · defter sayfası: anket ──
    const camC = world();
    el('div', 'abs', camC, { left: '-300px', top: '-400px', width: '1680px', height: '2800px', background: 'radial-gradient(ellipse 900px 1100px at 540px 1170px, #2A2036, #0B0912 72%)' });
    el('div', 'abs', camC, { left: '58px', top: '712px', width: '964px', height: '928px', borderRadius: '10px 26px 26px 10px', background: '#AE4716', boxShadow: '0 30px 60px rgba(0,0,0,.6)' });  // CEP DEFTERİ'nin kabı
    const page = el('div', 'abs', camC, { left: '70px', top: '720px', width: '940px', height: '904px', borderRadius: '6px 18px 18px 6px', background: '#FBF5E8', backgroundImage: 'linear-gradient(transparent 0 58px, rgba(70,110,190,.22) 58px 61px, transparent 61px)', backgroundSize: '100% 62px', overflow: 'hidden' });
    el('div', 'abs', page, { left: '118px', top: 0, width: '4px', height: '100%', background: 'rgba(214,60,60,.45)' });
    const pTitle = el('div', 'abs it', page, { left: '150px', top: '28px', fontSize: '58px', color: '#2B3A6B', whiteSpace: 'nowrap' });
    pTitle.textContent = 'ANKET · ABD · 1.000 KİŞİ';
    // 100 kişilik ızgara: kullanmayı bıraktığı aboneliğe hâlâ ödeyen 42 kişinin karesi kırmızıya döner
    const GC = 40, GG = 6;  // kare ve aralık
    const cells = Array.from({ length: 100 }, (_, k) => el('div', 'abs', page, { left: px(150 + (k % 10) * (GC + GG)), top: px(176 + Math.floor(k / 10) * (GC + GG)), width: px(GC), height: px(GC), borderRadius: '8px', background: 'rgba(42,46,90,.14)' }));
    el('div', 'abs', page, { left: '150px', top: '648px', fontSize: '28px', fontWeight: 700, color: '#5A5E86' }).textContent = "Her kare: 100 kişiden 1'i";
    const pct = el('div', 'abs it', page, { left: '640px', top: '186px', fontSize: '176px', color: '#C0392B', lineHeight: 1, opacity: 0 });
    const pLab = el('div', 'abs', page, { left: '640px', top: '372px', width: '290px', fontSize: '34px', fontWeight: 800, color: '#2A2E5A', lineHeight: 1.12, opacity: 0 });
    pLab.textContent = 'kullanmayı bıraktığı aboneliğe hâlâ ödüyordu';
    const stampM = el('div', 'abs', page, { left: '540px', top: '590px', padding: '4px 20px 8px', borderRadius: '16px', border: '8px solid #C0392B', background: 'rgba(255,255,255,.88)', color: '#C0392B', fontSize: '54px', fontWeight: 800, letterSpacing: '.02em', opacity: 0, transformOrigin: '50% 50%', whiteSpace: 'nowrap' });
    stampM.textContent = 'UNUTULDU!';
    pixEl(page, vampRows(0), { ...vampCols(0), C: '#FBF5E8', S: '#2A2E5A', o: '#2A2E5A', K: '#2A2E5A', R: '#C0392B' }, 4, { left: '24px', top: '430px', transform: 'rotate(-8deg)', opacity: 0.85 });  // kenar boşluğuna kalemle çizilmiş vampir
    const srcC = el('div', 'abs', page, { left: '152px', top: '96px', fontSize: '28px', fontWeight: 800, color: '#4A3B30' });
    srcC.textContent = 'Kaynak: C+R Research 2022';

    // ── üst katmanlar: kenar karartma, flaş, karar çağrısı ──
    el('div', 'abs', s.root, { inset: 0, zIndex: 17, pointerEvents: 'none', background: 'radial-gradient(ellipse 100% 72% at 50% 56%, transparent 58%, rgba(0,0,0,.5) 100%)' });
    el('div', 'abs', s.root, { left: 0, right: 0, top: 0, height: '260px', zIndex: 17, pointerEvents: 'none', background: 'linear-gradient(rgba(5,6,10,.5), rgba(5,6,10,0))' });
    el('div', 'abs', s.root, { left: 0, right: 0, bottom: 0, height: '300px', zIndex: 17, pointerEvents: 'none', background: 'linear-gradient(rgba(5,6,10,0), rgba(5,6,10,.45))' });
    const flash = el('div', 'abs', s.root, { inset: 0, zIndex: 21, opacity: 0, pointerEvents: 'none', background: '#FFFFFF' });
    // takip kartı (sondaki ortak takip satırıyla), Instagram'ın önerilen hesap kartı gibi ortalı: yuvarlak simge, cep_defteri,
    // "Her hafta bir para tuzağı" ve kart genişliğinde "Takip et"; pençe düğmeye basar
    const FW = 620, FT = 300;
    const fcard = el('div', 'abs', s.root, { left: px((1080 - FW) / 2), top: px(FT), width: px(FW), height: '410px', borderRadius: '44px', background: '#FFFFFF', boxShadow: '0 24px 60px rgba(0,0,0,.45)', display: 'none', zIndex: 26, transformOrigin: '50% 50%', textAlign: 'center' });
    const ficon = el('img', 'abs', fcard, { left: px(FW / 2 - 68), top: '34px', width: '136px', height: '136px', borderRadius: '50%', boxShadow: '0 0 0 4px #FFFFFF, 0 0 0 8px #E9E2D8' });
    ficon.src = 'assets/icon.png';
    el('div', 'abs', fcard, { left: 0, right: 0, top: '186px', fontSize: '50px', fontWeight: 800, color: '#141414', letterSpacing: '-.01em' }).textContent = 'cep_defteri';
    el('div', 'abs', fcard, { left: 0, right: 0, top: '252px', fontSize: '32px', fontWeight: 600, color: '#5E5650' }).textContent = 'Her hafta bir para tuzağı';
    const fbtn = el('div', 'abs', fcard, { left: '44px', right: '44px', top: '310px', height: '72px', borderRadius: '18px', background: '#0095F6', color: '#FFFFFF', fontSize: '38px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', transformOrigin: '50% 50%' });
    const FBX = 740, FBY = FT + 310 + 36;  // pençenin bastığı yer: düğmenin sağ ucu (yazıyı kapatmasın)
    const fpaw = pixEl(s.root, PAWP, { o: '#2A1E1A', B: '#A8683A' }, 16, { left: 0, top: 0, display: 'none', zIndex: 27, transformOrigin: '50% 30%' });
    const fring = el('div', 'abs', s.root, { left: px(FBX - 60), top: px(FBY - 60), width: '120px', height: '120px', boxSizing: 'border-box', borderRadius: '50%', border: '8px solid rgba(0,149,246,.75)', display: 'none', zIndex: 27 });
    const on = (lt, t) => { const k = lt - t; return k < 0 ? 0 : k >= 0.4 ? 1 : [0.15, 0, 0.6, 0.1, 0.85, 0.4, 1, 1][Math.floor(k / 0.05)]; };
    const flick = (lt, a, d) => (lt >= a && lt < a + d ? [1, 0.3, 0.9, 0.15, 0.7, 0.4][Math.floor((lt - a) / (d / 6))] : 1);
    s.update = (lt) => {
      const ramp = (a, d) => E.inOut(prog(lt, a, d));
      // ışık: gece karanlık; lamba yanınca oda aydınlanır; soru bitince söner
      let L = lt >= LIGHT ? on(lt, LIGHT) : 0;
      if (lt >= OFF) L = lt < OFF + 0.08 ? 0.4 : 0;
      const moonK = flick(lt, SNEAK, 0.5) * (1 - L);
      room.style.filter = `brightness(${(0.5 + 0.5 * L) * (0.85 + 0.15 * moonK)})`;
      moon.style.opacity = moonK;
      warm.style.opacity = L;
      shade.style.background = L > 0.5 ? '#F6D9A0' : '#6E604C';
      bulb.style.opacity = L;
      sec.setAttribute('transform', `rotate(${Math.floor(lt) * 6} 78 78)`);

      // telefon (stantta): PHONE'da kendiliğinden yanar; simgeler çıktıkça boşalır; SNEAK'te titrer, bildirim
      const scrOn = lt >= PHONE && lt < CTA;
      const sk = scrOn ? clamp((lt - PHONE) / 0.15) : 0;
      sScr.style.opacity = sk * (lt >= LIGHT ? 0.55 : 1);
      sIcons.forEach((e, i) => (e.style.display = lt < OUT[i] ? 'block' : 'none'));
      sNote.style.display = lt >= SNEAK + 0.2 ? 'block' : 'none';
      const buzz = (lt >= SNEAK && lt < SNEAK + 0.6) || (lt >= PHONE && lt < PHONE + 0.35);
      sph.style.transform = `translateX(${buzz ? Math.sin(lt * 90) * 3 : 0}px)`;
      sph.style.display = lt >= CTA && lt < OFF + 0.1 ? 'none' : 'block';
      phGlow.style.opacity = sk * (lt >= LIGHT ? 0.25 : 1) * (lt >= SNEAK && lt < SNEAK + 0.5 ? 1.3 : 1) * (lt >= CTA ? 0 : 1);

      // kumbara: seviye düşer (kancada %62)
      let lv = 0.62 - 0.07 * E.inOut(prog(lt, DRAIN, 0.45)) - 0.16 * prog(lt, SIP, TOTAL - SIP);
      lv -= 0.08 * prog(lt, TOTAL, SCI - TOTAL) + 0.03 * prog(lt, ROUSE, LIGHT - ROUSE);
      const coinTop = PY + (3 + (1 - lv) * 14) * PC;  // para yığınının yüzü
      fill.style.clipPath = `inset(${(coinTop - PY).toFixed(1)}px 0 0 0)`;
      pig.style.filter = `brightness(${(0.82 + 0.18 * L).toFixed(3)})`;
      // kumbaranın etiketi: vampirlerin etiketlerinden sonra 550 TL; HIT'te 700 TL
      const tagOn = lt >= TAGS + 0.75 && lt < OFF;
      pTag.style.display = tagStr.style.display = tagOn ? 'block' : 'none';
      if (tagOn) {
        const v = 550 + 150 * E.out(prog(lt, HIT - 0.05, 0.3));
        pTagN.textContent = `${fmt(lt < TAGS + 1.1 ? 550 * E.out(prog(lt, TAGS + 0.75, 0.35)) : v)} TL`;
        pTagN.style.color = lt >= HIT ? '#C0392B' : '#2A1E1A';
        pTag.style.borderColor = lt >= HIT ? '#C0392B' : '#2A1E1A';
        pTag.style.transform = `rotate(${Math.sin(lt * 2.2) * 3}deg) scale(${1 + 0.18 * Math.sin(Math.PI * prog(lt, HIT, 0.35))})`;
      }

      // vampirler: kanat çırpar, pipetle içer; ışıkta toza döner
      const burnt = (i) => lt >= LIGHT + 0.12 + i * 0.07;
      vamps.forEach((v, i) => {
        let vis, x, y, dim = 1, a = 1, sc = 1;
        if (i < 4) {
          vis = lt >= SIP && lt < LIGHT + 0.4;
          [x, y] = HOME[i];
        } else if (lt < PHONE + 0.5) {  // kancada kumbaranın sırtında karanlık bir siluet; telefon yanınca saklanır
          vis = true;
          [x, y] = HOME[4];
          dim = 0.16;
          const hide = E.inOut(prog(lt, PHONE + 0.1, 0.4));
          y += 70 * hide; a = 1 - hide;
        } else {
          vis = lt >= TOTAL && lt < LIGHT + 0.4;
          [x, y] = PERCH;
        }
        if (burnt(i)) { const q = prog(lt, LIGHT + 0.12 + i * 0.07, 0.25); a *= 1 - q; sc = 1 + 0.4 * q; }
        v.w.style.display = vis && a > 0.01 ? 'block' : 'none';
        const flap = Math.floor((lt + i * 0.13) / 0.11) % 2;
        const bob = Math.sin(lt * 5 + i) * 5;
        const shiver = lt >= LIGHT && lt < LIGHT + 0.4 ? Math.sin(lt * 80 + i) * 5 : 0;
        if (vis) {
          if (v.flap !== flap) { v.flap = flap; v.wl.innerHTML = v.wr.innerHTML = pix(flap ? VWING_UP : VWING_DN, VWING_C, VC); }
          v.w.style.transform = `translate(${x - 32 + shiver}px,${y - 36 + bob}px) scale(${sc})`;
          v.w.style.opacity = a;
          const fl = lt >= LIGHT ? `brightness(${1 + 2.5 * prog(lt, LIGHT, 0.2)})` : `brightness(${dim})`;
          [v.body, v.wl, v.wr, v.sash].forEach((e) => e && (e.style.filter = fl));
          v.eyes.forEach((e) => (e.style.opacity = dim < 0.5 || lt < LIGHT ? 1 : 0));
        }
        // pipet: ağızdan yarığa, yarıktan aşağı paraların içine (uç, seviye düştükçe iner); para kırıntısı yığından ağza akar
        const g = strawG[i], gi = innerG[i], r = g.querySelector('rect');
        const sv = vis && a > 0.5 && lt < LIGHT + 0.15;
        g.style.display = gi.style.display = sv ? 'inline' : 'none';
        if (sv) {
          const mx = x + shiver, my = y + bob + 24, sx2 = SLOT[0] + (i - 2) * 6, sy2 = SLOT[1] + 6;
          const tx = SLOT[0] + (i - 2) * 16, ty = coinTop + 18;
          setLine(g, mx, my, sx2, sy2);
          setLine(gi, sx2 - PX, sy2 - PY - 6, tx - PX, ty - PY);
          const q = ((lt * 1.6 + i * 0.27) % 1), sx3 = lerp(sx2, tx, (coinTop - sy2) / (ty - sy2));  // sx3: pipetin yığına girdiği yer
          const [kx, ky] = q < 0.35 ? [lerp(sx3, sx2, q / 0.35), lerp(coinTop, sy2, q / 0.35)] : [lerp(sx2, mx, (q - 0.35) / 0.65), lerp(sy2, my, (q - 0.35) / 0.65)];
          r.setAttribute('x', kx - 4.5); r.setAttribute('y', ky - 4.5);
          g.style.filter = gi.style.filter = `brightness(${dim < 0.5 ? 0.3 : 1})`;
        }
        // fiyat etiketleri: dört vampir kumbaraya yerleşince; deneme üyeliği geldiğinde onda
        const ta = i < 4 ? TAGS + 0.05 + i * 0.15 : TOTAL + 0.2;
        const tv = lt >= ta && lt < LIGHT + 0.1 && vis;
        v.tag.style.display = tv ? 'block' : 'none';
        if (tv) popIn(v.tag, prog(lt, ta, 0.3), { fromY: 30, base: `translate(${x}px,${y - 92 + bob * 0.5}px) translateX(-50%)` });
        v.dust.ox = x; v.dust.oy = y;
        v.dust.update(lt);
      });

      // Ceviz: uyur (gece şapkası, z'ler), ROUSE'da uyanır; PULL'da ipe sıçrar, kolunu kaldırıp patisiyle boncuğu kavrar,
      // LIGHT'ta aşağı çekip lambayı yakar; soruda oturur, telefonuna bakar
      const awake = lt >= ROUSE && lt < OFF;
      const sitting = lt >= CTA && lt < OFF;
      const grab = lt >= PULL + 0.22 && lt < LIGHT + 0.45;
      let c = ['calm', null, 'closed'];
      if (awake) c = ['calm', null, 'wide'];
      if (grab) c = ['calm', 'reach', 'wide'];
      if (lt >= LIGHT + 0.3) c = ['happy', grab ? 'reach' : null, 'mood'];
      if (sitting) c = ['happy', null, blink(lt, 0.3)];
      cz.set(...c);
      const pullDy = lt >= LIGHT - 0.05 && lt < LIGHT + 0.3 ? 24 * Math.sin(Math.PI * prog(lt, LIGHT - 0.05, 0.35)) : 0;
      cord.style.height = px(BY - 948 + pullDy);
      bead.style.top = px(BY - 9 + pullDy);
      const breathe = awake ? 0 : 0.015 * Math.sin(lt * 2.2);
      const rise = sitting ? SIT : awake ? 46 * E.out(prog(lt, ROUSE, 0.3)) : 0;
      const jump = lt >= ROUSE && lt < ROUSE + 0.5 ? 26 * Math.exp(-(lt - ROUSE) * 6) * Math.abs(Math.sin((lt - ROUSE) * 14)) : 0;
      const hq = prog(lt, PULL, 0.22), czx = lt < CTA ? lerp(330, CZX, E.inOut(hq)) : 330;  // ipe sıçrayış
      cz.put(czx, 1450 - rise - jump - 44 * Math.sin(Math.PI * hq) + (grab ? pullDy : 0), { sy: 1 + breathe, sx: 1 - breathe * 0.5, flip: true });
      zz.forEach((e, i) => {
        const a2 = i * 0.45, k = ((((lt - a2) % 1.4) + 1.4) % 1.4) / 1.4;
        e.style.display = !awake && lt < OFF ? 'block' : 'none';
        e.style.transform = `translate(${500 + i * 30 + Math.sin(k * 6) * 12}px,${1100 - k * 150}px)`;
        e.style.opacity = Math.sin(Math.PI * k) * 0.9;
      });
      bang.style.display = lt >= ROUSE && lt < Math.min(ROUSE + 0.6, PULL + 0.12) ? 'block' : 'none';
      bang.style.left = px(czx + 150);
      bang.style.transform = `scale(${E.back(prog(lt, ROUSE, 0.2))}) rotate(${Math.sin(lt * 30) * 4}deg)`;
      held.style.display = sitting ? 'block' : 'none';
      held.style.transform = `translateY(${Math.sin(lt * 1.6) * 2}px)`;
      lurk.forEach((e, i) => (e.style.display = lt >= LURK && lt < OFF && (lt * 1000) % 1700 > 150 ? 'block' : 'none'));

      // B · ana ekran: simgeler WAKE'te uyanır (göz, diş); adları söylenince kameraya doğru uçar
      icons.forEach((ic, i) => {
        const aw = lt >= WAKE;
        if (aw !== ic.awake) { ic.awake = aw; ic.e.innerHTML = pix(vampRows(i, aw), vampCols(i), IC); }
        ic.e.style.display = lt < OUT[i] ? 'block' : 'none';
        ic.lab.style.opacity = lt < OUT[i] ? 1 : 0.35;
        const jit = aw && lt < OUT[i] ? Math.sin(lt * 40 + i * 2) * 3 * clamp((lt - WAKE) * 3) : 0;
        ic.e.style.transform = `translate(${jit}px,0) rotate(${jit * 0.8}deg) scale(${1 + 0.1 * Math.exp(-Math.max(0, lt - WAKE) * 8) * (aw ? 1 : 0)})`;
        const fl = flyers[i], q = prog(lt, OUT[i], 0.75);
        fl.f.style.display = q > 0 && q < 1 ? 'block' : 'none';
        if (q > 0 && q < 1) {
          const dir = i % 2 ? 1 : -1, ee = E.inOut(q);
          fl.wl.innerHTML = fl.wr.innerHTML = pix(Math.floor(lt / 0.08) % 2 ? VWING_UP : VWING_DN, VWING_C, IC);
          fl.f.style.transform = `translate(${fl.cx - ICW / 2 + dir * 330 * ee}px,${fl.cy - ICH / 2 - 760 * ee * ee}px) scale(${1 + 1.5 * ee}) rotate(${dir * 18 * ee}deg)`;
        }
      });
      redFlash.style.opacity = lt >= WAKE ? 0.35 * Math.exp(-(lt - WAKE) * 6) : 0;
      // bildirim ve solgun vampir
      const nOn = lt >= NOTIF - 0.05 && lt < TOTAL;
      note.style.display = nOn ? 'block' : 'none';
      if (nOn) {
        note.style.transform = `translateY(${(1 - E.back(prog(lt, NOTIF - 0.05, 0.3))) * -120}px) rotate(${lt >= CRAWL && lt < CRAWL + 0.9 ? Math.sin(lt * 50) * 0.8 : 0}deg)`;
        ago.style.transform = `scale(${1 + 0.25 * Math.sin(Math.PI * prog(lt, NOTIF + 0.05, 0.4))})`;
        ago.style.color = lt >= NOTIF + 0.05 ? '#C0392B' : '#8A827A';
      }
      const gq = E.out(prog(lt, CRAWL, 0.85));
      ghost.style.display = nOn && lt >= CRAWL ? 'block' : 'none';
      const gy = (1 - gq) * 150 - 190 * gq;
      ghost.style.transform = `translateY(${gy}px) rotate(${Math.sin(lt * 3) * 2}deg)`;
      ghost.style.clipPath = `inset(-60px -60px ${Math.max(0, gy + ICH - NH)}px -60px)`;  // kartın alt kenarından aşağısı görünmez
      claws.forEach((cl, i) => {
        cl.style.display = nOn && lt >= CRAWL - 0.2 ? 'block' : 'none';
        cl.style.transform = `translateY(${(1 - E.out(prog(lt, CRAWL - 0.2, 0.25))) * 30}px)`;
      });
      motes.forEach((m, i) => {
        m.style.display = nOn ? 'block' : 'none';
        m.style.transform = `translate(${Math.sin(lt * 1.3 + i) * 20}px,${300 + (((i * 97) + lt * 40) % 420)}px)`;
      });
      // Cep Defteri: satırlar alt alta gelir; deneme üyeliği satırı parlar
      app.style.display = lt >= APP ? 'block' : 'none';
      app.style.transform = `translateX(${(1 - E.out(prog(lt, APP, 0.3))) * 100}%)`;
      let nRows = 0;
      prows.forEach((r, i) => {
        const q = prog(lt, ROWS[i], 0.25);
        if (q > 0) nRows = i + 1;
        r.style.opacity = clamp(q * 3);
        r.style.transform = `translateX(${(1 - E.out(q)) * 120}px)`;
      });
      pcard.style.height = px(90 + 92 * Math.min(5, nRows) + (nRows ? 12 : 0));
      prows[1].style.boxShadow = lt >= ROWS[4] + 0.3 ? `0 0 0 ${Math.round(5 + 3 * Math.sin(lt * 6))}px rgba(242,182,60,.55)` : 'none';

      // C · defter: başlık; 100 kişilik ızgarada 42 kare sırayla kırmızıya döner, sayaç %42; UNUTULDU damgası
      const nRed = Math.round(42 * E.out(prog(lt, PCT, 0.9)));
      cells.forEach((c, k) => (c.style.background = k < nRed ? '#D9343E' : 'rgba(42,46,90,.14)'));
      pct.style.opacity = lt >= PCT ? 1 : 0;
      pct.textContent = `%${nRed}`;
      pct.style.transform = `scale(${1 + 0.12 * Math.sin(Math.PI * prog(lt, PCT + 0.9, 0.3))})`;
      pLab.style.opacity = prog(lt, PCT + 0.6, 0.3);
      stampM.style.opacity = lt >= MISS ? 1 : 0;
      stampM.style.transform = `rotate(-8deg) scale(${lerp(2.2, 1, E.out(prog(lt, MISS, 0.2)))})`;
      pTitle.style.clipPath = `inset(0 ${(1 - E.out(prog(lt, SCI + 0.1, 0.6))) * 100}% 0 0)`;
      srcC.style.opacity = prog(lt, SCI + 0.5, 0.4);

      // kamera planları (A oda, B telefon, C defter): dünya noktası (fx, fy) ekranda (540, SY)'ye düşer
      let W = 'A', z = 1, fx = 540, fy = 1150;
      const HOOKCAM = () => { z = 2.3 + 0.06 * prog(lt, 0, 1); fx = 962; fy = 1120; };
      if (lt < WIDE) HOOKCAM();                                                                                              // kanca: kumbaradaki gözler
      else if (lt < PIGT) { z = 1.0 + 0.03 * prog(lt, WIDE, PIGT - WIDE); fx = 540; fy = 1150; }                              // oda: Ceviz uyuyor
      else if (lt < PHONE) { const q = E.out(prog(lt, PIGT, 0.4)); z = lerp(1.03, 1.75, q); fx = lerp(540, 958, q); fy = lerp(1150, 1130, q); }   // kumbara boşalıyor
      else if (lt < SCREEN) { z = 1.5 + 0.04 * prog(lt, PHONE, SCREEN - PHONE); fx = 860; fy = 1110; }                          // telefon kendiliğinden yanar
      else if (lt < SIP) { W = 'B'; z = 1.0 + 0.04 * prog(lt, SCREEN, SIP - SCREEN); fy = 1150; }                              // simgeler uyanır, vampirler çıkar
      else if (lt < TAGS) { z = 1.85 + 0.05 * prog(lt, SIP, TAGS - SIP); fx = 968; fy = 1070; }                                 // pipetle içerler
      else if (lt < NOTIF) { const q = E.out(prog(lt, TAGS, 0.4)); z = lerp(1.9, 1.5, q); fx = lerp(968, 960, q); fy = lerp(1070, 1110, q); }   // etiketler: 550 TL
      else if (lt < TOTAL) { W = 'B'; z = 1.22 + 0.18 * ramp(CRAWL, TOTAL - CRAWL); fy = lerp(1110, 1050, ramp(CRAWL, 1.0)); }   // eski bildirim, solgun vampir
      else if (lt < SCI) { z = 1.36 + 0.03 * prog(lt, TOTAL, SCI - TOTAL); fx = 925; fy = 1095; }                              // beşi birden: 700 TL
      else if (lt < ROUSE) { W = 'C'; z = 1.0 + 0.03 * prog(lt, SCI, ROUSE - SCI); fy = 1170; }                                // defter: anket
      else if (lt < APP) { z = 1.0 + 0.02 * prog(lt, ROUSE, APP - ROUSE); fx = 655; fy = 1150; }                              // Ceviz uyanır, lamba yanar
      else if (lt < CTA) { W = 'B'; z = 1.0; fy = 1150; }                                                                     // Cep Defteri: alt alta
      else if (lt < OFF) { z = 1.04 + 0.04 * prog(lt, CTA, OFF - CTA); fx = 560; fy = 1150; }                                 // soru
      else { z = 1.08; fx = 560; fy = 1150; }                                                                                   // lamba söner (döngü kopyası kancayı getirir)
      z *= 1 + (W === 'B' && lt >= WAKE && lt < WAKE + 0.3 ? 0.03 * Math.exp(-(lt - WAKE) * 10) : 0);
      const sx = shake(lt, HIT, 12, 0.35) + shake(lt, LIGHT, 10, 0.3) + shake(lt, WAKE, 8, 0.3) + shake(lt, CRAWL + 0.85, 10, 0.3);
      [camA, camB, camC].forEach((c, i) => (c.style.display = 'ABC'[i] === W ? 'block' : 'none'));
      ({ A: camA, B: camB, C: camC })[W].style.transform = `translate(${540 - fx * z + sx}px,${SY - fy * z}px) scale(${z})`;
      flash.style.opacity = Math.max(lt >= LIGHT ? 0.5 * Math.exp(-(lt - LIGHT) * 6) : 0, lt >= HIT ? 0.18 * Math.exp(-(lt - HIT) * 8) : 0);
      // takip kartı: FOLLOW'da açılır; TAPF'de pençe "Takip et"e basar, düğme "Takip ediliyor" olur
      const fOn = lt >= FOLLOW && lt < OFF;
      fcard.style.display = fOn ? 'block' : 'none';
      if (fOn) popIn(fcard, prog(lt, FOLLOW, 0.35), { fromY: -60 });
      const followed = lt >= TAPF + 0.02;
      fbtn.textContent = followed ? 'Takip ediliyor' : 'Takip et';
      fbtn.style.background = followed ? '#EFEFEF' : '#0095F6';
      fbtn.style.color = followed ? '#141414' : '#FFFFFF';
      const fd = lt - TAPF + 0.45;
      fbtn.style.transform = `scale(${fd >= 0.42 && fd < 0.55 ? 0.94 : followed ? 1 + 0.08 * Math.sin(Math.PI * prog(fd, 0.55, 0.25)) : 1 + 0.03 * Math.sin(lt * 8)})`;
      const ftap = fOn && fd >= 0.1 && fd < 0.95;  // pençe sağ alttan gelir, basar, geri çekilir; dokunuşta halka açılır
      fpaw.style.display = ftap ? 'block' : 'none';
      if (ftap) {
        const k1 = E.out(prog(fd, 0.1, 0.3)), k2 = E.inOut(prog(fd, 0.62, 0.33));
        const fx2 = lerp(FBX + 320, FBX + 8, k1) + 320 * k2, fy2 = lerp(FBY + 480, FBY + 16, k1) + 480 * k2 + (fd >= 0.42 && fd < 0.55 ? 8 : 0);
        fpaw.style.transform = `translate(${fx2 - 56}px,${fy2 - 34}px) rotate(${-20 * (1 - k1) - 20 * k2}deg)`;
        fpaw.style.opacity = 1 - k2;
      }
      const rk = prog(lt, TAPF, 0.4);
      fring.style.display = fOn && rk > 0 && rk < 1 ? 'block' : 'none';
      fring.style.transform = `scale(${0.4 + 1.6 * rk})`;
      fring.style.opacity = 1 - rk;
    };
  };
}
