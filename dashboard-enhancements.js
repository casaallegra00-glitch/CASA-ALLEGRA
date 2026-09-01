(function(){
'use strict';
function addHome(){
 const inicio=document.getElementById('inicio'); if(!inicio||document.getElementById('homeEnhanced')) return;
 const card=document.createElement('div'); card.id='homeEnhanced'; card.className='card panel';
 card.innerHTML='<div class="panel-head"><div><h3>⚡ Accesos rápidos</h3><span>Acciones principales de CASA ALLEGRA</span></div></div><div class="quick-grid enhanced-quick-grid">'+
 '<button class="quick" onclick="openProductModal()">➕<span>Nuevo producto</span></button>'+ 
 '<button class="quick" onclick="openQuoteModal()">📋<span>Nuevo presupuesto</span></button>'+ 
 '<button class="quick" onclick="go(\'pedidos\')">📦<span>Nuevo pedido</span></button>'+ 
 '<button class="quick" onclick="go(\'catalogo\')">👤<span>Clientes</span></button>'+ 
 '<button class="quick" onclick="go(\'configuracion\')">💰<span>Ingresos y egresos</span></button>'+ 
 '<button class="quick" onclick="go(\'costos\')">🧮<span>Calculadora de costos</span></button>'+ 
 '<button class="quick" onclick="showDashboardReport()">📊<span>Ver reportes</span></button>'+ 
 '</div>';
 inicio.insertBefore(card,inicio.firstElementChild?.nextElementSibling || inicio.firstElementChild);
}
function addReport(){
 if(document.getElementById('reportes')) return;
 const main=document.querySelector('main.main'); if(!main)return;
 const s=document.createElement('section'); s.id='reportes'; s.className='section';
 s.innerHTML='<div class="section-head"><div><h2>Reportes</h2><p>Resumen del rendimiento de CASA ALLEGRA.</p></div><button class="btn" onclick="renderDashboardReport()">Actualizar</button></div><div id="dashboardReport"></div>';
 main.appendChild(s);
 const nav=document.querySelector('.nav'); if(nav&&!nav.querySelector('[data-section="reportes"]')){const b=document.createElement('button');b.dataset.section='reportes';b.innerHTML='📊 <span>Reportes</span>';b.onclick=showDashboardReport;nav.appendChild(b)}
}
function data(){try{return JSON.parse(localStorage.getItem('casaAllegraPWA_v2')||'{}')}catch(e){return {}}}
function money(v){return new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(Number(v)||0)}
function renderDashboardReport(){
 addReport(); const d=data(),q=Array.isArray(d.quotes)?d.quotes:[],o=Array.isArray(d.orders)?d.orders:[],p=Array.isArray(d.products)?d.products:[];
 const approved=q.filter(x=>x.status==='Aprobado'||x.status==='Pagado'); const sales=approved.reduce((a,x)=>a+(Number(x.total)||0),0); const active=o.filter(x=>x.status!=='Entregado'&&x.status!=='Cancelado').length; const low=p.filter(x=>(Number(x.stock)||0)<=(Number(x.minStock)||5)).length;
 document.getElementById('dashboardReport').innerHTML='<div class="grid four report-kpis"><div class="card stat"><span>Ventas aprobadas</span><strong>'+money(sales)+'</strong><small>total acumulado</small></div><div class="card stat"><span>Presupuestos</span><strong>'+q.length+'</strong><small>registrados</small></div><div class="card stat"><span>Pedidos activos</span><strong>'+active+'</strong><small>sin entregar</small></div><div class="card stat"><span>Stock bajo</span><strong>'+low+'</strong><small>para reponer</small></div></div><div class="grid two"><div class="card panel"><h3>Pedidos por estado</h3><div class="report-list">'+['Pendiente','En proceso','Listo','Entregado','Cancelado'].map(s=>'<div class="trow"><span>'+s+'</span><b>'+o.filter(x=>x.status===s).length+'</b></div>').join('')+'</div></div><div class="card panel"><h3>Resumen de catálogo</h3><div class="trow"><span>Productos</span><b>'+p.length+'</b></div><div class="trow"><span>Presupuestos</span><b>'+q.length+'</b></div><div class="trow"><span>Ventas aprobadas</span><b>'+money(sales)+'</b></div></div></div>';
}
window.showDashboardReport=function(){
 addReport(); document.querySelectorAll('.section').forEach(x=>x.classList.toggle('active',x.id==='reportes')); document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('active',x.dataset.section==='reportes')); document.getElementById('pageTitle').textContent='Reportes'; document.getElementById('pageSubtitle').textContent='Resumen del rendimiento de CASA ALLEGRA.'; renderDashboardReport(); window.scrollTo(0,0);
}; window.renderDashboardReport=renderDashboardReport;
function init(){addHome();addReport()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
