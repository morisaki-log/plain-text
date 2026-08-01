const CACHE='morisaki-v062';
const ASSETS=['./?v=062','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const request=event.request;

  // HTML navigation: always try the newest version first.
  if(request.mode==='navigate'){
    event.respondWith((async()=>{
      try{
        const fresh=await fetch(request,{cache:'no-store'});
        const cache=await caches.open(CACHE);
        cache.put('./index.html',fresh.clone());
        return fresh;
      }catch{
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
    })());
    return;
  }

  // Other files: network first, cached copy only when offline.
  event.respondWith((async()=>{
    try{
      const fresh=await fetch(request,{cache:'no-store'});
      const cache=await caches.open(CACHE);
      cache.put(request,fresh.clone());
      return fresh;
    }catch{
      return caches.match(request);
    }
  })());
});
