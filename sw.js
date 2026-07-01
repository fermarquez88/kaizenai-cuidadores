const CACHE='kaizenai-v3';
const ASSETS=['./','./index.html','./manifest.json','./icon.svg'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS);}).then(function(){return self.skipWaiting();}).catch(function(){}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var isHTML = req.mode==='navigate' || (req.headers.get('accept')||'').indexOf('text/html')>=0;
  if(isHTML){
    e.respondWith(fetch(req).then(function(resp){
      try{var cp=resp.clone();caches.open(CACHE).then(function(c){c.put('./index.html',cp);});}catch(e){}
      return resp;
    }).catch(function(){ return caches.match('./index.html').then(function(r){return r||caches.match('./');}); }));
    return;
  }
  e.respondWith(caches.match(req).then(function(r){
    return r||fetch(req).then(function(resp){
      if(resp&&resp.status===200&&resp.type==='basic'){try{var cp=resp.clone();caches.open(CACHE).then(function(c){c.put(req,cp);});}catch(e){}}
      return resp;
    });
  }));
});
