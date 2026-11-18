/* Sahne serisi: Kayıp bilet (zihinsel muhasebe; Tversky ve Kahneman 1981).
 * Gece, tiyatro girişi: ışıklı TİYATRO tabelası, "BU GECE: HAMLET", kırmızı halı, gişede Karamel, papyonlu Fıstık.
 * Kanca: rüzgâr Fıstık'ın biletini uçurur. Gişe: "200 lira daha". Karar anı (gerçek 3 sn): Fıstık cüzdanı Hamlet'in
 * kafatası gibi tutar, balonda "ALMAK YA DA ALMAMAK?". Fıstık döner; balonda 200 + 200 = 400.
 * Ekran ikiye bölünür: solda bileti kaybolan evren (Fıstık sokak lambasının altında, tepesinde yağmur bulutu), sağda
 * parası kaybolan evren (200 TL uçar, Fıstık omuz silker, yine bilet alır: ALDI, kapı açılır). Kartlarda %46 / %88 ALDI;
 * iki tarafta da aynı Cep Defteri satırı "Kayıp −200 TL" ve aradaki "=". Kapanış sorusu, takip kartı; döngü kancaya döner.
 * Olaylar: lost, gise, daha, ask, count, zero, don, bana, dort, split, para, aldi, sci, s88, s46, kayip, ayni, iki, cta,
 * follow, tapf, dim. Ses takvimi audio.py'deki cue_bilet ile aynı. */
const BL_LEAF = ['..oo', '.oLo', 'oLLo', 'oo..'];
const BL_LEAF_CS = [{ o: '#6B2E10', L: '#E8892F' }, { o: '#5E2A0E', L: '#C9562A' }, { o: '#5E4810', L: '#E2B23A' }];
const BL_COMEDY = ['.oooooo.', 'oGGGGGGo', 'oGkGGkGo', 'oGGGGGGo', 'oGkGGkGo', 'oGGkkGGo', '.oGGGGo.', '..oooo..'];
const BL_TRAGEDY = ['.oooooo.', 'oSSSSSSo', 'oSkSSkSo', 'oSSSSSSo', 'oSSkkSSo', 'oSkSSkSo', '.oSSSSo.', '..oooo..'];
const BL_DROP = ['.o.', 'oBo', 'oBo', '.o.'];

