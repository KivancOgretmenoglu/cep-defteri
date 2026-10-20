/* "Organik" reels sahneleri: reklam gibi değil, bir kişinin paylaştığı içerik gibi.
 * Instagram yazı kutusu (hook), otomatik altyazı, elde çekim titremesi, grup sohbeti,
 * konuşan kafa Fıstık, telefon ekranı adımları ve logosuz kapanış.
 * Yazı kutuları ve altyazılar reels düzeyinde (reels.json: boxes, captions), sahnelerin üstünde çizilir. */

/* ───────── yazı kutusu ve altyazı katmanı ───────── */
let OVL = null;
function setupOverlays(reel) {
  const layer = el('div', 'abs', stage, { inset: 0, zIndex: 40, pointerEvents: 'none' });
  // [başlangıç, bitiş, html, y, {size: yazı px, pulse: hafif nabız, dim: [a, b] arasında soluk, dimTo: soluk opaklık (0,4)}]
  const boxes = (reel.boxes || []).map(([a, b, html, y = 250, o = {}]) => {
    const e = el('div', 'abs', layer, { left: '50px', right: '50px', top: px(y), textAlign: 'center', lineHeight: 1.5, transformOrigin: '50% 50%' });
    e.innerHTML = `<span class="igbox"${o.size ? ` style="font-size:${o.size}px;padding:4px ${Math.round(o.size * 0.33)}px;border-radius:${Math.round(o.size * 0.28)}px"` : ''}>${html}</span>`;
    return { a, b, e, pulse: !!o.pulse, dim: o.dim, dimTo: o.dimTo ?? 0.4 };
  });
  const caps = (reel.captions || []).map(([a, b, text, y = 1430, times]) => {
    const e = el('div', 'abs cap' + (reel.captionPixel ? ' it' : ''), layer, { left: '70px', right: '70px', top: px(y), textAlign: 'center' });
    const words = text.split(' ').map((w) => { const s = el('span', 'w', e); s.textContent = w + ' '; return s; });
    return { a, b, e, words, times, step: capStep(a, b, words.length) };
  });
  OVL = { boxes, caps, cut: reel.captionCut || [] };  // cut: altyazının susacağı aralıklar (ör. geri sayım)
}
/** Altyazıda sözcük aralığı (audio.py'deki cap_step ile aynı) */
const capStep = (a, b, n) => Math.min(0.2, ((b - a) * 0.72) / n);

function updateOverlays(t) {
  if (!OVL) return;
  OVL.boxes.forEach(({ a, b, e, pulse, dim, dimTo }) => {
    const on = t >= a && t < b;
    e.style.display = on ? 'block' : 'none';
    if (!on) return;
    // videonun başındaki kutu ilk karede hazır olmalı (kapak + hook)
    const k = a <= 0 ? 1 : E.back(prog(t, a, 0.28));
    const fade = dim ? 1 - (1 - dimTo) * Math.min(prog(t, dim[0], 0.3), 1 - prog(t, dim[1] - 0.2, 0.2)) : 1;
    e.style.opacity = (a <= 0 ? 1 : clamp(prog(t, a, 0.08) * 1.5)) * fade;
    const p = pulse ? 1 + 0.025 * Math.sin(t * 9) : 1;
    e.style.transform = `scale(${(0.85 + 0.15 * k) * p}) rotate(${pulse ? Math.sin(t * 4.5) * 1.2 : 0}deg)`;
  });
  const hush = OVL.cut.some(([x, y]) => t >= x && t < y);
  OVL.caps.forEach(({ a, b, e, words, step, times }) => {
    const on = t >= a && t < b && !hush;
    e.style.display = on ? 'block' : 'none';
    if (!on) return;
    // seslendirme varsa her kelime gerçek söylenme anında belirir; yoksa sabit adımla
    const n = times ? times.filter((x) => t >= x).length : Math.floor((t - a) / step) + 1;
    words.forEach((w, i) => {
      w.style.display = i < n ? 'inline' : 'none';
      const fresh = times ? t < (times[i] ?? 0) + 0.25 : t < a + words.length * step + 0.25;
      w.style.color = i === n - 1 && fresh ? '#FFD25A' : '#FFFFFF';
    });
  });
}
/** Elde çekim: yavaş, düzensiz titreme */
function handheld(t) {
  const x = 7 * Math.sin(t * 1.3) + 3 * Math.sin(t * 2.9 + 1.7);
  const y = 6 * Math.sin(t * 1.1 + 0.6) + 2.5 * Math.sin(t * 3.7);
  const r = 0.35 * Math.sin(t * 0.9) + 0.15 * Math.sin(t * 2.3);
  stage.style.transform = `translate(${x}px,${y}px) rotate(${r}deg) scale(1.03)`;
}

