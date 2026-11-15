/* Karar odası serisi: Paylaş mı, çal mı? (mahkûm ikilemi).
 * Tek mekân: yarışma stüdyosu. Solda Ceviz, sağda Pamuk; ortada 1.000 TL, herkesin önünde PAYLAŞ ve ÇAL düğmeleri.
 * Arkadaki dev ekran sırayla tutarı, üç kuralı, iki kapalı kartı (karar anı ve açılış), araştırmayı ve oyunun adını gösterir.
 * Olaylar: reveal, rules, r2, r3, zeroAt, promise, say, trust, ask, count, zero, pf (Pamuk'un kartı), cf (Ceviz'in kartı), win, sad,
 * sci, half, lesson, l2, cta, follow, tapf, dim. Ses takvimi audio.py'deki cue_cal ile aynı. */
const KHEART = ['.oo.oo.', 'oRRoRRo', 'oRRRRRo', 'oRRRRRo', '.oRRRo.', '..oRo..', '...o...'];
const KHEART_C = { o: '#2A1E1A', R: '#E8577A' };
const KDROP = ['.o.', 'oBo', 'oBo', '.o.'];

function defineKarar() {
  SCENES.cal = (t0, o = {}) => {
    const s = scene(t0, '#0B0920', undefined, o.wdur ?? 0.4);
    const ev = (k) => o[k] ?? 99;
    const RULES = ev('rules'), R2 = ev('r2'), R3 = ev('r3'), PROMISE = ev('promise'), TRUST = ev('trust'), ASK = ev('ask'), COUNT = ev('count'), ZERO = ev('zero');
    const PF = ev('pf'), CF = ev('cf'), WIN = ev('win'), SAD = ev('sad'), SCI = ev('sci'), HALF = ev('half'), LESSON = ev('lesson'), L2 = ev('l2');
    const CTA = ev('cta'), FOLLOW = ev('follow'), TAPF = ev('tapf'), DIM = ev('dim');
    const SAY = o.say ?? PROMISE + 0.25, ZA = o.zeroAt ?? R3 + 0.5;
    const REVEAL = o.reveal ?? (o.rules ? 1.3 : 99);  // stüdyo ışıkları yanar: para yakın planından geniş plana
    const GREEN = '#2F8F5A', RED = '#C0392B', GOLD = '#F2B63C', INK = '#2A1E1A';
    const outline = (c, w = 5) => `${w}px 0 0 ${c}, -${w}px 0 0 ${c}, 0 ${w}px 0 ${c}, 0 -${w}px 0 ${c}`;

    // ── kamera katmanı: bütün stüdyo burada ölçeklenir ──
    const cam = el('div', 'abs', s.root, { left: 0, top: 0, width: '1080px', height: '1920px', transformOrigin: '0 0' });
    el('div', 'abs', cam, { left: '-200px', top: '-200px', width: '1480px', height: '2320px', background: 'radial-gradient(ellipse 760px 700px at 740px 1050px, #2B2466 0%, #17133A 55%, #0B0920 100%)' });
    el('div', 'abs', cam, { left: '-200px', top: '-200px', width: '1480px', height: '1700px', background: 'repeating-linear-gradient(90deg, rgba(130,120,255,.08) 0 6px, transparent 6px 92px)' });
    const wash = el('div', 'abs', cam, { left: '-200px', top: '-200px', width: '1480px', height: '2320px', background: 'radial-gradient(ellipse 800px 760px at 740px 1100px, rgba(224,74,58,.5), rgba(224,74,58,0) 75%)', opacity: 0 });
    // ışık köprüsü ve üç spot
    el('div', 'abs', cam, { left: '-200px', top: '96px', width: '1480px', height: '22px', background: '#07061A' });
    el('div', 'abs', cam, { left: '-200px', top: '136px', width: '1480px', height: '8px', background: '#07061A' });
    const beam = (x, half, bottom, col) => {
      el('div', 'abs', cam, { left: px(x - 46), top: '112px', width: '92px', height: '70px', clipPath: 'polygon(22% 0, 78% 0, 100% 100%, 0 100%)', background: 'linear-gradient(#3A3660, #15132C)' });
      const lens = el('div', 'abs', cam, { left: px(x - 38), top: '178px', width: '76px', height: '14px', borderRadius: '0 0 12px 12px', background: '#FFF4D0' });
      const b = el('div', 'abs', cam, { left: px(x - half), top: '188px', width: px(half * 2), height: px(bottom - 188), clipPath: 'polygon(44% 0, 56% 0, 100% 100%, 0 100%)', background: `linear-gradient(${col}, rgba(255,255,255,.02))` });
      return { b, lens };
    };
    const bC = beam(230, 250, 1520, 'rgba(255,214,150,.30)'), bM = beam(540, 190, 1300, 'rgba(255,236,170,.34)'), bP = beam(850, 250, 1520, 'rgba(255,176,214,.30)');

    // ── dev ekran ──
    const SX = 160, SY0 = 740, SW = 760, SH = 230;
    const bulbs = [];
    for (let x = SX - 6; x <= SX + SW + 6; x += 51.5) { bulbs.push([x, SY0 - 14]); bulbs.push([x, SY0 + SH + 14]); }
    for (let y = SY0 + 37; y < SY0 + SH; y += 52) { bulbs.push([SX - 14, y]); bulbs.push([SX + SW + 14, y]); }
    const bulbEls = bulbs.map(([x, y]) => el('div', 'abs', cam, { left: px(x - 8), top: px(y - 8), width: '16px', height: '16px', borderRadius: '50%' }));
    const scr = el('div', 'abs', cam, { left: px(SX), top: px(SY0), width: px(SW), height: px(SH), boxSizing: 'border-box', background: '#090E20', border: '8px solid #C9962E', borderRadius: '18px', overflow: 'hidden', isolation: 'isolate' });
    el('div', 'abs', scr, { inset: 0, background: 'repeating-linear-gradient(rgba(255,255,255,.035) 0 3px, transparent 3px 7px)', zIndex: 5, pointerEvents: 'none' });
    const mode = () => el('div', 'abs it', scr, { inset: 0, display: 'none', color: '#fff' });
    // A: tutar
    const mA = mode();
    mA.innerHTML = `<div style="position:absolute;left:0;right:0;top:36px;text-align:center;font-size:170px;color:${GOLD};text-shadow:0 0 34px rgba(242,182,60,.55)">1.000 TL</div>`;
    // B: üç kural
    const mB = mode();
    const chip = (t) => `<span style="display:inline-block;background:${t === 'ÇAL' ? RED : GREEN};border-radius:10px;padding:0 14px 5px;margin:0 5px">${t}</span>`;
    const rows = [['PAYLAŞ', 'PAYLAŞ', '500 · 500', '#8FF0B4'], ['ÇAL', 'PAYLAŞ', '1.000 · 0', '#FFE08A'], ['ÇAL', 'ÇAL', '0 · 0', '#FF8A7A']].map(([a, b, r, col], i) => {
      const e = el('div', 'abs', mB, { left: 0, right: 0, top: px(4 + i * 70), height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '54px', whiteSpace: 'nowrap', transformOrigin: '50% 50%' });
      e.innerHTML = `${chip(a)}<span style="margin:0 4px;color:#9AA3C8">+</span>${chip(b)}<span style="margin:0 14px;color:#9AA3C8">=</span><span style="color:${col};font-size:62px">${r}</span>`;
      return e;
    });
    // C: iki kapalı kart
    const mC = mode();
    const tile = (x, name) => {
      const t = el('div', 'abs', mC, { left: px(x), top: '14px', width: '330px', height: '186px', boxSizing: 'border-box', borderRadius: '16px', border: '6px solid #3A4270', background: '#161D3C', transformOrigin: '50% 50%' });
      const h = el('div', 'abs', t, { left: 0, right: 0, top: '2px', textAlign: 'center', fontSize: '44px', color: '#B9C2E8', letterSpacing: '.08em' });
      h.textContent = name;
      const v = el('div', 'abs', t, { left: 0, right: 0, top: '44px', textAlign: 'center', fontSize: '128px', color: GOLD });
      return { t, h, v };
    };
    const tC = tile(22, 'CEVİZ'), tP = tile(392, 'PAMUK');
    // D: araştırma (gerçek yarışma: oyuncuların yaklaşık yarısı ÇAL dedi)
    const mD = mode();
    const REDS = [0, 2, 4, 6, 8];
    const people = Array.from({ length: 10 }, (_, i) => {
      const fig = (c) => pixEl(mD, PERSONP, { o: '#05070F', S: '#F3C9A8', C: c }, 11, { left: px(15 + i * 72), top: '6px', transformOrigin: '50% 100%' });
      return { g: fig('#8C95B8'), r: fig('#E04A3A'), k: fig('#3FB06F') };
    });
    const stL = el('div', 'abs', mD, { left: '20px', top: '120px', width: '350px', textAlign: 'center', fontSize: '60px', color: '#8FF0B4', transformOrigin: '50% 50%' });
    stL.textContent = '%53 PAYLAŞ';
    const stR = el('div', 'abs', mD, { left: '374px', top: '120px', width: '350px', textAlign: 'center', fontSize: '60px', color: '#FF8A7A', transformOrigin: '50% 50%' });
    stR.textContent = '%47 ÇAL';
    el('div', 'abs', mD, { left: 0, right: 0, top: '184px', textAlign: 'center', fontFamily: 'Bricolage', fontSize: '20px', fontWeight: 800, color: '#B9C2E8', letterSpacing: 0 }).textContent = 'Gerçek TV yarışması · Kaynak: van den Assem, van Dolder ve Thaler 2012';
    // E: oyunun adı
    const mE = mode();
    mE.innerHTML = `<div style="position:absolute;left:0;right:0;top:12px;text-align:center;font-size:46px;color:#B9C2E8;letter-spacing:.08em">BU OYUNUN ADI</div><div class="nm" style="position:absolute;left:0;right:0;top:66px;text-align:center;font-size:124px;color:${GOLD};text-shadow:0 0 30px rgba(242,182,60,.5);transform-origin:50% 50%">MAHKÛM İKİLEMİ</div>`;
    const nameEl = mE.querySelector('.nm');
    const scrDim = el('div', 'abs', scr, { inset: 0, background: '#05060F', zIndex: 6, opacity: 0 });

    // ── oyuncular (masanın arkasında) ──
    const cz = new Mascot(cam, { who: 'ceviz', w: 400 }), pm = new Mascot(cam, { who: 'pamuk', w: 400 });
    // konuşma balonu: Ceviz'in sözü
    const bub = el('div', 'abs it', cam, { left: '420px', top: '905px', width: '270px', boxSizing: 'border-box', padding: '8px 10px 16px', background: '#FFFDF4', border: `6px solid ${INK}`, borderRadius: '26px', textAlign: 'center', fontSize: '58px', lineHeight: 0.95, color: INK, display: 'none', transformOrigin: '0% 100%', zIndex: 3 });
    bub.innerHTML = `Söz!<br><span style="color:${GREEN}">PAYLAŞ</span><br>diyeceğim`;
    el('div', 'abs', bub, { left: '-21px', top: '108px', width: '30px', height: '30px', background: '#FFFDF4', borderLeft: `6px solid ${INK}`, borderBottom: `6px solid ${INK}`, transform: 'rotate(45deg)' });
    // kırık kalp ve gözyaşları (Pamuk), ter damlası (Ceviz)
    const heart = el('div', 'abs', cam, { left: '948px', top: '900px', width: '84px', height: '84px', display: 'none', zIndex: 3 });
    const hL = el('div', 'abs', heart, { inset: 0, clipPath: 'polygon(0 0, 50% 0, 38% 30%, 60% 52%, 44% 76%, 50% 100%, 0 100%)', transformOrigin: '50% 100%' });
    const hR = el('div', 'abs', heart, { inset: 0, clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%, 44% 76%, 60% 52%, 38% 30%)', transformOrigin: '50% 100%' });
    hL.innerHTML = hR.innerHTML = pix(KHEART, KHEART_C, 12);
    const tears = [0, 1].map((i) => ({ e: pixEl(cam, KDROP, { o: '#1E4E86', B: '#8CC7FF' }, 9, { display: 'none', zIndex: 3 }), x: 790 + i * 92, ph: i * 0.45 }));
    const sweat = pixEl(cam, KDROP, { o: '#1E4E86', B: '#8CC7FF' }, 10, { display: 'none', zIndex: 3 });
    const bang = el('div', 'abs it', cam, { left: '934px', top: '880px', fontSize: '150px', color: '#FF6B57', textShadow: outline(INK, 6), display: 'none', transformOrigin: '50% 100%', zIndex: 3 });
    bang.textContent = '!';

    // ── masa: perspektifli üst yüzey ve ışıklı ön yüz ──
    el('div', 'abs', cam, { left: '40px', top: '1250px', width: '1000px', height: '104px', clipPath: 'polygon(4% 0, 96% 0, 100% 100%, 0 100%)', background: 'linear-gradient(#4A4290, #332C6C)' });
    el('div', 'abs', cam, { left: '40px', top: '1352px', width: '1000px', height: '300px', background: 'linear-gradient(#1F1A4A 0 12px, #17133A 12px)' });
    const strip = el('div', 'abs', cam, { left: '70px', top: '1470px', width: '940px', height: '10px', borderRadius: '5px', background: GOLD, boxShadow: '0 0 26px 6px rgba(242,182,60,.45)' });
    // sahne zemini ve seyirci başları (alt bantta yazı yok, yalnız görüntü)
    el('div', 'abs', cam, { left: '-200px', top: '1650px', width: '1480px', height: '480px', background: 'linear-gradient(#141033, #07061A)' });
    el('div', 'abs', cam, { left: '140px', top: '1640px', width: '800px', height: '120px', borderRadius: '50%', background: 'radial-gradient(ellipse at center, rgba(255,226,170,.16), rgba(255,226,170,0) 70%)' });
    const crowd = [-70, 110, 290, 470, 650, 830, 1010].map((x, i) => ({ e: pixEl(cam, HEAD, { o: '#05040F', r: '#3E3870' }, 17, { left: px(x), top: '1772px' }), ph: i * 1.3 }));
    // Cep Defteri: sonuç deftere yazılır
    const led = el('div', 'abs', cam, { left: '405px', top: '1262px', width: '270px', height: '122px', boxSizing: 'border-box', background: 'repeating-linear-gradient(#FFFDF4 0 31px, #BFD3EA 31px 33px)', border: `5px solid ${INK}`, borderRadius: '10px', transform: 'rotate(-3deg)', padding: '2px 12px', zIndex: 2 });
    led.innerHTML = `<div style="font-size:30px;font-weight:800;color:#AE4716;letter-spacing:.05em;line-height:34px">CEP DEFTERİ</div><div class="it la" style="font-size:36px;color:${INK};height:36px"></div><div class="it lb" style="font-size:36px;color:${INK};height:36px"></div>`;
    const la = led.querySelector('.la'), lb = led.querySelector('.lb');
    // 1.000 TL: 4 × 200 + 2 × 100
    const notes = [1, 0, 0, 0, 0, 1].map((ci) => { const e = el('div', 'abs', cam, { left: 0, top: 0, width: '143px', height: '65px', transformOrigin: '50% 50%', zIndex: 1 }); e.innerHTML = pix(NOTE, NOTE_CS[ci], 13); return e; });
    const glint = el('div', 'abs', cam, { left: '469px', top: '1131px', width: '143px', height: '125px', overflow: 'hidden', pointerEvents: 'none', zIndex: 1 });
    const glintBar = el('div', 'abs', glint, { top: '-40px', width: '34px', height: '220px', background: 'rgba(255,250,225,.75)', transform: 'rotate(24deg)' });
    const lbl = (x, y, col = GOLD, fs = 66) => el('div', 'abs it', cam, { left: px(x - 180), width: '360px', top: px(y), textAlign: 'center', fontSize: px(fs), color: col, textShadow: outline(INK), display: 'none', transformOrigin: '50% 100%', zIndex: 3 });
    const total = lbl(540, 1059), winL = lbl(300, 1062, GOLD, 76), zeroL = lbl(766, 1150, '#FF6B57', 80), ask = lbl(540, 930, GOLD, 120);
    total.textContent = '1.000 TL'; winL.textContent = '1.000 TL'; zeroL.textContent = '0 TL'; ask.textContent = '?';
    // düğmeler: herkesin önünde PAYLAŞ (yeşil) ve ÇAL (kırmızı)
    const btn = (x, share) => {
      const b = el('div', 'abs', cam, { left: px(x - 64), top: '1290px', width: '128px', height: '64px' });
      el('div', 'abs', b, { left: 0, top: '18px', width: '128px', height: '46px', borderRadius: '50%', background: INK });
      const cap = el('div', 'abs', b, { left: '10px', top: 0, width: '108px', height: '50px', borderRadius: '50%', background: share ? '#3FB06F' : '#E04A3A', border: `5px solid ${INK}`, boxSizing: 'border-box', boxShadow: `inset 0 -8px 0 ${share ? GREEN : '#A8301F'}` });
      const t = el('div', 'abs it', cam, { left: px(x - 100), width: '200px', top: '1376px', textAlign: 'center', fontSize: '46px', color: share ? '#4FC47E' : '#FF7A66', letterSpacing: '.06em' });
      t.textContent = share ? 'PAYLAŞ' : 'ÇAL';
      return cap;
    };
    const BX = { cs: 130, cc: 290, ps: 790, pc: 950 };
    const capCS = btn(BX.cs, true), capCC = btn(BX.cc, false), capPS = btn(BX.ps, true), capPC = btn(BX.pc, false);
    // Pamuk'un kolu ve patisi düğmelerin üstünde gidip gelir
    const arm = el('div', 'abs', cam, { left: 0, top: 0, width: '30px', height: '10px', background: '#F7C9D9', border: `5px solid ${INK}`, borderRadius: '16px', transformOrigin: '0 50%', display: 'none', zIndex: 2 });
    const paw = pixEl(cam, PAWP, { o: INK, B: '#F7C9D9' }, 10, { display: 'none', zIndex: 2 });
    const confetti = new Burst(cam, { n: 30, t0: CF, ox: 300, oy: 1150, colors: ['#F2B63C', '#FFE08A', '#E04A3A', '#F4BCD8'], speed: 760, grav: 1900, life: 1.2, size: [12, 24], upBias: 0.6 });

    // ── üst katmanlar: kenar karartma, flaş, karar çağrısı, takip kartı ──
    el('div', 'abs', s.root, { inset: 0, zIndex: 17, pointerEvents: 'none', background: 'radial-gradient(ellipse 96% 70% at 50% 56%, transparent 56%, rgba(3,2,12,.6) 100%)' });
    el('div', 'abs', s.root, { left: 0, right: 0, top: 0, height: '280px', zIndex: 17, pointerEvents: 'none', background: 'linear-gradient(rgba(3,2,12,.55), rgba(3,2,12,0))' });
    const dark = el('div', 'abs', s.root, { inset: 0, zIndex: 18, pointerEvents: 'none', background: '#05040F', opacity: 0 });
    const flash = el('div', 'abs', s.root, { inset: 0, zIndex: 21, opacity: 0, pointerEvents: 'none' });
    const cdg = el('div', 'abs', s.root, { left: 0, right: 0, top: '628px', display: 'none', justifyContent: 'center', alignItems: 'center', zIndex: 24 });
    const ring = el('div', '', cdg, { position: 'relative', width: '156px', height: '156px', borderRadius: '50%', flex: 'none' });
    const num = el('div', 'abs it', ring, { left: '15px', top: '15px', width: '126px', height: '126px', borderRadius: '50%', background: 'rgba(11,9,32,.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '112px', color: '#fff' });
    const pill = el('div', 'it', cdg, { marginLeft: '18px', padding: '6px 26px 12px', background: 'rgba(11,9,32,.9)', border: `4px solid ${GOLD}`, borderRadius: '16px', textAlign: 'left', lineHeight: 1.05 });
    pill.innerHTML = `<div style="font-size:82px;color:#fff">KARAR VER</div><div style="font-size:58px;color:${GOLD}">P mi, Ç mi? Yoruma yaz</div>`;
    const FW = 620, FT = 300;
    const fcard = el('div', 'abs', s.root, { left: px((1080 - FW) / 2), top: px(FT), width: px(FW), height: '410px', borderRadius: '44px', background: '#FFFFFF', boxShadow: '0 24px 60px rgba(0,0,0,.45)', display: 'none', zIndex: 26, transformOrigin: '50% 50%', textAlign: 'center' });
    const ficon = el('img', 'abs', fcard, { left: px(FW / 2 - 68), top: '34px', width: '136px', height: '136px', borderRadius: '50%', boxShadow: '0 0 0 4px #FFFFFF, 0 0 0 8px #E9E2D8' });
    ficon.src = 'assets/icon.png';
    el('div', 'abs', fcard, { left: 0, right: 0, top: '186px', fontSize: '50px', fontWeight: 800, color: '#141414', letterSpacing: '-.01em' }).textContent = 'cep_defteri';
    el('div', 'abs', fcard, { left: 0, right: 0, top: '252px', fontSize: '32px', fontWeight: 600, color: '#5E5650' }).textContent = 'Her hafta bir para tuzağı';
    const fbtn = el('div', 'abs', fcard, { left: '44px', right: '44px', top: '310px', height: '72px', borderRadius: '18px', background: '#0095F6', color: '#FFFFFF', fontSize: '38px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', transformOrigin: '50% 50%' });
    const FBX = 740, FBY = FT + 310 + 36;
    const fpaw = pixEl(s.root, PAWP, { o: INK, B: '#F7C9D9' }, 16, { left: 0, top: 0, display: 'none', zIndex: 27, transformOrigin: '50% 30%' });
    const fring = el('div', 'abs', s.root, { left: px(FBX - 60), top: px(FBY - 60), width: '120px', height: '120px', boxSizing: 'border-box', borderRadius: '50%', border: '8px solid rgba(0,149,246,.75)', display: 'none', zIndex: 27 });

    // kalp atışları (audio.py ile aynı takvim): sayımda giderek hızlanır
    const beats = [];
    for (let t = ASK + 0.2, k = 0; t < ZERO - 0.1; t += Math.max(0.42, 0.62 - 0.03 * k), k++) beats.push(t);
    const kick = (lt, t, a) => (lt >= t ? a * Math.exp(-(lt - t) * 1.6) * Math.sin((lt - t) * 7) : 0);
    const flick = (lt, t) => { const k = lt - t; return k < 0 ? 0 : k >= 0.4 ? 1 : [0.15, 0, 0.6, 0.1, 0.85, 0.4, 1, 1][Math.floor(k / 0.05)]; };

    s.update = (lt) => {
      const Q = lt >= CTA;                    // soru: her şey başa döner
      const WON = lt >= WIN && !Q;            // para Ceviz'de
      const ALONE = lt >= L2 && !Q;           // Pamuk masadan kalktı
      const ramp = (a, d) => E.inOut(prog(lt, a, d));
      // ── kamera planları ──
      let z = 1, fx = 540, fy = 1060, dim = 0;  // dim: yakın planlarda ekran kısılır (yazılar okunur kalsın)
      if (lt < REVEAL) { z = 1.6 + 0.12 * ramp(0, REVEAL); fy = 1230; dim = 1; }                                  // karanlık stüdyo, ışık altında 1.000 TL
      else if (lt < RULES) { const k = E.out(prog(lt, REVEAL, 0.35)); z = lerp(1.72, 1, k) + 0.02 * prog(lt, REVEAL + 0.35, 1); fy = lerp(1230, 1060, k); }  // ışıklar yanar: geniş plan
      else if (lt < PROMISE) { z = 1.2 + 0.05 * prog(lt, RULES, PROMISE - RULES); fy = 940; }                    // kurallar: dev ekran ve iki yüz
      else if (lt < TRUST) { z = 1.42 + 0.06 * prog(lt, PROMISE, TRUST - PROMISE); fx = 372; fy = 1120; dim = 0.8; }  // Ceviz söz verir
      else if (lt < ASK) { z = 1.45 + 0.04 * prog(lt, TRUST, ASK - TRUST); fx = 800; fy = 1130; dim = 0.8; }    // Pamuk inanır
      else if (lt < ZERO) { z = 1.42 + 0.16 * ramp(ASK, ZERO - ASK); fx = 822; fy = 1150; dim = 0.8; }           // karar anı: Pamuk'un patisi iki düğme arasında
      else if (lt < WIN) { z = 1.36 + 0.04 * prog(lt, ZERO, WIN - ZERO); fy = 850; }                             // kartlar açılır
      else if (lt < SAD) { z = 1 + 0.03 * prog(lt, WIN, SAD - WIN); }                                             // para Ceviz'e kayar
      else if (lt < SCI) { z = 1.5 + 0.06 * prog(lt, SAD, SCI - SAD); fx = 815; fy = 1130; dim = 0.8; }          // Pamuk: kırık kalp
      else if (lt < LESSON) { z = 1.36 + 0.04 * prog(lt, SCI, LESSON - SCI); fy = 850; }                         // ekranda gerçek yarışma
      else if (lt < L2) { z = 1.5 + 0.05 * prog(lt, LESSON, L2 - LESSON); fx = 300; fy = 1140; dim = 0.8; }      // Ceviz: paraya sarılmış
      else if (lt < CTA) { z = 1 + 0.05 * prog(lt, L2, CTA - L2); }                                               // tek başına; ekranda oyunun adı
      else { z = 1 + 0.04 * ramp(CTA, 2.4); fy = 1060 + 15 * ramp(CTA, 2.4); }                                    // soru
      let beat = -9;
      beats.forEach((t) => { if (lt >= t) beat = t; });
      z *= 1 + 0.014 * Math.exp(-(lt - beat) * 10);
      const sx = shake(lt, CF, 24, 0.5) + shake(lt, REVEAL, 10, 0.25) + shake(lt, L2, 8, 0.25) + shake(lt, PF, 6, 0.2);
      cam.style.transform = `translate(${540 - fx * z + sx}px,${1060 - fy * z}px) scale(${z})`;

      // ── ışıklar ──
      const on = lt < REVEAL ? 0 : lt < DIM ? flick(lt, REVEAL) : 1 - E.inOut(prog(lt, DIM, 0.4));  // stüdyo ışıkları
      const pulse = lt >= ASK && lt < ZERO ? 1 - 0.2 * Math.exp(-(lt - beat) * 14) : 1;
      const pOn = ALONE ? 1 - flick(lt, L2) : 1;  // Pamuk'un spotu: masadan kalkınca söner
      bM.b.style.opacity = (0.75 + 0.25 * on) * pulse;
      bC.b.style.opacity = on * pulse; bP.b.style.opacity = on * pulse * pOn;
      bC.lens.style.opacity = 0.25 + 0.75 * on; bP.lens.style.opacity = 0.25 + 0.75 * on * pOn;
      dark.style.opacity = 0.34 * (1 - on);
      strip.style.opacity = 0.35 + 0.65 * on;
      wash.style.opacity = lt >= CF && lt < SCI ? 0.75 * Math.exp(-(lt - CF) * 1.1) : 0;
      const red = lt >= CF && lt < CF + 0.9;
      const fi = Math.floor(lt * 5);
      bulbEls.forEach((b, i) => {
        const lit = on > 0.5 && (lt >= COUNT && lt < ZERO ? lt - beat < 0.12 : (i + fi) % 3 === 0);
        b.style.opacity = on;
        b.style.background = red ? '#FF5A48' : lit ? '#FFE9A8' : '#6A531E';
        b.style.boxShadow = red ? '0 0 16px 5px rgba(255,90,72,.7)' : lit ? '0 0 16px 5px rgba(255,220,130,.75)' : 'none';
      });
      scr.style.borderColor = red ? '#FF5A48' : '#C9962E';
      scrDim.style.opacity = dim * 0.96;
      scr.style.opacity = on;
      flash.style.background = lt >= CF ? '#E04A3A' : '#FFFFFF';
      flash.style.opacity = Math.max(lt >= CF ? 0.5 * Math.exp(-(lt - CF) * 5) : 0, lt >= PF && lt < CF ? 0.16 * Math.exp(-(lt - PF) * 8) : 0, lt >= REVEAL && lt < RULES ? 0.2 * Math.exp(-(lt - REVEAL) * 9) : 0);

      // ── dev ekran ──
      const M = Q ? 'C' : lt < RULES ? 'A' : lt < PROMISE ? 'B' : lt < ASK ? 'A' : lt < SCI ? 'C' : lt < L2 ? 'D' : 'E';
      [['A', mA], ['B', mB], ['C', mC], ['D', mD], ['E', mE]].forEach(([k, e]) => (e.style.display = k === M ? 'block' : 'none'));
      if (M === 'B') rows.forEach((r, i) => {
        const t = [RULES, R2, R3][i], act = lt >= t && (i === 2 || lt < [R2, R3][i]);
        r.style.opacity = lt < t ? 0 : act ? 1 : 0.45;
        const blink = i === 2 && lt >= ZA && lt < ZA + 0.6 && Math.floor((lt - ZA) / 0.1) % 2 === 0;
        r.style.transform = `scale(${E.back(prog(lt, t, 0.25)) * (blink ? 1.06 : 1)})`;
        r.style.filter = blink ? 'brightness(1.5)' : 'none';
      });
      if (M === 'C') [[tC, CF, 'ÇAL', RED], [tP, PF, 'PAYLAŞ', GREEN]].forEach(([t, at, word, col]) => {
        const k = Q ? 1 : prog(lt, at, 0.3), open = !Q && k >= 0.5;
        const pop = !Q && lt >= at + 0.3 ? 1 + 0.1 * Math.exp(-(lt - at - 0.3) * 7) : 1;
        t.t.style.transform = `scaleX(${Math.max(0.04, Math.abs(Math.cos(k * Math.PI)))}) scale(${pop})`;
        t.t.style.background = open ? col : '#161D3C';
        t.t.style.borderColor = open ? '#FFFFFF' : '#3A4270';
        t.h.style.color = open ? '#FFFFFF' : '#B9C2E8';
        t.v.textContent = open ? word : '?';
        t.v.style.color = open ? '#FFFFFF' : GOLD;
        t.v.style.fontSize = open && word.length > 3 ? '108px' : '128px';
        t.v.style.top = open && word.length > 3 ? '54px' : '44px';
        if (!open) t.v.style.transform = `scale(${1 + 0.06 * Math.sin(lt * 6 + (t === tC ? 0 : 1.6))})`; else t.v.style.transform = 'none';
      });
      if (M === 'D') {
        people.forEach((p, i) => {
          const ri = REDS.indexOf(i), isR = ri >= 0 && lt >= HALF + ri * 0.1, isG = ri < 0 && lt >= HALF + 0.65;
          const pop = `scale(${E.back(prog(lt, SCI + 0.12 + i * 0.04, 0.22))})`;
          p.g.style.transform = pop;
          p.r.style.transform = `scale(${1 + 0.25 * Math.exp(-(lt - HALF - ri * 0.1) * 9)})`;
          p.k.style.transform = `scale(${1 + 0.25 * Math.exp(-(lt - HALF - 0.65) * 9)})`;
          p.g.style.display = isR || isG ? 'none' : 'block'; p.r.style.display = isR ? 'block' : 'none'; p.k.style.display = isG ? 'block' : 'none';
        });
        stR.style.opacity = lt >= HALF + 0.3 ? 1 : 0; stR.style.transform = `scale(${E.back(prog(lt, HALF + 0.3, 0.25))})`;
        stL.style.opacity = lt >= HALF + 0.65 ? 1 : 0; stL.style.transform = `scale(${E.back(prog(lt, HALF + 0.65, 0.25))})`;
      }
      if (M === 'E') nameEl.style.transform = `scale(${E.back(prog(lt, L2 + 0.1, 0.3))})`;

      // ── para: açılışta ortada; kazanınca Ceviz'e kayar; soruda yine ortada ──
      const wp = WON ? E.inOut(prog(lt, WIN, 0.5)) : 0, cp = Q ? E.inOut(prog(lt, CTA, 0.45)) : 0;
      notes.forEach((n, i) => {
        const k = Q ? 1 - cp : wp;
        const x = lerp(469, 228, k), y = 1191 - i * 12 - Math.sin((Q ? cp : wp) * Math.PI) * (26 + i * 5);
        n.style.transform = `translate(${x}px,${y}px) rotate(${Math.sin((Q ? cp : wp) * Math.PI) * (i % 2 ? 7 : -7)}deg)`;
      });
      glintBar.style.transform = `translateX(${lerp(-60, 200, prog(lt, 0.4, 0.5))}px) rotate(24deg)`;
      glint.style.display = lt < 1.0 ? 'block' : 'none';
      total.style.display = (lt < WIN && (lt < RULES || lt >= ASK)) || (Q && cp > 0.5) ? 'block' : 'none';
      winL.style.display = WON && wp > 0.7 && lt < SAD ? 'block' : 'none';
      winL.style.transform = `scale(${E.back(prog(lt, WIN + 0.4, 0.25))})`;
      zeroL.style.display = WON && lt >= WIN + 0.55 && lt < SAD ? 'block' : 'none';
      zeroL.style.transform = `scale(${E.back(prog(lt, WIN + 0.55, 0.25))})`;
      ask.style.display = 'none';
      ask.style.transform = `scale(${E.back(prog(lt, CTA + 0.3, 0.3)) * (1 + 0.06 * Math.sin(lt * 6))})`;
      // defter: sonuç harf harf yazılır; soruda boş sayfa
      const typed = (txt, a) => txt.slice(0, Math.floor(prog(lt, a, 0.45) * txt.length));
      la.textContent = Q ? typed('CEVİZ ?', CTA + 0.3) : lt >= WIN ? typed('CEVİZ 1.000', WIN + 0.3) : '';
      lb.textContent = Q ? typed('PAMUK ?', CTA + 0.45) : lt >= WIN ? typed('PAMUK 0', WIN + 0.6) : '';

      // ── düğmeler: "Paylaş, ya da çal"da sırayla yanar ──
      const glowAmt = (t, d) => { const g = Math.sin(Math.PI * prog(lt, t, d)); return g > 0 ? g : 0; };
      const gs = glowAmt(REVEAL + 0.1, 0.6), gc = glowAmt(REVEAL + 0.7, 0.6);
      [capCS, capPS].forEach((c) => (c.style.filter = gs > 0 ? `drop-shadow(0 0 ${24 * gs}px #7CF2A8)` : 'none'));
      [capCC, capPC].forEach((c) => (c.style.filter = gc > 0 ? `drop-shadow(0 0 ${24 * gc}px #FF8A7A)` : 'none'));
      const press = (t) => (lt >= t && lt < t + 0.5 ? 12 : 0);
      capPS.style.transform = `translateY(${Q ? 0 : press(ZERO)}px)`;
      capCC.style.transform = `translateY(${Q ? 0 : press(ZERO)}px)`;
      // pati: "Paylaş mı"da PAYLAŞ'a, "çal mı"da ÇAL'a; sayımda kararsız gidip gelir; sonda PAYLAŞ'a basar
      const KP = o.pw ?? ASK + 1.0, KC = o.cw ?? ASK + 1.7;
      let pv = false, ppx = 870, ppy = 1276;
      if (lt >= KP - 0.15 && lt < ZERO + 0.5 && !Q) {
        pv = true;
        ppy = 1272 + Math.sin(lt * 7) * 6;
        const sway = (Math.cos((lt - COUNT) * 2.6) + 1) / 2;  // 1: ÇAL'ın üstünde
        if (lt < KC - 0.1) ppx = lerp(870, BX.ps, E.out(prog(lt, KP - 0.15, 0.3)));
        else if (lt < COUNT) ppx = lerp(BX.ps, BX.pc, E.inOut(prog(lt, KC - 0.1, 0.35)));
        else if (lt < COUNT + 2.2) ppx = lerp(BX.ps, BX.pc, sway);
        else ppx = lerp(lerp(BX.ps, BX.pc, (Math.cos(2.2 * 2.6) + 1) / 2), BX.ps, E.out(prog(lt, COUNT + 2.2, 0.35))) + Math.sin(lt * 40) * 3;
        const g = prog(lt, ZERO - 0.3, 0.3);
        ppy = lerp(ppy, 1302, g * g);
        if (lt >= ZERO) ppy = 1302 - 56 * E.out(prog(lt, ZERO + 0.15, 0.3));
      }
      paw.style.display = arm.style.display = pv ? 'block' : 'none';
      paw.style.transform = `translate(${ppx - 35}px,${ppy - 70}px)`;
      const ax = 850, ay = 1236, bx = ppx, by = ppy - 36, len = Math.hypot(bx - ax, by - ay);
      arm.style.width = px(len); arm.style.transform = `translate(${ax}px,${ay - 10}px) rotate(${Math.atan2(by - ay, bx - ax)}rad)`;
      confetti.update(Q ? -1 : lt);

      // ── karar anı: gerçek 3 saniyelik sayım ──
      const cd = lt >= COUNT && lt < ZERO;
      cdg.style.display = cd ? 'flex' : 'none';
      if (cd) {
        const k = prog(lt, COUNT, ZERO - COUNT), st = Math.min(2, Math.floor(lt - COUNT)), loc = lt - COUNT - st;
        ring.style.background = `conic-gradient(#E04A3A ${360 * (1 - k)}deg, rgba(255,255,255,.18) 0)`;
        num.textContent = String(3 - st);
        num.style.transform = `scale(${1 + 0.35 * (1 - E.out(Math.min(1, loc * 4)))})`;
        cdg.style.opacity = Math.min(1, (lt - COUNT) * 8);
      }

      // ── oyuncular ──
      let c = ['happy', null, 'half'], p = ['calm', null, 'mood'];
      if (lt >= REVEAL) { c = ['curious', null, 'wide']; p = ['curious', null, 'wide']; }
      if (lt >= REVEAL + 0.5) { c = ['happy', null, 'half']; p = ['calm', null, 'mood']; }
      if (lt >= RULES + 0.3) { c = ['happy', 'up', 'happy']; p = ['happy', 'up', 'happy']; }
      if (lt >= R2) { c = ['happy', 'face', 'half']; p = ['curious', null, 'wide']; }
      if (lt >= R3) { c = ['curious', null, 'wide']; p = ['thoughtful', null, 'squeeze']; }
      if (lt >= PROMISE) { c = ['happy', Math.floor(lt / 0.2) % 2 ? 'wave' : 'wave2', 'happy']; p = ['curious', null, 'mood']; }
      if (lt >= TRUST) { c = ['happy', null, 'half']; p = ['happy', null, 'happy']; }
      if (lt >= ASK + 0.5) p = ['thoughtful', null, 'half'];
      if (lt >= KP) p = ['thoughtful', null, 'mood'];
      if (lt >= KC) p = ['thoughtful', null, 'half'];
      if (lt >= COUNT) p = ['thoughtful', 'face', 'squeeze'];
      if (lt >= COUNT + 2.2) p = ['curious', null, 'wide'];
      if (lt >= ZERO - 0.3) p = ['calm', null, 'squeeze'];
      if (lt >= ZERO) { c = ['calm', null, 'half']; p = ['calm', null, 'mood']; }
      if (lt >= PF + 0.15) p = ['happy', 'up', 'happy'];
      if (lt >= CF) { c = ['celebrate', 'up', 'happy']; p = ['curious', 'up', 'x']; }
      if (lt >= WIN + 0.9) p = ['thoughtful', null, 'squeeze'];
      if (lt >= SCI) c = ['happy', null, 'half'];
      if (lt >= LESSON) c = ['celebrate', Math.floor(lt / 0.2) % 2 ? 'wave' : 'wave2', 'happy'];
      if (lt >= L2) c = ['curious', null, 'wide'];
      if (lt >= L2 + 0.9) c = ['thoughtful', null, 'squeeze'];
      if (Q) { c = ['curious', null, 'mood']; p = ['thoughtful', null, 'mood']; }
      if (lt >= FOLLOW) { c = ['happy', null, 'mood']; p = ['happy', 'up', 'happy']; }
      const bl = (e, off) => (e === 'mood' && ((lt + off) * 1000) % 2900 < 120 ? 'closed' : e);
      cz.set(c[0], c[1], bl(c[2], 0.3)); pm.set(p[0], p[1], bl(p[2], 1.1));
      const lightC = 0.5 + 0.5 * on, tense = lt >= COUNT && lt < ZERO ? 1 - 0.16 * prog(lt, COUNT, ZERO - COUNT) : 1;
      cz.root.style.filter = `brightness(${lightC.toFixed(3)})`;
      pm.root.style.filter = `brightness(${(lightC * tense).toFixed(3)})`;
      let cx = 230, cy = 1310, cr = Math.sin(lt * 1.4) * 2, pxx = 850, py = 1310, pr = Math.sin(lt * 1.2 + 1) * 2;
      if (lt >= REVEAL && lt < REVEAL + 0.5) { const k = lt - REVEAL; cr -= 6 * Math.exp(-k * 6) * Math.sin(k * 20); pr += 6 * Math.exp(-k * 6) * Math.sin(k * 20); }
      if (lt >= RULES + 0.3 && lt < R2) { cy -= hop(lt, 0.46, 14).y; py -= hop(lt, 0.46, 14, 0.23).y; }
      if (lt >= PROMISE && lt < TRUST) cr = Math.sin(lt * 9) * 3;
      if (lt >= PF + 0.15 && lt < CF) py -= hop(lt - PF, 0.4, 16).y;
      if (lt >= CF && lt < SCI) { cy -= hop(lt - CF, 0.42, 26).y; const k = lt - CF; pr = 9 * Math.exp(-k * 3) * Math.cos(k * 14); pxx += 16 * Math.exp(-k * 2); }
      if (lt >= WIN + 0.9 && lt < L2) { py += 14; pr = Math.sin(lt * 9) * 1.2; }  // omuzlar düşer, hıçkırır
      if (lt >= LESSON && lt < L2) cy -= hop(lt - LESSON, 0.4, 20).y;
      if (lt >= L2 - 0.45 && !Q) { const k = E.inOut(prog(lt, L2 - 0.45, 0.6)); pxx = lerp(850, 1340, k); py = 1324 - 4 * 40 * (k * 3 % 1) * (1 - (k * 3 % 1)); }  // Pamuk zıplayarak masadan ayrılır
      if (Q) { const k = E.out(prog(lt, CTA, 0.45)); pxx = lerp(1340, 850, k); py = 1310 - 4 * 30 * k * (1 - k); cr = Math.sin(lt * 2.4) * 4; pr = Math.sin(lt * 2.4 + 1.2) * 4; }
      if (lt >= L2 && !Q) cr = Math.sin(lt * 1.1) * 1.5;
      cz.put(cx, cy, { rot: cr }); pm.put(pxx, py, { rot: pr, flip: lt >= L2 - 0.45 && !Q });
      // balon, ünlem, kırık kalp, gözyaşı, ter
      const bOn = lt >= SAY && lt < ASK;
      bub.style.display = bOn ? 'block' : 'none';
      if (bOn) bub.style.transform = `scale(${E.back(prog(lt, SAY, 0.25))}) rotate(${Math.sin(lt * 3) * 1.5}deg)`;
      const bg = lt >= CF + 0.05 && lt < WIN;
      bang.style.display = bg ? 'block' : 'none';
      if (bg) bang.style.transform = `scale(${E.back(prog(lt, CF + 0.05, 0.2))}) rotate(8deg)`;
      const hOn = lt >= WIN + 0.5 && lt < L2 - 0.45;
      heart.style.display = hOn ? 'block' : 'none';
      if (hOn) {
        const k = lt - WIN - 0.5, crack = E.out(prog(k, 0.45, 0.4));
        heart.style.transform = `translateY(${-10 * Math.sin(lt * 3)}px) scale(${E.back(prog(k, 0, 0.25))})`;
        hL.style.transform = `translate(${-10 * crack}px,${6 * crack}px) rotate(${-16 * crack}deg)`;
        hR.style.transform = `translate(${10 * crack}px,${6 * crack}px) rotate(${16 * crack}deg)`;
      }
      tears.forEach((t) => {
        const k = (((lt - WIN - 1.0 + t.ph) % 0.9) + 0.9) % 0.9 / 0.9, tOn = lt >= WIN + 1.0 && lt < L2 - 0.45;
        t.e.style.display = tOn ? 'block' : 'none';
        t.e.style.transform = `translate(${t.x}px,${1150 + 96 * k * k}px)`;
        t.e.style.opacity = 1 - k * k;
      });
      const swOn = lt >= L2 + 0.9 && !Q;
      sweat.style.display = swOn ? 'block' : 'none';
      if (swOn) { const k = (((lt - L2 - 0.9) % 1.0) + 1.0) % 1.0; sweat.style.transform = `translate(${372}px,${1010 + 110 * k * k}px)`; sweat.style.opacity = 1 - k * k; }
      // seyirci: ihanette yerinden sıçrar
      crowd.forEach((h) => { const j = lt >= CF ? 34 * Math.exp(-(lt - CF) * 3) * Math.abs(Math.sin((lt - CF) * 9 + h.ph)) : 0; h.e.style.transform = `translateY(${Math.sin(lt * 1.6 + h.ph) * 5 - j}px)`; });

      // ── takip kartı: FOLLOW'da açılır; TAPF'de Pamuk'un patisi "Takip et"e basar ──
      const OFF = DIM + 0.1;
      const fOn = lt >= FOLLOW && lt < OFF;
      fcard.style.display = fOn ? 'block' : 'none';
      if (fOn) popIn(fcard, prog(lt, FOLLOW, 0.35), { fromY: -60 });
      const followed = lt >= TAPF + 0.02;
      fbtn.textContent = followed ? 'Takip ediliyor' : 'Takip et';
      fbtn.style.background = followed ? '#EFEFEF' : '#0095F6';
      fbtn.style.color = followed ? '#141414' : '#FFFFFF';
      const fd = lt - TAPF + 0.45;
      fbtn.style.transform = `scale(${fd >= 0.42 && fd < 0.55 ? 0.94 : followed ? 1 + 0.08 * Math.sin(Math.PI * prog(fd, 0.55, 0.25)) : 1 + 0.03 * Math.sin(lt * 8)})`;
      const ftap = fOn && fd >= 0.1 && fd < 0.95;
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
