const CACHE='kaizenai-v5';
const ASSETS=['./','./index.html','./manifest.json','./icon.svg','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS);}).then(function(){return self.skipWaiting();}).catch(function(){}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));});
function isRoot(u){ var p=new URL(u).pathname, sc=new URL(self.registration.scope).pathname; return p===sc || p===sc+'index.html'; }
self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var isHTML = req.mode==='navigate' || (req.headers.get('accept')||'').indexOf('text/html')>=0;
  if(isHTML){
    // Red primero, pero si la red tarda mas de 3,5 s (señal mala) se usa la copia guardada.
    // La copia se guarda por URL: /completa/ no pisa a la version principal.
    e.respondWith(new Promise(function(resolve){
      var done=false;
      function cached(){ return caches.match(req, {ignoreSearch:true}).then(function(r){ return r || (isRoot(req.url) ? caches.match('./index.html') : null); }); }
      var t=setTimeout(function(){ cached().then(function(r){ if(r && !done){ done=true; resolve(r); } }); }, 3500);
      fetch(req).then(function(resp){
        try{ var cp=resp.clone(); caches.open(CACHE).then(function(c){ c.put(req, cp); }); }catch(err){}
        if(!done){ done=true; clearTimeout(t); resolve(resp); }
      }).catch(function(){
        cached().then(function(r){ if(!done){ done=true; clearTimeout(t); resolve(r || Response.error()); } });
      });
    }));
    return;
  }
  e.respondWith(caches.match(req).then(function(r){
    return r||fetch(req).then(function(resp){
      if(resp&&resp.status===200&&resp.type==='basic'){try{var cp=resp.clone();caches.open(CACHE).then(function(c){c.put(req,cp);});}catch(err){}}
      return resp;
    });
  }));
});
