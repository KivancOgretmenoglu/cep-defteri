/* Sahne serisi: Bedava sihirbazı (sıfır fiyat etkisi; Shampanier, Mazar ve Ariely 2007, Ariely 2008).
 * Sihir şovu: kırmızı kadife perde, altın saçaklı drape, spotlar, sahne tahtası ve ön ışıklar, seyirci başları.
 * Silindir şapkalı sihirbaz Diken (değnekli), gönüllü Ceviz; ortada mor örtülü masa: 15 TL'lik trüf, 1 TL'lik şeker.
 * Ceviz trüfü seçer. "Abrakadabra!": değnek kalkar, duman; etiketler 1'er lira düşer: 14 TL ve BEDAVA (yeşil, parlıyor).
 * Gerçek 3 sn karar anı (TRÜF mü, ŞEKER mi?): Ceviz'in patisi iki etiket arasında gider gelir. Ceviz bedavaya koşar.
 * Pano: ÖNCE 15 − 1 = 14, SONRA 14 − 0 = 14 (fark aynı). Araştırma kartı: şekeri seçenler %27 → %69. Panoya BEDAVA!
 * çıkartması yapışır (hesap durur). Kapanış: masada Cep Defteri satırı "Bedava kargo −250 TL"; takip kartı; döngü.
 * Olaylar: p15, p1, pick, abra, poof, ask, count, zero, fark, f14, sci, s27, s69, bedava, cta, follow, tapf, dim.
 * Ses takvimi audio.py'deki cue_sihir ile aynı. */
const SH_TOPHAT = ['...ooooooooo...', '...oKKKKKKKo...', '...oKHKKKKKo...', '...oKHKKKKKo...', '...oKKKKKKKo...', '...orrrrrrro...', '...oKKKKKKKo...', 'oKKKKKKKKKKKKKo', '.ooooooooooooo.'];
const SH_TOPHAT_C = { o: '#16110F', K: '#2E2A34', H: '#5E5868', r: '#C0392B' };
const SH_TRUF = ['...ooooo...', '..oCCcCCo..', '.oCcCCCcCo.', '.oCCCcCCCo.', '.oCcCCCCco.', '..oCCCCCo..', '.oGgGgGgGo.', '..oGgGgGo..', '...ooooo...'];
const SH_TRUF_C = { o: '#2A1E1A', C: '#5A3218', c: '#8A5A36', G: '#F2B63C', g: '#C9962E' };
const SH_SEKER = ['oo.........oo', 'oPo.ooooo.oPo', 'oPPoRWRRWoPPo', 'oPPoRRWRRoPPo', 'oPPoRWRRWoPPo', 'oPo.ooooo.oPo', 'oo.........oo'];
const SH_SEKER_C = { o: '#2A1E1A', P: '#F49AB6', R: '#E04A3A', W: '#FFF4F0' };
const SH_SPARK = ['..o..', '..o..', 'oo.oo', '..o..', '..o..'];

