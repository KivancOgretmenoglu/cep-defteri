/* Yaratıcı hook sahneleri: korku filmi, yarışma programı, kişilik testi. */

const MASCOTS6 = [
  ['fistik', 'Fıstık', 'sokak kedisi'],
  ['bilge', 'Bilge', 'baykuş'],
  ['ceviz', 'Ceviz', 'sincap'],
  ['diken', 'Diken', 'kirpi'],
  ['karamel', 'Karamel', 'sokak köpeği'],
  ['pamuk', 'Pamuk', 'tavşan'],
];

function defineHooks() {
  /* ── "Banka uygulamasını açmadan önceki 3 saniye" ── */
  SCENES.dread = (t0, o = {}) => {
    const SCARE = o.scare ?? 3.3;
    const s = scene(t0, '#07080D');
    const cam = el('div', 'abs', s.root, { inset: 0, transformOrigin: '50% 48%' });
    const glow = el('div', 'abs', cam, { left: '-200px', right: '-200px', top: '500px', height: '1600px', background: 'radial-gradient(ellipse at 50% 70%, rgba(90,150,255,.5), rgba(40,70,160,.14) 45%, transparent 70%)' });
    const num = el('div', 'abs it', cam, { left: 0, right: 0, top: '520px', textAlign: 'center', fontSize: '420px', color: '#E8EEFF', textShadow: '0 0 70px rgba(120,170,255,.85)' });
    const m = new Mascot(cam, { w: 960 });
    const tint = el('div', 'abs', cam, { inset: 0, background: 'radial-gradient(ellipse at 50% 85%, rgba(80,130,255,.42), transparent 55%)', mixBlendMode: 'multiply' });
    const sweat = pixEl(cam, SWEAT, SWEAT_C, 30);
    const bank = el('div', 'abs', s.root, { left: '90px', right: '90px', top: '640px', borderRadius: '56px', background: 'linear-gradient(#1B2340,#121729)', color: '#fff', padding: '64px 60px', boxShadow: '0 40px 90px rgba(0,0,0,.6)', display: 'none' });
    bank.innerHTML = '<div style="font-size:42px;color:#9AA6C8;font-weight:700">Vadesiz hesap</div><div style="font-size:38px;color:#9AA6C8;margin-top:70px">Kullanılabilir bakiye</div><div style="font-size:156px;font-weight:800;letter-spacing:-.04em;color:#FF5A4E;line-height:1.1">47,20 TL</div>';
    const flashL = el('div', 'abs', s.root, { inset: 0, background: '#fff', opacity: 0 });
    s.update = (lt) => {
      const scared = lt >= SCARE;
      const n = lt < 1 ? 3 : lt < 2 ? 2 : 1;
      num.style.display = scared ? 'none' : 'block';
      num.textContent = n;
      const pk = (lt % 1) / 1;
      num.style.transform = `scale(${1.25 - 0.25 * E.out(Math.min(1, pk * 3))})`;
      num.style.opacity = 0.35 + 0.65 * (1 - pk * 0.5);
      // kamera yavaşça yaklaşır; korku anında sarsılır
      const push = 1 + 0.14 * E.inOut(prog(lt, 0, SCARE));
      const sh = shake(lt, SCARE, 34, 0.45), shy = shake(lt + 0.3, SCARE, 24, 0.45);
      cam.style.transform = `translate(${sh}px,${shy}px) scale(${scared ? 1.05 : push})`;
      glow.style.opacity = scared ? 0.35 : 0.8 + 0.2 * Math.sin(lt * 9);
      // Fıstık: titrer, gözleri kocaman, 1–2 arası patileriyle yüzünü kapatır
      const trem = scared ? 0 : Math.sin(lt * 45) * 1.4;
      if (!scared) m.set('thoughtful', lt >= 1.0 && lt < 2.0 ? 'face' : null, 'wide');
      else m.set('thoughtful', null, 'x');
      const fall = E.out(prog(lt, SCARE, 0.35));
      m.put(540 + trem * 2, 1960 + fall * 120, { rot: trem + fall * -6, sy: 1 - fall * 0.05 });
      m.root.style.filter = 'brightness(.82) saturate(.8)';
      sweat.style.display = scared ? 'none' : 'block';
      const sk = (lt % 0.9) / 0.9;
      sweat.style.transform = `translate(780px,${1180 + sk * 120}px)`;
      sweat.style.opacity = 1 - sk * 0.6;
      // banka ekranı çarpar
      bank.style.display = scared ? 'block' : 'none';
      const bk = E.back(prog(lt, SCARE, 0.3));
      bank.style.transform = `scale(${lerp(1.5, 1, bk)}) rotate(${(1 - bk) * -4 + Math.sin(lt * 30) * (lt < SCARE + 0.5 ? 1 : 0)}deg)`;
      flashL.style.opacity = scared ? Math.max(0, 1 - (lt - SCARE) / 0.15) * 0.85 : 0;
    };
  };

  /* ── Yarışma programı: "Günde 1 kahve. Yılda kaç lira?" ── */
  SCENES.coffeeQuiz = (t0, o = {}) => {
    const REVEAL = o.reveal ?? 3.0, FAINT = REVEAL + 0.45, UP = o.up ?? 5.2;
    const PRICE = o.price ?? 65;
    const s = scene(t0, 'radial-gradient(ellipse at 50% 40%, #4A2A7A, #1E1033 70%)');
    const spots = [0, 1].map((i) => el('div', 'abs', s.root, { left: i ? '540px' : '-540px', top: '-300px', width: '1080px', height: '2400px', background: 'conic-gradient(from 170deg at 50% 0%, transparent 0deg, rgba(255,240,200,.16) 8deg, transparent 20deg)', transformOrigin: '50% 0%' }));
    const bulbs = [];
    for (let i = 0; i < 18; i++) bulbs.push(el('div', 'abs', s.root, { width: '22px', height: '22px', borderRadius: '50%', left: px(20 + i * 60), top: '170px' }));
    for (let i = 0; i < 18; i++) bulbs.push(el('div', 'abs', s.root, { width: '22px', height: '22px', borderRadius: '50%', left: px(20 + i * 60), top: '1760px' }));
    const C = 28;
    const cup = pixEl(s.root, CUP, CUP_C, C, { left: px(540 - 84), top: '700px' });
    const steam = [0, 1, 2].map(() => el('div', 'abs', s.root, { width: px(C / 2), height: px(C / 2), background: 'rgba(255,255,255,.75)' }));
    const price = el('div', 'pill', s.root, { left: px(540 - 120), width: '240px', justifyContent: 'center', top: '880px', fontSize: '52px', fontWeight: 800 });
    price.textContent = `${PRICE} TL`;
    // geri sayım halkası
    const ring = el('div', 'abs', s.root, { left: px(540 - 170), top: '1010px', width: '340px', height: '340px' });
    ring.innerHTML = '<svg viewBox="0 0 100 100" width="340" height="340"><circle cx="50" cy="50" r="44" fill="rgba(0,0,0,.35)" stroke="rgba(255,255,255,.18)" stroke-width="8"/><circle class="arc" cx="50" cy="50" r="44" fill="none" stroke="#FFD25A" stroke-width="8" stroke-linecap="round" transform="rotate(-90 50 50)" stroke-dasharray="276.5" stroke-dashoffset="0"/></svg><div class="it" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:200px;color:#fff"></div>';
    const arc = ring.querySelector('.arc'), rnum = ring.querySelector('div');
    const big = el('div', 'abs it', s.root, { left: 0, right: 0, top: '1000px', textAlign: 'center', fontSize: '210px', color: '#FFD25A', textShadow: '0 10px 0 #7A4A00', display: 'none' });
    const sub = el('div', 'abs', s.root, { left: 0, right: 0, top: '1230px', textAlign: 'center', fontSize: '52px', fontWeight: 700, color: '#F3E9FF', display: 'none' });
    sub.textContent = `${PRICE} TL × 365 gün`;
    const m = new Mascot(s.root, { w: 32 * C, outfit: 'suit' });  // fincanla aynı piksel boyu
    const conf = new Burst(s.root, { n: 50, t0: REVEAL, ox: 540, oy: 1100, colors: ['#FFD25A', '#FF6B9A', '#6EE0C5', '#FFFFFF', '#B58CFF'], speed: 1400, grav: 1700, life: 2.4, size: [20, 20] });
    s.update = (lt) => {
      spots.forEach((sp, i) => (sp.style.transform = `rotate(${(i ? -1 : 1) * (12 + Math.sin(lt * 1.5 + i) * 10)}deg)`));
      bulbs.forEach((b, i) => (b.style.background = (i + Math.floor(lt / 0.25)) % 2 ? '#FFE9A8' : '#6B4A1A'));
      steam.forEach((st, i) => {
        const k = ((lt * 0.8 + i / 3) % 1);
        st.style.transform = `translate(${540 - 14 + Math.sin(k * 6 + i) * 20 + (i - 1) * 30}px,${690 - k * 140}px)`;
        st.style.opacity = 1 - k;
      });
      const revealed = lt >= REVEAL;
      ring.style.display = revealed ? 'none' : 'block';
      arc.setAttribute('stroke-dashoffset', String(276.5 * clamp(lt / REVEAL)));
      rnum.textContent = String(Math.max(1, 3 - Math.floor(lt / (REVEAL / 3))));
      big.style.display = sub.style.display = revealed ? 'block' : 'none';
      const v = E.out(prog(lt, REVEAL, 0.8)) * PRICE * 365;
      big.textContent = `${fmt(v)} TL`;
      big.style.transform = `scale(${1 + 0.15 * Math.sin(prog(lt, REVEAL + 0.8, 0.3) * Math.PI)})`;
      cup.style.transform = `translateY(${Math.sin(lt * 4) * 8}px)`;
      // sunucu Fıstık: anlatır → bayılır → toparlanır
      if (lt < FAINT) {
        const h = hop(lt, 0.45, 18);
        m.set('happy', Math.floor(lt / 0.45) % 2 ? 'up' : null, blink(lt));
        m.put(860, 2030 - h.y, { sx: h.sx, sy: h.sy, flip: true });
      } else if (lt < UP) {
        const k = E.out(prog(lt, FAINT, 0.35));
        m.set('thoughtful', null, 'x');
        m.put(860 + k * 60, 2030 + k * 40, { rot: -78 * k, flip: true });
      } else {
        const h = hop(lt, 0.5, 30);
        m.set('celebrate', Math.floor(lt / 0.2) % 2 ? 'wave' : 'up', blink(lt));
        m.put(860, 2030 - h.y + (1 - E.back(prog(lt, UP, 0.4))) * 200, { sx: h.sx, sy: h.sy, flip: true });
      }
      conf.update(lt);
    };
  };

  /* ── Kişilik testi: "Harcama tarzına göre hangi hayvansın?" ── */
  SCENES.persona = (t0, o = {}) => {
    const C0 = o.c0 ?? 1.8, D = o.d ?? 1.55;
    const s = scene(t0, 'var(--paper)');
    pattern(s.root);
    const cardBg = el('div', 'abs', s.root, { inset: 0 });
    // giriş: altı siluet
    const grid = MASCOTS6.map(([k], i) => {
      const m = new Mascot(s.root, { who: k, w: 320 });
      const q = el('div', 'abs it', s.root, { width: '320px', textAlign: 'center', fontSize: '120px', color: 'var(--acc)' });
      q.textContent = '?';
      return { m, q, x: [200, 540, 880][i % 3], b: i < 3 ? 1020 : 1500 };
    });
    // kartlar
    const big = MASCOTS6.map(([k]) => new Mascot(s.root, { who: k, w: 768 }));
    const name = el('div', 'abs it', s.root, { left: 0, right: 0, top: '560px', textAlign: 'center', fontSize: '170px' });
    const species = el('div', 'abs', s.root, { left: 0, right: 0, top: '720px', textAlign: 'center', fontSize: '54px', fontWeight: 700, color: '#6e5f55' });
    const counter = el('div', 'pill', s.root, { right: '60px', top: '120px', fontSize: '40px', color: '#6e5f55' });
    s.update = (lt) => {
      const intro = lt < C0;
      grid.forEach((g, i) => {
        g.m.root.style.display = g.q.style.display = intro ? 'block' : 'none';
        const h = hop(lt, 0.8, 16, i * 0.13);
        g.m.set('calm', null, 'mood');
        g.m.put(g.x, g.b - h.y, { sy: h.sy, sx: h.sx });
        g.m.root.style.filter = 'brightness(0) opacity(.82)';
        g.q.style.left = px(g.x - 160);
        g.q.style.top = px(g.b - 360 - h.y + Math.sin(lt * 5 + i) * 6);
      });
      const i = Math.min(5, Math.floor((lt - C0) / D));
      const lk = lt - C0 - i * D;
      name.style.display = species.style.display = counter.style.display = intro ? 'none' : 'block';
      cardBg.style.display = intro ? 'none' : 'block';
      big.forEach((m, j) => (m.root.style.display = !intro && j === i ? 'block' : 'none'));
      if (intro) return;
      const [k, nm, sp] = MASCOTS6[i];
      const pal = SP.__meta.pal[k];
      cardBg.style.background = pal.soft;
      name.textContent = nm;
      name.style.color = pal.accent;
      species.textContent = sp;
      counter.style.display = 'flex';
      counter.textContent = `${i + 1}/6`;
      const sl = E.out(prog(lk, 0, 0.22));
      const reveal = prog(lk, 0.15, 0.25);
      const m = big[i];
      const h = hop(lk, 0.6, reveal >= 1 ? 40 : 0);
      m.set(reveal >= 1 ? 'happy' : 'calm', reveal >= 1 ? (Math.floor(lk / 0.22) % 2 ? 'wave' : 'up') : null, blink(lk));
      m.put(540 + (1 - sl) * 700, 1720 - h.y, { sx: h.sx * (0.9 + 0.1 * E.back(reveal)), sy: h.sy * (0.9 + 0.1 * E.back(reveal)) });
      m.root.style.filter = reveal < 1 ? `brightness(${reveal})` : 'none';
      name.style.transform = `translateX(${(1 - sl) * 600}px) scale(${0.8 + 0.2 * E.back(reveal)})`;
      species.style.transform = `translateX(${(1 - sl) * 600}px)`;
    };
  };
}
