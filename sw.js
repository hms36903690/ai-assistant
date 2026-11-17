// 앱 화면 파일을 기기에 저장해 두어 인터넷이 없어도 열리게 합니다.
// 새 버전을 올릴 때는 아래 버전 숫자를 올려 주세요. (예: v2 → v3)
const CACHE = 'hmsfc-v195';
const FILES = ['./', './index.html', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png', './icon-maskable-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})))).then(() => self.skipWaiting()));
});

// 예전 버전 보관함 정리
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== 'hmsfc-share').map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// 화면(HTML)은 최신 버전을 먼저 받아오고, 인터넷이 없으면 저장된 것을 보여 줍니다.
// (cache: 'no-cache' → 브라우저에 잠시 저장된 옛 파일 대신 서버에 새 버전이 있는지 꼭 확인)
// 아이콘 등 나머지는 저장된 것을 먼저 씁니다.
self.addEventListener('fetch', e => {
  const req = e.request;
  // 휴대폰 연락처 앱에서 '공유 → 이 앱'으로 보낸 연락처(텍스트·vcf 파일)를 받아 두고 앱을 엽니다.
  if (req.method === 'POST' && new URL(req.url).pathname.endsWith('/share-target')) {
    e.respondWith((async () => {
      try {
        const fd = await req.formData(); let text = [fd.get('title'), fd.get('text'), fd.get('url')].filter(Boolean).join('\n');
        for (const f of fd.getAll('file')) if (f && f.text) text += '\n' + await f.text();
        const c = await caches.open('hmsfc-share'); await c.put('./__share', new Response(text));
      } catch (err) {}
      return Response.redirect('./index.html?share=1#dbleads', 303);
    })());
    return;
  }
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (new URL(req.url).pathname.endsWith('/manifest.json')) { e.respondWith(fetch(req, {cache: 'no-cache'}).catch(() => caches.match(req))); return; }
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req.url, {cache: 'no-cache', credentials: 'same-origin'})
      .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); } return res; })
      .catch(() => caches.match('./index.html')));
    return;
  }
  // 월요일·수요일 문구 모음은 매달 바뀌므로 항상 최신 것을 먼저 받아옵니다.
  if (new URL(req.url).pathname.endsWith('-messages.json')) {
    e.respondWith(fetch(req, {cache: 'no-cache'})
      .then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req, {ignoreSearch: true})));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