function defineBilet() {
  SCENES.bilet = (t0, o = {}) => {
    const s = scene(t0, '#05081A', undefined, o.wdur ?? 0.4);
    s.root.style.isolation = 'isolate';  // z-index'li katmanlar (karartma, bölme şeridi) döngü sahnesinin üstüne binmesin
    const ev = (k) => o[k] ?? 99;
    const LOST = ev('lost'), GISE = ev('gise'), DAHA = ev('daha'), ASK = ev('ask'), COUNT = ev('count'), ZERO = ev('zero');
    const BANA = ev('bana'), DORT = ev('dort'), SPLIT = ev('split'), PARA = ev('para'), ALDI = ev('aldi');
    const SCI = ev('sci'), S88 = ev('s88'), S46 = ev('s46'), KAYIP = ev('kayip'), AYNI = ev('ayni'), IKI = ev('iki');
    const CTA = ev('cta'), FOLLOW = ev('follow'), TAPF = ev('tapf'), DIM = ev('dim');
    const DON = o.don ?? ZERO + 0.55;
    const SY = 1150, GY = 1420, FX0 = 590, FB = 1500, FXE = 905;  // odak yüksekliği, kaldırım, Fıstık'ın ayak hizası ve dönünce durduğu yer
    const INK = '#2A1E1A', GOLD = '#F2B63C', BRASS = '#C9962E', RED = '#C0392B', BLUE = '#2F5F9E';
    const outline = (c, w = 5) => `${w}px 0 0 ${c}, -${w}px 0 0 ${c}, 0 ${w}px 0 ${c}, 0 -${w}px 0 ${c}`;
    const ramp = (lt, a, d) => E.inOut(prog(lt, a, d));

    const ticket = (parent) => {
      const t = el('div', 'abs', parent, { left: 0, top: 0, width: '200px', height: '100px', transformOrigin: '50% 50%', display: 'none' });
      t.innerHTML = `<div style="position:absolute;inset:0;background:#FFE3A0;border:6px solid ${INK};border-radius:12px;box-sizing:border-box"></div>`
        + `<div style="position:absolute;left:52px;top:10px;bottom:10px;border-left:5px dashed ${BRASS}"></div>`
        + `<div style="position:absolute;left:14px;top:36px;width:28px;height:28px;border-radius:50%;background:${RED};border:4px solid ${INK};box-sizing:border-box"></div>`
        + `<div class="it" style="position:absolute;left:60px;right:6px;top:2px;text-align:center;font-size:42px;line-height:48px;color:#8A1C2A">BİLET</div>`
        + `<div class="it" style="position:absolute;left:60px;right:6px;top:46px;text-align:center;font-size:46px;line-height:48px;color:${INK}">200 TL</div>`;
      return t;
    };

    // ── dekor: aynı tiyatro iki evrende iki kez kurulur (bölünmüş ekranın iki paneli) ──
    const build = (parent) => {
      const cam = el('div', 'abs', parent, { left: 0, top: 0, width: '1080px', height: '1920px', transformOrigin: '0 0' });
      const w = { cam };
      // gökyüzü, yıldızlar, ay
      el('div', 'abs', cam, { left: '-800px', top: '-1000px', width: '2700px', height: px(GY + 1000), background: 'linear-gradient(#03061A, #0B1236 45%, #18205A 82%, #222A66)' });
      w.stars = Array.from({ length: 30 }, (_, i) => el('div', 'abs', cam, { left: px(-600 + ((i * 271) % 2300)), top: px(-800 + ((i * 389) % 1080)), width: px(4 + (i % 3) * 2), height: px(4 + (i % 3) * 2), background: '#FFF4D6' }));
      el('div', 'abs', cam, { left: '120px', top: '110px', width: '96px', height: '96px', borderRadius: '50%', boxShadow: 'inset 26px -10px 0 0 #F6EEC8', filter: 'drop-shadow(0 0 20px rgba(246,238,200,.45))', transform: 'rotate(-20deg)' });
      // cephe, korniş, iki sütun
      el('div', 'abs', cam, { left: '-800px', top: '330px', width: '2700px', height: px(GY - 330), background: 'repeating-linear-gradient(#4E1B28 0 38px, #3E141F 38px 42px)' });
      el('div', 'abs', cam, { left: '-800px', top: '296px', width: '2700px', height: '42px', background: '#2B0D15', borderBottom: `8px solid ${BRASS}` });
      [392, 750].forEach((x) => el('div', 'abs', cam, { left: px(x), top: '338px', width: '40px', height: px(GY - 338), background: 'linear-gradient(90deg, #6E2737, #57202D)', boxShadow: 'inset 0 0 0 4px #2B0D15' }));
      // ışıklı tabela ve oyun panosu
      const MX = 240, MY = 372, MW = 700, MH = 196;
      const bl = [];
      for (let x = MX + 14; x <= MX + MW - 14; x += 48) { bl.push([x, MY - 13]); bl.push([x, MY + MH + 13]); }
      for (let y = MY + 34; y < MY + MH - 10; y += 44) { bl.push([MX - 13, y]); bl.push([MX + MW + 13, y]); }
      w.bulbs = bl.map(([x, y]) => el('div', 'abs', cam, { left: px(x - 9), top: px(y - 9), width: '18px', height: '18px', borderRadius: '50%', background: '#FFE9A8' }));
      w.mq = el('div', 'abs it', cam, { left: px(MX), top: px(MY), width: px(MW), height: px(MH), boxSizing: 'border-box', background: '#170A1D', border: `10px solid ${BRASS}`, borderRadius: '18px', textAlign: 'center', fontSize: '160px', lineHeight: px(MH - 34), color: '#FFD36B' });
      w.mq.textContent = 'TİYATRO';
      const sub = el('div', 'abs it', cam, { left: '320px', top: '606px', width: '540px', height: '92px', boxSizing: 'border-box', background: '#F6E7C8', border: `6px solid ${INK}`, borderRadius: '10px', textAlign: 'center', fontSize: '64px', lineHeight: '80px', color: '#8A1C2A' });
      sub.textContent = 'BU GECE: HAMLET';
      // kemerli kapı: içeride sahne ışığı ve kırmızı perde
      const DX = 455, DT = 770, DW = 270, DH = GY - DT;
      el('div', 'abs', cam, { left: px(DX - 16), top: px(DT - 16), width: px(DW + 32), height: px(DH + 16), background: BRASS, borderRadius: `${(DW + 32) / 2}px ${(DW + 32) / 2}px 0 0`, boxShadow: `0 0 0 5px ${INK}` });
      w.glow = el('div', 'abs', cam, { left: px(DX), top: px(DT), width: px(DW), height: px(DH), borderRadius: `${DW / 2}px ${DW / 2}px 0 0`, overflow: 'hidden', background: 'radial-gradient(ellipse at 50% 75%, #FFF3CC, #FFC76A 55%, #D9822E)' });
      el('div', 'abs', w.glow, { left: 0, right: 0, top: 0, height: '150px', background: 'repeating-linear-gradient(90deg, #A8283B 0 22px, #8C1F31 22px 30px)' });
      el('div', 'abs', w.glow, { left: '30px', right: '30px', bottom: 0, height: '120px', background: 'repeating-linear-gradient(90deg, rgba(90,20,30,.55) 0 30px, transparent 30px 42px)' });
      const leaf = (x, right) => {
        const e = el('div', 'abs', cam, { left: px(x), top: px(DT), width: px(DW / 2), height: px(DH), background: 'linear-gradient(#A92A3D, #8A1F31)', boxShadow: `inset 0 0 0 5px ${INK}`, borderRadius: right ? `0 ${DW / 2}px 0 0` : `${DW / 2}px 0 0 0`, transformOrigin: right ? '100% 50%' : '0 50%' });
        [150, 380].forEach((y) => el('div', 'abs', e, { left: '24px', top: px(y), width: px(DW / 2 - 48), height: '190px', boxShadow: 'inset 0 0 0 5px #6E1625' }));
        el('div', 'abs', e, { [right ? 'left' : 'right']: '12px', top: '330px', width: '20px', height: '20px', borderRadius: '50%', background: GOLD, boxShadow: `0 0 0 4px ${INK}` });
        return e;
      };
      w.dl = leaf(DX, false); w.dr = leaf(DX + DW / 2, true);
      // gişe kulübesi: tente, tabela, pencerede Karamel, uzattığı bilet, tezgâh, fiyat panosu
      const BX = 30, BT = 800, BW = 340;
      el('div', 'abs', cam, { left: px(BX), top: px(BT), width: px(BW), height: px(GY - BT), background: 'repeating-linear-gradient(90deg, #7A4826 0 34px, #6A3C1F 34px 38px)', boxShadow: `inset 0 0 0 6px ${INK}` });
      el('div', 'abs', cam, { left: px(BX - 24), top: px(BT - 56), width: px(BW + 48), height: '70px', boxSizing: 'border-box', background: 'repeating-linear-gradient(90deg, #C0392B 0 44px, #F6E7C8 44px 88px)', border: `6px solid ${INK}`, borderRadius: '10px 10px 4px 4px' });
      const sign = el('div', 'abs it', cam, { left: px(BX + 60), top: px(BT + 24), width: px(BW - 120), height: '66px', boxSizing: 'border-box', background: '#170A1D', border: `5px solid ${BRASS}`, borderRadius: '10px', textAlign: 'center', fontSize: '54px', lineHeight: '54px', color: '#FFD36B' });
      sign.textContent = 'GİŞE';
      const win = el('div', 'abs', cam, { left: px(BX + 36), top: px(BT + 104), width: px(BW - 72), height: '236px', boxSizing: 'border-box', background: 'radial-gradient(ellipse 70% 60% at 50% 22%, #8A4A2E, #4A2026 70%, #33151C)', border: '8px solid #3E2414', borderRadius: '14px 14px 0 0', overflow: 'hidden' });
      el('div', 'abs', win, { left: '14px', top: '10px', width: '22px', height: '22px', borderRadius: '50%', background: '#FFE9A8', boxShadow: '0 0 26px 10px rgba(255,214,140,.45)' });
      w.kar = new Mascot(win, { who: 'karamel', w: 236 });
      w.kt = ticket(cam);
      el('div', 'abs', cam, { left: px(BX + 16), top: px(BT + 330), width: px(BW - 32), height: '28px', boxSizing: 'border-box', background: BRASS, border: `5px solid ${INK}` });
      w.pb = el('div', 'abs it', cam, { left: px(BX + 50), top: px(BT + 388), width: px(BW - 100), height: '138px', boxSizing: 'border-box', background: '#173326', border: '9px solid #6B4E31', textAlign: 'center', color: '#F6EEDA', transformOrigin: '50% 50%' });
      w.pb.innerHTML = `<div style="font-size:44px;line-height:50px;margin-top:6px">BİLET</div><div style="font-size:76px;line-height:62px;color:${GOLD}">200 TL</div>`;
      // afiş: komedi ve trajedi maskeleri
      const po = el('div', 'abs', cam, { left: '806px', top: '880px', width: '200px', height: '310px', boxSizing: 'border-box', background: 'linear-gradient(#7A1A2C, #4E0F1C)', border: `8px solid ${BRASS}`, boxShadow: `0 0 0 5px ${INK}` });
      pixEl(po, BL_COMEDY, { o: INK, G: GOLD, k: INK }, 12, { left: '10px', top: '34px', transform: 'rotate(-12deg)' });
      pixEl(po, BL_TRAGEDY, { o: INK, S: '#C9CCD2', k: INK }, 12, { left: '80px', top: '106px', transform: 'rotate(10deg)' });
      el('div', 'abs it', po, { left: 0, right: 0, top: '218px', textAlign: 'center', fontSize: '46px', color: '#FFD36B' }).textContent = 'HAMLET';
      // sokak lambası ve ışık konisi
      el('div', 'abs', cam, { left: '1014px', top: '650px', width: '18px', height: px(GY + 70 - 650), background: '#1B1B2A', boxShadow: `0 0 0 4px ${INK}` });
      el('div', 'abs', cam, { left: '982px', top: '596px', width: '82px', height: '62px', background: '#2B2B3D', clipPath: 'polygon(22% 0, 78% 0, 100% 100%, 0 100%)' });
      w.lamp = el('div', 'abs', cam, { left: '970px', top: '654px', width: '106px', height: '26px', borderRadius: '0 0 52px 52px', background: '#FFE9A8', boxShadow: '0 0 44px 18px rgba(255,220,140,.5)' });
      el('div', 'abs', cam, { left: '840px', top: '676px', width: '366px', height: px(GY + 240 - 676), background: 'linear-gradient(rgba(255,226,150,.2), rgba(255,226,150,0))', clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)' });
      // kaldırım ve kırmızı halı
      el('div', 'abs', cam, { left: '-800px', top: px(GY), width: '2700px', height: '800px', background: 'repeating-linear-gradient(90deg, #2B2E44 0 118px, #24263A 118px 122px)' });
      el('div', 'abs', cam, { left: '-800px', top: px(GY), width: '2700px', height: '18px', background: '#3B3E58' });
      el('div', 'abs', cam, { left: '330px', top: px(GY), width: '520px', height: '800px', background: 'linear-gradient(#B42C3F, #8B2032)', clipPath: 'polygon(24% 0, 76% 0, 100% 100%, 0 100%)' });
      // Fıstık ve elindekiler
      w.fis = new Mascot(cam, { who: 'fistik', outfit: 'bowtie', w: 400 });
      w.wal = pixEl(cam, WALLET_O, WALLET_COL, 13, { display: 'none', transformOrigin: '50% 50%' });
      w.note = pixEl(cam, NOTE, NOTE_CS[0], 13, { display: 'none', transformOrigin: '50% 50%' });
      w.tk = ticket(cam);
      // halının iki yanında pirinç direkler ve kadife kordon (önde)
      const post = (x, y) => {
        el('div', 'abs', cam, { left: px(x - 9), top: px(y - 110), width: '18px', height: '110px', background: 'linear-gradient(90deg, #EBC873, #B98A30)', boxShadow: `0 0 0 4px ${INK}` });
        el('div', 'abs', cam, { left: px(x - 17), top: px(y - 132), width: '34px', height: '28px', borderRadius: '50%', background: GOLD, boxShadow: `0 0 0 4px ${INK}` });
        el('div', 'abs', cam, { left: px(x - 30), top: px(y - 6), width: '60px', height: '14px', borderRadius: '7px', background: '#B98A30', boxShadow: `0 0 0 4px ${INK}` });
      };
      const rope = (x1, x2, y) => el('div', 'abs', cam, { left: px(x1), top: px(y - 112), width: px(x2 - x1), height: '56px', boxSizing: 'border-box', borderBottom: '13px solid #8E1E2E', borderRadius: '0 0 50% 50%' });
      rope(250, 430, GY + 330); rope(750, 930, GY + 330);
      [250, 430, 750, 930].forEach((x) => post(x, GY + 330));
      // balonlar, ünlem, damga, Cep Defteri satırı, yapraklar, yağmur bulutu
      w.bang = el('div', 'abs it', cam, { left: 0, top: 0, fontSize: '160px', color: '#FF6B57', textShadow: outline(INK, 6), display: 'none', transformOrigin: '50% 100%' });
      w.bang.textContent = '!';
      w.dots = [30, 18].map((d) => el('div', 'abs', cam, { left: 0, top: 0, width: px(d), height: px(d), boxSizing: 'border-box', borderRadius: '50%', background: '#FFFDF4', border: `5px solid ${INK}`, display: 'none' }));
      w.bub = el('div', 'abs it', cam, { left: 0, top: 0, width: '520px', boxSizing: 'border-box', padding: '8px 12px 14px', background: '#FFFDF4', border: `6px solid ${INK}`, borderRadius: '44px', textAlign: 'center', fontSize: '62px', lineHeight: 0.95, color: INK, display: 'none', transformOrigin: '50% 100%' });
      w.stamp = el('div', 'abs it', cam, { left: 0, top: 0, width: '330px', boxSizing: 'border-box', textAlign: 'center', fontSize: '92px', lineHeight: '92px', borderRadius: '18px', background: 'rgba(255,253,244,.95)', display: 'none', transformOrigin: '50% 50%' });
      w.led = el('div', 'abs', cam, { left: 0, top: 0, width: '360px', height: '140px', boxSizing: 'border-box', background: 'repeating-linear-gradient(#FFFDF4 0 45px, #BFD3EA 45px 47px)', border: `6px solid ${INK}`, borderRadius: '12px', padding: '4px 16px', display: 'none', transformOrigin: '50% 50%' });
      w.led.innerHTML = `<div style="font-size:32px;font-weight:800;color:#AE4716;letter-spacing:.05em;line-height:46px">CEP DEFTERİ</div><div class="it lr" style="font-size:60px;color:${RED};line-height:74px;white-space:nowrap"></div>`;
      w.ledRow = w.led.querySelector('.lr');
      w.leaves = Array.from({ length: 7 }, (_, i) => ({ e: pixEl(cam, BL_LEAF, BL_LEAF_CS[i % 3], 10, { left: 0, top: 0, display: 'none' }), ph: i * 0.37, y0: 1060 + ((i * 97) % 380) }));
      w.cloud = pixEl(cam, CLOUD, CLOUD_C, 12, { left: 0, top: 0, display: 'none' });
      w.drops = Array.from({ length: 4 }, (_, i) => ({ e: pixEl(cam, BL_DROP, { o: '#1E4E86', B: '#8CC7FF' }, 9, { left: 0, top: 0, display: 'none' }), ph: i * 0.23, dx: 18 + i * 38 }));
      return w;
    };

    // panel kapları: bölünmeden önce bilet evreni tam ekran; bölününce solda o, sağda para evreni
    const p1 = el('div', 'abs', s.root, { left: 0, top: 0, width: '1080px', height: '1920px', overflow: 'hidden' });
    const p2 = el('div', 'abs', s.root, { left: '1080px', top: 0, width: '540px', height: '1920px', overflow: 'hidden', display: 'none' });
    const W1 = build(p1), W2 = build(p2);

    // ── üst katmanlar ──
    const streaks = [720, 820, 1290, 1390, 1480, 1580].map((y, i) => el('div', 'abs', s.root, { left: 0, top: px(y), width: px(150 + (i % 3) * 70), height: '7px', borderRadius: '4px', background: 'rgba(255,255,255,.32)', display: 'none', zIndex: 8 }));
    el('div', 'abs', s.root, { inset: 0, zIndex: 9, pointerEvents: 'none', background: 'radial-gradient(ellipse 96% 70% at 50% 56%, transparent 58%, rgba(3,2,12,.55) 100%)' });
    el('div', 'abs', s.root, { left: 0, right: 0, top: 0, height: '300px', zIndex: 9, pointerEvents: 'none', background: 'linear-gradient(rgba(3,2,12,.55), rgba(3,2,12,0))' });
    const divider = el('div', 'abs', s.root, { left: '528px', top: 0, width: '24px', height: '1920px', background: 'repeating-linear-gradient(-45deg, #8E1E2E 0 18px, #F2B63C 18px 30px)', boxShadow: `0 0 0 4px ${INK}`, display: 'none', zIndex: 14, transformOrigin: '50% 0' });
    // araştırma kartları: başlık şeridi evreni adlandırır, gövdede yüzde ve çubuk
    const card = (cx, title, bg, val, numCol) => {
      const e = el('div', 'abs', s.root, { left: px(cx - 240), top: '730px', width: '480px', boxSizing: 'border-box', borderRadius: '22px', background: 'rgba(8,10,30,.88)', border: `5px solid ${INK}`, boxShadow: '0 12px 30px rgba(0,0,0,.35)', display: 'none', zIndex: 15, transformOrigin: '50% 0', overflow: 'hidden' });
      const h = el('div', 'it', e, { background: bg, color: '#FFFFFF', textAlign: 'center', fontSize: '54px', lineHeight: '66px', textShadow: `3px 3px 0 ${INK}` });
      h.textContent = title;
      const body = el('div', '', e, { position: 'relative', height: '0px', overflow: 'hidden' });
      const row = el('div', 'it', body, { display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: '20px', height: '112px', paddingTop: '2px' });
      const n = el('span', '', row, { fontSize: '120px', lineHeight: '110px', color: numCol });
      const lab = el('span', '', row, { fontSize: '62px', color: '#FFFFFF' });
      lab.textContent = 'ALDI';
      const barBg = el('div', 'abs', body, { left: '28px', right: '28px', top: '124px', height: '22px', borderRadius: '11px', background: 'rgba(255,255,255,.16)', overflow: 'hidden' });
      const bar = el('div', 'abs', barBg, { left: 0, top: 0, bottom: 0, width: 0, background: numCol, borderRadius: '11px' });
      return { e, body, n, bar, val };
    };
    const cB = card(270, 'BİLET DÜŞTÜ', RED, 46, '#FFB35A'), cP = card(810, 'PARA DÜŞTÜ', BLUE, 88, '#7CE3A0');
    const eq = el('div', 'abs it', s.root, { left: '466px', top: '1124px', width: '148px', height: '148px', borderRadius: '50%', background: '#FFFDF4', border: `7px solid ${INK}`, boxSizing: 'border-box', textAlign: 'center', fontSize: '140px', lineHeight: '124px', color: INK, display: 'none', zIndex: 16, transformOrigin: '50% 50%' });
    eq.textContent = '=';
    const src = el('div', 'abs', s.root, { left: 0, right: 0, top: '1452px', textAlign: 'center', fontSize: '30px', fontWeight: 800, color: '#FFFFFF', textShadow: `0 3px 0 ${INK}, 0 0 8px rgba(0,0,0,.6)`, display: 'none', zIndex: 15 });
    src.textContent = 'Kaynak: Tversky ve Kahneman 1981 · üniversite öğrencileri';
    const dark = el('div', 'abs', s.root, { inset: 0, zIndex: 18, pointerEvents: 'none', background: '#05040F', opacity: 0 });
    const flash = el('div', 'abs', s.root, { inset: 0, zIndex: 21, opacity: 0, pointerEvents: 'none', background: '#FFFFFF' });
    // karar anı: gerçek 3 saniyelik sayım
    const cdg = el('div', 'abs', s.root, { left: 0, right: 0, top: '548px', display: 'none', justifyContent: 'center', alignItems: 'center', zIndex: 24 });
    const ring = el('div', '', cdg, { position: 'relative', width: '156px', height: '156px', borderRadius: '50%', flex: 'none' });
    const num = el('div', 'abs it', ring, { left: '15px', top: '15px', width: '126px', height: '126px', borderRadius: '50%', background: 'rgba(8,10,30,.94)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '112px', color: '#fff' });
    const pill = el('div', 'it', cdg, { marginLeft: '18px', padding: '6px 26px 12px', background: 'rgba(8,10,30,.9)', border: `4px solid ${GOLD}`, borderRadius: '16px', textAlign: 'left', lineHeight: 1.05 });
    pill.innerHTML = `<div style="font-size:82px;color:#fff">KARAR VER</div><div style="font-size:58px;color:${GOLD}">AL mı, DÖN mü? Yoruma yaz</div>`;
    // takip kartı ve "Takip et"e basan Fıstık patisi
    const FW = 620, FT = 300;
    const fcard = el('div', 'abs', s.root, { left: px((1080 - FW) / 2), top: px(FT), width: px(FW), height: '410px', borderRadius: '44px', background: '#FFFFFF', boxShadow: '0 24px 60px rgba(0,0,0,.45)', display: 'none', zIndex: 26, transformOrigin: '50% 50%', textAlign: 'center' });
    const ficon = el('img', 'abs', fcard, { left: px(FW / 2 - 68), top: '34px', width: '136px', height: '136px', borderRadius: '50%', boxShadow: '0 0 0 4px #FFFFFF, 0 0 0 8px #E9E2D8' });
    ficon.src = 'assets/icon.png';
    el('div', 'abs', fcard, { left: 0, right: 0, top: '186px', fontSize: '50px', fontWeight: 800, color: '#141414', letterSpacing: '-.01em' }).textContent = 'cep_defteri';
    el('div', 'abs', fcard, { left: 0, right: 0, top: '252px', fontSize: '32px', fontWeight: 600, color: '#5E5650' }).textContent = 'Her hafta bir para tuzağı';
    const fbtn = el('div', 'abs', fcard, { left: '44px', right: '44px', top: '310px', height: '72px', borderRadius: '18px', background: '#0095F6', color: '#FFFFFF', fontSize: '38px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', transformOrigin: '50% 50%' });
    const FBX = 740, FBY = FT + 310 + 36;
    const fpaw = pixEl(s.root, PAWP, { o: INK, B: '#EE8E3A' }, 16, { left: 0, top: 0, display: 'none', zIndex: 27, transformOrigin: '50% 30%' });
    const fring = el('div', 'abs', s.root, { left: px(FBX - 60), top: px(FBY - 60), width: '120px', height: '120px', boxSizing: 'border-box', borderRadius: '50%', border: '8px solid rgba(0,149,246,.75)', display: 'none', zIndex: 27 });

    // kalp atışları (audio.py ile aynı takvim): soruda başlar, sayımda hızlanır
    const beats = [];
    for (let t = ASK + 0.2, k = 0; t < ZERO - 0.1; t += Math.max(0.42, 0.62 - 0.03 * k), k++) beats.push(t);
    const setCam = (w, pw, fx, fy, z, sx = 0) => { w.cam.style.transform = `translate(${pw / 2 - fx * z + sx}px,${SY - fy * z}px) scale(${z})`; };
    const blinkE = (e, lt, off) => (e === 'mood' && ((lt + off) * 1000) % 2900 < 120 ? 'closed' : e);
    const typed = (lt, txt, a, d = 0.45) => txt.slice(0, Math.floor(prog(lt, a, d) * txt.length));
    // bubble: balonu (alt-orta noktası cx, by) ve iki düşünce noktasını kafanın üstüne yerleştirir
    const bubbleAt = (w, on, html, cx, by, k, tilt) => {
      w.bub.style.display = on ? 'block' : 'none';
      w.dots.forEach((d) => (d.style.display = on ? 'block' : 'none'));
      if (!on) return;
      if (w.bub.innerHTML !== html) w.bub.innerHTML = html;
      const h = w.bub.offsetHeight || 150;
      w.bub.style.transform = `translate(${cx - 260}px,${by - h}px) scale(${E.back(k)}) rotate(${tilt}deg)`;
      w.dots[0].style.transform = `translate(${cx - 70}px,${by + 6}px) scale(${E.back(k)})`;
      w.dots[1].style.transform = `translate(${cx - 104}px,${by + 38}px) scale(${E.back(k)})`;
    };
    const stampAt = (w, on, txt, col, cx, cy, k) => {
      w.stamp.style.display = on ? 'block' : 'none';
      if (!on) return;
      if (w.stamp.textContent !== txt) w.stamp.textContent = txt;
      w.stamp.style.color = col; w.stamp.style.border = `9px solid ${col}`;
      w.stamp.style.transform = `translate(${cx - 165}px,${cy - 55}px) rotate(-8deg) scale(${1 + 1.2 * (1 - E.out(k))})`;
      w.stamp.style.opacity = clamp(k * 3);
    };
    const ledgerAt = (w, lt, a, cx) => {
      const on = lt >= a && lt < FOLLOW;
      w.led.style.display = on ? 'block' : 'none';
      if (!on) return;
      const pulse = lt >= IKI ? 1 + 0.07 * Math.exp(-(lt - IKI) * 6) * Math.sin((lt - IKI) * 20) : 1;
      w.led.style.transform = `translate(${cx - 180}px,1528px) rotate(-3deg) scale(${E.back(prog(lt, a, 0.3)) * pulse})`;
      w.ledRow.textContent = typed(lt, 'Kayıp −200 TL', a + 0.15);
    };
    const karamel = (w, lt, wi) => {
      let m = ['calm', null, 'mood'], b = 262;
      if (wi === 0) {
        if (lt >= GISE && lt < DON) { b = 262 - 20 * E.back(prog(lt, GISE, 0.3)); m = ['happy', lt >= DAHA - 0.1 && lt < ASK ? 'up' : null, 'happy']; }
        if (lt >= DON) m = ['thoughtful', null, 'half'];
      } else {
        m = lt >= ALDI - 0.15 && lt < ALDI + 0.9 ? ['happy', 'up', 'happy'] : lt >= ALDI ? ['happy', 'wave', 'happy'] : ['happy', null, 'mood'];
        if (lt >= ALDI + 1.6) m = ['calm', null, 'mood'];
        b = 248;
      }
      w.kar.set(m[0], m[1], blinkE(m[2], lt, 0.7 + wi));
      w.kar.put(126, b + Math.sin(lt * 2 + wi) * 3);
    };
    const leavesAt = (w, lt, on) => {
      w.leaves.forEach((l, i) => {
        const k = lt - i * 0.13;
        const vis = on && k >= 0 && k < 2.6;
        l.e.style.display = vis ? 'block' : 'none';
        if (!vis) return;
        const x = -80 + k * 640, y = l.y0 - 160 * k + 40 * Math.sin(k * 4 + i);
        l.e.style.transform = `translate(${x}px,${y}px) rotate(${k * 320 + i * 40}deg)`;
      });
    };

    s.update = (lt) => {
      const split = lt >= SPLIT;
      const sp = split ? E.out(prog(lt, SPLIT, 0.4)) : 0;
      const Q = lt >= CTA;
      const pw1 = lerp(1080, 540, sp);
      p1.style.width = px(pw1);
      p2.style.display = split ? 'block' : 'none';
      p2.style.left = px(lerp(1080, 540, sp));
      let beat = -9;
      beats.forEach((t) => { if (lt >= t) beat = t; });
      const kick = lt < ZERO ? 1 + 0.014 * Math.exp(-(lt - beat) * 10) : 1;
      const counting = lt >= COUNT && lt < ZERO;

      // ── ortak dekor hareketi: yıldızlar, tabela ampulleri (sayımda kalp atışıyla yanar), lamba ──
      [W1, W2].forEach((w, wi) => {
        if (wi === 1 && !split) return;
        w.stars.forEach((st, i) => (st.style.opacity = 0.3 + 0.7 * Math.abs(Math.sin(lt * (0.7 + (i % 5) * 0.3) + i))));
        const fi = Math.floor(lt * 6);
        w.bulbs.forEach((b, i) => {
          const lit = counting ? lt - beat < 0.14 : (i + fi) % 3 !== 0;
          b.style.background = lit ? '#FFE9A8' : '#6E521C';
          b.style.boxShadow = lit ? '0 0 14px 4px rgba(255,220,130,.7)' : 'none';
        });
        w.mq.style.textShadow = `0 0 ${22 + 8 * Math.sin(lt * 5 + wi)}px rgba(255,200,90,.65)`;
        w.lamp.style.opacity = 0.9 + 0.1 * Math.sin(lt * 13 + wi * 2);
        karamel(w, lt, wi);
      });

      // ══ W1 · bileti kaybolan evren ══
      {
        const w = W1;
        let z, fx, fy;
        if (lt < GISE) { z = 1.45 + 0.05 * prog(lt, 0, GISE); fx = 610; fy = 1280; }                                       // kanca: kapıda Fıstık, uçan bilet
        else if (lt < ASK) { const q = ramp(lt, GISE, 0.55); fx = lerp(610, 400, q); fy = lerp(1280, 1180, q); z = lerp(1.5, 1.2, q) + 0.03 * prog(lt, GISE + 0.55, ASK - GISE - 0.55); }  // gişe ile Fıstık
        else if (lt < COUNT) { const q = ramp(lt, ASK, 0.5); fx = lerp(400, 575, q); fy = lerp(1180, 1250, q); z = lerp(1.23, 1.17, q); }  // soru
        else if (lt < ZERO) { fx = 575; fy = 1250; z = 1.17 + 0.15 * ramp(lt, COUNT, ZERO - COUNT); }                     // karar: yavaş yaklaşma
        else { const q = ramp(lt, ZERO, 0.6); fx = lerp(575, 760, prog(lt, ZERO + 0.3, SPLIT - ZERO - 0.3)); fy = 1250; z = lerp(1.32, 1.12, q); }  // döner, gider
        if (split) { fx = lerp(fx, 830, sp); z = lerp(z, 0.95, sp) + 0.03 * prog(lt, SPLIT, 10); }
        const sh = shake(lt, LOST, 10, 0.3) + shake(lt, ZERO, 12, 0.3) + shake(lt, DORT, 10, 0.3);
        setCam(w, pw1, fx, fy, z * kick, split ? 0 : sh);

        // Fıstık
        let x = FX0, b = FB, rot = 0, flip = false, m = ['curious', 'up', 'wide'];
        if (lt < GISE) {
          rot = 3 * Math.sin(lt * 24) * Math.exp(-lt * 2);
          if (lt >= LOST - 0.1) m = ['thoughtful', 'face', 'wide'];
        } else if (lt < ASK) {
          m = lt >= DAHA + 0.1 ? ['thoughtful', 'face', 'half'] : ['curious', null, 'mood'];
        } else if (lt < COUNT) {
          m = ['curious', null, 'wide'];
        } else if (lt < ZERO) {
          m = ['thoughtful', 'face', 'half'];
          flip = Math.floor((lt - COUNT) / 0.75) % 2 === 1;  // bir gişeye, bir sokağa bakar
          rot = Math.sin(lt * 3) * 2;
        } else {
          m = ['calm', null, 'half'];
          if (lt >= DON) {
            const k = E.inOut(prog(lt, DON, 2.2));
            x = lerp(FX0, FXE, k);
            if (k < 1) b -= hop(lt - DON, 0.42, 16).y;
            flip = true;
            m = ['thoughtful', null, 'half'];
          }
          if (split && lt >= SPLIT + 1.0) { b += 10; rot = Math.sin(lt * 7) * 1.0; }  // omuzlar düşer
        }
        if (Q) { x = FXE; b = FB; flip = false; m = ['curious', null, 'mood']; rot = Math.sin(lt * 2.4) * 3; }
        if (lt >= FOLLOW) m = ['happy', null, 'mood'];
        w.fis.set(m[0], m[1], blinkE(m[2], lt, 0.3));
        w.fis.put(x, b, { rot, flip });

        // kanca: rüzgâr bileti uçurur, yapraklar savrulur, "!"
        const tOn = lt < 2.6;
        w.tk.style.display = tOn ? 'block' : 'none';
        if (tOn) {
          const k = clamp(lt / 2.4);
          const tx = 800 + 400 * k + 18 * Math.sin(lt * 7), ty = 1250 - 660 * (1 - (1 - k) ** 2) + 26 * Math.sin(lt * 5);
          w.tk.style.transform = `translate(${tx - 100}px,${ty - 50}px) rotate(${-18 + 400 * k}deg) scale(${1 - 0.32 * k})`;
        }
        leavesAt(w, lt, lt < GISE + 0.6);
        const bOn = lt >= LOST - 0.05 && lt < GISE;
        w.bang.style.display = bOn ? 'block' : 'none';
        if (bOn) w.bang.style.transform = `translate(${x + 120}px,${1000}px) scale(${E.back(prog(lt, LOST - 0.05, 0.22))}) rotate(10deg)`;

        // gişede uzatılan bilet ve "+200 TL"
        const ktOn = lt >= GISE + 0.2 && lt < DON;
        w.kt.style.display = ktOn ? 'block' : 'none';
        if (ktOn) w.kt.style.transform = `translate(${262 - 100}px,${1114 - 50 + 3 * Math.sin(lt * 5)}px) rotate(${-6 + 3 * Math.sin(lt * 3)}deg) scale(${0.72 * E.back(prog(lt, GISE + 0.2, 0.25))})`;
        const pk = lt >= DAHA ? Math.exp(-(lt - DAHA) * 5) : 0;
        w.pb.style.transform = `scale(${1 + 0.12 * pk})`;
        w.pb.style.boxShadow = lt >= DAHA && lt < ASK ? `0 0 ${30 * (0.5 + 0.5 * Math.sin(lt * 14))}px 8px rgba(255,107,87,.7)` : 'none';

        // cüzdan: "daha!"da çıkar, sayımda Hamlet gibi havaya kalkar, kararda cebe girer
        const wv = lt >= DAHA + 0.2 && lt < ZERO + 0.35;
        w.wal.style.display = wv ? 'block' : 'none';
        if (wv) {
          let cx = x + 80, cy = 1372 + 4 * Math.sin(lt * 4), r = 0, sc = E.back(prog(lt, DAHA + 0.2, 0.25));
          if (lt >= COUNT) { const k = E.out(prog(lt, COUNT, 0.35)); cx = lerp(x + 80, x + 170, k); cy = lerp(1372, 1236, k) + 8 * Math.sin(lt * 2.2); r = -12 * k; }
          if (lt >= ZERO) { const k = prog(lt, ZERO, 0.35); cx = lerp(x + 170, x + 40, k); cy = lerp(1236, 1420, k); sc = 1 - k; }
          w.wal.style.transform = `translate(${cx - 58}px,${cy - 45}px) rotate(${r}deg) scale(${sc})`;
        }

        // balon: sayımda "ALMAK YA DA ALMAMAK?", dönünce "200 + 200 = 400"
        const hb = FB - 375;  // kafa üstü
        if (counting) bubbleAt(w, true, 'ALMAK YA DA<br>ALMAMAK?', x + 70, hb - 34, prog(lt, COUNT + 0.05, 0.3), Math.sin(lt * 2) * 1.5);
        else if (lt >= BANA && !split) {
          const html = lt >= DORT ? `200 + 200 <span style="color:${RED}">= 400</span>` : '200 + 200';
          bubbleAt(w, true, html, x - 20, hb - 34, prog(lt, BANA, 0.25), (lt >= DORT ? shake(lt, DORT, 6, 0.3) : 0) + Math.sin(lt * 2) * 1.2);
        } else bubbleAt(w, false);
        stampAt(w, lt >= ZERO + 0.05 && lt < BANA - 0.1, 'DÖNDÜ', RED, FX0, 1046, prog(lt, ZERO + 0.05, 0.22));

        // bölünmeden sonra: lambanın altında, tepesinde yağmur bulutu
        const cOn = split && lt >= SPLIT + 0.6 && lt < CTA + 0.4;
        const ca = cOn ? clamp(prog(lt, SPLIT + 0.6, 0.3)) * (Q ? 1 - prog(lt, CTA, 0.4) : 1) : 0;
        w.cloud.style.display = cOn ? 'block' : 'none';
        if (cOn) { w.cloud.style.transform = `translate(${x - 84}px,${hb - 74 + 5 * Math.sin(lt * 2)}px)`; w.cloud.style.opacity = ca; }
        w.drops.forEach((d) => {
          const k = ((((lt + d.ph) % 0.7) + 0.7) % 0.7) / 0.7;
          d.e.style.display = cOn ? 'block' : 'none';
          if (cOn) { d.e.style.transform = `translate(${x - 84 + d.dx}px,${hb - 16 + 56 * k * k}px)`; d.e.style.opacity = ca * (1 - k * k); }
        });
        ledgerAt(w, lt, KAYIP, x);
        w.dl.style.transform = w.dr.style.transform = 'none';
      }

      // ══ W2 · parası kaybolan evren (yalnız bölünmüş ekranda) ══
      if (split) {
        const w = W2;
        setCam(w, 540, lerp(430, 540, ramp(lt, ALDI + 0.9, 0.8)), 1250, 0.95 + 0.03 * prog(lt, SPLIT, 10));
        let x = 470, b = FB, rot = 0, m = ['happy', null, 'happy'];
        if (lt < PARA) {
          const k = E.inOut(prog(lt, SPLIT, 1.0));
          x = lerp(860, 470, k);
          if (k < 1) b -= hop(lt - SPLIT, 0.4, 16).y;
        } else if (lt < ALDI) {
          if (lt < PARA + 0.45) m = ['curious', null, 'wide'];
          else { m = ['happy', 'up', 'mood']; rot = 5 * Math.sin((lt - PARA - 0.45) * 12) * Math.exp(-(lt - PARA - 0.45) * 3); }  // omuz silker
        } else {
          m = ['celebrate', 'up', 'happy'];
          if (lt < ALDI + 0.85) b -= hop(lt - ALDI, 0.42, 22).y;
          if (lt >= ALDI + 0.9) {
            const k = E.inOut(prog(lt, ALDI + 0.9, 0.7));
            x = lerp(470, 590, k);
            m = ['happy', null, 'happy'];
            b -= k < 1 ? hop(lt - ALDI - 0.9, 0.35, 12).y : hop(lt, 0.9, 6).y;
          }
        }
        if (Q) { m = ['curious', null, 'mood']; rot = Math.sin(lt * 2.4 + 1.2) * 3; b = FB; }
        if (lt >= FOLLOW) m = ['happy', 'up', 'happy'];
        w.fis.set(m[0], m[1], blinkE(m[2], lt, 1.1));
        w.fis.put(x, b, { rot });
        // uçan 200 TL
        const nOn = lt >= PARA && lt < PARA + 1.3;
        w.note.style.display = nOn ? 'block' : 'none';
        if (nOn) {
          const k = prog(lt, PARA, 1.3);
          const nx = 540 + 420 * k + 16 * Math.sin(lt * 8), ny = 1380 - 620 * (1 - (1 - k) ** 2);
          w.note.style.transform = `translate(${nx - 72}px,${ny - 33}px) rotate(${-10 + 520 * k}deg) scale(${1 - 0.3 * k})`;
        }
        // gişedeki bilet uzatılır, ALDI'da Fıstık'ın patisine uçar ve elinde kalır
        w.kt.style.display = lt < ALDI ? 'block' : 'none';
        if (lt < ALDI) w.kt.style.transform = `translate(162px,${1064 + 3 * Math.sin(lt * 5)}px) rotate(${-6 + 3 * Math.sin(lt * 3)}deg) scale(0.72)`;
        const hOn = lt >= ALDI;
        w.tk.style.display = hOn ? 'block' : 'none';
        if (hOn) {
          const k = E.out(prog(lt, ALDI, 0.35));
          const hx = lerp(262, x + 120, k), hy = lerp(1114, 1268 + (b - FB), k) - 60 * Math.sin(Math.PI * k);
          w.tk.style.transform = `translate(${hx - 100}px,${hy - 50}px) rotate(${lerp(-6, 12, k) + 4 * Math.sin(lt * 5)}deg) scale(${lerp(0.72, 0.66, k)})`;
        }
        // kapı açılır, içeriden ışık
        const dk = E.inOut(prog(lt, ALDI + 1.1, 0.45));
        w.dl.style.transform = w.dr.style.transform = `scaleX(${1 - 0.86 * dk})`;
        w.glow.style.filter = `brightness(${1 + 0.25 * dk})`;
        stampAt(w, lt >= ALDI + 0.15 && lt < SCI + 0.6, 'ALDI', '#2F8F5A', 470, 1046, prog(lt, ALDI + 0.15, 0.22));
        if (lt >= SCI + 0.35 && lt < SCI + 0.6) w.stamp.style.opacity = 1 - prog(lt, SCI + 0.35, 0.25);
        ledgerAt(w, lt, KAYIP + 0.12, x);
        leavesAt(w, lt - PARA, lt >= PARA && lt < PARA + 2.5);
      } else W2.leaves.forEach((l) => (l.e.style.display = 'none'));

      // ── rüzgâr çizgileri (kanca) ──
      streaks.forEach((e, i) => {
        const on = lt < 1.9;
        e.style.display = on ? 'block' : 'none';
        if (on) { e.style.transform = `translateX(${-320 + ((lt * 1500 + i * 260) % 1500)}px)`; e.style.opacity = 1 - prog(lt, 1.4, 0.5); }
      });
      // ── bölme şeridi, kartlar, eşittir, kaynak ──
      divider.style.display = split ? 'block' : 'none';
      divider.style.transform = `scaleY(${E.out(prog(lt, SPLIT, 0.3))})`;
      [[cB, S46], [cP, S88]].forEach(([c, at], i) => {
        const on = split && lt < FOLLOW + 0.2;
        c.e.style.display = on ? 'block' : 'none';
        if (!on) return;
        c.e.style.transform = `scale(${E.back(prog(lt, SPLIT + 0.25 + i * 0.12, 0.3))})`;
        const open = E.out(prog(lt, SCI + 0.6, 0.35)) * (Q ? 1 - E.inOut(prog(lt, CTA, 0.3)) : 1);
        c.body.style.height = px(162 * open);
        const v = Math.round(c.val * E.out(prog(lt, at, 0.6)));
        c.n.textContent = lt < at ? (Math.floor(lt * 4) % 2 ? '%?' : '% ?') : `%${v}`;
        c.n.style.transform = `scale(${lt >= at ? 1 + 0.12 * Math.exp(-(lt - at - 0.6) * 6) * (lt >= at + 0.6 ? 1 : 0) : 1})`;
        c.bar.style.width = `${lt < at ? 0 : v}%`;
      });
      const eOn = lt >= AYNI && lt < FOLLOW;
      eq.style.display = eOn ? 'block' : 'none';
      if (eOn) eq.style.transform = `scale(${E.back(prog(lt, AYNI, 0.25)) * (lt >= IKI ? 1 + 0.08 * Math.exp(-(lt - IKI) * 5) * Math.sin((lt - IKI) * 18) : 1)})`;
      src.style.display = lt >= SCI + 0.3 && lt < KAYIP ? 'block' : 'none';

      // ── karar anı: gerçek 3 saniye ──
      cdg.style.display = counting ? 'flex' : 'none';
      if (counting) {
        const k = prog(lt, COUNT, ZERO - COUNT), st = Math.min(2, Math.floor(lt - COUNT)), loc = lt - COUNT - st;
        ring.style.background = `conic-gradient(#E04A3A ${360 * (1 - k)}deg, rgba(255,255,255,.18) 0)`;
        num.textContent = String(3 - st);
        num.style.transform = `scale(${1 + 0.35 * (1 - E.out(Math.min(1, loc * 4)))})`;
        cdg.style.opacity = Math.min(1, (lt - COUNT) * 8);
      }
      flash.style.opacity = Math.max(lt >= ZERO && lt < ZERO + 0.3 ? 0.5 * (1 - prog(lt, ZERO, 0.3)) : 0, lt >= SPLIT && lt < SPLIT + 0.3 ? 0.45 * (1 - prog(lt, SPLIT, 0.3)) : 0, lt >= ALDI && lt < ALDI + 0.25 ? 0.18 * (1 - prog(lt, ALDI, 0.25)) : 0);
      dark.style.opacity = 0.75 * E.inOut(prog(lt, DIM, 0.4));

      // ── takip kartı: FOLLOW'da açılır; TAPF'de Fıstık'ın patisi "Takip et"e basar ──
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
