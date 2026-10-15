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

/** Dikkat dağıtmayan arka plan canlılığı: dönen ışık hüzmeleri, süzülen soluk pikseller, patlama kıvılcımları */
function ambient(root, o = {}) {
  const cx = o.cx ?? 540, cy = o.cy ?? 1010;
  const rays = el('div', 'abs', root, { left: px(cx - 900), top: px(cy - 900), width: '1800px', height: '1800px', borderRadius: '50%', background: `repeating-conic-gradient(${o.ray || 'rgba(255,255,255,.55)'} 0 9deg, transparent 9deg 22deg)`, WebkitMaskImage: 'radial-gradient(circle, #000 18%, transparent 62%)', maskImage: 'radial-gradient(circle, #000 18%, transparent 62%)' });
  const glow = el('div', 'abs', root, { left: px(cx - 520), top: px(cy - 520), width: '1040px', height: '1040px', borderRadius: '50%', background: `radial-gradient(circle, ${o.glow || 'rgba(255,214,150,.55)'}, transparent 65%)` });
  const fl = Array.from({ length: 9 }, (_, i) => {
    const e = i % 3 === 0 ? pixEl(root, PTAG, PTAG_C, 10) : pixEl(root, TLCOIN, TLCOIN_C, 10);
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
      l2.style.transform = `scale(${lerp(2.2, 1, E.out(bp))}) rotate(${(1 - E.out(bp)) * -8 + Math.sin(lt * 3) * 1.2}deg)`;
      // Pamuk: kafa kaşır (salak), sonra aydınlanır
      const got = lt > B + 0.3;
      p.set(got ? 'celebrate' : 'thoughtful', got ? 'up' : 'face', got ? 'happy' : (Math.floor(lt / 0.9) % 2 ? 'half' : 'mood'));
      const h = got ? hop(lt, 0.45, 40) : { y: 0, sx: 1, sy: 1 };
      p.put(720, (o.floor ?? 1990) - h.y, { rot: got ? 0 : -10 + Math.sin(lt * 8) * 4, sx: h.sx, sy: h.sy });
      bm.set(got ? 'happy' : 'curious', got ? 'wave' : null, blink(lt));
      bm.put(260, (o.floor ?? 1990) - (got ? hop(lt + 0.2, 0.5, 20).y : 0), {});
      hp.style.display = 'none';
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
    gap.innerHTML = `<div style="font-size:46px;font-weight:800;color:#F3EEE2">${o.gapLabel || 'Küçük → Büyük'}</div><div class="it" style="font-size:130px;color:#FF8A5B;line-height:1">+${P[2] - P[0]} TL</div><div style="height:10px;margin:10px 30px 0;background:#FF8A5B;border-radius:5px"></div>`;
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
        b.put(230 - (1 - bp) * 500, (o.floor ?? 1990) - hop(lt, 0.8, 14).y, {});
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
    wal.innerHTML = `<div class="w" style="margin-top:60px">${pix(WALLET_O, WALLET_COL, 26)}</div><div style="font-size:52px;font-weight:800;color:#6e5f55;margin-top:10px">CÜZDAN</div><div class="wv it" style="font-size:180px;line-height:1">?</div>`;
    const wv = wal.querySelector('.wv'), ww = wal.querySelector('.w');
    const coins = Array.from({ length: 8 }, () => pixEl(s.root, TLCOIN, TLCOIN_C, 16));
    const think = el('div', 'abs', s.root, { left: o.thinkX ?? '20px', top: o.thinkY ?? '1330px', background: '#fff', border: '7px solid #2A1E1A', borderRadius: '40px', padding: '10px 34px 16px', zIndex: 4, display: 'none', transformOrigin: '80% 100%' });
    think.innerHTML = `<span style="font-size:48px;font-weight:800;color:#6e5f55">Pamuk sanıyor ki:</span><br><span class="it" style="font-size:104px;color:#2F8F5A">+1.000 TL</span><br><span style="font-size:58px;font-weight:800">kazandım!</span>`;
    const timer = el('div', 'abs it', s.root, { left: '820px', top: '540px', width: '170px', height: '170px', borderRadius: '50%', background: '#4351A3', color: '#fff', fontSize: '130px', display: 'none', alignItems: 'center', justifyContent: 'center', zIndex: 4 });
    const m = new Mascot(s.root, { who: 'pamuk', w: 576, outfit: 'winter' });
    s.update = (lt) => {
      amb(lt, [ev('sale'), ev('reveal')].reduce((a, t) => (lt >= t ? t : a), -9));
      const W = lt >= ev('wallet');
      const out = E.inOut(prog(lt, ev('wallet') - 0.3, 0.3));
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
      const wp = E.back(prog(lt, ev('wallet'), 0.4));
      wal.style.display = W ? 'block' : 'none';
      wal.style.transform = `scale(${wp})`;
      const R = lt >= ev('reveal');
      if (R) { wv.textContent = '-1.000 TL'; wv.style.color = '#C0392B'; }
      else { wv.textContent = '?'; wv.style.color = 'var(--ink)'; }
      wv.style.transform = R ? `scale(${lerp(2.2, 1, E.out(prog(lt, ev('reveal'), 0.25)))})` : 'none';
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
}
