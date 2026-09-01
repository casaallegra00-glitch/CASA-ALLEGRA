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
    ['＋','Nuevo producto','productos'],
    ['＄','Registrar venta','ventas'],
    ['👤','Nuevo cliente','clientes'],
    ['📋','Nuevo pedido','pedidos'],
    ['💰','Ingresos y egresos','caja'],
    ['🧮','Calculadora de costos','costos'],
    ['📄','Nuevo presupuesto','presupuestos'],
    ['📊','Ver reportes','reportes'],
  ] as const
  return <section className="home-dashboard">
    <div className="home-dashboard-head">
      <div><span className="eyebrow">PANEL DE CONTROL</span><h2>Accesos rápidos</h2><p>Todo lo que necesitás para trabajar desde Inicio.</p></div>
    </div>
    <div className="home-dashboard-actions">
      {actions.map(([icon,label,target])=><button key={label} className="home-action" onClick={()=>onNavigate(target)}><span className="home-action-icon">{icon}</span><span>{label}</span><span className="home-action-arrow">→</span></button>)}
    </div>
    <div className="home-dashboard-stats">
      <article><span>Ventas del mes</span><strong>{money(monthSales)}</strong><small>Facturación registrada</small></article>
      <article><span>Saldo de caja</span><strong>{money(balance)}</strong><small>Ingresos menos egresos</small></article>
      <article><span>Pedidos pendientes</span><strong>{pending}</strong><small>Para producir o entregar</small></article>
      <article><span>Stock bajo</span><strong>{lowStock}</strong><small>Productos para reponer</small></article>
    </div>
  </section>
}
