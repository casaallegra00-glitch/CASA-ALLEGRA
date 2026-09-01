'use client'

type Product = { id:number; name:string; price:number; stock:number; minStock:number }
type Sale = { id:number; amount:number; date:string }
type Order = { id:number; status:string; amount:number }
type CashMove = { id:number; type:'ingreso'|'egreso'; amount:number }

type Props = {
  products: Product[]
  sales: Sale[]
  orders: Order[]
  cash: CashMove[]
  onNavigate: (section:string) => void
}

const money = (v:number) => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(v)

export default function HomeDashboard({products,sales,orders,cash,onNavigate}:Props){
  const monthSales = sales.filter(s=>{const d=new Date(s.date),n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()}).reduce((a,s)=>a+s.amount,0)
  const lowStock = products.filter(p=>p.stock <= (p.minStock ?? 5)).length
  const pending = orders.filter(o=>!['Entregado','Completado','Cancelado'].includes(o.status)).length
  const balance = cash.reduce((a,m)=>a+(m.type==='ingreso'?m.amount:-m.amount),0)
  const actions = [
    ['＋','Nuevo producto','productos','violet'],
    ['＄','Registrar venta','ventas','yellow'],
    ['♙','Nuevo cliente','clientes','turquoise'],
    ['☷','Nuevo pedido','pedidos','pink'],
    ['▣','Ingresos y egresos','caja','green'],
    ['⌗','Calculadora de costos','costos','orange'],
    ['▤','Nuevo presupuesto','presupuestos','blue'],
    ['◔','Ver reportes','reportes','purple'],
  ] as const
  return <section className="home-dashboard">
    <style jsx>{`
      .home-dashboard{width:100%;padding:4px 0 28px}
      .home-dashboard-head{display:flex;align-items:flex-end;justify-content:space-between;margin:0 0 20px}
      .eyebrow{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.14em;color:#8d7ba8;margin-bottom:5px}
      .home-dashboard h2{margin:0;font-size:28px;line-height:1.1;color:#302a3d;font-weight:800}
      .home-dashboard-head p{margin:7px 0 0;color:#81798d;font-size:14px}
      .home-dashboard-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
      .home-action{position:relative;min-height:132px;border:1px solid rgba(70,55,90,.08);border-radius:20px;background:#fff;padding:18px;text-align:left;display:flex;flex-direction:column;justify-content:space-between;cursor:pointer;box-shadow:0 5px 18px rgba(55,42,75,.06);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease;overflow:hidden}
      .home-action:before{content:"";position:absolute;inset:0 0 auto;height:5px;background:var(--accent)}
      .home-action:hover{transform:translateY(-4px);box-shadow:0 12px 28px rgba(55,42,75,.12);border-color:rgba(70,55,90,.14)}
      .home-action:active{transform:translateY(-1px)}
      .home-action-icon{width:43px;height:43px;border-radius:14px;background:var(--soft);display:grid;place-items:center;color:var(--accent);font-size:23px;font-weight:800}
      .home-action-label{font-size:14px;font-weight:750;color:#393242;margin-top:13px;line-height:1.25}
      .home-action-arrow{position:absolute;right:17px;bottom:16px;width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:#f7f5f9;color:#82778e;font-size:15px;transition:all .18s ease}
      .home-action:hover .home-action-arrow{background:var(--accent);color:white}
      .violet{--accent:#8b6bd6;--soft:#f0eaff}.yellow{--accent:#d5a829;--soft:#fff6d9}.turquoise{--accent:#39aaa4;--soft:#e3f8f5}.pink{--accent:#d77fa5;--soft:#fbeaf2}.green{--accent:#62a96b;--soft:#eaf7eb}.orange{--accent:#d98a4d;--soft:#fff0e3}.blue{--accent:#658dca;--soft:#eaf1fc}.purple{--accent:#9b72bd;--soft:#f2eafa}
      .home-dashboard-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-top:22px}
      .home-stat{border-radius:18px;padding:17px 18px;background:linear-gradient(135deg,#fff,#faf8fc);border:1px solid rgba(70,55,90,.07);box-shadow:0 4px 14px rgba(55,42,75,.04)}
      .home-stat span{display:block;font-size:12px;color:#8b8295;font-weight:700}.home-stat strong{display:block;margin-top:6px;font-size:22px;color:#332c3d}.home-stat small{display:block;margin-top:4px;color:#a098a8;font-size:11px}
      @media(max-width:1000px){.home-dashboard-actions,.home-dashboard-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:560px){.home-dashboard-actions,.home-dashboard-stats{grid-template-columns:1fr}.home-dashboard h2{font-size:24px}.home-action{min-height:118px}}
    `}</style>
    <div className="home-dashboard-head">
      <div><span className="eyebrow">PANEL DE CONTROL</span><h2>¿Qué querés hacer hoy?</h2><p>Accesos rápidos para manejar CASA ALLEGRA.</p></div>
    </div>
    <div className="home-dashboard-actions">
      {actions.map(([icon,label,target,theme])=><button key={label} className={`home-action ${theme}`} onClick={()=>onNavigate(target)}><span className="home-action-icon">{icon}</span><span className="home-action-label">{label}</span><span className="home-action-arrow">→</span></button>)}
    </div>
    <div className="home-dashboard-stats">
      <article className="home-stat"><span>Ventas del mes</span><strong>{money(monthSales)}</strong><small>Facturación registrada</small></article>
      <article className="home-stat"><span>Saldo de caja</span><strong>{money(balance)}</strong><small>Ingresos menos egresos</small></article>
      <article className="home-stat"><span>Pedidos pendientes</span><strong>{pending}</strong><small>Para producir o entregar</small></article>
      <article className="home-stat"><span>Stock bajo</span><strong>{lowStock}</strong><small>Productos para reponer</small></article>
    </div>
  </section>
}
