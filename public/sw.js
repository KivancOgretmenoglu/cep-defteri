// Çevrimdışı çalışma: uygulama dosyalarını önbelleğe alır. Kullanıcı verisi burada değil, localStorage'dadır.
//
// İki önbellek:
//  - SHELL: index.html, manifest, simgeler. Ağ öncelikli (yeni sürüm hemen gelsin), ağ yoksa önbellek.
//  - ASSETS: derlemenin adı özetli (hash) dosyaları (/assets/*.js|css|woff2). İçerik adla değiştiği için
//    önbellek öncelikli. Kurulumda precache.json'daki TÜM parçalar indirilir; böylece tembel yüklenen ve
//    hiç açılmamış ekranlar da çevrimdışıyken açılır.
const SHELL = 'cep-defteri-shell-v2';
const ASSETS = 'cep-defteri-assets';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png'];

async function precacheList() {
  try {
    const res = await fetch('./precache.json', { cache: 'no-store' });
    if (!res.ok) return [];
    const m = await res.json();
    return (m.files || []).filter((f) => f.startsWith('assets/')).map((f) => './' + f);
  } catch {
    return [];
  }
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    (async () => {
      const shell = await caches.open(SHELL);
      await shell.addAll(CORE);
      const files = await precacheList();
      const assets = await caches.open(ASSETS);
      // Zaten önbellekte olanı yeniden indirme (adı özetli dosya değişmez).
      const have = new Set((await assets.keys()).map((r) => r.url));
      const missing = files.filter((f) => !have.has(new URL(f, self.registration.scope).href));
      // Tek bir dosya başarısız olsa da kurulum sürsün; eksik kalan ilk kullanımda önbelleğe girer.
      await Promise.all(missing.map((f) => assets.add(f).catch(() => {})));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== SHELL && k !== ASSETS).map((k) => caches.delete(k)));
      // Eski sürümlerin parçalarını temizle (yalnız güncel listede olmayanlar; liste alınamazsa dokunma).
      const files = await precacheList();
      if (files.length) {
        const keep = new Set(files.map((f) => new URL(f, self.registration.scope).href));
        const assets = await caches.open(ASSETS);
        for (const req of await assets.keys()) if (!keep.has(req.url)) await assets.delete(req);
      }
      await self.clients.claim();
    })(),
  );
});

const isAsset = (url) => /\/assets\/[^/]+\.(?:js|css|woff2?|png|svg|jpe?g|webp)$/.test(url.pathname);

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isAsset(url)) {
    // Önbellek öncelikli; yoksa ağdan al ve sakla.
    e.respondWith(
      caches.open(ASSETS).then(async (c) => {
        const hit = await c.match(req);
        if (hit) return hit;
        const res = await fetch(req);
        if (res.ok) c.put(req, res.clone());
        return res;
      }),
    );
    return;
  }

  // Ağ öncelikli; ağ yoksa önbellek. Böylece yeni sürüm hemen gelir, çevrimdışıyken de açılır.
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(async () => {
        const hit = await caches.match(req);
        if (hit) return hit;
        // Sayfa gezinmesi (ör. #/raporlar ile açılış) → uygulama kabuğu
        if (req.mode === 'navigate') return (await caches.match('./index.html')) || (await caches.match('./'));
        return Response.error();
      }),
  );
});
