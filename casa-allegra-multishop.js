/* CASA ALLEGRA · identidad multi-tienda y experiencia comercial */
(function(){'use strict';
const KEY='casaAllegraPWA_v2';
const get=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
const put=d=>localStorage.setItem(KEY,JSON.stringify(d));
function apply(){const d=get(),s=d.settings||{};const name=s.business||'CASA ALLEGRA';document.title=name+' · Gestión';document.querySelectorAll('.brand strong').forEach(x=>x.textContent=name);document.querySelectorAll('.eyebrow').forEach(x=>{if(x.textContent==='CASA ALLEGRA')x.textContent=name});document.querySelectorAll('.brand img,.hero-logo').forEach(img=>{if(s.logo)img.src=s.logo});if(s.primaryColor){document.documentElement.style.setProperty('--turq',s.primaryColor)}window.casaAllegraIdentity={name,logo:s.logo||'logo-casa-allegra.png',primaryColor:s.primaryColor||'#63c7c9'}}
function bind(){apply();document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply()});window.addEventListener('storage',e=>{if(e.key===KEY)apply()})}
addEventListener('load',bind);
})();
