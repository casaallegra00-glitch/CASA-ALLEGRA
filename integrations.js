/* CASA ALLEGRA — Integraciones v2 */
(function(){
  const KEY='casaAllegraIntegrations_v2';
  const DEFAULT={
    mercadopago:{enabled:false,mode:'sandbox',publicKey:'',connected:false},
    mercadolibre:{enabled:false,connected:false},
    mercadoenvios:{enabled:false,connected:false},
    correoargentino:{enabled:false,connected:false},
    andreani:{enabled:false,connected:false}
  };
  const providers=[
    ['mercadopago','💳','Mercado Pago','Pagos online, links y estado de cobro.','Pago'],
    ['mercadolibre','🛒','Mercado Libre','Publicaciones, ventas y sincronización de productos.','Marketplace'],
    ['mercadoenvios','📦','Mercado Envíos','Seguimiento y estado logístico.','Envíos'],
    ['correoargentino','📮','Correo Argentino','Despachos y códigos de seguimiento.','Correo'],
    ['andreani','🚚','Andreani','Despachos, seguimiento y entregas.','Logística']
  ];
  let cfg=load();
  function load(){try{return {...DEFAULT,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return JSON.parse(JSON.stringify(DEFAULT))}}
  function esc(s){return String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}
  function notify(msg){if(typeof window.toast==='function')window.toast(msg);else console.log(msg)}
  function style(){
    if(document.getElementById('integrationStyles'))return;
    const s=document.createElement('style');s.id='integrationStyles';
    s.textContent=`.integration-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.integration-card{padding:18px}.integration-card.is-on{box-shadow:0 0 0 2px rgba(99,199,201,.22),var(--shadow)}.integration-head{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:start}.integration-icon{width:50px;height:50px;border-radius:15px;background:#f5effd;display:grid;place-items:center;font-size:26px}.integration-head h3{margin:6px 0 4px}.integration-head p{margin:0;color:var(--muted);font-size:12px;line-height:1.45}.integration-switch{position:relative;width:48px;height:28px}.integration-switch input{display:none}.integration-switch span{position:absolute;inset:0;border-radius:999px;background:#ddd3df;cursor:pointer}.integration-switch span:after{content:'';position:absolute;width:22px;height:22px;left:3px;top:3px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.12);transition:.2s}.integration-switch input:checked+span{background:var(--turq)}.integration-switch input:checked+span:after{transform:translateX(20px)}.integration-status{margin:12px 0;font-size:11px;font-weight:800}.integration-dot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#c7bdc9;margin-right:7px}.integration-card.is-on .integration-dot{background:var(--success)}.integration-fields{display:grid;grid-template-columns:1fr 1fr;gap:10px}.integration-fields label{display:grid;gap:6px;color:#675e6d;font-size:11px;font-weight:800}.integration-data{margin-top:12px;padding:10px;background:#faf6fb;border-radius:12px}.integration-data span{display:block;font-size:10px;font-weight:800}.integration-data small{font-size:11px;color:var(--muted)}.integration-flow{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin-top:14px}.integration-flow span{padding:10px 12px;background:#f8f3fa;border-radius:12px;font-size:11px;font-weight:800}@media(max-width:760px){.integration-grid{grid-template-columns:1fr}.integration-fields{grid-template-columns:1fr}}`;
    document.head.appendChild(s);
  }
  function card(p){const[id,icon,name,desc,type]=p,c=cfg[id]||DEFAULT[id];return `<article class="card integration-card ${c.enabled?'is-on':''}"><div class="integration-head"><div class="integration-icon">${icon}</div><div><span class="badge">${type}</span><h3>${name}</h3><p>${desc}</p></div><label class="integration-switch"><input data-int="${id}" type="checkbox" ${c.enabled?'checked':''}><span></span></label></div><div class="integration-status"><span class="integration-dot"></span>${c.connected?'Conectado':'Preparado para conectar'}</div>${id==='mercadopago'?`<div class="integration-fields"><label>Modo<select id="mpMode" class="select"><option value="sandbox" ${c.mode==='sandbox'?'selected':''}>Pruebas / Sandbox</option><option value="production" ${c.mode==='production'?'selected':''}>Producción</option></select></label><label>Clave pública<input id="mpPublic" class="input" value="${esc(c.publicKey)}" placeholder="Se agregará al conectar la API"></label></div>`:`<div class="integration-fields"><label>Estado de conexión<input class="input" value="${c.connected?'Conectado':'Pendiente de credenciales API'}" disabled></label><button type="button" class="btn" data-info="${id}">Ver estructura</button></div>`}<div class="integration-data"><span>Datos previstos</span><small>${id==='mercadopago'?'pago_id · referencia · monto · estado':id==='mercadolibre'?'publicación · SKU · venta · comprador':id==='mercadoenvios'?'shipment_id · tracking · estado · costo':'destinatario · tracking · estado · costo'}</small></div></article>`}
  function activate(){
    const section=document.getElementById('integraciones');if(!section)return;
    document.querySelectorAll('.section').forEach(x=>x.classList.toggle('active',x===section));
    document.querySelectorAll('.nav button,.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.section==='integraciones'));
    const t=document.getElementById('pageTitle'),s=document.getElementById('pageSubtitle');if(t)t.textContent='Integraciones';if(s)s.textContent='Pagos, marketplaces y operadores logísticos.';
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function render(){
    style();
    let nav=document.querySelector('.nav');
    if(nav && !nav.querySelector('[data-section="integraciones"]')){const b=document.createElement('button');b.dataset.section='integraciones';b.innerHTML='🔗 <span>Integraciones</span>';b.addEventListener('click',activate);nav.appendChild(b)}
    let bottom=document.querySelector('.bottom-nav');
    if(bottom && !bottom.querySelector('[data-section="integraciones"]')){const b=document.createElement('button');b.dataset.section='integraciones';b.innerHTML='🔗<span>Integraciones</span>';b.addEventListener('click',activate);bottom.appendChild(b)}
    let section=document.getElementById('integraciones');
    if(!section){
      const main=document.querySelector('.main');if(!main)return;
      section=document.createElement('section');section.id='integraciones';section.className='section';
      section.innerHTML=`<div class="section-head"><div><h2>Integraciones</h2><p>Conectá pagos, marketplaces y operadores logísticos cuando estés listo.</p></div><button class="btn primary" id="saveIntegrationsBtn">Guardar configuración</button></div><div class="card info-banner"><strong>Centro de conexiones</strong><span>Interfaz lista. Las APIs reales se conectarán en la segunda etapa.</span></div><div class="integration-grid">${providers.map(card).join('')}</div><div class="card panel" style="margin-top:16px"><h3>Flujo de pedido</h3><div class="integration-flow"><span>🧾 Presupuesto</span><b>→</b><span>💳 Pago</span><b>→</b><span>📦 Pedido</span><b>→</b><span>🚚 Envío</span><b>→</b><span>✅ Entrega</span></div><p class="muted">Cada pedido podrá guardar proveedor, referencia externa, estado, tracking, costo y fecha de entrega.</p></div>`;
      main.appendChild(section);
    }
    const saveBtn=document.getElementById('saveIntegrationsBtn');
    if(saveBtn && !saveBtn.dataset.bound){saveBtn.dataset.bound='1';saveBtn.addEventListener('click',save)}
    section.querySelectorAll('[data-int]').forEach(e=>{if(!e.dataset.bound){e.dataset.bound='1';e.addEventListener('change',()=>e.closest('.integration-card').classList.toggle('is-on',e.checked))}});
    section.querySelectorAll('[data-info]').forEach(e=>{if(!e.dataset.bound){e.dataset.bound='1';e.addEventListener('click',()=>{const p=providers.find(x=>x[0]===e.dataset.info);notify((p?p[2]:'Integración')+': estructura preparada para API real.')})}});
    const b=document.querySelector('[data-section="integraciones"]');if(b&&!b.dataset.bound){b.dataset.bound='1';b.addEventListener('click',activate)}
  }
  function save(){
    document.querySelectorAll('[data-int]').forEach(e=>{cfg[e.dataset.int]={...(cfg[e.dataset.int]||DEFAULT[e.dataset.int]),enabled:e.checked}});
    cfg.mercadopago={...cfg.mercadopago,mode:document.getElementById('mpMode')?.value||cfg.mercadopago.mode,publicKey:document.getElementById('mpPublic')?.value||''};
    localStorage.setItem(KEY,JSON.stringify(cfg));notify('Configuración de integraciones guardada');
  }
  window.casaAllegraIntegrations={activate,render,save};
  document.addEventListener('DOMContentLoaded',render);
})();