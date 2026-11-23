// AI 영상 스튜디오 — 인터넷이 없어도 열리게 화면 파일을 기기에 저장합니다.
// 새 버전을 올릴 때는 아래 숫자를 올려 주세요.
const CACHE = 'aivs-v1';
const FILES = ['./', './index.html', './manifest.json', './icon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, {cache: 'reload'})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('aivs-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req, {cache: 'no-cache'}).then(res => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./index.html', copy)); } return res; }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req)));
});