function defineSihir() {
  SCENES.sihir = (t0, o = {}) => {
    const s = scene(t0, '#160509', undefined, o.wdur ?? 0.4);
    s.root.style.isolation = 'isolate';  // z-index'li katmanlar döngü sahnesinin üstüne binmesin
    const ev = (k) => o[k] ?? 99;
    const P15 = ev('p15'), P1 = ev('p1'), PICK = ev('pick'), ABRA = ev('abra'), POOF = ev('poof'), ASK = ev('ask'), COUNT = ev('count'), ZERO = ev('zero');
    const FARK = ev('fark'), F14 = ev('f14'), SCI = ev('sci'), S27 = ev('s27'), S69 = ev('s69'), BEDAVA = ev('bedava');
    const CTA = ev('cta'), FOLLOW = ev('follow'), TAPF = ev('tapf'), DIM = ev('dim');
    const SY = 1150, FL = 1440;  // odak yüksekliği; sahne tahtası (ayak hizası)
    const INK = '#2A1E1A', GOLD = '#F2B63C', BRASS = '#C9962E', RED = '#C0392B', GREEN = '#2F8F5A';
    const outline = (c, w = 5) => `${w}px 0 0 ${c}, -${w}px 0 0 ${c}, 0 ${w}px 0 ${c}, 0 -${w}px 0 ${c}`;
    const ramp = (lt, a, d) => E.inOut(prog(lt, a, d));
    const TX = 488, CX = 640, ITY = 1240, DX = 290, CZX = 815;  // trüf, şeker, masa üstü; Diken ve Ceviz  // trüf ve şekerin masa üstündeki yeri

    // ── kamera katmanı ──
    const cam = el('div', 'abs', s.root, { left: 0, top: 0, width: '1080px', height: '1920px', transformOrigin: '0 0' });
    // perde: kadife kıvrımlar, üstte gölge
    el('div', 'abs', cam, { left: '-800px', top: '-1000px', width: '2700px', height: px(FL + 1000), background: 'repeating-linear-gradient(90deg, #5E0C1A 0 26px, #86162A 26px 62px, #9E2034 62px 78px, #6A0F1F 78px 108px)' });
    el('div', 'abs', cam, { left: '-800px', top: '-1000px', width: '2700px', height: px(FL + 1000), background: 'linear-gradient(rgba(10,2,6,.75), rgba(10,2,6,0) 42%, rgba(10,2,6,0) 70%, rgba(10,2,6,.55))' });
    // üst drape: altın saçaklı, dalgalı alt kenar
    el('div', 'abs', cam, { left: '-800px', top: '-200px', width: '2700px', height: '520px', background: 'linear-gradient(#4A0814, #7A1326)' });
    el('div', 'abs', cam, { left: '-800px', top: '318px', width: '2700px', height: '60px', background: 'radial-gradient(circle at 60px -6px, #7A1326 54px, transparent 55px) 0 0 / 120px 60px repeat-x' });
    el('div', 'abs', cam, { left: '-800px', top: '304px', width: '2700px', height: '14px', background: GOLD, boxShadow: `0 4px 0 ${BRASS}` });
    el('div', 'abs', cam, { left: '-800px', top: '362px', width: '2700px', height: '22px', background: `repeating-linear-gradient(90deg, ${GOLD} 0 6px, transparent 6px 14px)`, opacity: 0.85 });
    // üç spot: Diken'e, masaya, Ceviz'e
    const beam = (x, bx, half, col) => el('div', 'abs', cam, { left: px(Math.min(x, bx) - half), top: '380px', width: px(Math.abs(bx - x) + half * 2), height: px(FL + 60 - 380), clipPath: x < bx ? `polygon(${half - 30}px 0, ${half + 30}px 0, 100% 100%, ${Math.abs(bx - x)}px 100%)` : `polygon(calc(100% - ${half + 30}px) 0, calc(100% - ${half - 30}px) 0, calc(100% - ${Math.abs(bx - x)}px) 100%, 0 100%)`, background: `linear-gradient(${col}, rgba(255,255,255,0))`, pointerEvents: 'none' });
    const bL = beam(120, 240, 190, 'rgba(255,224,170,.30)'), bM = beam(560, 560, 170, 'rgba(255,236,190,.34)'), bR = beam(1000, 880, 190, 'rgba(255,214,170,.30)');
    // sahne tahtası, ön kenar ve ön ışıklar, orkestra çukuru, seyirci
    el('div', 'abs', cam, { left: '-800px', top: px(FL - 20), width: '2700px', height: '180px', background: 'repeating-linear-gradient(#6E4224 0 30px, #5E371D 30px 34px)' });
    el('div', 'abs', cam, { left: '-800px', top: px(FL + 156), width: '2700px', height: '22px', background: '#3A2414', borderTop: `6px solid ${BRASS}` });
    const foot = Array.from({ length: 16 }, (_, i) => el('div', 'abs', cam, { left: px(-180 + i * 92), top: px(FL + 144), width: '34px', height: '18px', borderRadius: '17px 17px 4px 4px', background: '#FFE9A8', boxShadow: '0 -10px 26px 8px rgba(255,220,140,.45)' }));
    el('div', 'abs', cam, { left: '-800px', top: px(FL + 178), width: '2700px', height: '700px', background: 'linear-gradient(#12060A, #050204)' });
    const crowd = [-90, 90, 270, 450, 630, 810, 990, 1170].map((x, i) => ({ e: pixEl(cam, HEAD, { o: '#050204', r: '#4A1C2A' }, 17, { left: px(x), top: px(FL + 205 + (i % 2) * 20) }), ph: i * 1.3 }));
    // masa: mor kadife örtü, altın saçak, önünde yıldız ve "BÜYÜK DİKEN"
    el('div', 'abs', cam, { left: '330px', top: px(ITY - 6), width: '460px', height: px(FL - ITY + 6), background: 'linear-gradient(#5A2A86, #3E1C60)', clipPath: 'polygon(6% 0, 94% 0, 100% 100%, 0 100%)' });
    el('div', 'abs', cam, { left: '330px', top: px(FL - 34), width: '460px', height: '34px', background: `repeating-linear-gradient(90deg, ${GOLD} 0 8px, ${BRASS} 8px 16px)`, clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)' });
    pixEl(cam, ['....o....', '...oYo...', 'ooooYoooo', 'oYYYYYYYo', '.oYYYYYo.', '..oYYYo..', '.oYYoYYo.', 'oYYo.oYYo', 'ooo...ooo'], { o: INK, Y: GOLD }, 12, { left: '506px', top: px(ITY + 30) });
    el('div', 'abs it', cam, { left: '330px', width: '460px', top: px(ITY + 136), textAlign: 'center', fontSize: '50px', color: GOLD, textShadow: `3px 3px 0 ${INK}` }).textContent = 'BÜYÜK DİKEN';
    el('div', 'abs', cam, { left: '318px', top: px(ITY - 34), width: '484px', height: '58px', borderRadius: '50%', background: 'radial-gradient(ellipse at 50% 40%, #7A44AE, #4E2478)', boxShadow: `0 0 0 5px ${INK}` });

    // ── oyuncular: sihirbaz Diken (silindir şapka, değnek), gönüllü Ceviz ──
    const DW = 390, CW = 372;
    const dk = new Mascot(cam, { who: 'diken', w: DW });
    const hat = el('div', 'abs', cam, { width: px(DW), height: px((DW * 30) / 32), transformOrigin: '50% 100%', pointerEvents: 'none' });
    pixEl(hat, SH_TOPHAT, SH_TOPHAT_C, DW / 32, { left: px((9 * DW) / 32), top: px((-0.5 * DW) / 32) });
    const wand = el('div', 'abs', cam, { left: 0, top: 0, width: '190px', height: '20px', borderRadius: '10px', background: 'linear-gradient(90deg, #1A1418 0 74%, #FFFFFF 74%)', boxShadow: `0 0 0 5px ${INK}, 0 0 14px 2px rgba(255,240,200,.35)`, transformOrigin: '10px 10px', zIndex: 5 });
    const sparks = Array.from({ length: 8 }, (_, i) => ({ e: pixEl(cam, SH_SPARK, { o: i % 2 ? '#FFE9A8' : '#FFFFFF' }, 12, { left: 0, top: 0, display: 'none', zIndex: 6, filter: 'drop-shadow(0 0 8px rgba(255,236,170,.9))' }), ph: i / 8 }));
    const cz = new Mascot(cam, { who: 'ceviz', w: CW });
    const arm = el('div', 'abs', cam, { left: 0, top: 0, width: '30px', height: '12px', background: '#C27F48', border: `5px solid ${INK}`, borderRadius: '16px', transformOrigin: '0 50%', display: 'none' });
    const paw = pixEl(cam, PAWP, { o: INK, B: '#C27F48' }, 10, { left: 0, top: 0, display: 'none' });

    // ── masadakiler: trüf, şeker, fiyat kartları ──
    const truf = pixEl(cam, SH_TRUF, SH_TRUF_C, 13, { left: px(TX - 72), top: px(ITY - 117) });
    const seker = pixEl(cam, SH_SEKER, SH_SEKER_C, 12, { left: 0, top: 0 });
    const tag = (cx, name) => {
      const e = el('div', 'abs', cam, { left: px(cx - 86), top: px(ITY - 268), width: '172px', height: '132px', boxSizing: 'border-box', background: '#FFFDF4', border: `6px solid ${INK}`, borderRadius: '14px', textAlign: 'center', transformOrigin: '50% 100%' });
      el('div', 'it', e, { fontSize: '36px', lineHeight: '38px', color: '#6E5A4A', marginTop: '2px' }).textContent = name;
      const old = el('div', 'abs it', e, { left: 0, right: 0, top: '30px', fontSize: '34px', color: '#9A8A7A', textDecoration: 'line-through', textDecorationThickness: '4px', textDecorationColor: RED, display: 'none' });
      const val = el('div', 'abs it', e, { left: 0, right: 0, top: '54px', fontSize: '66px', lineHeight: '64px', color: RED });
      el('div', 'abs', e, { left: '76px', top: '124px', width: '8px', height: '30px', background: INK });  // ayak
      return { e, old, val };
    };
    const tT = tag(TX, 'TRÜF'), tC = tag(CX, 'ŞEKER');
    const smoke = Array.from({ length: 10 }, (_, i) => el('div', 'abs', cam, { left: 0, top: 0, width: px(70 + (i % 3) * 30), height: px(70 + (i % 3) * 30), borderRadius: '50%', background: 'rgba(235,228,240,.85)', display: 'none' }));
    const magic = new Burst(cam, { n: 34, t0: POOF, ox: 560, oy: ITY - 200, colors: ['#FFE9A8', '#FFFFFF', '#F49AB6', '#7CE3A0'], speed: 820, grav: 900, life: 1.1, size: [10, 20], upBias: 0.3 });
    const confetti = new Burst(cam, { n: 30, t0: ZERO + 0.15, ox: CX + 40, oy: ITY - 180, colors: ['#F2B63C', '#7CE3A0', '#E04A3A', '#F49AB6'], speed: 760, grav: 1900, life: 1.2, size: [12, 24], upBias: 0.6 });
    const yay = el('div', 'abs it', cam, { left: px(CZX - 200), width: '400px', top: '0px', textAlign: 'center', fontSize: '96px', color: '#7CE3A0', textShadow: outline(INK, 6), display: 'none', transformOrigin: '50% 100%' });
    yay.textContent = 'BEDAVA!';
    const check = pixEl(cam, ['.......oo', '......oGo', '.....oGo.', 'oo..oGo..', 'oGooGo...', '.oGGo....', '..oo.....'], { o: INK, G: '#7CE3A0' }, 11, { left: px(TX - 50), top: px(ITY - 352), display: 'none', transformOrigin: '50% 100%' });
    // Cep Defteri satırı (kapanış)
    const led = el('div', 'abs', cam, { left: px(560 - 240), top: px(ITY + 50), width: '480px', height: '148px', boxSizing: 'border-box', background: 'repeating-linear-gradient(#FFFDF4 0 47px, #BFD3EA 47px 49px)', border: `6px solid ${INK}`, borderRadius: '12px', padding: '4px 16px', display: 'none', transformOrigin: '50% 50%' });
    led.innerHTML = `<div style="font-size:32px;font-weight:800;color:#AE4716;letter-spacing:.05em;line-height:48px">CEP DEFTERİ</div><div class="it lr" style="font-size:52px;color:${RED};line-height:76px;white-space:nowrap"></div>`;
    const ledRow = led.querySelector('.lr');

    // ── ekran katmanları: kenar karartma, pano, araştırma kartı, sayaç, flaş, takip kartı ──
    el('div', 'abs', s.root, { inset: 0, zIndex: 9, pointerEvents: 'none', background: 'radial-gradient(ellipse 96% 70% at 50% 56%, transparent 58%, rgba(8,1,4,.6) 100%)' });
    el('div', 'abs', s.root, { left: 0, right: 0, top: 0, height: '300px', zIndex: 9, pointerEvents: 'none', background: 'linear-gradient(rgba(8,1,4,.55), rgba(8,1,4,0))' });
    // fark panosu: iki satır, "14"ler altın; BEDAVA çıkartması
    const board = el('div', 'abs it', s.root, { left: '150px', top: '722px', width: '780px', height: '196px', boxSizing: 'border-box', borderRadius: '22px', background: 'rgba(14,6,20,.9)', border: `6px solid ${BRASS}`, boxShadow: '0 12px 30px rgba(0,0,0,.4)', display: 'none', zIndex: 15, transformOrigin: '50% 0', overflow: 'hidden', color: '#FFFFFF' });
    const brow = (top, lab, a, b, r) => {
      const e = el('div', 'abs', board, { left: '28px', right: '28px', top: px(top), height: '84px', display: 'flex', alignItems: 'baseline', gap: '18px', fontSize: '74px', whiteSpace: 'nowrap' });
      el('span', '', e, { fontSize: '44px', color: '#B9A8D0', width: '170px', display: 'inline-block' }).textContent = lab;
      const eqs = el('span', '', e);
      eqs.innerHTML = `${a} − ${b} = <span class="r" style="color:${GOLD}">${r} TL</span>`;
      return { e, r: eqs.querySelector('.r') };
    };
    const r1 = brow(10, 'ÖNCE', '15', '1', '14'), r2 = brow(96, 'SONRA', '14', '0', '14');
    const sticker = el('div', 'abs it', s.root, { left: '250px', top: '754px', width: '580px', height: '130px', borderRadius: '20px', background: GREEN, border: `7px solid ${INK}`, boxSizing: 'border-box', textAlign: 'center', fontSize: '112px', lineHeight: '112px', color: '#FFFFFF', textShadow: `5px 5px 0 ${INK}`, display: 'none', zIndex: 16, transformOrigin: '50% 50%' });
    sticker.textContent = 'BEDAVA!';
    // araştırma kartı: şekeri seçenler 1 TL iken %27, bedava iken %69
    const card = el('div', 'abs', s.root, { left: '150px', top: '722px', width: '780px', boxSizing: 'border-box', borderRadius: '22px', background: 'rgba(8,10,30,.9)', border: `5px solid ${INK}`, boxShadow: '0 12px 30px rgba(0,0,0,.35)', display: 'none', zIndex: 15, transformOrigin: '50% 0', overflow: 'hidden' });
    el('div', 'it', card, { background: GREEN, color: '#FFFFFF', textAlign: 'center', fontSize: '56px', lineHeight: '68px', textShadow: `3px 3px 0 ${INK}` }).textContent = 'ŞEKERİ SEÇENLER';
    const crow = (top, lab, col) => {
      const e = el('div', 'abs it', card, { left: '26px', right: '26px', top: px(top), height: '64px' });
      el('div', 'abs', e, { left: 0, top: '6px', width: '230px', fontSize: '46px', color: '#FFFFFF' }).textContent = lab;
      const bg = el('div', 'abs', e, { left: '236px', right: '150px', top: '20px', height: '30px', borderRadius: '15px', background: 'rgba(255,255,255,.14)', overflow: 'hidden' });
      const bar = el('div', 'abs', bg, { left: 0, top: 0, bottom: 0, width: 0, borderRadius: '15px', background: col });
      const n = el('div', 'abs', e, { right: 0, top: '-6px', width: '140px', textAlign: 'right', fontSize: '74px', color: col });
      return { bar, n };
    };
    const c1 = crow(76, '1 TL iken', '#FFB35A'), c2 = crow(142, 'BEDAVA iken', '#7CE3A0');
    el('div', '', card, { height: '148px' });
    const src = el('div', 'abs', s.root, { left: 0, right: 0, top: '1462px', textAlign: 'center', fontSize: '28px', fontWeight: 800, color: '#FFFFFF', textShadow: `0 3px 0 ${INK}, 0 0 8px rgba(0,0,0,.6)`, display: 'none', zIndex: 15 });
    src.textContent = 'Kaynak: Ariely 2008 · Shampanier, Mazar ve Ariely 2007';
    const dark = el('div', 'abs', s.root, { inset: 0, zIndex: 18, pointerEvents: 'none', background: '#08020A', opacity: 0 });
    const flash = el('div', 'abs', s.root, { inset: 0, zIndex: 21, opacity: 0, pointerEvents: 'none', background: '#FFFFFF' });
    const cdg = el('div', 'abs', s.root, { left: 0, right: 0, top: '548px', display: 'none', justifyContent: 'center', alignItems: 'center', zIndex: 24 });
    const ring = el('div', '', cdg, { position: 'relative', width: '156px', height: '156px', borderRadius: '50%', flex: 'none' });
    const num = el('div', 'abs it', ring, { left: '15px', top: '15px', width: '126px', height: '126px', borderRadius: '50%', background: 'rgba(14,6,20,.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '112px', color: '#fff' });
    const pill = el('div', 'it', cdg, { marginLeft: '18px', padding: '6px 26px 12px', background: 'rgba(14,6,20,.9)', border: `4px solid ${GOLD}`, borderRadius: '16px', textAlign: 'left', lineHeight: 1.05 });
    pill.innerHTML = `<div style="font-size:82px;color:#fff">KARAR VER</div><div style="font-size:58px;color:${GOLD}">T mi, Ş mi? Yoruma yaz</div>`;
    const FWD = 620, FT = 300;
    const fcard = el('div', 'abs', s.root, { left: px((1080 - FWD) / 2), top: px(FT), width: px(FWD), height: '410px', borderRadius: '44px', background: '#FFFFFF', boxShadow: '0 24px 60px rgba(0,0,0,.45)', display: 'none', zIndex: 26, transformOrigin: '50% 50%', textAlign: 'center' });
    const ficon = el('img', 'abs', fcard, { left: px(FWD / 2 - 68), top: '34px', width: '136px', height: '136px', borderRadius: '50%', boxShadow: '0 0 0 4px #FFFFFF, 0 0 0 8px #E9E2D8' });
    ficon.src = 'assets/icon.png';
    el('div', 'abs', fcard, { left: 0, right: 0, top: '186px', fontSize: '50px', fontWeight: 800, color: '#141414', letterSpacing: '-.01em' }).textContent = 'cep_defteri';
    el('div', 'abs', fcard, { left: 0, right: 0, top: '252px', fontSize: '32px', fontWeight: 600, color: '#5E5650' }).textContent = 'Her hafta bir para tuzağı';
    const fbtn = el('div', 'abs', fcard, { left: '44px', right: '44px', top: '310px', height: '72px', borderRadius: '18px', background: '#0095F6', color: '#FFFFFF', fontSize: '38px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', transformOrigin: '50% 50%' });
    const FBX = 740, FBY = FT + 310 + 36;
    const fpaw = pixEl(s.root, PAWP, { o: INK, B: '#C27F48' }, 16, { left: 0, top: 0, display: 'none', zIndex: 27, transformOrigin: '50% 30%' });
    const fring = el('div', 'abs', s.root, { left: px(FBX - 60), top: px(FBY - 60), width: '120px', height: '120px', boxSizing: 'border-box', borderRadius: '50%', border: '8px solid rgba(0,149,246,.75)', display: 'none', zIndex: 27 });

    // kalp atışları (audio.py ile aynı takvim)
    const beats = [];
    for (let t = ASK + 0.15, k = 0; t < ZERO - 0.1; t += Math.max(0.42, 0.62 - 0.03 * k), k++) beats.push(t);
    const blinkE = (e, lt, off) => (e === 'mood' && ((lt + off) * 1000) % 2900 < 120 ? 'closed' : e);
    const typed = (lt, txt, a, d = 0.5) => txt.slice(0, Math.floor(prog(lt, a, d) * txt.length));

    s.update = (lt) => {
      const Q = lt >= CTA;
      const counting = lt >= COUNT && lt < ZERO;
      const GOT = lt >= ZERO;  // şeker Ceviz'de
      let beat = -9;
      beats.forEach((t) => { if (lt >= t) beat = t; });

      // ── kamera planları ──
      let z = 1.36, fx = 575, fy = 1200;
      if (lt < ABRA) { z = 1.36 + 0.03 * prog(lt, 0, ABRA); fx = lerp(575, 600, ramp(lt, PICK - 0.2, 0.5)); }                                                                   // kanca: masa, iki etiket
      else if (lt < POOF) { const q = ramp(lt, ABRA, 0.45); fx = lerp(600, 400, q); fy = lerp(1200, 1130, q); z = lerp(1.39, 1.45, q); }  // değnek kalkar
      else if (lt < ASK) { const q = E.out(prog(lt, POOF, 0.3)); fx = lerp(380, 560, q); fy = lerp(1150, 1215, q); z = lerp(1.45, 1.4, q); }  // duman, yeni fiyatlar
      else if (lt < COUNT) { const q = ramp(lt, ASK, 0.45); fx = lerp(560, 640, q); fy = 1215; z = lerp(1.4, 1.38, q); }        // soru
      else if (lt < ZERO) { fx = 640; fy = 1215; z = 1.38 + 0.14 * ramp(lt, COUNT, ZERO - COUNT); }                             // karar
      else if (lt < FARK) { const q = ramp(lt, ZERO, 0.4); fx = lerp(640, 660, q); fy = 1215; z = lerp(1.52, 1.35, q); }        // Ceviz bedavaya koşar
      else if (lt < CTA) { const q = ramp(lt, FARK, 0.5); fx = lerp(660, 555, q); fy = lerp(1215, 1168, q); z = lerp(1.35, 1.1, q) + 0.02 * prog(lt, FARK + 0.5, CTA - FARK); }  // pano etiketlerin üstünde kalsın  // pano ve araştırma
      else { const q = ramp(lt, CTA, 0.5); fx = 555; fy = lerp(1168, 1250, q); z = lerp(1.12, 1.2, q); }                      // kapanış
      if (lt < ZERO) z *= 1 + 0.014 * Math.exp(-(lt - beat) * 10);
      const sx = shake(lt, POOF, 14, 0.3) + shake(lt, ZERO, 12, 0.3) + shake(lt, BEDAVA, 10, 0.3);
      cam.style.transform = `translate(${540 - fx * z + sx}px,${SY - fy * z}px) scale(${z})`;

      // ── ışıklar, ön ışıklar, seyirci ──
      const pulse = counting ? 1 - 0.25 * Math.exp(-(lt - beat) * 12) : 1;
      bL.style.opacity = 0.85 * pulse; bM.style.opacity = pulse; bR.style.opacity = 0.85 * pulse;
      foot.forEach((f, i) => (f.style.opacity = 0.75 + 0.25 * Math.sin(lt * 4 + i)));
      crowd.forEach((h) => { const j = lt >= ZERO ? 30 * Math.exp(-(lt - ZERO) * 3) * Math.abs(Math.sin((lt - ZERO) * 9 + h.ph)) : 0; h.e.style.transform = `translateY(${Math.sin(lt * 1.6 + h.ph) * 5 - j}px)`; });

      // ── Diken: değnek kalkar, "abrakadabra"; sonra kuru bir tebessüm ──
      let dm = ['calm', null, 'half'];
      if (lt >= ABRA - 0.1 && lt < POOF + 0.5) dm = ['happy', 'up', 'happy'];
      else if (lt >= POOF + 0.5 && lt < ZERO) dm = ['calm', null, 'half'];
      else if (lt >= ZERO && lt < CTA) dm = ['happy', null, 'half'];
      if (lt >= FOLLOW) dm = ['happy', 'wave', 'happy'];
      dk.set(dm[0], dm[1], blinkE(dm[2], lt, 0.5));
      let dy = FL, drot = Math.sin(lt * 1.3) * 1.5;
      if (lt >= ABRA - 0.1 && lt < POOF) dy -= 18 * E.out(prog(lt, ABRA - 0.1, 0.3));
      if (lt >= POOF && lt < POOF + 0.4) dy -= 18 * (1 - prog(lt, POOF, 0.4));
      dk.put(DX, dy, { rot: drot });
      hat.style.left = dk.root.style.left; hat.style.top = dk.root.style.top; hat.style.transform = dk.root.style.transform;
      const hatTip = lt >= FOLLOW ? -10 * Math.sin(Math.PI * prog(lt, FOLLOW + 0.3, 0.8)) : 0;
      hat.style.transform += ` rotate(${hatTip}deg)`;
      // değnek: patiden masaya doğru; kalkar, dönerek sallanır
      let wa = -24 + 3 * Math.sin(lt * 2);
      if (lt >= ABRA - 0.1 && lt < POOF) { const k = E.out(prog(lt, ABRA - 0.1, 0.35)); wa = lerp(-24, -100, k) + 16 * Math.sin((lt - ABRA) * 16) * k; }
      if (lt >= POOF && lt < POOF + 0.6) wa = lerp(-100, -18, E.out(prog(lt, POOF, 0.16))) + 6 * Math.sin(lt * 30) * (1 - prog(lt, POOF, 0.6));
      const up = lt >= ABRA - 0.1 && lt < POOF + 0.5;
      const wx = DX + (up ? 140 : 120), wy = dy - (up ? 258 : 160);
      wand.style.transform = `translate(${wx - 8}px,${wy - 8}px) rotate(${wa}deg)`;
      const tipX = wx + 180 * Math.cos((wa * Math.PI) / 180), tipY = wy + 180 * Math.sin((wa * Math.PI) / 180);
      const spOn = (lt >= ABRA && lt < POOF + 0.2) || (lt % 2.6 > 0.3 && lt % 2.6 < 0.8 && lt < COUNT);  // ilk karede (kapak) şeker açıkta kalsın
      sparks.forEach((sp, i) => {
        sp.e.style.display = spOn ? 'block' : 'none';
        if (!spOn) return;
        const a = (lt * 3 + sp.ph) * Math.PI * 2, r = 30 + 22 * Math.sin(lt * 7 + i);
        sp.e.style.transform = `translate(${tipX - 30 + Math.cos(a) * r}px,${tipY - 30 + Math.sin(a) * r}px) scale(${0.6 + 0.4 * Math.sin(lt * 9 + i)})`;
      });
      magic.update(lt);

      // ── etiketler: 15 TL / 1 TL → (duman) → 14 TL / BEDAVA ──
      const flipped = lt >= POOF + 0.12;
      const pop = (t) => (lt >= t ? 1 + 0.16 * Math.exp(-(lt - t) * 6) * Math.cos((lt - t) * 14) : 1);
      tT.old.style.display = tC.old.style.display = flipped && !GOT ? 'block' : flipped ? 'block' : 'none';
      tT.old.textContent = '15 TL'; tC.old.textContent = '1 TL';
      tT.val.textContent = flipped ? '14 TL' : '15 TL';
      tC.val.textContent = flipped ? 'BEDAVA' : '1 TL';
      tC.val.style.fontSize = flipped ? '46px' : '66px';
      tC.val.style.top = flipped ? '66px' : '54px';
      tC.val.style.color = flipped ? '#FFFFFF' : RED;
      tC.e.style.background = flipped ? GREEN : '#FFFDF4';
      const glow = flipped ? 0.5 + 0.5 * Math.sin(lt * (counting ? 10 : 6)) : 0;
      tC.e.style.boxShadow = flipped ? `0 0 ${18 + 26 * glow}px ${6 + 6 * glow}px rgba(124,227,160,.75)` : 'none';
      tC.e.style.borderColor = flipped ? '#FFFFFF' : INK;
      const tagIn = Math.min(1, E.back(prog(lt, -1, 0.3)));
      tT.e.style.transform = `scale(${tagIn * pop(P15) * pop(POOF + 0.12)}) rotate(${Math.sin(lt * 2) * 2}deg)`;
      tC.e.style.transform = `scale(${tagIn * pop(P1) * pop(POOF + 0.12) * (counting ? 1 + 0.05 * Math.sin(lt * 10) : 1)}) rotate(${Math.sin(lt * 2 + 1) * 2}deg)`;
      // duman: değneğin vuruşunda iki etiketin üstünde
      smoke.forEach((m, i) => {
        const k = prog(lt, POOF + (i % 5) * 0.02, 0.7), on = k > 0 && k < 1;
        m.style.display = on ? 'block' : 'none';
        if (!on) return;
        const cx = (i < 5 ? TX : CX) + Math.cos(i * 2.1) * 60 * k, cy = ITY - 200 + Math.sin(i * 1.7) * 40 * k - 40 * k;
        const d = 70 + (i % 3) * 30;
        m.style.transform = `translate(${cx - d / 2}px,${cy - d / 2}px) scale(${0.4 + 1.2 * E.out(k)})`;
        m.style.opacity = (1 - k) * 0.9;
      });
      const chOn = lt >= PICK + 0.25 && lt < ABRA;
      check.style.display = chOn ? 'block' : 'none';
      if (chOn) check.style.transform = `scale(${E.back(prog(lt, PICK + 0.25, 0.25))})`;

      // ── şeker: masada; kararda Ceviz'in kucağına ──
      if (!GOT) seker.style.transform = `translate(${CX - 78}px,${ITY - 86}px)`;
      else { const k = E.out(prog(lt, ZERO + 0.1, 0.3)); const hx = lerp(CX - 78, CZX - 102, k), hy = lerp(ITY - 86, 1262, k) - 70 * Math.sin(Math.PI * k); seker.style.transform = `translate(${hx}px,${hy}px) rotate(${lerp(0, -16, k) + (k >= 1 ? 4 * Math.sin(lt * 5) : 0)}deg)`; }
      truf.style.transform = `translateY(${Math.sin(lt * 2.2) * 2}px)`;

      // ── Ceviz ──
      let cm = ['curious', null, 'mood'];
      if (lt >= P15 - 0.1 && lt < P1) cm = ['curious', null, 'wide'];
      if (lt >= P1 && lt < PICK) cm = ['thoughtful', null, 'half'];
      if (lt >= PICK && lt < ABRA) cm = ['happy', null, 'happy'];
      if (lt >= ABRA && lt < POOF + 0.2) cm = ['curious', 'face', 'wide'];
      if (lt >= POOF + 0.2 && lt < ASK) cm = ['curious', null, 'wide'];
      if (lt >= ASK) cm = ['thoughtful', null, 'half'];
      if (counting) cm = ['thoughtful', 'face', 'squeeze'];
      if (lt >= ZERO) cm = ['celebrate', 'up', 'happy'];
      if (lt >= FARK) cm = ['happy', null, 'happy'];
      if (lt >= BEDAVA) cm = ['happy', null, 'happy'];
      if (Q) cm = ['curious', null, 'mood'];
      if (lt >= FOLLOW) cm = ['happy', 'up', 'happy'];
      cz.set(cm[0], cm[1], blinkE(cm[2], lt, 1.1));
      let cy = FL, crot = Math.sin(lt * 1.2 + 1) * 2, cxp = CZX;
      if (lt >= ZERO && lt < FARK) { cy -= hop(lt - ZERO, 0.42, 22).y; crot = 4 * Math.sin((lt - ZERO) * 6); }
      if (lt >= ZERO) cxp = lerp(CZX, CZX - 24, E.out(prog(lt, ZERO, 0.12)));
      cz.put(cxp, cy, { rot: crot });
      // pati: trüfü gösterir; sayımda iki etiket arasında gider gelir; kararda şekeri kapar
      let pv = false, ppx = CX, ppy = ITY - 120;
      if (lt >= PICK - 0.05 && lt < ABRA) { pv = true; const k = E.out(prog(lt, PICK - 0.05, 0.3)); ppx = lerp(CZX - 90, TX + 30, k); ppy = lerp(1290, ITY - 110, k) + 4 * Math.sin(lt * 8); }
      if (lt >= ASK + 0.2 && lt < ZERO + 0.12) {
        pv = true;
        const sway = (Math.cos((lt - COUNT) * 2.4) + 1) / 2;  // 1: trüfün üstünde
        if (lt < COUNT) ppx = lerp(CZX - 90, CX, E.out(prog(lt, ASK + 0.2, 0.3)));
        else if (lt < ZERO - 0.4) ppx = lerp(CX, TX + 30, sway);
        else ppx = lerp(lerp(CX, TX + 30, (Math.cos((ZERO - 0.4 - COUNT) * 2.4) + 1) / 2), CX, E.out(prog(lt, ZERO - 0.4, 0.25)));
        ppy = ITY - 116 + 6 * Math.sin(lt * 7);
        if (lt >= ZERO - 0.1) ppy = lerp(ppy, ITY - 70, E.out(prog(lt, ZERO - 0.1, 0.12)));
      }
      paw.style.display = arm.style.display = pv ? 'block' : 'none';
      if (pv) {
        paw.style.transform = `translate(${ppx - 35}px,${ppy - 35}px)`;
        const ax = cxp - 92, ay = cy - 150, bx2 = ppx + 10, by2 = ppy, len = Math.hypot(bx2 - ax, by2 - ay);
        arm.style.width = px(len); arm.style.transform = `translate(${ax}px,${ay - 11}px) rotate(${Math.atan2(by2 - ay, bx2 - ax)}rad)`;
      }
      const yOn = lt >= ZERO + 0.1 && lt < FARK;
      yay.style.display = yOn ? 'block' : 'none';
      if (yOn) { yay.style.top = px(930 - 20 * Math.sin(lt * 4)); yay.style.transform = `scale(${E.back(prog(lt, ZERO + 0.1, 0.25))}) rotate(${-6 + 2 * Math.sin(lt * 6)}deg)`; }
      confetti.update(lt);

      // ── pano (fark aynı), araştırma kartı, BEDAVA çıkartması ──
      const bOn = (lt >= FARK && lt < SCI) || (lt >= BEDAVA - 0.2 && lt < CTA);
      board.style.display = bOn ? 'block' : 'none';
      if (bOn) {
        const a0 = lt < SCI ? FARK : BEDAVA - 0.2;
        board.style.transform = `scaleY(${E.out(prog(lt, a0, 0.3))})`;
        r1.e.style.opacity = lt < SCI ? clamp(prog(lt, FARK + 0.1, 0.25)) : 1;
        r2.e.style.opacity = lt < SCI ? clamp(prog(lt, FARK + 0.5, 0.25)) : 1;
        const hl = lt >= F14 && lt < SCI;
        [r1, r2].forEach((r) => { r.r.style.textShadow = hl ? `0 0 ${16 + 10 * Math.sin(lt * 10)}px rgba(242,182,60,.9)` : 'none'; });
      }
      const stOn = lt >= BEDAVA && lt < CTA;
      sticker.style.display = stOn ? 'block' : 'none';
      if (stOn) sticker.style.transform = `rotate(-9deg) scale(${1 + 1.3 * (1 - E.out(prog(lt, BEDAVA, 0.22)))})`;
      const cOn = lt >= SCI && lt < BEDAVA - 0.2;
      card.style.display = cOn ? 'block' : 'none';
      if (cOn) {
        card.style.transform = `scaleY(${E.out(prog(lt, SCI, 0.3))})`;
        const v1 = Math.round(27 * E.out(prog(lt, S27, 0.5))), v2 = Math.round(69 * E.out(prog(lt, S69, 0.6)));
        c1.bar.style.width = `${lt < S27 ? 0 : v1}%`; c1.n.textContent = lt < S27 ? '' : `%${v1}`;
        c2.bar.style.width = `${lt < S69 ? 0 : v2}%`; c2.n.textContent = lt < S69 ? '' : `%${v2}`;
        c2.n.style.transform = `scale(${lt >= S69 + 0.6 ? 1 + 0.15 * Math.exp(-(lt - S69 - 0.6) * 6) : 1})`;
      }
      src.style.display = lt >= SCI + 0.3 && lt < BEDAVA - 0.2 ? 'block' : 'none';
      // Cep Defteri satırı: kapanışta masanın önünde
      const lOn = lt >= CTA + 0.2 && lt < FOLLOW;
      led.style.display = lOn ? 'block' : 'none';
      if (lOn) { led.style.transform = `rotate(-3deg) scale(${E.back(prog(lt, CTA + 0.2, 0.3))})`; ledRow.textContent = typed(lt, 'Bedava kargo −250 TL', CTA + 0.4, 0.6); }

      // ── karar anı: gerçek 3 saniye ──
      cdg.style.display = counting ? 'flex' : 'none';
      if (counting) {
        const k = prog(lt, COUNT, ZERO - COUNT), st = Math.min(2, Math.floor(lt - COUNT)), loc = lt - COUNT - st;
        ring.style.background = `conic-gradient(#E04A3A ${360 * (1 - k)}deg, rgba(255,255,255,.18) 0)`;
        num.textContent = String(3 - st);
        num.style.transform = `scale(${1 + 0.35 * (1 - E.out(Math.min(1, loc * 4)))})`;
        cdg.style.opacity = Math.min(1, (lt - COUNT) * 8);
      }
      flash.style.opacity = Math.max(lt >= POOF && lt < POOF + 0.3 ? 0.7 * (1 - prog(lt, POOF, 0.3)) : 0, lt >= ZERO && lt < ZERO + 0.25 ? 0.35 * (1 - prog(lt, ZERO, 0.25)) : 0);
      dark.style.opacity = 0.75 * E.inOut(prog(lt, DIM, 0.4));

      // ── takip kartı: FOLLOW'da açılır; TAPF'de Ceviz'in patisi "Takip et"e basar ──
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
