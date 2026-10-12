/* Faydalı bilgi reelsleri: hook görselleri ve bilgi kartları. */

/** "12.000" gibi Türkçe biçimli sayıyı sayar; metindeki {n} yerine konur */
function countText(tpl, lt, a, d, to) {
  const v = E.out(prog(lt, a, d)) * to;
  return tpl.replace('{n}', fmt(v));
}

function defineValue() {
  /* ── Bilgi kartları: her kart bir ipucu ── */
  SCENES.cards = (t0, o = {}) => {
    const s = scene(t0, o.bg || 'var(--paper)', o.wipe || [540, 1200], o.wdur ?? 0.3);
    const bg = el('div', 'abs', s.root, { inset: 0 });
    pattern(s.root, 'rgba(0,0,0,.05)');
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
        if (it.big) big = el('div', 'it', ex, { fontSize: px(it.bigSize || 140), color: it.color || 'var(--acc)', marginTop: '10px', lineHeight: 1 });
      }
      const m = it.mascot ? new Mascot(s.root, { who: it.mascot.who || 'fistik', w: it.mascot.w || 576, outfit: it.mascot.outfit || null }) : null;
      return { ...it, bigTpl: it.big, card, rows, big, m };
    });
    const counter = el('div', 'pill', s.root, { right: '56px', top: '130px', fontSize: '38px', color: '#6e5f55', zIndex: 3 });
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
      items.forEach((it, i) => {
        const on = i === idx;
        it.card.style.display = on ? 'block' : 'none';
        if (it.m) it.m.root.style.display = on ? 'block' : 'none';
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
          it.big.innerHTML = it.bigTo != null ? countText(it.bigTpl, k, a, CD, it.bigTo) : it.bigTpl;
          const hitK = prog(k, a + CD, 0.3);  // sayı yerine oturunca çarpar
          it.big.style.transform = FAST ? `scale(${1 + 0.3 * Math.sin(hitK * Math.PI)}) rotate(${Math.sin(hitK * Math.PI) * -4}deg)` : `scale(${1 + 0.12 * Math.sin(prog(k, a + CD, 0.3) * Math.PI)})`;
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
}
