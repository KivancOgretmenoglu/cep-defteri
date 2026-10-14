/* Faydalı bilgi reelsleri: hook görselleri ve bilgi kartları. */

/** "12.000" gibi Türkçe biçimli sayıyı sayar; metindeki {n} yerine konur */
function countText(tpl, lt, a, d, to, dec = 0) {
  const v = E.out(prog(lt, a, d)) * to;
  return tpl.replace('{n}', dec ? v.toFixed(dec).replace('.', ',') : fmt(v));
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
      const e = el('div', 'abs', s.root, { left: px(x), top: '600px', width: '420px', borderRadius: '40px', background: '#fff', padding: '40px 30px 46px', textAlign: 'center', boxShadow: '0 30px 60px -20px rgba(40,20,10,.45)', border: `8px solid ${c}` });
      e.innerHTML = `<div style="font-size:44px;font-weight:800;color:${c};letter-spacing:.04em">${head}</div><div class="it" style="font-size:130px;line-height:1;margin-top:14px">${val}</div><div style="font-size:40px;font-weight:700;color:#6e5f55;margin-top:6px">${sub}</div>`;
      return e;
    };
    const a = tag(60, 'PEŞİN', o.cash || '12.000', 'TL, bugün', '#AE4716');
    const b = tag(600, 'TAKSİT', o.inst || '6 × 2.000', 'TL, 6 ayda', '#2F8F5A');
    const sign = el('div', 'abs it', s.root, { left: '540px', top: '700px', fontSize: '200px', color: '#2A1E1A', zIndex: 3 });
    const crown = el('div', 'abs pill', s.root, { left: '810px', top: '470px', fontSize: '44px', color: '#2F8F5A', whiteSpace: 'nowrap', zIndex: 4 });
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
    const calc = el('div', 'abs', s.root, { left: '130px', right: '130px', top: '520px', borderRadius: '56px', background: '#2A2F45', padding: '44px', boxShadow: '0 40px 90px -30px rgba(20,25,60,.6)' });
    const scr = el('div', 'it', calc, { borderRadius: '28px', background: '#C9D8B6', color: '#1E2A16', fontSize: '128px', textAlign: 'right', padding: '24px 36px', lineHeight: 1, whiteSpace: 'nowrap' });
    const keys = el('div', '', calc, { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '22px', marginTop: '34px' });
    '789÷456×123−0%=+'.split('').forEach((k) => { const e = el('div', 'it', keys, { height: '100px', borderRadius: '24px', background: '=+−×÷%'.includes(k) ? '#4351A3' : '#454B66', color: '#fff', fontSize: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }); e.textContent = k; });
    const stamp = el('div', 'abs it', s.root, { left: '50%', top: '860px', fontSize: '210px', color: '#E8322A', textShadow: '0 10px 0 #7A1410', zIndex: 6, whiteSpace: 'nowrap' });
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
}
