'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Product = { id:number; name:string; category:string; price:number; stock:number }
const PRODUCTS:Product[]=[
 {id:1,name:'Cuaderno personalizado',category:'Papelería',price:18500,stock:12},
 {id:2,name:'Planner semanal',category:'Organización',price:12900,stock:8},
 {id:3,name:'Kit stickers',category:'Regalos',price:6500,stock:24},
 {id:4,name:'Agenda 2026',category:'Papelería',price:22000,stock:5},
 {id:5,name:'Tarjetas personalizadas',category:'Gráfica',price:9800,stock:18},
 {id:6,name:'Combo emprendedor',category:'Gráfica',price:28500,stock:4},
]

const money=(v:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(v)
const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabase=supabaseUrl&&supabaseKey?createClient(supabaseUrl,supabaseKey):null

export default function Home(){
 const [search,setSearch]=useState(''); const [cat,setCat]=useState('Todas'); const [cart,setCart]=useState<Product[]>([]); const [tab,setTab]=useState('inicio')
 const [authMode,setAuthMode]=useState<'login'|'signup'|null>(null)
 const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [name,setName]=useState(''); const [authMessage,setAuthMessage]=useState(''); const [loading,setLoading]=useState(false)
 const cats=['Todas',...Array.from(new Set(PRODUCTS.map(p=>p.category)))]
 const visible=useMemo(()=>PRODUCTS.filter(p=>(cat==='Todas'||p.category===cat)&&p.name.toLowerCase().includes(search.toLowerCase())),[cat,search])
 const total=cart.reduce((a,p)=>a+p.price,0)
 const openAuth=(mode:'login'|'signup')=>{setAuthMode(mode);setAuthMessage('');setEmail('');setPassword('');setName('')}
 const submitAuth=async()=>{
  setAuthMessage('');
  if(!email||!password||(authMode==='signup'&&!name)){setAuthMessage('Completá todos los campos.');return}
  if(password.length<6){setAuthMessage('La contraseña debe tener al menos 6 caracteres.');return}
  if(!supabase){setAuthMessage('La conexión de cuenta todavía no está configurada.');return}
  setLoading(true)
  try{
   if(authMode==='signup'){
    const {error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name}}})
    if(error) throw error
    setAuthMessage('Cuenta creada. Revisá tu correo para confirmar la cuenta y luego ingresá.')
   }else{
    const {error}=await supabase.auth.signInWithPassword({email,password})
    if(error) throw error
    setAuthMode(null);setTab('panel');setAuthMessage('')
   }
  }catch(error){setAuthMessage(error instanceof Error?error.message:'No pudimos completar la operación. Intentá nuevamente.')}finally{setLoading(false)}
 }
 return <div className="shell">
  <header className="top"><div className="brand"><span className="brand-mark">CA</span><span>CASA ALLEGRA APP</span></div><nav className="topnav"><button onClick={()=>setTab('inicio')}>Inicio</button><button onClick={()=>setTab('tienda')}>Tienda</button><button onClick={()=>setTab('panel')}>Mi negocio</button><button onClick={()=>openAuth('login')}>Ingresar</button><button onClick={()=>openAuth('signup')}>Crear cuenta</button><span className="chip">🛒 {cart.length}</span></nav></header>
  {tab==='inicio'||tab==='tienda'?<>
   <section className="hero"><div className="hero-card"><span className="eyebrow">CASA ALLEGRA APP</span><h1>Tu tienda. Tus ventas. Todo en un solo lugar.</h1><p>Catálogo, carrito, clientes, pedidos, métricas, pagos y gestión comercial preparados para crecer. Cada comercio podrá personalizar su marca y administrar su negocio desde PC o iPhone.</p><div className="hero-actions"><button className="btn primary" onClick={()=>setTab('tienda')}>Ver tienda</button><button className="btn dark" onClick={()=>openAuth('signup')}>Crear mi cuenta</button></div></div><div className="side-card"><div><span className="eyebrow">Cuenta de comercio</span><h3>Creá tu tienda profesional</h3><p>Nombre, logo, colores, productos, usuarios y dominio propio.</p></div><div className="login"><input placeholder="Correo electrónico" value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)}/><button className="btn primary" onClick={()=>{setAuthMode('signup');submitAuth()}} disabled={loading}>{loading?'Creando...':'Crear cuenta'}</button></div></div></section>
   <section className="grid kpis"><div className="kpi"><span>Ventas del mes</span><strong>{money(428500)}</strong><small>↑ 18,4% vs. mes anterior</small></div><div className="kpi"><span>Ganancia estimada</span><strong>{money(126700)}</strong><small>Margen 29,6%</small></div><div className="kpi"><span>Pedidos activos</span><strong>14</strong><small>3 listos para despachar</small></div><div className="kpi"><span>Meta mensual</span><strong>74%</strong><small>Faltan {money(149000)}</small></div></section>
   <section className="grid content"><div className="panel"><div className="section-title"><div><h2>Productos destacados</h2><div className="muted">Mostrá tus productos y recibí pedidos desde la tienda.</div></div><button className="btn" onClick={()=>setTab('tienda')}>Ver catálogo</button></div><div className="products">{PRODUCTS.slice(0,3).map(p=><article className="product" key={p.id}><div className="product-img">✦</div><h3>{p.name}</h3><p>{p.category} · Stock {p.stock}</p><div className="price-row"><span className="price">{money(p.price)}</span><button className="btn" onClick={()=>setCart(c=>[...c,p])}>Agregar</button></div></article>)}</div></div><aside className="panel"><h2>Centro de negocio</h2><div className="muted">Lo importante, resumido.</div><div className="list"><div className="row"><span>📊 Métricas</span><b>Día · semana · mes · año</b></div><div className="row"><span>💵 Rentabilidad</span><b>Ganancia / pérdida</b></div><div className="row"><span>🧮 Costos</span><b>Unidad · producto · lote</b></div><div className="row"><span>📱 Marketing</span><b>Redes + objetivos</b></div><div className="row"><span>🚚 Envíos</span><b>Mercado · Andreani · Correo</b></div></div></aside></section>
  </>:<Panel tab={tab} total={total} cart={cart} setCart={setCart} />}
  {tab==='tienda'&&<section className="grid"><div className="panel"><div className="toolbar"><input className="input" placeholder="Buscar productos..." value={search} onChange={e=>setSearch(e.target.value)}/>{cats.map(c=><button className="btn" key={c} onClick={()=>setCat(c)}>{c}</button>)}</div><div className="products">{visible.map(p=><article className="product" key={p.id}><div className="product-img">✦</div><h3>{p.name}</h3><p>{p.category} · Stock {p.stock}</p><div className="price-row"><span className="price">{money(p.price)}</span><button className="btn primary" onClick={()=>setCart(c=>[...c,p])}>Agregar</button></div></article>)}</div></div><div className="panel"><h2>🛒 Tu carrito</h2><div className="list">{cart.map((p,i)=><div className="row" key={`${p.id}-${i}`}><span>{p.name}</span><b>{money(p.price)}</b></div>)}</div><div className="price-row" style={{marginTop:18}}><span>Total</span><strong className="price">{money(total)}</strong></div><button className="btn primary" style={{marginTop:12,width:'100%'}}>Continuar al checkout</button></div></section>}
  {authMode&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'grid',placeItems:'center',zIndex:1000,padding:20}}><div className="panel" style={{width:'min(440px,100%)',position:'relative'}}><button className="btn" style={{position:'absolute',right:16,top:16}} onClick={()=>setAuthMode(null)}>Cerrar</button><span className="eyebrow">CASA ALLEGRA APP</span><h2>{authMode==='signup'?'Crear cuenta':'Iniciar sesión'}</h2><div className="login" style={{marginTop:20}}>{authMode==='signup'&&<input placeholder="Nombre del comercio" value={name} onChange={e=>setName(e.target.value)}/>}<input type="email" placeholder="Correo electrónico" value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" placeholder="Contraseña (mínimo 6 caracteres)" value={password} onChange={e=>setPassword(e.target.value)}/><button className="btn primary" onClick={submitAuth} disabled={loading}>{loading?'Procesando...':authMode==='signup'?'Crear cuenta':'Ingresar'}</button>{authMessage&&<div className="muted" style={{marginTop:8}}>{authMessage}</div>}</div><button className="btn" style={{marginTop:14}} onClick={()=>openAuth(authMode==='signup'?'login':'signup')}>{authMode==='signup'?'Ya tengo una cuenta':'Crear una cuenta'}</button></div></div>}
  <footer className="footer">CASA ALLEGRA APP · preparada para multi-tienda, pagos, envíos, IA y sincronización.</footer>
 </div>
}

function Panel({tab,total,cart,setCart}:{tab:string,total:number,cart:Product[],setCart:React.Dispatch<React.SetStateAction<Product[]>>}){
 const sections=['inicio','ventas','productos','clientes','caja','pedidos','tienda','ia','reportes','integraciones','configuracion'];
 return <><section className="grid"><div className="panel"><span className="eyebrow">Panel del comercio</span><h1 style={{margin:'8px 0 4px'}}>CASA ALLEGRA</h1><p className="muted">Centro de gestión profesional · cada negocio tendrá sus propios datos y usuarios.</p><div className="hero-actions">{sections.slice(1).map(s=><button className="btn" key={s}>{s[0].toUpperCase()+s.slice(1)}</button>)}</div></div></section><section className="grid kpis"><div className="kpi"><span>Ventas</span><strong>{money(428500)}</strong><small>Este mes</small></div><div className="kpi"><span>Ganancia</span><strong>{money(126700)}</strong><small>Positiva</small></div><div className="kpi"><span>Carrito de prueba</span><strong>{cart.length}</strong><small>{money(total)}</small></div><div className="kpi"><span>Estado</span><strong>Activo</strong><small>Sincronización preparada</small></div></section></>
}
