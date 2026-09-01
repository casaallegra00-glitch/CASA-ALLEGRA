(function(){
  'use strict';
  const KEY='casaAllegraPWA_v2';
  const money=v=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(v)||0);
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch{return {}}};
  const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  function setSection(id,title,subtitle){
    document.querySelectorAll('.section').forEach(x=>x.classList.toggle('active',x.id===id));
    document.querySelectorAll('.nav button,.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.section===id));
    const t=document.getElementById('pageTitle'),s=document.getElementById('pageSubtitle');
    if(t)t.textContent=title;if(s)s.textContent=subtitle;
    document.getElementById('sidebar')?.classList.remove('open');window.scrollTo({top:0,behavior:'smooth'});
    if(id==='reportes')renderReports();
  }
  window.casaAllegraShowReports=()=>setSection('reportes','Reportes','Ventas, caja, stock y pedidos en un solo lugar.');
  function quickActions(){
    const inicio=document.getElementById('inicio'); if(!inicio)return;
    let card=document.getElementById('homeQuickActions');
    if(!card){
      card=document.createElement('div');card.id='homeQuickActions';card.className='card panel home-enhanced-card';
      card.innerHTML='<div class="panel-head"><div><h3>⚡ Accesos rápidos</h3><span>Las tareas que más usás, a un toque</span></div></div><div class="quick-grid enhanced-quick-grid">'+
      '<button class="quick" data-q="producto">➕<span>Nuevo producto</span></button>'+ 
      '<button class="quick" data-q="presupuesto">📋<span>Nuevo presupuesto</span></button>'+ 
      '<button class="quick" data-q="pedido">📦<span>Nuevo pedido</span></button>'+ 
      '<button class="quick" data-q="cliente">👤<span>Nuevo cliente</span></button>'+ 
      '<button class="quick" data-q="ingreso">💰<span>Registrar ingreso</span></button>'+ 
      '<button class="quick" data-q="egreso">💸<span>Registrar egreso</span></button>'+ 
      '<button class="quick" data-q="calculadora">🧮<span>Calculadora rápida</span></button>'+ 
      '<button class="quick" data-q="reportes">📊<span>Ver reportes</span></button>'+ 
      '</div>';
      inicio.appendChild(card);
      card.querySelectorAll('[data-q]').forEach(b=>b.addEventListener('click',()=>{
        const q=b.dataset.q;
        if(q==='reportes')return window.casaAllegraShowReports();
        if(q==='producto')return window.openProductModal?.();
        if(q==='presupuesto')return window.openQuoteModal?.();
        if(q==='cliente'){window.casaAllegraToast?.('Abrí Clientes desde el menú.');return setSection('clientes','Clientes','Gestioná tus clientes y contactos.');}
        if(q==='pedido')return setSection('pedidos','Pedidos','Seguimiento de pedidos.');
        if(q==='ingreso'||q==='egreso')return setSection('caja','Caja','Ingresos, egresos y saldo.');
        if(q==='calculadora')return window.openQuickCalculator?.() || setSection('costos','Costos y precios','Calculá costo real, precio sugerido y margen.');
      }));
    }
  }
  function addReportsNav(){
    const nav=document.querySelector('.nav');if(!nav||nav.querySelector('[data-section="reportes"]'))return;
    const b=document.createElement('button');b.dataset.section='reportes';b.innerHTML='📊 <span>Reportes</span>';b.addEventListener('click',window.casaAllegraShowReports);nav.appendChild(b);
  }
  function ensureReportsSection(){
    if(document.getElementById('reportes'))return;
    const main=document.querySelector('main.main');if(!main)return;
    const sec=document.createElement('section');sec.id='reportes';sec.className='section';
    sec.innerHTML='<div class="section-head"><div><h2>Reportes</h2><p>Visualizá el rendimiento de CASA ALLEGRA de forma clara.</p></div><button class="btn" id="reportRefresh">Actualizar</button></div><div id="reportContent"></div>';
    main.appendChild(sec);document.getElementById('reportRefresh').addEventListener('click',renderReports);
  }
  function renderReports(){
    ensureReportsSection();const d=read(),quotes=Array.isArray(d.quotes)?d.quotes:[],orders=Array.isArray(d.orders)?d.orders:[],products=Array.isArray(d.products)?d.products:[],cash=Array.isArray(d.cash)?d.cash:[];
    const approved=quotes.filter(q=>['Aprobado','Pagado'].includes(q.status));
    const sales=approved.reduce((a,q)=>a+(Number(q.total)||0),0),income=cash.filter(x=>x.type==='ingreso').reduce((a,x)=>a+(Number(x.amount)||0),0),expense=cash.filter(x=>x.type==='egreso').reduce((a,x)=>a+(Number(x.amount)||0),0),pending=orders.filter(o=>!['Entregado','Cancelado'].includes(o.status)).length,low=products.filter(p=>(Number(p.stock)||0)<=(Number(p.minStock)||5)).length;
    const days=[];for(let i=6;i>=0;i--){const dt=new Date();dt.setHours(0,0,0,0);dt.setDate(dt.getDate()-i);days.push(dt)}
    const vals=days.map(dt=>{const next=new Date(dt);next.setDate(next.getDate()+1);return approved.filter(q=>{const x=new Date(q.createdAt||q.date||0);return x>=dt&&x<next}).reduce((a,q)=>a+(Number(q.total)||0),0)});const max=Math.max(...vals,1);
    const bars=vals.map((v,i)=>{const h=Math.max(4,Math.round((v/max)*150));const x=30+i*52;const label=days[i].toLocaleDateString('es-AR',{weekday:'short'}).replace('.','');return '<rect x="'+x+'" y="'+(175-h)+'" width="30" height="'+h+'" rx="7"/><text x="'+(x+15)+'" y="198" text-anchor="middle">'+esc(label)+'</text><text x="'+(x+15)+'" y="'+(165-h)+'" text-anchor="middle">'+(v?esc(money(v)):'')+'</text>'}).join('');
    const content=document.getElementById('reportContent');if(!content)return;
    content.innerHTML='<div class="grid four report-kpis"><div class="card stat"><span>Ventas aprobadas</span><strong>'+money(sales)+'</strong><small>cotizaciones aprobadas/pagadas</small></div><div class="card stat"><span>Ingresos</span><strong>'+money(income)+'</strong><small>movimientos de caja</small></div><div class="card stat"><span>Egresos</span><strong>'+money(expense)+'</strong><small>movimientos de caja</small></div><div class="card stat"><span>Saldo</span><strong>'+money(income-expense)+'</strong><small>resultado de caja</small></div></div><div class="grid three report-kpis"><div class="card stat"><span>Pedidos activos</span><strong>'+pending+'</strong><small>sin entregar</small></div><div class="card stat"><span>Stock bajo</span><strong>'+low+'</strong><small>productos para reponer</small></div><div class="card stat"><span>Productos</span><strong>'+products.length+'</strong><small>en catálogo</small></div></div><div class="card panel report-chart-card"><div class="panel-head"><div><h3>Ventas aprobadas — últimos 7 días</h3><span>Evolución diaria</span></div><strong>'+money(sales)+'</strong></div><div class="report-chart"><svg viewBox="0 0 400 215" role="img" aria-label="Gráfico de ventas de los últimos 7 días"><line x1="20" y1="175" x2="390" y2="175"/><line x1="20" y1="20" x2="20" y2="175"/>'+bars+'</svg></div></div><div class="grid two"><div class="card panel"><h3>Pedidos por estado</h3>'+(['Pendiente','En proceso','Listo','Entregado','Cancelado'].map(s=>'<div class="trow"><span>'+esc(s)+'</span><b>'+orders.filter(o=>o.status===s).length+'</b></div>').join('')||'<div class="empty-state">Sin pedidos registrados.</div>')+'</div><div class="card panel"><h3>Alertas de stock</h3>'+(low?'<div class="notice">⚠️ Hay <b>'+low+'</b> productos que necesitan reposición.</div>':'<div class="empty-state">Todo el stock está dentro de los mínimos configurados.</div>')+'</div></div>';
  }
  function init(){quickActions();addReportsNav();ensureReportsSection();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
