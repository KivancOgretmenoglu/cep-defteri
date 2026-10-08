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
    ? [`${base}|${mood}|${paws}|mood`, `${base}|${mood}|${paws === 'wave2' ? 'wave' : paws}|mood`, `${base}|${mood}|null|mood`]
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
      if (it) { sp.style.fontSize = '1.14em'; if (itColor) sp.style.color = itColor; }
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
const COIN = ['..oooo..', '.ohhggo.', 'ohhgggdo', 'ohggggdo', 'ohggggdo', 'ohgggddo', '.oddddo.', '..oooo..'];
const COIN_C = { o: '#8A4F0E', h: '#FFE08A', g: '#F2B63C', d: '#D28E1E' };
const coinSVG = () => `<svg viewBox="0 0 8 8" width="100%" height="100%" shape-rendering="crispEdges">${COIN.map((r, y) => [...r].map((c, x) => (c === '.' ? '' : `<rect x="${x}" y="${y}" width="1" height="1" fill="${COIN_C[c]}"/>`)).join('')).join('')}</svg>`;

class Burst {
  constructor(parent, { n, t0, ox, oy, colors, speed = 900, grav = 1800, life = 1.6, size = [18, 34], coin = false, upBias = 0.5 }) {
    Object.assign(this, { t0, ox, oy, grav, life });
    this.ps = Array.from({ length: n }, (_, i) => {
      const a = rnd() * Math.PI * 2, v = speed * (0.4 + rnd() * 0.7);
      const s = coin ? size[1] : size[0] + rnd() * (size[1] - size[0]);
      const e = el('div', 'abs', parent, { width: px(s), height: px(s), willChange: 'transform' });
      if (coin) e.innerHTML = coinSVG(); else e.style.background = colors[i % colors.length];
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
function scene(t0, bg, wipe = [540, 1500]) {
  const root = el('div', 'scene', stage, { background: bg });
  cur = { t0, root, wipe, items: [], bg };
  scenes.push(cur);
  return cur;
}
const T = { s1: 0, s2: 3.0, s3: 6.0, s4: 11.0, s5: 14.0, s6: 18.0, s7: 21.0, s8: 24.0, end: 28.0 };

function buildAll() {
  /* S1 · Kanca: para nereye gitti? */
  {
    const s = scene(T.s1, 'var(--paper)');
    pattern(s.root);
    const lines = [
      new Line(s.root, { html: 'Ay başı.', y: 240, size: 92, color: '#7a6a60', delay: 0.15, weight: 600 }),
      new Line(s.root, { html: 'Para', y: 340, size: 200, delay: 0.55 }),
      new Line(s.root, { html: '*nereye*', y: 510, size: 250, delay: 0.95, itColor: 'var(--acc)' }),
      new Line(s.root, { html: '*gitti?*', y: 790, size: 250, delay: 1.25, itColor: 'var(--acc)' }),
    ];
    const m = new Mascot(s.root, { w: 1100 });
    const coins = new Burst(s.root, { n: 18, t0: 1.55, ox: 540, oy: 1250, colors: [], coin: true, speed: 1250, grav: 2200, life: 1.5, size: [0, 70], upBias: 0.9 });
    s.update = (lt, t) => {
      lines.forEach((l) => l.update(lt));
      const enter = E.out(prog(lt, 0.0, 0.7));
      const think = lt > 1.55;
      const h = hop(lt, 0.9, think ? 0 : 30);
      m.set(think ? 'thoughtful' : 'curious', think ? 'face' : null, think ? 'mood' : lt % 1.3 < 0.12 ? 'closed' : 'wide');
      m.put(540, 1930 + (1 - enter) * 900 - h.y, { sx: h.sx, sy: h.sy, rot: think ? Math.sin(lt * 5) * 2 : Math.sin(lt * 3) * 1.5 });
      coins.update(lt);
    };
  }

  /* S2 · Tanıtım: bütçeni cebine koy */
  {
    const s = scene(T.s2, 'var(--acc)', [540, 400]);
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
    const m = new Mascot(s.root, { w: 720 });
    const conf = new Burst(s.root, { n: 34, t0: 0.35, ox: 540, oy: 360, colors: ['#F8DCC8', '#FFE08A', '#FFFCF6', '#2F8F9D', '#F0874F'], speed: 1100, grav: 1900, life: 1.8, size: [16, 34] });
    s.update = (lt) => {
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
  }

  /* S3 · Harcamanı 5 saniyede yaz */
  {
    const s = scene(T.s3, 'var(--soft)', [540, 1300]);
    pattern(s.root, 'rgba(174,71,22,.10)');
    const lines = [
      new Line(s.root, { html: 'Harcamanı', y: 240, size: 124, delay: 0.1 }),
      new Line(s.root, { html: '*5 saniyede*', y: 370, size: 210, itColor: 'var(--acc)', delay: 0.35 }),
      new Line(s.root, { html: 'yaz.', y: 600, size: 150, delay: 0.7 }),
    ];
    const ph = new Phone(s.root, { w: 580, x: 250, top: 800, imgs: ['assets/ui/add0.png', 'assets/ui/add2.png', 'assets/ui/add3.png', 'assets/ui/saved.png'] });
    const sw = el('div', 'pill', s.root, { left: px(700), top: px(590), width: '330px', justifyContent: 'center', color: 'var(--acc)' });
    const swDot = el('span', 'dot', sw, { background: 'var(--acc)' });
    const swTxt = el('span', '', sw);
    const tap1 = el('div', 'tap', ph.screen), tap2 = el('div', 'tap', ph.screen), tap0 = el('div', 'tap', ph.screen);
    const av = el('div', 'abs', s.root, { width: '270px', height: '270px', borderRadius: '50%', background: '#FFFCF6', border: '10px solid var(--acc)', overflow: 'hidden', left: '40px', top: '1280px', boxShadow: '0 20px 50px -10px rgba(60,20,0,.4)' });
    const m = new Mascot(av, { w: 330, outfit: 'headphones' });
    m.root.style.left = px(-30); m.root.style.top = px(40);
    const conf = new Burst(s.root, { n: 26, t0: 3.45, ox: 540, oy: 1500, colors: ['#AE4716', '#FFE08A', '#2F8F9D', '#fff'], speed: 800, grav: 1800, life: 1.4, size: [14, 28] });
    s.update = (lt) => {
      lines.forEach((l) => l.update(lt));
      const rise = E.out(prog(lt, 0.3, 0.7));
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
      sw.style.opacity = prog(lt, 0.7, 0.3);
      sw.style.transform = `scale(${lt > 3.45 ? 1 + 0.15 * Math.sin(prog(lt, 3.45, 0.4) * Math.PI) : 1})`;
      // maskot balonu
      const ap = prog(lt, 0.9, 0.5);
      const done = lt > 3.45;
      popIn(av, ap, { fromX: -200, fromY: 0 });
      const h = hop(lt, 0.7, done ? 22 : 0);
      m.set(done ? 'celebrate' : 'curious', done ? (Math.floor(lt / 0.2) % 2 ? 'wave' : 'up') : null);
      m.put(165, 330 - h.y, { sy: h.sy, sx: h.sx });
      conf.update(lt);
    };
  }

  /* S4 · Bugün ne kadar harcayabilirim? */
  {
    const s = scene(T.s4, '#DDEFE9', [540, 1500]);
    pattern(s.root, 'rgba(31,111,120,.10)');
    const TEAL = '#1F6F78';
    const lines = [
      new Line(s.root, { html: 'Bugün', y: 240, size: 116, delay: 0.1 }),
      new Line(s.root, { html: 'ne kadar', y: 350, size: 150, delay: 0.3 }),
      new Line(s.root, { html: '*harcayabilirim?*', y: 510, size: 150, itColor: TEAL, delay: 0.55 }),
    ];
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
    const m = new Mascot(s.root, { w: 330, outfit: 'scholar' });
    s.update = (lt) => {
      lines.forEach((l) => l.update(lt));
      const rise = E.out(prog(lt, 0.4, 0.7));
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
  }

  /* S5 · Faturalar, taksitler, abonelikler */
  {
    const s = scene(T.s5, '#DEE2F6', [540, 1500]);
    pattern(s.root, 'rgba(67,81,163,.10)');
    const IND = '#4351A3';
    const lines = [
      new Line(s.root, { html: 'Faturalar,', y: 240, size: 120, delay: 0.1 }),
      new Line(s.root, { html: 'taksitler,', y: 360, size: 120, delay: 0.35 }),
      new Line(s.root, { html: '*abonelikler.*', y: 480, size: 190, itColor: IND, delay: 0.6 }),
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
    const m = new Mascot(s.root, { w: 400, outfit: 'ledger' });
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
  }

  /* S6 · Nereye gitti, ne kadar birikti? */
  {
    const s = scene(T.s6, '#2A1E1A', [540, 1500]);
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
  }

  /* S7 · Maskotunu seç */
  {
    const s = scene(T.s7, 'var(--paper)', [540, 900]);
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
      const m = new Mascot(g, { who: key, w: 290 });
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
  }

  /* S8 · Kapanış */
  {
    const s = scene(T.s8, 'var(--acc)', [540, 1100]);
    pattern(s.root, 'rgba(255,255,255,.14)');
    const icon = el('img', 'abs', s.root, { width: '190px', height: '190px', left: px(445), top: px(250), borderRadius: '48px', boxShadow: '0 30px 60px -10px rgba(0,0,0,.4)' });
    icon.src = 'assets/icon.png';
    const lines = [
      new Line(s.root, { html: 'Cep Defteri', y: 480, size: 190, color: '#FFFCF6', delay: 0.35 }),
      new Line(s.root, { html: 'Verin telefonunda kalır.', y: 720, size: 58, color: 'var(--soft)', delay: 0.9, weight: 600, stagger: 0.07 }),
      new Line(s.root, { html: '*İnternet gerekmez.*', y: 810, size: 78, color: '#FFFCF6', itColor: '#FFFCF6', delay: 1.3, stagger: 0.1 }),
    ];
    const btn = el('div', 'abs', s.root, { left: px(540 - 270), top: '960px', width: '540px', height: '140px', borderRadius: '70px', background: '#FFFCF6', color: 'var(--acc)', fontSize: '66px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 24px 60px -12px rgba(0,0,0,.45)', letterSpacing: '-.02em' });
    btn.textContent = 'Şimdi dene';
    const m = new Mascot(s.root, { w: 880 });
    const conf = new Burst(s.root, { n: 44, t0: 0.15, ox: 540, oy: 1100, colors: ['#F8DCC8', '#FFE08A', '#FFFCF6', '#2F8F9D', '#F0874F'], speed: 1300, grav: 1900, life: 2.0, size: [16, 36] });
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
  }
}

/* ───────── Zaman çizelgesi ───────── */
window.renderAt = (t) => {
  scenes.forEach((s, i) => {
    const next = scenes[i + 1];
    const endT = next ? next.t0 + 0.7 : 1e9;
    const vis = t >= s.t0 && t < endT;
    s.root.style.display = vis ? 'block' : 'none';
    if (!vis) return;
    const wp = i === 0 ? 1 : E.inOut(prog(t, s.t0, 0.6));
    s.root.style.clipPath = wp >= 1 ? 'none' : `circle(${wp * 2600}px at ${s.wipe[0]}px ${s.wipe[1]}px)`;
    s.update(t - s.t0, t);
  });
};

window.ready = (async () => {
  SP = await (await fetch('assets/sprites.json')).json();
  buildAll();
  await document.fonts.load('800 100px Bricolage');
  await document.fonts.load('italic 100px Serif');
  await document.fonts.ready;
  window.renderAt(0);
  await Promise.all([...document.images].map((i) => i.decode().catch(() => {})));
  return true;
})();
