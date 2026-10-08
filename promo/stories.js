/* Hikâyeli kısa reels sahneleri (reel.js'teki yardımcıları kullanır).
 * Her hikâye: kanca (ilk kare kapak) → komik dönüş; ardından SCENES.app (uygulamanın gerçek ekranı) ve SCENES.outro gelir. */

/* ───────── piksel çizimler (her sahnede maskotla aynı piksel boyunda çizilir) ───────── */
const TOST = ['..bbbbbbbbbb..', '.bTTTTTTTTTTb.', 'bTTgTTTgTTTgTb', 'bTgTTTgTTTgTTb', 'bTTTTTTTTTTTTb', 'bccTccccTcccTb', 'bbbbbbbbbbbbbb', '.pppppppppppp.'];
const TOST_C = { b: '#7A4318', T: '#E7B26A', g: '#9A5B22', c: '#F6D04D', p: '#FFFFFF' };
const TRAY = ['oooooooooooooooo', 'oyyyyyoWWWWWoBBo', 'oyrryyoWWWWWoBBo', 'oyyyyyoWWWWWoBBo', 'oGGgGGoWWWWWoBBo', 'oGgGGGoWWWWWoBBo', 'oooooooooooooooo'];
const TRAY_C = { o: '#6F7C89', y: '#E8913A', r: '#B5501E', W: '#F5F1E6', G: '#6DBE5A', g: '#3F8F3A', B: '#D9A35E' };
const CUP = ['oooo..', 'okkooo', 'owwo.o', 'owwooo', '.oo...'];
const CUP_C = { o: '#2A1E1A', k: '#6B4226', w: '#F5EFE6' };
const BELL = ['...b...', '..bbb..', '.bbbbb.', '.bbbbb.', 'bbbbbbb', '...b...'];
const BELL_C = { b: '#FFD25A' };
const COBWEB = ['w...w.', '.w.w..', 'wwwwww', '.w.w..', 'w..w..', '...w..'];
const COBWEB_C = { w: '#8E867C' };
const NOTEP = ['..oo', '..o.', '..o.', 'ooo.', 'oo..'];
const NOTEP_C = { o: '#2A1E1A' };