/** Maskotun başından avatar (kare, kırpılmış) */
function avatarSVG(who, size) {
  const rs = SP[`${who}|calm|null|mood`];
  const body = rs.map(([x, y, w, h, f]) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${f}"/>`).join('');
  return `<svg viewBox="7 3 20 17" width="${size}" height="${size}" shape-rendering="crispEdges" preserveAspectRatio="xMidYMid slice">${body}</svg>`;
}

function defineNative() {
  /* ── Telefon ekranı adımları (ekran kaydı gibi) ── */
  SCENES.pov = (t0, o = {}) => {
    const s = scene(t0, o.bg || 'var(--paper)', o.wipe || [540, 1300], o.wdur ?? 0.35);
    pattern(s.root, o.dot || 'rgba(0,0,0,.07)');
    const W = o.w || 700, X = 540 - W / 2, TOP = o.top ?? 560;
    const ph = new Phone(s.root, { w: W, x: X, top: TOP });
    const steps = (o.steps || []).map((st) => {
      const box = el('div', 'abs', ph.screen, { inset: 0, overflow: 'hidden', background: '#FFFCF6' });
      const out = { ...st, box };
      if (st.img) { const i = el('img', '', box); i.src = st.img; }
      if (st.scroll) {
        out.sImg = el('img', '', box); out.sImg.src = st.scroll.src;
        if (st.scroll.nav) {
          el('div', 'abs', box, { left: 0, right: 0, bottom: 0, height: px(84 * ph.scale), background: '#FFFCF6' });
          const n = el('img', '', box, { top: 'auto', bottom: 0 }); n.src = st.scroll.nav;
        }
      }
      if (st.seq) out.seqEls = st.seq.map(([t, src]) => { const i = el('img', '', box); i.src = src; return [t, i]; });
      return out;
    });
    const taps = (o.taps || []).map((tp) => ({ ...tp, e: el('div', 'tap', ph.screen) }));
    const chips = (o.chips || []).map((c) => ({ ...c, e: chipEl(s.root, c.html, { left: px(c.x ?? 40), top: px(c.y), zIndex: 5, ...(c.style || {}) }) }));
    let sw = null;
    if (o.stopwatch) {
      sw = el('div', 'pill', s.root, { left: px(X + W - 300), top: px(TOP - 40), width: '300px', justifyContent: 'center', color: 'var(--acc)', zIndex: 6 });
      el('span', 'dot', sw, { background: 'var(--acc)' });
      sw.t = el('span', '', sw);
    }
    const M = o.mascot;
    const m = M ? new Mascot(s.root, { who: M.who || 'fistik', w: M.w || 448, outfit: M.outfit || null }) : null;
    const conf = o.confetti ? new Burst(s.root, { n: 30, t0: o.confetti.t, ox: o.confetti.x ?? 540, oy: o.confetti.y ?? 1100, colors: ['#AE4716', '#FFE08A', '#2F8F9D', '#F8DCC8', '#fff'], speed: 1100, grav: 1700, life: 2.2, size: [14, 14] }) : null;
    s.update = (lt) => {
      const rise = o.rise ? E.out(prog(lt, 0, 0.5)) : 1;
      ph.pos(X, TOP + (1 - rise) * 1200, (o.tilt ?? -2) + Math.sin(lt * 1.2) * 0.8);
      let idx = 0;
      steps.forEach((st, i) => { if (lt >= (st.t ?? 0)) idx = i; });
      steps.forEach((st, i) => {
        const k = E.out(prog(lt, steps[idx].t ?? 0, 0.28));
        const vis = i === idx || (i === idx - 1 && k < 1);
        st.box.style.display = vis ? 'block' : 'none';
        st.box.style.transform = i === idx ? (idx > 0 ? `translateX(${(1 - k) * 100}%)` : 'none') : `translateX(${-k * 100}%)`;
        if (st.sImg) st.sImg.style.transform = `translateY(${-lerp(st.scroll.from || 0, st.scroll.to || 0, E.inOut(prog(lt, (st.t ?? 0) + 0.25, st.scroll.dur || 1.6))) * ph.scale}px)`;
        if (st.seqEls) st.seqEls.forEach(([t, img], j) => { img.style.opacity = lt >= t ? 1 : 0; img.style.zIndex = j; });
      });
      taps.forEach((tp) => tapAt(tp.e, lt, tp.t, ph.sw * tp.fx, ph.sh * tp.fy));
      chips.forEach((c) => {
        c.e.style.display = c.until != null && lt >= c.until ? 'none' : 'flex';
        popIn(c.e, prog(lt, c.t, 0.45), { fromX: c.from ?? -260, fromY: 0, rot: c.rot ?? -4 });
      });
      if (sw) {
        const [a, b, v, from = -9] = o.stopwatch;
        sw.style.display = lt >= from ? 'flex' : 'none';
        const secs = lt < a ? 0 : lt < b ? ((lt - a) / (b - a)) * v : v;
        sw.t.textContent = secs.toFixed(1).replace('.', ',') + ' sn';
        sw.style.transform = `scale(${lt > b ? 1 + 0.15 * Math.sin(prog(lt, b, 0.4) * Math.PI) : 1})`;
      }
      if (m) {
        const dance = M.dance && lt >= M.dance[0] && lt < M.dance[1];
        const cheer = M.cheer != null && lt >= M.cheer;
        const h = hop(lt, dance ? 0.42 : 0.7, dance ? 55 : cheer ? 26 : 0);
        const beat = Math.floor(lt / 0.42);
        m.set(dance || cheer ? 'celebrate' : M.mood || 'happy', dance ? (beat % 2 ? 'up' : 'wave') : cheer ? (Math.floor(lt / 0.2) % 2 ? 'wave' : 'up') : null, blink(lt));
        const enter = M.enter != null ? E.back(prog(lt, M.enter, 0.45)) : 1;
        m.put(M.x ?? 230, (M.bottom ?? 1910) + (1 - enter) * 600 - h.y, { sx: h.sx, sy: h.sy, flip: dance ? beat % 2 === 1 : !!M.flip, rot: dance ? (beat % 2 ? 7 : -7) : 0 });
      }
      if (conf) conf.update(lt);
    };
  };

  /* ── Grup sohbeti ── */
  SCENES.chat = (t0, o = {}) => {
    const s = scene(t0, '#E6DDD1');
    pattern(s.root, 'rgba(0,0,0,.05)');
    const P = { left: 36, right: 36, top: o.top ?? 430, bottom: 1880 };
    const panel = el('div', 'abs', s.root, { left: px(P.left), right: px(P.right), top: px(P.top), bottom: '300px', borderRadius: '52px', background: '#F4EEE6', overflow: 'hidden', boxShadow: '0 30px 80px -20px rgba(0,0,0,.35)' });
    const head = el('div', 'abs', panel, { left: 0, right: 0, top: 0, height: '150px', background: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '22px', padding: '0 36px', borderBottom: '2px solid #E8DFD3', zIndex: 2 });
    const people = o.people || {};
    const av = el('div', '', head, { display: 'flex' });
    Object.values(people).slice(0, 3).forEach((p, i) => {
      const a = el('div', '', av, { width: '84px', height: '84px', borderRadius: '50%', overflow: 'hidden', background: p.bg || '#F8DCC8', border: '4px solid #fff', marginLeft: i ? '-26px' : 0 });
      a.innerHTML = avatarSVG(p.who, 84);
    });
    const ttl = el('div', '', head);
    ttl.innerHTML = `<div style="font-size:44px;font-weight:800;letter-spacing:-.02em">${o.title || 'Grup'}</div><div style="font-size:30px;color:#8a7d72;font-weight:500">${o.subtitle || ''}</div>`;
    const list = el('div', 'abs', panel, { left: '28px', right: '28px', top: '160px', bottom: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '14px', overflow: 'hidden' });
    const msgs = (o.messages || []).map(([t, who, text]) => {
      const me = who === 'me';
      const p = people[who] || {};
      const row = el('div', '', list, { display: 'flex', alignItems: 'flex-end', gap: '14px', justifyContent: me ? 'flex-end' : 'flex-start', flex: 'none' });
      if (!me) { const a = el('div', '', row, { width: '72px', height: '72px', borderRadius: '50%', overflow: 'hidden', background: p.bg || '#F8DCC8', flex: 'none' }); a.innerHTML = avatarSVG(p.who, 72); }
      const b = el('div', '', row, { maxWidth: '700px', padding: '18px 28px', borderRadius: me ? '36px 36px 10px 36px' : '36px 36px 36px 10px', background: me ? '#AE4716' : '#FFFFFF', color: me ? '#fff' : '#2A1E1A', fontSize: px(o.font || 42), fontWeight: 500, lineHeight: 1.2, boxShadow: '0 4px 10px rgba(0,0,0,.06)', transformOrigin: me ? '100% 100%' : '0% 100%' });
      b.innerHTML = (me ? '' : `<div style="font-size:30px;font-weight:800;color:${p.color || '#AE4716'};margin-bottom:2px">${p.name || who}</div>`) + text;
      return { t, row, b };
    });
    const typing = o.typing ? (() => {
      const row = el('div', '', list, { display: 'flex', justifyContent: o.typing[2] === 'me' ? 'flex-end' : 'flex-start', flex: 'none' });
      const b = el('div', '', row, { padding: '22px 30px', borderRadius: '36px', background: o.typing[2] === 'me' ? '#C9774F' : '#FFFFFF', display: 'flex', gap: '12px' });
      const dots = [0, 1, 2].map(() => el('div', '', b, { width: '18px', height: '18px', borderRadius: '50%', background: '#fff' }));
      return { row, dots, a: o.typing[0], b: o.typing[1] };
    })() : null;
    s.update = (lt) => {
      msgs.forEach((mm) => {
        const on = lt >= mm.t;
        mm.row.style.display = on ? 'flex' : 'none';
        const k = prog(lt, mm.t, 0.22);
        mm.b.style.transform = `scale(${0.6 + 0.4 * E.back(k)})`;
        mm.b.style.opacity = clamp(k * 3);
      });
      if (typing) {
        const on = lt >= typing.a && lt < typing.b;
        typing.row.style.display = on ? 'flex' : 'none';
        typing.dots.forEach((d, i) => (d.style.transform = `translateY(${-Math.max(0, Math.sin(lt * 9 - i * 0.8)) * 10}px)`));
        if (typing.row.parentNode.lastChild !== typing.row && on) typing.row.parentNode.appendChild(typing.row);
      }
    };
  };

  /* ── Konuşan kafa Fıstık ── */
  SCENES.talk = (t0, o = {}) => {
    const s = scene(t0, o.bg || 'var(--soft)', o.wipe || [540, 1200], o.wdur ?? 0.35);
    el('div', 'abs', s.root, { inset: 0, background: 'radial-gradient(circle at 50% 62%, rgba(255,255,255,.55), transparent 55%)' });
    pattern(s.root, 'rgba(174,71,22,.08)');
    const m = new Mascot(s.root, { w: o.w || 960, outfit: o.outfit || null });
    const talking = (o.talk || []).map(([a, b]) => [a, b]);
    s.update = (lt) => {
      const tl = (o.poses || [[0, 'happy', null, 'mood']]).reduce((acc, p) => (lt >= p[0] ? p : acc));
      const isTalking = talking.some(([a, b]) => lt >= a && lt < b);
      const nod = isTalking ? Math.abs(Math.sin(lt * 15)) : 0;
      const shake = (o.shake || []).some(([a, b]) => lt >= a && lt < b);
      const eyes = tl[3] === 'mood' ? blink(lt) : tl[3];
      m.set(tl[1], tl[2], eyes);
      m.put(540, (o.bottom ?? 1880) - nod * 10, { sy: 1 + nod * 0.025, sx: 1 - nod * 0.012, flip: shake ? Math.floor(lt / 0.12) % 2 === 1 : false, rot: shake ? 0 : Math.sin(lt * 1.7) * 1.5 });
    };
  };

  /* ── Beş maskot sıra hâlinde ── */
  SCENES.lineup = (t0, o = {}) => {
    const s = scene(t0, o.bg || 'var(--paper)', o.wipe || [540, 1300], o.wdur ?? 0.35);
    pattern(s.root);
    const keys = ['bilge', 'ceviz', 'fistik', 'pamuk', 'diken', 'karamel'];
    const two = o.rows === 2;  // iki sıra: daha büyük maskotlar
    const xs = two ? [200, 540, 880, 200, 540, 880] : [130, 294, 458, 622, 786, 950];
    const bots = two ? [1090, 1060, 1090, 1530, 1500, 1530] : [1470, 1415, 1385, 1385, 1415, 1470];
    const ms = keys.map((k) => new Mascot(s.root, { who: k, w: two ? 384 : 288 }));
    const note = o.note ? el('div', 'pill', s.root, { left: '50%', top: px(o.noteY ?? 640), transform: 'translateX(-50%)', fontSize: '40px', color: 'var(--acc)', whiteSpace: 'nowrap' }) : null;
    if (note) note.textContent = o.note;
    s.update = (lt) => {
      ms.forEach((m, i) => {
        const t = 0.1 + i * 0.14;
        const p = E.back(prog(lt, t, 0.35));
        const h = hop(lt, 0.6, lt > t + 0.3 ? 40 : 0, i * 0.12);
        m.set('happy', lt > t + 0.3 ? (Math.floor(lt / 0.22 + i) % 2 ? 'wave' : 'up') : null, blink(lt, i * 0.3));
        m.put(xs[i], bots[i] + (1 - p) * 700 - h.y, { sx: h.sx, sy: h.sy, flip: two ? i % 3 === 2 : i > 2 });
      });
      if (note) note.style.opacity = prog(lt, 0.9, 0.3);
    };
  };

  /* ── Logosuz kapanış: Fıstık (ve arkadaşı) + kullanıcı adı ── */
  SCENES.end = (t0, o = {}) => {
    const s = scene(t0, o.bg || 'var(--soft)', o.wipe || [540, 1300], o.wdur ?? 0.35);
    pattern(s.root, 'rgba(174,71,22,.08)');
    const handle = el('div', 'pill', s.root, { left: px(540 - 200), width: '400px', justifyContent: 'center', top: px(o.handleY ?? 640), fontSize: '42px', fontWeight: 800, color: 'var(--acc)' });
    handle.textContent = '@cep_defteri';
    const note = o.note ? el('div', 'abs', s.root, { left: '80px', right: '80px', top: px((o.handleY ?? 640) + 110), textAlign: 'center', fontSize: '36px', fontWeight: 600, color: '#6e5f55' }) : null;
    if (note) note.textContent = o.note;
    const m = new Mascot(s.root, { w: o.w || 768, outfit: o.outfit || null });
    const fr = o.friend ? new Mascot(s.root, { who: o.friend, w: 576 }) : null;
    s.update = (lt) => {
      handle.style.opacity = prog(lt, 0.5, 0.3);
      if (note) note.style.opacity = prog(lt, 0.8, 0.3);
      const h = hop(lt, 0.7, 30);
      m.set('celebrate', Math.floor(lt / 0.2) % 2 ? 'wave' : 'wave2', blink(lt));
      m.put(fr ? 700 : 540, 1900 - h.y + (1 - E.back(prog(lt, 0, 0.4))) * 500, { sx: h.sx, sy: h.sy, flip: !!fr });
      if (fr) {
        fr.set('happy', null, 'closed');
        fr.put(260, 1900 + Math.sin(lt * 6) * 4 + (1 - E.back(prog(lt, 0.15, 0.4))) * 500, { rot: Math.sin(lt * 3) * 3 });
      }
    };
  };
}
