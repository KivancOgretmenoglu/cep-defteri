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
    s.update = (lt) => {
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
        const sl = E.out(prog(k, 0, 0.3));
        it.card.style.transform = `translateX(${(1 - sl) * 900}px) rotate(${(1 - sl) * 6}deg)`;
        it.rows.forEach((r, j) => {
          const p = prog(k, 0.9 + j * 0.45, 0.3);
          r.style.opacity = p;
          r.style.transform = `translateY(${(1 - E.out(p)) * 20}px)`;
        });
        if (it.big) {
          const a = 0.9 + it.rows.length * 0.45;
          it.big.style.opacity = prog(k, a, 0.15);
          it.big.innerHTML = it.bigTo != null ? countText(it.bigTpl, k, a, 0.7, it.bigTo) : it.bigTpl;
          it.big.style.transform = `scale(${1 + 0.12 * Math.sin(prog(k, a + 0.7, 0.3) * Math.PI)})`;
        }
        if (it.m) {
          const M = it.mascot;
          const pop = E.back(prog(k, 0.35, 0.4));
          const late = k > (M.cheerAt ?? 2.6);
          const h = hop(k, 0.6, late ? 26 : 0);
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
    s.update = (lt) => {
      btn.style.transform = `scale(${1 + 0.035 * Math.sin(lt * 8)})`;
      const reach = Math.sin(lt * 3.2);
      m.set('thoughtful', reach > 0.3 ? 'up' : null, lt % 1.4 < 0.12 ? 'closed' : 'wide');
      m.put(540, 1960 - Math.max(0, reach) * 40, { rot: Math.sin(lt * 30) * 1 });
      const sk = (lt % 0.8) / 0.8;
      sweat.style.transform = `translate(720px,${1460 + sk * 80}px)`;
      sweat.style.opacity = 1 - sk * 0.6;
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