/* ───────── ortak parçalar ───────── */
/** Sahneyi sarsar; sarsıntı yokken dönüşümü kaldırır (kenarda boşluk görünmesin diye hafif büyütür) */
function shakeRoot(root, x, y = 0) {
  root.style.transform = Math.abs(x) + Math.abs(y) > 0.01 ? `translate(${x}px,${y}px) scale(1.05)` : 'none';
}
function notifCard(parent, { icon = 'coin', app = 'BANKA', title, body, top = 600 }) {
  const n = el('div', 'abs', parent, { left: '50px', width: '980px', top: px(top), background: 'rgba(255,255,255,.97)', borderRadius: '44px', padding: '28px 32px', display: 'flex', gap: '26px', alignItems: 'center', boxShadow: '0 30px 70px -20px rgba(0,0,0,.45)', zIndex: 20 });
  const ic = el('div', '', n, { width: '108px', height: '108px', borderRadius: '26px', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', background: icon === 'app' ? 'transparent' : '#AE4716', overflow: 'hidden' });
  ic.innerHTML = icon === 'app' ? '<img src="assets/icon.png" style="width:108px;height:108px;display:block">' : pix(TLCOIN, TLCOIN_C, 12);
  const tx = el('div', '', n, { flex: 1, minWidth: 0 });
  tx.innerHTML = `<div style="display:flex;justify-content:space-between;font-size:30px;font-weight:600;color:#8a7d72;letter-spacing:.04em"><span>${app}</span><span>şimdi</span></div>
    <div style="font-size:44px;font-weight:800;color:#2A1E1A;line-height:1.15;margin-top:4px;letter-spacing:-.01em">${title}</div>
    ${body ? `<div style="font-size:36px;font-weight:500;color:#5b4d44;margin-top:2px">${body}</div>` : ''}`;
  return n;
}
/** Üstten düşerek gelir (p: 0→1), q>0 ise yukarı kaçar */
function dropIn(e, p, q = 0) {
  const k = E.back(p);
  e.style.opacity = clamp(p * 4) * (1 - q);
  e.style.transform = `translateY(${(1 - k) * -300 - E.inOut(q) * 400}px)`;
}
function bubble(parent, { html, x, y, w = 560, tail = 'left', size = 46 }) {
  const b = el('div', 'abs', parent, { left: px(x), top: px(y), width: px(w), background: '#FFFCF6', border: '6px solid #2A1E1A', borderRadius: '34px', padding: '22px 30px', fontWeight: 700, fontSize: px(size), lineHeight: 1.12, color: '#2A1E1A', boxShadow: '8px 10px 0 #2A1E1A', transformOrigin: tail === 'left' ? '15% 120%' : '85% 120%', zIndex: 15, letterSpacing: '-.01em' });
  b.innerHTML = html;
  el('div', 'abs', b, { width: '34px', height: '34px', background: '#FFFCF6', borderRight: '6px solid #2A1E1A', borderBottom: '6px solid #2A1E1A', bottom: '-23px', [tail === 'left' ? 'left' : 'right']: '60px', transform: 'rotate(45deg)' });
  return b;
}
/** Konuşma balonu: t0'da açılır, t1'de kapanır */
function talk(b, lt, t0, t1 = 99) {
  const p = prog(lt, t0, 0.3), q = prog(lt, t1, 0.18);
  b.style.display = p > 0 && q < 1 ? 'block' : 'none';
  b.style.opacity = clamp(p * 4) * (1 - q);
  b.style.transform = `scale(${(0.4 + 0.6 * E.back(p)) * (1 - q * 0.4)})`;
}
const pixEl = (parent, rows, cols, cell, css = {}) => {
  const e = el('div', 'abs', parent, { width: px(rows[0].length * cell), height: px(rows.length * cell), ...css });
  e.innerHTML = pix(rows, cols, cell);
  return e;
};
/** Yazı grubunu (Line dizisi) belli aralıkta göster */
function showLines(ls, lt, a, b = 99, offset = 0) {
  ls.forEach((l) => {
    const on = lt >= a && lt < b;
    l.root.style.display = on ? 'block' : 'none';
    if (on) l.update(lt - a + offset);
  });
}
/** Sayıyı yumuşakça hedefe kaydır: adımlar [[t, değer], ...] */
function stepValue(lt, steps, dur = 0.3) {
  let v = steps[0][1];
  for (let i = 1; i < steps.length; i++) v = lerp(v, steps[i][1], E.out(prog(lt, steps[i][0], dur)));
  return v;
}

function defineStories() {
  /* ── Genel uygulama sahnesi: üstte iki satır, telefonda gerçek ekran, yanda balonlar ── */
  SCENES.app = (t0, o = {}) => {
    const s = scene(t0, o.bg || 'var(--soft)', o.wipe || [540, 1500]);
    pattern(s.root, o.dot || 'rgba(174,71,22,.10)');
    const lines = (o.lines || []).map((l, i) => new Line(s.root, { delay: 0.1 + i * 0.25, ...l }));
    const P = o.phone || {};
    const pw = P.w || 560, px0 = P.x ?? 540 - pw / 2, top = P.top ?? 760;
    const ph = new Phone(s.root, { w: pw, x: px0, top, imgs: P.img ? [P.img] : [], scrollImg: P.scroll?.src, nav: P.scroll?.nav });
    if (P.img) ph.layers[0].style.opacity = 1;
    const taps = (o.taps || []).map((tp) => ({ ...tp, e: el('div', 'tap', ph.screen) }));
    const chips = (o.chips || []).map((c) => ({ ...c, e: chipEl(s.root, c.html, { left: px(c.x ?? 40), top: px(c.y), ...(c.w ? { width: px(c.w), justifyContent: 'space-between' } : {}), ...(c.style || {}) }) }));
    const M = o.mascot;
    const m = M ? new Mascot(s.root, { who: M.who || 'fistik', w: M.w || 384, outfit: M.outfit || null }) : null;
    s.update = (lt) => {
      lines.forEach((l) => l.update(lt));
      const rise = E.out(prog(lt, 0.3, 0.7));
      ph.pos(px0, 2000 - rise * (2000 - top), (1 - rise) * 3);
      if (P.scroll) ph.scrollTo(lerp(P.scroll.from || 0, P.scroll.to || 0, E.inOut(prog(lt, 0.8, P.scroll.dur || 2.0))));
      taps.forEach((tp) => tapAt(tp.e, lt, tp.t, ph.sw * tp.fx, ph.sh * tp.fy));
      chips.forEach((c) => popIn(c.e, prog(lt, c.t, 0.5), { fromX: c.from ?? -300, fromY: 0, rot: c.rot ?? -5 }));
      if (m) {
        const mt = M.t ?? 1.4;
        const on = lt > mt + 0.4;
        const h = hop(lt, 0.75, on ? 24 : 0);
        m.set(on ? 'celebrate' : M.mood || 'happy', on ? (Math.floor(lt / 0.2) % 2 ? 'wave' : 'up') : null, blink(lt));
        m.put(M.x ?? 860, (M.bottom ?? 1900) + (1 - E.back(prog(lt, mt, 0.5))) * 600 - h.y, { sy: h.sy, sx: h.sx, flip: !!M.flip });
      }
    };
  };

  /* ── 1 · Burs yattı bildirimi gelince ── */
  SCENES.bursStory = (t0, o = {}) => {
    const s = scene(t0, 'var(--paper)');
    pattern(s.root);
    const sad = el('div', 'abs', s.root, { inset: 0, background: 'linear-gradient(#3F4752, #6A7380)', display: 'none' });
    const hook = [
      new Line(s.root, { html: 'Burs yattı', y: 230, size: 140, delay: -1 }),
      new Line(s.root, { html: '*bildirimi gelince:*', y: 380, size: 112, itColor: 'var(--acc)', delay: -1 }),
    ];
    const later = [new Line(s.root, { html: '*2 gün sonra:*', y: 250, size: 150, itColor: '#FFFCF6' })];
    const m = new Mascot(s.root, { w: 768 });
    const nt = notifCard(s.root, { app: 'BANKA', title: 'Hesabına +3.000 TL geldi', body: 'Açıklama: burs ödemesi', top: 560 });
    const bal = el('div', 'pill', s.root, { left: px(540 - 280), width: '560px', justifyContent: 'center', top: '580px', fontSize: '72px', fontWeight: 800, color: '#2A1E1A', zIndex: 10 });
    const items = [['Kulaklık', '1.200'], ['Pizza (yine)', '350'], ['Konser bileti', '800'], ['7 kahve', '450']].map(([n, a], i) =>
      chipEl(s.root, `<span>${n}</span><b style="color:#C0392B">−${a} TL</b>`, { left: px(i % 2 ? 500 : 40), top: px(790 + i * 135), width: '540px', justifyContent: 'space-between', fontSize: '46px', zIndex: 9 }));
    const IT = [1.5, 1.9, 2.3, 2.7];
    const CUT = 3.3;
    s.update = (lt) => {
      const isSad = lt >= CUT;
      sad.style.display = isSad ? 'block' : 'none';
      shakeRoot(s.root, shake(lt, CUT, 30, 0.3));
      showLines(hook, lt, -9, CUT, 9);
      showLines(later, lt, CUT);
      // bildirim
      nt.style.display = lt < 1.4 ? 'flex' : 'none';
      dropIn(nt, prog(lt, 0.3, 0.45), prog(lt, 1.05, 0.3));
      // bakiye
      const v = stepValue(lt, [[0, 3000], ...IT.map((t, i) => [t + 0.05, [1800, 1450, 650, 200][i]])], 0.28);
      bal.style.display = lt > 1.1 ? 'flex' : 'none';
      bal.innerHTML = `${fmt(v)} <span style="font-size:44px">TL</span>`;
      const hit = IT.some((t) => lt > t && lt < t + 0.2);
      bal.style.color = isSad || hit ? '#C0392B' : '#2A1E1A';
      bal.style.transform = `scale(${isSad ? 1.15 : 1 + (hit ? 0.06 : 0) + 0.12 * (1 - E.out(prog(lt, 1.1, 0.3)))}) translateX(${isSad ? Math.sin(lt * 50) * 6 : 0}px)`;
      if (isSad) bal.style.top = '820px';
      else bal.style.top = '580px';
      items.forEach((c, i) => {
        c.style.display = isSad ? 'none' : 'flex';
        popIn(c, prog(lt, IT[i], 0.4), { fromX: i % 2 ? 500 : -500, fromY: 0, rot: i % 2 ? 6 : -6 });
      });
      // maskot: uyuyor → irkiliyor → güneş gözlüğüyle dans → çarpı göz
      if (lt < 0.55) {
        m.outfit = null; m.set('calm', null, 'closed');
        m.put(540, 1910 + Math.sin(lt * 4) * 4, { sy: 1 + Math.sin(lt * 4) * 0.01 });
      } else if (lt < 1.1) {
        m.outfit = null; m.set('curious', null, 'wide');
        const j = Math.sin(prog(lt, 0.55, 0.4) * Math.PI) * 90;
        m.put(540, 1910 - j, { sy: 1.04 });
      } else if (!isSad) {
        m.outfit = 'summer';
        const h = hop(lt, 0.4, 60), beat = Math.floor(lt / 0.4);
        m.set('celebrate', beat % 2 ? 'up' : 'wave', 'mood');
        m.put(540, 1910 - h.y, { sx: h.sx, sy: h.sy, rot: beat % 2 ? 8 : -8, flip: beat % 2 === 1 });
      } else {
        m.outfit = null;
        const sink = E.out(prog(lt, CUT, 0.5));
        m.set('thoughtful', null, 'x');
        m.put(540, 1910 + sink * 50, { sy: 1 - sink * 0.07, sx: 1 + sink * 0.04 });
      }
    };
  };

  /* ── 2 · Tost mu, yemekhane mi? ── */
  SCENES.tostStory = (t0, o = {}) => {
    const C = 28;
    const s = scene(t0, 'var(--paper)');
    const L = el('div', 'abs', s.root, { left: 0, top: 0, width: '540px', height: '1920px', background: '#F8DCC8' });
    const R = el('div', 'abs', s.root, { left: '540px', top: 0, width: '540px', height: '1920px', background: '#DDEFE9' });
    const math = el('div', 'abs', s.root, { inset: 0, background: 'var(--paper)', display: 'none' });
    pattern(math);
    const hook = [
      new Line(s.root, { html: 'Tost mu,', y: 230, size: 150, delay: -1 }),
      new Line(s.root, { html: '*yemekhane mi?*', y: 395, size: 112, itColor: 'var(--acc)', delay: -1 }),
    ];
    const lab = (txt, x, color) => { const e = el('div', 'abs it', s.root, { left: px(x - 250), width: '500px', top: '590px', textAlign: 'center', fontSize: '84px', color }); e.textContent = txt; return e; };
    const labL = lab('KANTİN', 270, '#AE4716'), labR = lab('YEMEKHANE', 810, '#1F6F78');
    const tost = pixEl(s.root, TOST, TOST_C, C, { left: px(270 - 7 * C), top: '730px', overflow: 'hidden' });
    const tray = pixEl(s.root, TRAY, TRAY_C, C, { left: px(810 - 8 * C), top: '740px' });
    const tag = (txt, x) => { const e = el('div', 'pill', s.root, { left: px(x - 120), width: '240px', justifyContent: 'center', top: '1000px', fontSize: '60px', fontWeight: 800 }); e.textContent = txt; return e; };
    const tagL = tag('95 TL', 270), tagR = tag('40 TL', 810);
    const m = new Mascot(s.root, { w: 32 * C });
    // hesap tahtası
    const mathLines = [new Line(math, { html: '*Her gün tost:*', y: 250, size: 130, itColor: 'var(--acc)' })];
    const row = (y) => el('div', 'abs', math, { left: 0, right: 0, top: px(y), textAlign: 'center', fontWeight: 800, fontSize: '58px', letterSpacing: '-.02em', lineHeight: 1.05 });
    const r1 = row(470), r2 = row(720), r3 = el('div', 'abs it', math, { left: 0, right: 0, top: '990px', textAlign: 'center', fontSize: '170px', color: '#C0392B' });
    const M0 = 2.6, SLAM = 4.0;
    s.update = (lt) => {
      const isMath = lt >= M0;
      math.style.display = isMath ? 'block' : 'none';
      [L, R, labL, labR, tray, tagL, tagR].forEach((e) => (e.style.display = isMath ? 'none' : 'block'));
      tagL.style.display = tagR.style.display = isMath ? 'none' : 'flex';
      showLines(hook, lt, -9, M0, 9);
      showLines(mathLines, lt, M0);
      // ısırıklar
      const bites = lt < 1.95 ? 0 : lt < 2.15 ? 1 : lt < 2.35 ? 2 : 3;
      tost.style.display = isMath || bites >= 3 ? 'none' : 'block';
      tost.style.width = px((14 - bites * 5) * C);
      tost.style.transform = `translateY(${Math.sin(lt * 5) * 6}px)`;
      tray.style.transform = `translateY(${Math.sin(lt * 5 + 1) * 6}px)`;
      // maskot: iki yana bakar → tosta koşar → yer → hesapta çarpı göz
      if (lt < 1.6) {
        const look = Math.floor(lt / 0.4) % 2;
        m.set('curious', null, lt % 1.3 < 0.1 ? 'closed' : 'wide');
        m.put(540, 1910 - Math.abs(Math.sin(lt * 7.8)) * 20, { flip: look === 0, rot: look ? 4 : -4 });
      } else if (!isMath) {
        const k = E.inOut(prog(lt, 1.6, 0.3));
        const h = hop(lt, 0.2, lt < 1.9 ? 40 : 10);
        m.set('happy', lt > 1.9 ? 'up' : null, lt > 1.9 ? 'closed' : 'mood');
        m.put(lerp(540, 330, k), 1910 - h.y, { flip: true, sx: h.sx, sy: h.sy });
      } else {
        const fell = lt > SLAM;
        m.set(fell ? 'thoughtful' : 'curious', null, fell ? 'x' : 'wide');
        m.put(540, 1910 + (fell ? 40 * E.out(prog(lt, SLAM, 0.3)) : 0), { rot: fell ? -6 * E.out(prog(lt, SLAM, 0.3)) : 0 });
      }
      // hesap
      const a = Math.round(stepValue(lt, [[0, 0], [M0 + 0.2, 22]], 0.7));
      r1.innerHTML = `Tost · 95 TL × ${a} gün<br><span style="color:#AE4716;font-size:2em">${fmt(95 * a)} TL</span>`;
      r2.innerHTML = `Yemekhane · 40 TL × ${a} gün<br><span style="color:#1F6F78;font-size:2em">${fmt(40 * a)} TL</span>`;
      r1.style.opacity = prog(lt, M0 + 0.1, 0.2);
      r2.style.opacity = prog(lt, M0 + 0.5, 0.2);
      const sk = prog(lt, SLAM, 0.2);
      r3.style.opacity = sk > 0 ? 1 : 0;
      r3.innerHTML = 'Fark: 1.210 TL';
      r3.style.transform = `scale(${lerp(2.4, 1, E.out(sk))}) rotate(${-3 * sk}deg)`;
      math.style.transform = `translate(${shake(lt, SLAM, 26, 0.3)}px,${shake(lt + 0.2, SLAM, 16, 0.3)}px)`;
    };
  };

  /* ── 3 · Abonelik avcısı ── */
  SCENES.subsStory = (t0, o = {}) => {
    const s = scene(t0, '#1F2433');
    el('div', 'abs', s.root, { inset: 0, background: 'radial-gradient(circle at 50% 55%, rgba(255,220,170,.16), transparent 60%)' });
    pattern(s.root, 'rgba(255,255,255,.06)');
    const hook = [
      new Line(s.root, { html: 'Unuttuğun', y: 230, size: 140, color: '#FFFCF6', delay: -1 }),
      new Line(s.root, { html: '*abonelikler:*', y: 380, size: 112, itColor: '#F0874F', delay: -1 }),
    ];
    const hunt = [
      new Line(s.root, { html: '*Abonelik avcısı*', y: 240, size: 110, itColor: '#F0874F' }),
      new Line(s.root, { html: 'iş başında.', y: 400, size: 96, color: '#FFFCF6' }),
    ];
    const defs = [['MÜZİK', '#D9487E', 60], ['DİZİ', '#C0392B', 150], ['BULUT', '#3A7BD5', 40], ['OYUN', '#6C4AB6', 120], ['DİL', '#2F9E6B', 90], ['SPOR', '#E08A2E', 400]];
    const KILL = { 1: 2.4, 3: 2.8, 5: 3.2 };
    const tiles = defs.map(([n, c, fee], i) => {
      const x = [75, 415, 755][i % 3], y = i < 3 ? 560 : 900;
      const g = el('div', 'abs', s.root, { left: px(x), top: px(y), width: '250px', height: '300px' });
      const t = el('div', 'abs it', g, { left: 0, top: 0, width: '250px', height: '220px', borderRadius: '56px', background: c, color: '#fff', fontSize: '76px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 40px -10px rgba(0,0,0,.5)' });
      t.textContent = n;
      const p = el('div', 'abs', g, { left: 0, width: '250px', top: '232px', textAlign: 'center', color: '#FFFCF6', fontWeight: 700, fontSize: '40px' });
      p.textContent = `${fee} TL/ay`;
      const x1 = el('div', 'abs', g, { left: 0, top: 0, width: '250px', height: '220px', borderRadius: '56px', background: 'rgba(20,20,30,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' });
      x1.innerHTML = '<div class="stamp" style="position:static;border-color:#FF5A4E;color:#FF5A4E;background:rgba(255,255,255,.95);font-size:46px">İPTAL</div>';
      return { g, t, x1, fee, at: i < 3 ? -1 : 0.15 + (i - 3) * 0.2, kill: KILL[i] };
    });
    const ctr = el('div', 'pill', s.root, { left: px(540 - 400), width: '800px', justifyContent: 'center', top: '1280px', fontSize: '64px', fontWeight: 800, zIndex: 5, whiteSpace: 'nowrap' });
    const m = new Mascot(s.root, { w: 576, outfit: 'spy' });
    const YEAR = 1.4, SAVE = 3.8;
    s.update = (lt) => {
      showLines(hook, lt, -9, 1.9, 9);
      showLines(hunt, lt, 1.9);
      let monthly = 0;
      tiles.forEach((tl) => {
        const p = prog(lt, tl.at, 0.35);
        popIn(tl.g, p, { fromY: 120, rot: 8 });
        if (p > 0.3) monthly += tl.fee;
        const k = tl.kill ? prog(lt, tl.kill, 0.25) : 0;
        tl.x1.style.opacity = k > 0 ? 1 : 0;
        tl.x1.firstChild.style.transform = `rotate(-12deg) scale(${lerp(2.6, 1, E.out(k))})`;
        tl.t.style.filter = k > 0 ? 'grayscale(.8)' : 'none';
      });
      const yearly = stepValue(lt, [[0, 10320], [KILL[1], 8520], [KILL[3], 7080], [KILL[5], 2280]], 0.3);
      const saved = lt > SAVE;
      if (lt < YEAR) ctr.innerHTML = `Ayda <span style="color:#C0392B">${fmt(monthly)} TL</span>`;
      else if (!saved) ctr.innerHTML = `Yılda <span style="color:#C0392B">${fmt(yearly)} TL</span>`;
      else ctr.innerHTML = `<span style="color:#1F6F78">Yılda 8.040 TL cepte!</span>`;
      const pulse = lt > YEAR && lt < YEAR + 0.5 ? 1 + 0.12 * Math.sin(prog(lt, YEAR, 0.5) * Math.PI) : saved ? 1 + 0.1 * Math.sin(prog(lt, SAVE, 0.4) * Math.PI) : 1;
      ctr.style.transform = `scale(${pulse}) translateX(${lt > YEAR && lt < YEAR + 0.5 ? Math.sin(lt * 60) * 8 : 0}px)`;
      shakeRoot(s.root, shake(lt, YEAR, 20, 0.3));
      // dedektif Fıstık sağdan kayarak gelir, her vuruşta zıplar
      const enter = E.out(prog(lt, 1.9, 0.4));
      const firing = Object.values(KILL).some((t) => lt > t - 0.05 && lt < t + 0.15);
      const h = hop(lt, 0.4, saved ? 50 : 0);
      m.set(saved ? 'celebrate' : 'calm', saved ? (Math.floor(lt / 0.2) % 2 ? 'wave' : 'up') : firing ? 'up' : null, 'mood');
      m.put(lerp(1300, 860, enter), 1930 - h.y - (firing ? 20 : 0), { flip: true, sx: h.sx, sy: h.sy });
    };
  };

  /* ── 4 · "Yarın veririm" ── */
  SCENES.debtStory = (t0, o = {}) => {
    const C = 20;
    const s = scene(t0, 'var(--paper)');
    pattern(s.root);
    const hook = [
      new Line(s.root, { html: 'Arkadaşın', y: 230, size: 140, delay: -1 }),
      new Line(s.root, { html: '*borç isterken:*', y: 380, size: 112, itColor: 'var(--acc)', delay: -1 }),
    ];
    const kar = new Mascot(s.root, { who: 'karamel', w: 32 * C });
    const fis = new Mascot(s.root, { w: 32 * C });
    const b1 = bubble(s.root, { html: 'Kanka 120 TL atar mısın? <span class="it" style="font-size:1.25em;color:#1F5F96">Yarın veririm!</span>', x: 40, y: 640, w: 700, tail: 'left', size: 60 });
    const b2 = bubble(s.root, { html: 'Tabii kanka!', x: 520, y: 960, w: 480, tail: 'right', size: 60 });
    const b3 = bubble(s.root, { html: '120 TL ne oldu?', x: 400, y: 720, w: 620, tail: 'right', size: 64 });
    const b4 = bubble(s.root, { html: '<span class="it" style="font-size:1.5em">Hangi 120?</span>', x: 40, y: 1000, w: 520, tail: 'left', size: 64 });
    const coins = [0, 1, 2].map(() => pixEl(s.root, TLCOIN, TLCOIN_C, C));
    const card = el('div', 'abs it', s.root, { left: px(540 - 400), width: '800px', top: '250px', height: '220px', borderRadius: '36px', background: '#FFFDF8', boxShadow: '0 24px 50px -16px rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '120px', color: '#2A1E1A', overflow: 'hidden' });
    const cardTop = el('div', 'abs', card, { left: 0, right: 0, top: 0, height: '40px', background: '#D7372B' });
    const cardTxt = el('div', '', card, { marginTop: '30px' });
    const web = pixEl(s.root, COBWEB, COBWEB_C, C);
    const notes = [0, 1].map(() => pixEl(s.root, NOTEP, NOTEP_C, C / 2));
    const CAL = [[2.1, 'ERTESİ GÜN'], [2.55, '1 HAFTA SONRA'], [3.0, '1 AY SONRA'], [3.45, '3 AY SONRA']];
    const KX = 290, FX = 790, BOT = 1880;
    s.update = (lt) => {
      showLines(hook, lt, -9, 2.1, 9);
      talk(b1, lt, -1, 1.15);
      talk(b2, lt, 1.15, 2.0);
      talk(b3, lt, 4.0, 99);
      talk(b4, lt, 4.55, 99);
      // paralar Fıstık'tan Karamel'e uçar
      coins.forEach((c, i) => {
        const k = prog(lt, 1.35 + i * 0.15, 0.45);
        c.style.display = k > 0 && k < 1 ? 'block' : 'none';
        c.style.transform = `translate(${lerp(FX - 54, KX - 54, k)}px,${1450 - Math.sin(k * Math.PI) * 300}px) rotate(${k * 360}deg)`;
      });
      // takvim kartı
      const ci = CAL.reduce((a, [t], i) => (lt >= t ? i : a), -1);
      card.style.display = ci >= 0 ? 'flex' : 'none';
      if (ci >= 0) {
        cardTxt.textContent = CAL[ci][1];
        const f = prog(lt, CAL[ci][0], 0.18);
        card.style.transform = `scaleY(${0.3 + 0.7 * E.back(f)}) rotate(${(ci % 2 ? 2 : -2)}deg)`;
        card.style.fontSize = ci === 0 ? '120px' : '100px';
      }
      // Karamel: yalvarır → sevinir → ıslık çalıp öbür yana bakar → omuz silker
      const waiting = lt > 2.1;
      const kh = hop(lt, 0.45, lt < 1.15 ? 30 : lt < 2.1 ? 45 : 0);
      if (lt < 2.1) {
        kar.set(lt < 1.35 ? 'happy' : 'celebrate', lt < 1.35 ? 'up' : Math.floor(lt / 0.2) % 2 ? 'wave' : 'up', blink(lt));
        kar.put(KX, BOT - kh.y, { sx: kh.sx, sy: kh.sy, flip: false });
      } else if (lt < 4.55) {
        kar.set('calm', null, 'closed');
        kar.put(KX, BOT + Math.sin(lt * 6) * 4, { flip: true, rot: Math.sin(lt * 3) * 3 });
      } else {
        kar.set('happy', 'up', 'happy');
        kar.put(KX, BOT - Math.abs(Math.sin(lt * 10)) * 14, { flip: false });
      }
      notes.forEach((n, i) => {
        const k = ((lt - 2.2 + i * 0.5) % 1) / 1;
        n.style.display = waiting && lt < 4.55 ? 'block' : 'none';
        n.style.transform = `translate(${KX - 200 - k * 60 + i * 40}px,${1380 - k * 220}px)`;
        n.style.opacity = 1 - k;
      });
      // Fıstık: sevinçle verir → bekler → örümcek ağı → çarpı göz
      const age = prog(lt, 2.1, 1.6);
      fis.set(lt < 2.1 ? 'happy' : lt < 4.0 ? 'thoughtful' : 'thoughtful', lt < 1.6 && lt > 1.15 ? 'up' : null, lt < 2.1 ? blink(lt) : lt < 3.0 ? 'mood' : lt < 3.6 ? 'half' : 'x');
      fis.put(FX, BOT + age * 30, { flip: true, sy: 1 - age * 0.05 });
      fis.root.style.filter = `saturate(${1 - age * 0.6}) brightness(${1 - age * 0.12})`;
      web.style.display = lt > 3.45 ? 'block' : 'none';
      web.style.transform = `translate(${FX + 70}px,${BOT - 470}px) scale(${E.back(prog(lt, 3.45, 0.3))})`;
    };
  };

  /* ── 5 · Sınav haftası ── */
  SCENES.examStory = (t0, o = {}) => {
    const C = 24;
    const s = scene(t0, 'linear-gradient(#141A2E, #2A2F4A)');
    const stars = Array.from({ length: 26 }, () => {
      const e = el('div', 'abs', s.root, { width: '12px', height: '12px', background: '#F6EEDC' });
      return { e, x: rnd() * 1060, y: 480 + rnd() * 700, ph: rnd() * 6 };
    });
    el('div', 'abs', s.root, { left: '-200px', right: '-200px', top: '900px', height: '1100px', background: 'radial-gradient(ellipse at 50% 70%, rgba(255,214,140,.32), transparent 60%)' });
    const hook = [
      new Line(s.root, { html: 'Sınav haftası', y: 230, size: 140, color: '#FFFCF6', delay: -1 }),
      new Line(s.root, { html: '*ben:*', y: 380, size: 130, itColor: '#FFD25A', delay: -1 }),
    ];
    const mode = [
      new Line(s.root, { html: '*Sınav haftası modu*', y: 240, size: 100, itColor: '#FFD25A' }),
      new Line(s.root, { html: 'hatırlatmayı susturur.', y: 400, size: 80, color: '#FFFCF6', weight: 700 }),
    ];
    const clock = el('div', 'abs it', s.root, { left: px(540 - 200), width: '400px', top: '560px', height: '170px', borderRadius: '30px', background: '#0D111F', border: '6px solid #3A4266', color: '#FF6B5E', fontSize: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', letterSpacing: '.04em' });
    const m = new Mascot(s.root, { w: 32 * C, outfit: 'exam' });
    const desk = el('div', 'abs', s.root, { left: 0, right: 0, top: '1680px', bottom: 0, background: '#6B4A2F', borderTop: `${C}px solid #8B6240` });
    const cups = [[110, 0], [250, 0], [840, 0], [940, 0], [150, 1]].map(([x, lvl], i) => ({ e: pixEl(s.root, CUP, CUP_C, C, { left: px(x), top: px(1680 - 5 * C - lvl * 5 * C) }), t: 0.5 + i * 0.45 }));
    const nt = notifCard(s.root, { icon: 'app', app: 'CEP DEFTERİ', title: 'Bugünkü harcamalarını girdin mi?', body: 'Bir dakikanı alır; defterin açık.', top: 560 });
    const b = bubble(s.root, { html: '<span class="it" style="font-size:1.6em">Şu an değil!</span>', x: 520, y: 900, w: 520, tail: 'left', size: 64 });
    const bell = el('div', 'abs', s.root, { left: px(540 - 110), top: '600px', width: '220px', height: '220px', borderRadius: '50%', background: '#0D111F', border: '6px solid #3A4266', display: 'flex', alignItems: 'center', justifyContent: 'center' });
    bell.innerHTML = pix(BELL, BELL_C, 18) + '<div style="position:absolute;width:180px;height:16px;background:#FF5A4E;transform:rotate(-40deg);border-radius:8px"></div>';
    const NT = 3.0, MUTE = 4.1;
    s.update = (lt) => {
      showLines(hook, lt, -9, MUTE, 9);
      showLines(mode, lt, MUTE);
      stars.forEach((st) => {
        st.e.style.transform = `translate(${st.x}px,${st.y}px)`;
        st.e.style.opacity = 0.35 + 0.65 * (Math.sin(lt * 3 + st.ph) > 0.3 ? 1 : 0.3);
      });
      // saat 23:00 → 04:00
      const hrs = Math.min(5, Math.floor(prog(lt, 0.3, 2.5) * 5.999));
      clock.textContent = `${String((23 + hrs) % 24).padStart(2, '0')}:00`;
      clock.style.display = lt < NT ? 'flex' : 'none';
      cups.forEach((c) => popIn(c.e, prog(lt, c.t, 0.3), { fromY: -200 }));
      // bildirim → balon → susturma
      nt.style.display = lt >= NT && lt < MUTE ? 'flex' : 'none';
      dropIn(nt, prog(lt, NT, 0.4), prog(lt, MUTE - 0.25, 0.25));
      talk(b, lt, 3.55, MUTE + 0.6);
      bell.style.display = lt > MUTE + 0.2 ? 'flex' : 'none';
      bell.style.transform = `scale(${E.back(prog(lt, MUTE + 0.2, 0.4))}) rotate(${Math.sin(lt * 20) * (lt < MUTE + 0.7 ? 8 : 0)}deg)`;
      // Fıstık: çalışır → uykusu gelir → irkilir → sinirlenir → rahatlar
      let mood = 'thoughtful', eyes = 'mood', rot = 0, dy = 0;
      if (lt < 1.0) eyes = 'mood';
      else if (lt < 2.0) eyes = 'half';
      else if (lt < NT) { eyes = 'closed'; rot = Math.sin(lt * 4) * 6; dy = 12 + Math.sin(lt * 4) * 8; }
      else if (lt < 3.5) { mood = 'curious'; eyes = 'wide'; dy = -Math.sin(prog(lt, NT, 0.35) * Math.PI) * 70; }
      else if (lt < MUTE) { mood = 'thoughtful'; eyes = 'squeeze'; rot = Math.sin(lt * 40) * 2; }
      else { mood = 'happy'; eyes = 'closed'; dy = -Math.abs(Math.sin(lt * 8)) * 10; }
      m.set(mood, null, eyes);
      m.put(540, 1760 + dy, { rot });
      shakeRoot(s.root, shake(lt, NT, 22, 0.3));
    };
  };
}
