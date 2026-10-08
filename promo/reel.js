/* Cep Defteri · Reels reklamı (1080×1920). Her kare window.renderAt(t) ile saniyeden çizilir; durum tutulmaz. */
const W = 1080, H = 1920;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const prog = (t, a, d) => clamp((t - a) / d);
const E = {
  out: (x) => 1 - (1 - x) ** 3,
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2),
  back: (x) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2; },
  elastic: (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 2 ** (-10 * x) * Math.sin(((x * 10 - 0.75) * 2 * Math.PI) / 3) + 1),
};
const lerp = (a, b, k) => a + (b - a) * k;
const fmt = (n) => Math.round(n).toLocaleString('tr-TR');
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

const stage = document.getElementById('stage');
const el = (tag, cls, parent, css) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (css) Object.assign(e.style, css);
  (parent || stage).appendChild(e);
  return e;
};
const px = (v) => v + 'px';

/* ───────── Maskot ───────── */
let SP = null;
const svgCache = {};
function spriteSVG(k) {
  if (svgCache[k]) return svgCache[k];
  const rs = SP[k];
  const body = rs.map(([x, y, w, h, f]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`).join('');
  return (svgCache[k] = `<svg viewBox="0 0 32 30" width="100%" height="100%" shape-rendering="crispEdges">${body}</svg>`);
}
function pick(who, outfit, mood, paws, eyes) {
  const base = outfit ? `${who}@${outfit}` : who;
  const tries = outfit
    ? [`${base}|${mood}|${paws}|${eyes}`, `${base}|${mood}|${paws}|mood`, `${base}|${mood}|${paws === 'wave2' ? 'wave' : paws}|mood`, `${base}|${mood}|null|mood`]
    : [`${base}|${mood}|${paws}|${eyes}`, `${base}|${mood}|${paws}|mood`, `${base}|${mood}|null|mood`];
  return tries.find((k) => SP[k]) || `${who}|calm|null|mood`;
}
class Mascot {
  constructor(parent, { who = 'fistik', w = 600, outfit = null, x = 0, y = 0 }) {
    this.who = who; this.outfit = outfit; this.w = w;
    this.root = el('div', 'abs mascot', parent, { width: px(w), height: px((w * 30) / 32), transformOrigin: '50% 100%' });
    this.x = x; this.y = y; this.state = '';
  }
  set(mood = 'calm', paws = null, eyes = 'mood') {
    const k = pick(this.who, this.outfit, mood, paws, eyes);
    if (k !== this.state) { this.state = k; this.root.innerHTML = spriteSVG(k); }
  }
  /** x, y: gövde alt-orta noktası */
  put(cx, bottom, { sx = 1, sy = 1, rot = 0, flip = false, op = 1 } = {}) {
    const s = this.root.style;
    s.left = px(cx - this.w / 2); s.top = px(bottom - (this.w * 30) / 32);
    s.transform = `rotate(${rot}deg) scale(${flip ? -sx : sx}, ${sy})`;
    s.opacity = op;
  }
}
/** Zıplama: lt anında yükseklik ve ezilme */
function hop(lt, T, amp, off = 0) {
  const ph = (((lt + off) % T) + T) % T / T;
  const y = 4 * amp * ph * (1 - ph);
  const air = ph > 0.1 && ph < 0.9;
  const sy = air ? 1 + 0.05 * Math.sin(Math.PI * ph) : 0.9 + 0.1 * (ph < 0.1 ? ph / 0.1 : (1 - ph) / 0.1);
  return { y, sy, sx: 1 + (1 - sy) * 0.8 };
}
const blink = (lt, off = 0) => (((lt + off) * 1000) % 2700 < 130 ? 'closed' : 'mood');

/* ───────── Metin (hareketli tipografi) ───────── */
class Line {
  constructor(parent, { html, y, size, color = 'var(--ink)', delay = 0, itColor, weight = 800, stagger = 0.09 }) {
    this.delay = delay; this.stagger = stagger;
    this.root = el('div', 'tx', parent, { top: px(y), fontSize: px(size), color, fontWeight: weight });
    this.words = [];
    let inIt = false;
    html.split(' ').forEach((tok, i, a) => {
      if (tok.startsWith('*')) inIt = true;
      const it = inIt;
      if (tok.endsWith('*')) inIt = false;
      const word = tok.replace(/\*/g, '');
      const sp = el('span', 'w' + (it ? ' it' : ''), this.root);
      sp.textContent = word + (i < a.length - 1 ? ' ' : '');
      if (it) { sp.style.fontSize = '1.3em'; if (itColor) sp.style.color = itColor; }
      this.words.push(sp);
    });
  }
  update(lt) {
    this.words.forEach((w, i) => {
      const p = prog(lt, this.delay + i * this.stagger, 0.55);
      const e = E.back(p);
      w.style.opacity = clamp(p * 4);
      w.style.transform = `translateY(${(1 - e) * 110}px) rotate(${(1 - e) * -7}deg) scale(${0.6 + 0.4 * e})`;
    });
  }
}

/* ───────── Piksel parçacıklar ───────── */
class Burst {
  constructor(parent, { n, t0, ox, oy, colors, speed = 900, grav = 1800, life = 1.6, size = [18, 34], upBias = 0.5 }) {
    Object.assign(this, { t0, ox, oy, grav, life });
    this.ps = Array.from({ length: n }, (_, i) => {
      const a = rnd() * Math.PI * 2, v = speed * (0.4 + rnd() * 0.7);
      const s = size[0] + rnd() * (size[1] - size[0]);
      const e = el('div', 'abs', parent, { width: px(s), height: px(s), willChange: 'transform' });
      e.style.background = colors[i % colors.length];
      return { e, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * upBias, vr: (rnd() - 0.5) * 900, s };
    });
  }
  update(t) {
    const k = t - this.t0;
    this.ps.forEach((p) => {
      if (k < 0 || k > this.life) { p.e.style.display = 'none'; return; }
      p.e.style.display = 'block';
      const x = this.ox + p.vx * k, y = this.oy + p.vy * k + 0.5 * this.grav * k * k;
      p.e.style.transform = `translate(${x - p.s / 2}px,${y - p.s / 2}px) rotate(${p.vr * k}deg)`;
      p.e.style.opacity = clamp((this.life - k) / 0.4);
    });
  }
}


/** Satır dizisinden piksel SVG (her harf bir renk, '.' boş) */
const pix = (rows, cols, cell) => `<svg viewBox="0 0 ${rows[0].length} ${rows.length}" width="${rows[0].length * cell}" height="${rows.length * cell}" shape-rendering="crispEdges">${rows.map((r, y) => [...r].map((c, x) => (c === '.' ? '' : `<rect x="${x}" y="${y}" width="1.02" height="1.02" fill="${cols[c]}"/>`)).join('')).join('')}</svg>`;
const CELL = 28;
// TL banknotları (200 pembe, 100 mavi, 50 turuncu): çerçeve, açık zemin, sağda portre madalyonu
const NOTE = ['ddddddddddd', 'dLLLLLLmmLd', 'dLssLLmmmmd', 'dLLLLLLmmLd', 'ddddddddddd'];
const NOTE_CS = [
  { d: '#A8467E', L: '#F4BCD8', m: '#D97DAE', s: '#A8467E' },
  { d: '#2F5F9E', L: '#B5D0EE', m: '#6E9BD6', s: '#2F5F9E' },
  { d: '#B8601A', L: '#F8CC98', m: '#E99A4F', s: '#B8601A' },
];
// 1 TL: altın göbek, gümüş halka
const TLCOIN = ['.oooo.', 'osggso', 'oghggo', 'oggydo', 'osyyso', '.oooo.'];
const TLCOIN_C = { o: '#6B4A1A', s: '#C9CCD2', g: '#F2B63C', h: '#FFE08A', y: '#D9961E', d: '#B87A14' };
const CLOUD = ['....cccc......', '..cccccccc.cc.', '.cccccccccccccc', 'cccccccccccccc', '.dddddddddddd.'];
const CLOUD_C = { c: '#AEB6C0', d: '#7F8894' };
const SWEAT = ['.o', 'oL', 'oo'];
const SWEAT_C = { o: '#3E8FC9', L: '#9ED8F5' };
const WALLET_C = ['.........', '.bbbbbbb.', 'bBBBBBByb', 'bbbbbbbyb', 'bBBBBBBBb', 'bBBBBBBBb', 'bbbbbbbbb'];
const WALLET_O = ['.bbbbbbb.', 'bBBBBBByb', '.bbbbbbb.', 'bkkkkkkkb', 'bBBBBBBBb', 'bBBBBBBBb', 'bbbbbbbbb'];
const WALLET_COL = { b: '#3E2414', B: '#8B5A2B', y: '#F2B63C', k: '#1E120A' };
const MOTH_A = ['m.....m', 'mm.a.mm', 'mmmbmmm', '.mmbmm.', '...b...'];
const MOTH_B = ['...a...', '...b...', '.mmbmm.', 'mmmbmmm', 'mm...mm'];
const MOTH_C = { m: '#D9D0BF', a: '#5E5246', b: '#8A7D6B' };
/** Sönümlü sarsıntı: t0 anında başlar */
const shake = (t, t0, amp, dur) => { const k = t - t0; return k < 0 || k > dur ? 0 : amp * (1 - k / dur) * Math.sin(k * 70); };

/* ───────── Telefon ───────── */
class Phone {
  constructor(parent, { w, x, top, imgs = [], scrollImg = null, nav = null }) {
    this.w = w; this.sw = w - 32; this.sh = (this.sw * 844) / 390; this.scale = this.sw / 390;
    this.root = el('div', 'phone', parent, { width: px(w), height: px(this.sh + 32), left: px(x), top: px(top) });
    this.screen = el('div', 'screen', this.root);
    this.layers = imgs.map((src) => { const i = el('img', '', this.screen); i.src = src; i.style.opacity = 0; return i; });
    this.scroll = null; this.nav = null;
    if (scrollImg) {
      this.scroll = el('img', '', this.screen); this.scroll.src = scrollImg;
      if (nav) {
        this.navBg = el('div', 'abs', this.screen, { left: 0, right: 0, bottom: 0, height: px(84 * this.scale), background: '#FFFCF6' });
        this.nav = el('img', '', this.screen, { top: 'auto', bottom: 0 }); this.nav.src = nav;
      }
    }
  }
  show(i, a = 1) { this.layers.forEach((l, j) => (l.style.opacity = j === i ? a : l.style.opacity)); }
  scrollTo(cssY) { if (this.scroll) this.scroll.style.transform = `translateY(${-cssY * this.scale}px)`; }
  pos(x, y, rot = 0, s = 1) { Object.assign(this.root.style, { left: px(x), top: px(y), transform: `rotate(${rot}deg) scale(${s})` }); }
}

/* ───────── Ortak parçalar ───────── */
const pattern = (parent, dot = 'rgba(0,0,0,.07)') => { const p = el('div', 'pattern', parent); p.style.backgroundImage = `radial-gradient(circle,${dot} 3px,transparent 3.5px)`; return p; };
function chipEl(parent, html, extra = {}) {
  const c = el('div', 'chip', parent, extra); c.innerHTML = html; return c;
}
function popIn(e, p, { fromX = 0, fromY = 80, rot = 0, base = '' } = {}) {
  const k = E.back(p);
  e.style.opacity = clamp(p * 5);
  e.style.transform = `${base} translate(${(1 - k) * fromX}px,${(1 - k) * fromY}px) rotate(${(1 - k) * rot}deg) scale(${0.7 + 0.3 * k})`;
}
const tapAt = (e, lt, t0, x, y) => {
  const k = prog(lt, t0, 0.5);
  e.style.left = px(x); e.style.top = px(y);
  e.style.opacity = k > 0 && k < 1 ? 1 - k * k : 0;
  e.style.transform = `translate(-50%,-50%) scale(${0.3 + k * 1.3})`;
};

/* ───────── Sahneler ───────── */
const scenes = [];
let cur;
let OPTS = {};
function scene(t0, bg, wipe = [540, 1500], wdur = 0.6) {
  const root = el('div', 'scene', stage, { background: bg });
  cur = { t0, root, wipe, wdur, items: [], bg, skip: OPTS.skip || 0, flash: !!OPTS.flash };
  scenes.push(cur);
  return cur;
}
const SCENES = {};
function defineScenes() {
  /* S1 · Kanca: Ayın 1'i → 15'i → 30'u, dondurulmuş kare: "Tanıdık geldi mi?" */
  SCENES.hook = (t0, o = {}) => {
    const D15 = 1.5, D30 = 2.5, FR = 3.5;
    const s = scene(t0, '#F9D9C3');
    const cam = el('div', 'abs', s.root, { inset: 0, transformOrigin: '50% 60%' });
    // zeminler (yaprak koptukça sert kesme)
    const bg1 = el('div', 'abs', cam, { inset: 0, background: '#F9D9C3', overflow: 'hidden' });
    const rays = el('div', 'abs', bg1, { left: px(540 - 1700), top: px(1250 - 1700), width: '3400px', height: '3400px', background: 'repeating-conic-gradient(from 0deg, #F6C09C 0deg 9deg, #FADCC8 9deg 18deg)' });
    const bg2 = el('div', 'abs', cam, { inset: 0, background: '#EFE6DA' });
    pattern(bg2);
    const bg3 = el('div', 'abs', cam, { inset: 0, background: 'linear-gradient(#3F4752, #6A7380)' });
    // para yağmuru
    const notes = Array.from({ length: 9 }, (_, i) => {
      const e = el('div', 'abs', bg1, { width: px(11 * CELL), height: px(5 * CELL) });
      e.innerHTML = pix(NOTE, NOTE_CS[i % 3], CELL);
      return { e, x: 60 + ((i * 0.37) % 1) * 960, v: 560 + rnd() * 260, ph: rnd() * 3, r: (rnd() - 0.5) * 160, off: (i / 9) * 3.4 };
    });
    // 15'i: kafanın çevresinde uçup giden paralar
    const coins = [230, 420, 660, 850].map((x, i) => {
      const e = el('div', 'abs', bg2, { width: px(6 * CELL), height: px(6 * CELL) });
      e.innerHTML = pix(TLCOIN, TLCOIN_C, CELL);
      return { e, x, t: 1.7 + i * 0.2 };
    });
    // 30'u: yağmur bulutu, damlalar, cüzdan, güve
    const cloud = el('div', 'abs', bg3, { width: px(14 * CELL), height: px(5 * CELL), left: px(540 - 7 * CELL), top: px(1000) });
    cloud.innerHTML = pix(CLOUD, CLOUD_C, CELL);
    const drops = Array.from({ length: 22 }, () => {
      const e = el('div', 'abs', bg3, { width: px(CELL / 2), height: px(CELL * 1.5), background: '#9FC3E6', opacity: 0.85 });
      return { e, x: 360 + rnd() * 360, off: rnd(), v: 1500 + rnd() * 500 };
    });
    // maskot
    const m = new Mascot(cam, { w: 32 * CELL });
    const sweat = el('div', 'abs', cam, { width: px(2 * CELL), height: px(3 * CELL) });
    sweat.innerHTML = pix(SWEAT, SWEAT_C, CELL);
    const wallet = el('div', 'abs', cam, { width: px(9 * CELL), height: px(7 * CELL), left: px(720), top: px(1600) });
    const moth = el('div', 'abs', cam, { width: px(7 * CELL), height: px(5 * CELL) });
    // takvim yaprakları
    const cal = el('div', 'abs', cam, { left: px(540 - 185), top: px(200), width: '370px', height: '430px' });
    const pages = [['1', 'PERŞEMBE'], ['15', 'PERŞEMBE'], ['30', 'CUMA']].map(([n, d], i) => {
      const p = el('div', 'abs', cal, { inset: 0, background: '#FFFDF8', borderRadius: '22px', overflow: 'hidden', zIndex: 3 - i, boxShadow: '0 24px 50px -16px rgba(0,0,0,.45)', transformOrigin: '50% 0%' });
      p.innerHTML = `<div style="height:104px;background:#D7372B;color:#fff;font-family:Pixel;font-size:84px;letter-spacing:.06em;display:flex;align-items:center;justify-content:center">EKİM</div>
        <div style="text-align:center;font-family:Pixel;font-size:300px;line-height:.82;margin-top:14px;color:${i === 2 ? '#D7372B' : '#2A1E1A'}">${n}</div>
        <div style="text-align:center;font-weight:700;font-size:38px;letter-spacing:.14em;color:#7a6a60;margin-top:-6px">${d}</div>`;
      return p;
    });
    const rings = el('div', 'abs', cal, { left: '60px', right: '60px', top: '-22px', height: '44px', zIndex: 9, display: 'flex', justifyContent: 'space-between' });
    rings.innerHTML = '<i style="width:30px;height:44px;border-radius:15px;background:#3a2c26;display:block"></i><i style="width:30px;height:44px;border-radius:15px;background:#3a2c26;display:block"></i>';
    // gün yazıları
    const caps = [
      [new Line(cam, { html: '*Burs yattı!*', y: 680, size: 150, itColor: '#2A1E1A', stagger: 0.06, delay: -1 }), 0, D15],
      [new Line(cam, { html: '*İdare eder…*', y: 680, size: 150, itColor: '#2A1E1A', stagger: 0.06 }), D15, D30],
      [new Line(cam, { html: '*Cüzdan:*', y: 680, size: 150, itColor: '#FFFCF6', stagger: 0.06 }), D30, 99],
    ];
    // dondurma katmanı
    const dim = el('div', 'abs', s.root, { inset: 0, background: '#120c0a', opacity: 0 });
    const fz = el('div', 'abs', s.root, { left: 0, right: 0, top: '600px', textAlign: 'center', color: '#fff', fontWeight: 800, letterSpacing: '-.04em', lineHeight: 0.95 });
    fz.innerHTML = '<div><span class="w" style="font-size:200px">Tanıdık</span></div><div><span class="w" style="font-size:200px;margin-right:.22em">geldi</span><span class="w it" style="font-size:280px;color:#F8DCC8">mi?</span></div>';
    const fzw = [...fz.querySelectorAll('.w')];
    const fzRec = el('div', 'abs', s.root, { left: 0, right: 0, top: '1060px', color: '#fff', fontWeight: 800, fontSize: '44px', letterSpacing: '.08em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px' });
    fzRec.innerHTML = '<span style="width:30px;height:30px;border-radius:50%;background:#E8322A;display:inline-block"></span>DURAKLATILDI';

    s.update = (T0) => {
      const lt = Math.min(T0, FR); // donunca her şey durur
      const day = lt < D15 ? 0 : lt < D30 ? 1 : 2;
      bg1.style.display = day === 0 ? 'block' : 'none';
      bg2.style.display = day === 1 ? 'block' : 'none';
      bg3.style.display = day === 2 ? 'block' : 'none';
      rays.style.transform = `rotate(${lt * 40}deg)`;
      // kamera: açılış çarpması, vuruşlarda nabız, yaprak koparken savrulma, 30'unda yavaş yakınlaşma, donunca yüze zoom
      let sc = 1;
      if (day === 0) sc += 0.035 * Math.exp(-((lt % 0.5) * 9));
      if (day === 2) sc += 0.05 * E.inOut(prog(lt, D30, 1));
      sc += 0.22 * E.inOut(prog(T0, FR, 0.9));
      const sh = shake(T0, D15, 40, 0.3) + shake(T0, D30, 40, 0.3) + shake(T0, FR, 30, 0.25);
      const shY = shake(T0 + 0.37, FR, 20, 0.25);
      cam.style.transform = `translate(${sh}px,${shY}px) scale(${sc}) rotate(${day === 0 ? Math.sin(lt * Math.PI * 2) * 1.2 : 0}deg)`;
      const gray = prog(T0, FR, 0.15);
      cam.style.filter = gray > 0 ? `grayscale(${gray}) contrast(${1 + gray * 0.15})` : 'none';
      // takvim: çakılma + yaprak koparma
      cal.style.transform = `rotate(${Math.sin(lt * 4) * 2}deg) scale(${1 + 0.04 * Math.exp(-((lt % 0.5) * 9)) * (day === 0 ? 1 : 0)})`;
      pages.forEach((p, i) => {
        const tt = i === 0 ? D15 : i === 1 ? D30 : 99;
        const k = prog(lt, tt - 0.05, 0.5);
        p.style.display = k >= 1 ? 'none' : 'block';
        p.style.transform = `translate(${-k * 700}px,${k * k * 1500}px) rotate(${-k * 70}deg) scaleY(${1 - Math.sin(k * Math.PI) * 0.12})`;
      });
      // para yağmuru
      notes.forEach((n) => {
        const k = (lt + n.off) % 3.4;
        const y = -160 + k * n.v, x = n.x + Math.sin(lt * 3 + n.ph) * 70;
        n.e.style.transform = `translate(${x - 154}px,${y}px) rotate(${n.r * k + Math.sin(lt * 5 + n.ph) * 25}deg) rotateX(${Math.sin(lt * 7 + n.ph) * 60}deg)`;
      });
      // 15'i paraları
      coins.forEach((c, i) => {
        const k = prog(lt, c.t, 0.5);
        const bob = Math.sin(lt * 6 + i) * 12;
        const x = c.x + k * (i < 2 ? -700 : 700), y = 960 + bob - Math.sin(k * Math.PI) * 260 + k * 200;
        c.e.style.transform = `translate(${x - 84}px,${y - 30}px) rotate(${k * 540}deg) scale(${1 - k * 0.3})`;
        c.e.style.opacity = k >= 1 ? 0 : 1;
      });
      // 30'u: bulut + yağmur
      cloud.style.transform = `translateX(${Math.sin(lt * 3) * 14}px)`;
      drops.forEach((d) => {
        const k = ((lt * d.v) / 700 + d.off) % 1;
        d.e.style.transform = `translate(${Math.round(d.x / 14) * 14}px,${1140 + k * 620}px)`;
        d.e.style.opacity = 0.85 * (1 - k * 0.6);
      });
      // maskot
      if (day === 0) {
        m.outfit = 'summer';
        const h = hop(lt, 0.5, 70);
        const beat = Math.floor(lt / 0.5);
        m.set('celebrate', beat % 2 ? 'up' : 'wave', 'mood');
        m.put(540, 1930 - h.y, { sx: h.sx, sy: h.sy, rot: beat % 2 ? 9 : -9, flip: beat % 2 === 1 });
      } else if (day === 1) {
        m.outfit = null;
        m.set('thoughtful', 'face', lt % 1.1 < 0.12 ? 'closed' : 'half');
        m.put(540, 1930, { rot: Math.sin(lt * 18) * 1.6 });
      } else {
        m.outfit = null;
        const sink = E.out(prog(lt, D30, 0.6));
        m.set('thoughtful', null, lt > D30 + 0.4 ? 'x' : 'half');
        m.put(540, 1930 + sink * 40, { sy: 1 - sink * 0.06, sx: 1 + sink * 0.03 });
      }
      // ter damlası (15'i)
      const sk = ((lt - D15) % 0.7) / 0.7;
      sweat.style.display = day === 1 && lt > D15 + 0.2 ? 'block' : 'none';
      sweat.style.transform = `translate(${720}px,${1290 + sk * 90}px)`;
      sweat.style.opacity = 1 - sk * 0.7;
      // cüzdan + güve
      const wv = day === 2;
      wallet.style.display = wv ? 'block' : 'none';
      const wk = E.back(prog(lt, D30 + 0.05, 0.35));
      wallet.style.transform = `translateY(${(1 - wk) * 500}px) rotate(${-8 + (1 - wk) * 20}deg)`;
      const open = lt > D30 + 0.3;
      const wkey = open ? 'o' : 'c';
      if (wallet.dataset.k !== wkey) { wallet.dataset.k = wkey; wallet.innerHTML = pix(open ? WALLET_O : WALLET_C, WALLET_COL, CELL); }
      const mk = prog(lt, D30 + 0.32, 0.85);
      moth.style.display = wv && mk > 0 && mk < 1 ? 'block' : 'none';
      const fr = Math.floor(lt / 0.06) % 2;
      if (moth.dataset.f !== String(fr)) { moth.dataset.f = fr; moth.innerHTML = pix(fr ? MOTH_B : MOTH_A, MOTH_C, CELL); }
      moth.style.transform = `translate(${780 - 98 - mk * 260 + Math.sin(mk * 14) * 90}px,${1600 - mk * 940}px) rotate(${Math.sin(mk * 14) * 14}deg)`;
      // yazılar
      caps.forEach(([l, a, b]) => {
        const on = lt >= a && lt < b && T0 < FR + 0.1;
        l.root.style.display = on ? 'block' : 'none';
        if (on) l.update(lt - a);
      });
      // donma: karartma + çarpan sözcükler
      dim.style.opacity = 0.55 * E.out(prog(T0, FR, 0.2));
      fzRec.style.opacity = T0 > FR ? (Math.floor((T0 - FR) / 0.25) % 2 ? 0.35 : 1) : 0;
      fzw.forEach((w, i) => {
        const k = prog(T0, FR + 0.08 + i * 0.22, 0.16);
        w.style.display = 'inline-block';
        w.style.opacity = k > 0 ? 1 : 0;
        w.style.transform = `scale(${lerp(2.8, 1, E.out(k))}) rotate(${i === 2 ? -6 * k : 0}deg)`;
        w.style.textShadow = '0 10px 0 #2A1E1A';
      });
    };
  };

  /* S2 · Tanıtım: bütçeni cebine koy */
  SCENES.brand = (t0, o = {}) => {
    const s = scene(t0, 'var(--acc)', [540, 1300], 0.22);
    pattern(s.root, 'rgba(255,255,255,.14)');
    const icon = el('img', 'abs', s.root, { width: '220px', height: '220px', left: px(430), top: px(250), borderRadius: '56px', boxShadow: '0 30px 60px -10px rgba(0,0,0,.4)' });
    icon.src = 'assets/icon.png';
    const lines = [
      new Line(s.root, { html: 'Bütçeni', y: 500, size: 200, color: '#FFFCF6', delay: 0.55 }),
      new Line(s.root, { html: '*cebine*', y: 720, size: 290, itColor: 'var(--soft)', delay: 0.85 }),
      new Line(s.root, { html: 'koy.', y: 1030, size: 200, color: '#FFFCF6', delay: 1.2 }),
    ];
    const sub = el('div', 'abs', s.root, { left: 0, right: 0, top: px(1245), textAlign: 'center', fontSize: '46px', fontWeight: 600, color: 'var(--soft)', letterSpacing: '-.01em' });
    sub.textContent = 'üniversite hayatı için sade bütçe defteri';
    const m = new Mascot(s.root, { w: 704 });
    const conf = new Burst(s.root, { n: 34, t0: 0.35, ox: 540, oy: 360, colors: ['#F8DCC8', '#FFE08A', '#FFFCF6', '#2F8F9D', '#F0874F'], speed: 1100, grav: 1900, life: 1.8, size: [22, 22] });
    s.update = (lt) => {
      const sk = shake(lt, 0.05, 34, 0.45), sky = shake(lt + 0.3, 0.05, 22, 0.45);
      s.root.style.transform = lt < 0.55 ? `translate(${sk}px,${sky}px) scale(${1.04 + 0.1 * (1 - E.out(prog(lt, 0, 0.4)))})` : 'none';
      lines.forEach((l) => l.update(lt));
      const p = prog(lt, 0.15, 0.7);
      icon.style.transform = `scale(${E.back(p)}) rotate(${(1 - E.out(p)) * -200}deg)`;
      icon.style.opacity = clamp(p * 4);
      sub.style.opacity = prog(lt, 1.5, 0.4);
      const h = hop(lt, 0.62, 80, 0.1);
      m.set('celebrate', Math.floor(lt / 0.2) % 2 ? 'wave' : 'wave2', blink(lt));
      m.put(540, 2030 + (1 - E.out(prog(lt, 0.3, 0.6))) * 700 - h.y, { sx: h.sx, sy: h.sy });
      conf.update(lt);
    };
  };

  /* S3 · Harcamanı 5 saniyede yaz */
  SCENES.quickAdd = (t0, o = {}) => {
    const s = scene(t0, 'var(--soft)', [540, 1300]);
    pattern(s.root, 'rgba(174,71,22,.10)');
    const lines = [
      new Line(s.root, { html: 'Harcamanı', y: 240, size: 124, delay: 0.1 }),
      new Line(s.root, { html: '*5 saniyede*', y: 370, size: 190, itColor: 'var(--acc)', delay: 0.35 }),
      new Line(s.root, { html: 'yaz.', y: 600, size: 150, delay: 0.7 }),
    ];
    const P = o.poster ? 3 : 0;
    const ph = new Phone(s.root, { w: 580, x: 250, top: 800, imgs: ['assets/ui/add0.png', 'assets/ui/add2.png', 'assets/ui/add3.png', 'assets/ui/saved.png'] });
    const sw = el('div', 'pill', s.root, { left: px(700), top: px(590), width: '330px', justifyContent: 'center', color: 'var(--acc)' });
    const swDot = el('span', 'dot', sw, { background: 'var(--acc)' });
    const swTxt = el('span', '', sw);
    const tap1 = el('div', 'tap', ph.screen), tap2 = el('div', 'tap', ph.screen), tap0 = el('div', 'tap', ph.screen);
    const av = el('div', 'abs', s.root, { width: '270px', height: '270px', borderRadius: '50%', background: '#FFFCF6', border: '10px solid var(--acc)', overflow: 'hidden', left: '40px', top: '1280px', boxShadow: '0 20px 50px -10px rgba(60,20,0,.4)' });
    const m = new Mascot(av, { w: 320, outfit: 'headphones' });
    m.root.style.left = px(-30); m.root.style.top = px(40);
    const conf = new Burst(s.root, { n: 26, t0: 3.45, ox: 540, oy: 1500, colors: ['#AE4716', '#FFE08A', '#2F8F9D', '#fff'], speed: 800, grav: 1800, life: 1.4, size: [20, 20] });
    s.update = (lt) => {
      lines.forEach((l) => l.update(lt + P));
      const rise = E.out(prog(lt + P, 0.3, 0.7));
      const top = 1960 - rise * (1960 - 800);
      ph.pos(250, top, (1 - rise) * 4);
      // ekran durumu: 0 boş → 1 "95" → 2 kategori → 3 kaydedildi
      const idx = lt < 1.7 ? 0 : lt < 2.65 ? 1 : lt < 3.45 ? 2 : 3;
      ph.layers.forEach((l, i) => {
        const prev = i === idx ? 1 : 0;
        l.style.opacity = i <= idx ? 1 : 0;
        l.style.zIndex = i;
      });
      const sx = ph.sw, sh = ph.sh;
      tapAt(tap0, lt, 1.0, sx * 0.2, sh * 0.29);
      tapAt(tap1, lt, 2.5, sx * 0.845, sh * 0.67);
      tapAt(tap2, lt, 3.3, sx * 0.5, sh * 0.958);
      // kronometre
      const secs = lt < 1.0 ? 0 : lt < 3.45 ? ((lt - 1.0) / 2.45) * 4.8 : 4.8;
      swTxt.textContent = secs.toFixed(1).replace('.', ',') + ' sn';
      sw.style.opacity = prog(lt + P, 0.7, 0.3);
      sw.style.transform = `scale(${lt > 3.45 ? 1 + 0.15 * Math.sin(prog(lt, 3.45, 0.4) * Math.PI) : 1})`;
      // maskot balonu
      const ap = prog(lt + P, 0.9, 0.5);
      const done = lt > 3.45;
      popIn(av, ap, { fromX: -200, fromY: 0 });
      const h = hop(lt, 0.7, done ? 22 : 0);
      m.set(done ? 'celebrate' : 'curious', done ? (Math.floor(lt / 0.2) % 2 ? 'wave' : 'up') : null);
      m.put(165, 330 - h.y, { sy: h.sy, sx: h.sx });
      conf.update(lt);
    };
  };

  /* S4 · Bugün ne kadar harcayabilirim? */
  SCENES.daily = (t0, o = {}) => {
    const s = scene(t0, '#DDEFE9', [540, 1500]);
    pattern(s.root, 'rgba(31,111,120,.10)');
    const TEAL = '#1F6F78';
    const lines = [
      new Line(s.root, { html: 'Bugün', y: 240, size: 116, delay: 0.1 }),
      new Line(s.root, { html: 'ne kadar', y: 350, size: 150, delay: 0.3 }),
      new Line(s.root, { html: '*harcayabilirim?*', y: 500, size: 130, itColor: TEAL, delay: 0.55 }),
    ];
    const P = o.poster ? 3 : 0;
    const ph = new Phone(s.root, { w: 500, x: 560, top: 800, scrollImg: 'assets/ui/full-ozet.png', nav: 'assets/ui/nav-ozet.png' });
    const rows = [
      ['Günlük hesaplarda', '8.840 TL', '#fff', 'var(--ink)'],
      ['− Yaklaşan ödemeler', '825 TL', '#fff', 'var(--ink)'],
      ['− Planlı yatırım', '1.000 TL', '#fff', 'var(--ink)'],
      ['− Birikim payı', '1.000 TL', '#fff', 'var(--ink)'],
    ].map(([a, b, bg, c], i) => {
      const e = chipEl(s.root, `<span style="font-weight:600">${a}</span><b style="margin-left:auto">${b}</b>`, { left: '36px', top: px(840 + i * 128), width: '560px', fontSize: '38px', color: c, background: bg });
      return e;
    });
    const res = el('div', 'abs', s.root, { left: '36px', top: '1370px', width: '620px', height: '330px', borderRadius: '56px', background: TEAL, color: '#fff', padding: '34px 44px', boxShadow: '0 30px 70px -14px rgba(10,60,70,.55)' });
    res.innerHTML = '<div style="font-size:40px;font-weight:600;opacity:.9">günde yaklaşık</div><div class="n" style="font-size:190px;font-weight:800;letter-spacing:-.04em;line-height:1.05"></div>';
    const resN = res.querySelector('.n');
    const m = new Mascot(s.root, { w: 320, outfit: 'scholar' });
    s.update = (lt) => {
      lines.forEach((l) => l.update(lt + P));
      const rise = E.out(prog(lt + P, 0.4, 0.7));
      ph.pos(560, 2000 - rise * (2000 - 800), 0);
      ph.scrollTo(lerp(0, 640, E.inOut(prog(lt, 0.9, 2.2))));
      rows.forEach((r, i) => popIn(r, prog(lt, 0.9 + i * 0.28, 0.5), { fromX: -300, fromY: 0, rot: -6 }));
      popIn(res, prog(lt, 2.15, 0.55), { fromX: 0, fromY: 200, rot: 3 });
      const n = E.out(prog(lt, 2.2, 0.9)) * 243;
      resN.innerHTML = `${fmt(n)} <span style="font-size:80px">TL</span>`;
      const h = hop(lt, 0.8, lt > 2.4 ? 20 : 0);
      m.set(lt > 2.4 ? 'celebrate' : 'happy', lt > 2.4 ? (Math.floor(lt / 0.2) % 2 ? 'wave' : 'wave2') : null);
      const mp = E.back(prog(lt, 1.9, 0.5));
      m.put(840, 1820 + (1 - mp) * 500 - h.y, { sy: h.sy, sx: h.sx });
    };
  };

  /* S5 · Faturalar, taksitler, abonelikler */
  SCENES.bills = (t0, o = {}) => {
    const s = scene(t0, '#DEE2F6', [540, 1500]);
    pattern(s.root, 'rgba(67,81,163,.10)');
    const IND = '#4351A3';
    const lines = [
      new Line(s.root, { html: 'Faturalar,', y: 240, size: 120, delay: 0.1 }),
      new Line(s.root, { html: 'taksitler,', y: 360, size: 120, delay: 0.35 }),
      new Line(s.root, { html: '*abonelikler.*', y: 480, size: 168, itColor: IND, delay: 0.6 }),
    ];
    const ph = new Phone(s.root, { w: 540, x: 270, top: 860, scrollImg: 'assets/ui/full-butce.png', nav: 'assets/ui/nav-butce.png' });
    const items = [
      { txt: 'Müzik aboneliği', amt: '60 TL', x: 20, y: 900, from: -500, rot: -5, t: 0.9 },
      { txt: 'Kulaklık taksiti <small style="opacity:.6">3/6</small>', amt: '415 TL', x: 430, y: 1130, from: 700, rot: 5, t: 1.35 },
      { txt: 'Telefon faturası', amt: '350 TL', x: 20, y: 1360, from: -500, rot: -4, t: 1.8 },
    ].map((d) => {
      const c = chipEl(s.root, `<span>${d.txt}</span><b style="color:${IND}">${d.amt}</b>`, { left: px(d.x), top: px(d.y), width: '570px', justifyContent: 'space-between', fontSize: '40px', padding: '28px 36px' });
      const st = el('div', 'stamp', s.root, { left: px(d.x + 330), top: px(d.y + 78), background: 'rgba(255,255,255,.92)' });
      st.textContent = 'ÖDENDİ ✓';
      return { ...d, c, st };
    });
    const m = new Mascot(s.root, { w: 384, outfit: 'ledger' });
    s.update = (lt) => {
      lines.forEach((l) => l.update(lt));
      const rise = E.out(prog(lt, 0.4, 0.7));
      ph.pos(270, 2000 - rise * (2000 - 860), 0);
      ph.scrollTo(lerp(790, 1150, E.inOut(prog(lt, 0.6, 2.8))));
      items.forEach((d) => {
        popIn(d.c, prog(lt, d.t, 0.5), { fromX: d.from, fromY: 0, rot: d.rot });
        const k = prog(lt, d.t + 0.55, 0.25);
        d.st.style.opacity = k > 0 ? 1 : 0;
        d.st.style.transform = `rotate(-8deg) scale(${lerp(3, 1, E.out(k))})`;
      });
      const h = hop(lt, 0.8, lt > 2.2 ? 26 : 0);
      m.set(lt > 2.2 ? 'celebrate' : 'happy', lt > 2.2 ? (Math.floor(lt / 0.2) % 2 ? 'wave' : 'up') : null);
      m.put(860, 1900 + (1 - E.back(prog(lt, 1.4, 0.6))) * 500 - h.y, { sy: h.sy, sx: h.sx });
    };
  };

  /* S6 · Nereye gitti, ne kadar birikti? */
  SCENES.savings = (t0, o = {}) => {
    const s = scene(t0, '#2A1E1A', [540, 1500]);
    pattern(s.root, 'rgba(255,255,255,.07)');
    const lines = [
      new Line(s.root, { html: 'Nereye gitti,', y: 240, size: 120, color: '#FFFCF6', delay: 0.1 }),
      new Line(s.root, { html: 'ne kadar', y: 360, size: 120, color: '#FFFCF6', delay: 0.35 }),
      new Line(s.root, { html: '*birikti?*', y: 480, size: 220, itColor: '#F0874F', delay: 0.6 }),
    ];
    const pa = new Phone(s.root, { w: 470, x: 70, top: 1000, scrollImg: 'assets/ui/full-raporlar.png', nav: 'assets/ui/nav-raporlar.png' });
    const pb = new Phone(s.root, { w: 470, x: 540, top: 1100, scrollImg: 'assets/ui/full-yatirim.png', nav: 'assets/ui/nav-yatirim.png' });
    const pill = el('div', 'pill', s.root, { left: px(540 - 270), top: px(850), width: '540px', justifyContent: 'center', fontSize: '52px', color: '#1F6F78' });
    const pd = el('span', 'dot', pill, { background: '#1F6F78' });
    const pt = el('span', '', pill);
    const goal = chipEl(s.root, '', { left: '70px', top: '1700px', width: '940px', flexDirection: 'column', alignItems: 'stretch', gap: '14px', padding: '26px 40px', fontSize: '38px' });
    goal.innerHTML = '<div style="display:flex"><span>Yaz okulu fonu</span><b style="margin-left:auto;color:#1F6F78">%58</b></div><div style="height:26px;border-radius:13px;background:#E7E0D5;overflow:hidden"><div class="bar" style="height:100%;width:0;background:#1F6F78;border-radius:13px"></div></div>';
    const bar = goal.querySelector('.bar');
    s.update = (lt) => {
      lines.forEach((l) => l.update(lt));
      const ra = E.out(prog(lt, 0.5, 0.8)), rb = E.out(prog(lt, 0.8, 0.8));
      pa.pos(70, 2100 - ra * (2100 - 1000), -5 * ra);
      pb.pos(540, 2200 - rb * (2200 - 1100), 5 * rb);
      pa.scrollTo(lerp(0, 330, E.inOut(prog(lt, 0.8, 2.3))));
      pb.scrollTo(lerp(0, 280, E.inOut(prog(lt, 0.9, 2.3))));
      popIn(pill, prog(lt, 1.1, 0.5), { fromY: 100 });
      pt.innerHTML = `birikim <b>${fmt(E.out(prog(lt, 1.2, 1.0)) * 6125)} TL</b>`;
      popIn(goal, prog(lt, 1.7, 0.5), { fromY: 150 });
      bar.style.width = E.out(prog(lt, 1.9, 0.9)) * 58 + '%';
    };
  };

  /* S7 · Maskotunu seç */
  SCENES.mascots = (t0, o = {}) => {
    const s = scene(t0, 'var(--paper)', [540, 900]);
    pattern(s.root);
    const lines = [
      new Line(s.root, { html: 'Maskotunu', y: 240, size: 134, delay: 0.1 }),
      new Line(s.root, { html: '*seç.*', y: 380, size: 230, itColor: 'var(--acc)', delay: 0.4 }),
    ];
    const defs = [
      ['fistik', 'Fıstık', 'sokak kedisi', 200, 640],
      ['bilge', 'Bilge', 'baykuş', 540, 640],
      ['ceviz', 'Ceviz', 'sincap', 880, 640],
      ['diken', 'Diken', 'kirpi', 370, 1130],
      ['karamel', 'Karamel', 'sokak köpeği', 710, 1130],
    ];
    const cards = defs.map(([key, name, sp, cx, top], i) => {
      const pal = SP.__meta.pal[key];
      const g = el('div', 'abs', s.root, { left: px(cx - 160), top: px(top), width: '320px', height: '320px' });
      el('div', 'abs', g, { inset: 0, borderRadius: '50%', background: pal.soft, border: `6px solid ${pal.line}` });
      const m = new Mascot(g, { who: key, w: 288 });
      const label = el('div', 'abs', g, { left: '-40px', width: '400px', top: '330px', textAlign: 'center', lineHeight: 1.05 });
      label.innerHTML = `<div style="font-size:60px;font-weight:800;letter-spacing:-.03em;color:${pal.accent}">${name}</div><div class="it" style="font-size:46px;color:#6e5f55">${sp}</div>`;
      return { g, m, label, i };
    });
    s.update = (lt) => {
      lines.forEach((l) => l.update(lt));
      cards.forEach(({ g, m, label, i }) => {
        const t0 = 0.55 + i * 0.28;
        const p = prog(lt, t0, 0.55);
        popIn(g, p, { fromY: 400, rot: (i % 2 ? 1 : -1) * 20 });
        label.style.opacity = prog(lt, t0 + 0.25, 0.3);
        const on = lt > t0 + 0.4;
        const h = hop(lt, 0.75, on ? 40 : 0, i * 0.17);
        m.set(on ? 'happy' : 'calm', on && Math.floor(lt / 0.22 + i) % 2 ? 'wave' : on ? 'wave2' : null, blink(lt, i * 0.4));
        m.put(160, 305 - h.y, { sy: h.sy, sx: h.sx });
      });
    };
  };

  /* S8 · Kapanış */
  SCENES.outro = (t0, o = {}) => {
    const s = scene(t0, 'var(--acc)', [540, 1100], 0.22);
    pattern(s.root, 'rgba(255,255,255,.14)');
    const icon = el('img', 'abs', s.root, { width: '190px', height: '190px', left: px(445), top: px(250), borderRadius: '48px', boxShadow: '0 30px 60px -10px rgba(0,0,0,.4)' });
    icon.src = 'assets/icon.png';
    const lines = [
      new Line(s.root, { html: 'Cep Defteri', y: 480, size: 190, color: '#FFFCF6', delay: 0.35 }),
      new Line(s.root, { html: o.sub || 'Verin telefonunda kalır.', y: 720, size: 58, color: 'var(--soft)', delay: 0.9, weight: 600, stagger: 0.07 }),
      new Line(s.root, { html: `*${o.accent || 'İnternet gerekmez.'}*`, y: 810, size: 78, color: '#FFFCF6', itColor: '#FFFCF6', delay: 1.3, stagger: 0.1 }),
    ];
    const btn = el('div', 'abs', s.root, { left: px(540 - 270), top: '960px', width: '540px', height: '140px', borderRadius: '70px', background: '#FFFCF6', color: 'var(--acc)', fontSize: '66px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 24px 60px -12px rgba(0,0,0,.45)', letterSpacing: '-.02em' });
    btn.textContent = o.cta || 'Şimdi dene';
    const m = new Mascot(s.root, { w: 896 });
    const conf = new Burst(s.root, { n: 44, t0: 0.15, ox: 540, oy: 1100, colors: ['#F8DCC8', '#FFE08A', '#FFFCF6', '#2F8F9D', '#F0874F'], speed: 1300, grav: 1900, life: 2.0, size: [28, 28] });
    s.update = (lt) => {
      lines.forEach((l) => l.update(lt));
      const p = prog(lt, 0.15, 0.7);
      icon.style.transform = `scale(${E.back(p)}) rotate(${(1 - E.out(p)) * 160}deg)`;
      icon.style.opacity = clamp(p * 4);
      const bp = prog(lt, 1.7, 0.5);
      const pulse = 1 + 0.045 * Math.sin(lt * 7);
      btn.style.opacity = clamp(bp * 4);
      btn.style.transform = `translateY(${(1 - E.back(bp)) * 120}px) scale(${bp < 1 ? 0.8 + 0.2 * E.back(bp) : pulse})`;
      const h = hop(lt, 0.7, 70);
      m.set('celebrate', Math.floor(lt / 0.2) % 2 ? 'wave' : 'wave2', blink(lt));
      m.put(540, 1960 + (1 - E.out(prog(lt, 0.2, 0.6))) * 800 - h.y, { sx: h.sx, sy: h.sy });
      conf.update(lt);
    };
  };
}

/* ───────── Zaman çizelgesi ───────── */
let flash;
window.renderAt = (t) => {
  if (!flash) flash = el('div', 'abs', stage, { inset: 0, background: '#fff', zIndex: 50, pointerEvents: 'none' });
  flash.style.opacity = Math.max(0, ...scenes.filter((s) => s.flash).map((s) => (t >= s.t0 ? Math.max(0, 1 - (t - s.t0) / 0.18) : 0))) * 0.9;
  scenes.forEach((s, i) => {
    const next = scenes[i + 1];
    const endT = next ? next.t0 + 0.7 : 1e9;
    const vis = t >= s.t0 && t < endT;
    s.root.style.display = vis ? 'block' : 'none';
    if (!vis) return;
    const wp = i === 0 ? 1 : E.inOut(prog(t, s.t0, s.wdur));
    s.root.style.clipPath = wp >= 1 ? 'none' : `circle(${wp * 2600}px at ${s.wipe[0]}px ${s.wipe[1]}px)`;
    s.update(t - s.t0 + s.skip, t);
  });
};

window.ready = (async () => {
  if (document.readyState === 'loading') await new Promise((r) => document.addEventListener('DOMContentLoaded', r));
  SP = await (await fetch('assets/sprites.json')).json();
  const REELS = await (await fetch('reels.json')).json();
  const name = new URLSearchParams(location.search).get('r') || 'tanitim';
  const reel = REELS[name];
  if (!reel) throw new Error('reels.json içinde yok: ' + name);
  defineScenes();
  if (typeof defineStories === 'function') defineStories();
  for (const [type, t0, opts = {}] of reel.scenes) {
    OPTS = opts;
    SCENES[type](t0, opts);
  }
  window.REEL_END = reel.end;
  await document.fonts.load('800 100px Bricolage');
  await document.fonts.load('100px Pixel');
  await document.fonts.ready;
  window.renderAt(0);
  await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
  return true;
})();
