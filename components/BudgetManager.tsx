'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Product = { id:number; name:string; price:number; stock:number; sku?:string; category?:string; image?:string; brand?:string }
type Client = { id:number; name:string; contact?:string; phone?:string; email?:string; address?:string; dni?:string; cuil?:string }
type BudgetItem = { id:number; productId?:number; name:string; quantity:number; unitPrice:number; total:number }
type Budget = { id:number; number:string; date:string; validUntil:string; client:Client|null; items:BudgetItem[]; discount:number; discountType:'percent'|'amount'; payment:string; notes:string; logo:string; businessName:string }
type Props = { products:Product[]; clients:Client[]; businessName:string; storageKey:string; onNotice:(message:string)=>void }

const money=(v:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:0}).format(v)
const dateAR=(value:string)=>value?new Date(`${value}T00:00:00`).toLocaleDateString('es-AR'):''
const todayInput=()=>new Date().toISOString().slice(0,10)
const plusDays=(n:number)=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
const esc=(s:string)=>s.replace(/[&<>\\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\\':'&#92;','"':'&quot;'}[c]||c))

export default function BudgetManager({products,clients,businessName,storageKey,onNotice}:Props){
 const [items,setItems]=useState<BudgetItem[]>([])
 const [clientId,setClientId]=useState<number|''>('')
 const [clientDraft,setClientDraft]=useState<Client|null>(null)
 const [discount,setDiscount]=useState<number|string>(0)
 const [discountType,setDiscountType]=useState<'percent'|'amount'>('percent')
 const [payment,setPayment]=useState('Efectivo')
 const [validUntil,setValidUntil]=useState(plusDays(7))
 const [notes,setNotes]=useState('')
 const [logo,setLogo]=useState('/icon-512.png')
 const [budgetNumber,setBudgetNumber]=useState('')
 const [saved,setSaved]=useState<Budget[]>([])
 const [showHistory,setShowHistory]=useState(false)
 const previewRef=useRef<HTMLDivElement>(null)

 useEffect(()=>{
  try{const raw=localStorage.getItem(`${storageKey}-budgets`);if(raw)setSaved(JSON.parse(raw))}catch{}
  try{const savedLogo=localStorage.getItem(`${storageKey}-budget-logo`);if(savedLogo)setLogo(savedLogo)}catch{}
  setBudgetNumber(`PRES-${String(Date.now()).slice(-6)}`)
 },[storageKey])
 useEffect(()=>{try{localStorage.setItem(`${storageKey}-budgets`,JSON.stringify(saved))}catch{}},[storageKey,saved])
 useEffect(()=>{try{localStorage.setItem(`${storageKey}-budget-logo`,logo)}catch{}},[storageKey,logo])

 const selectedClient=useMemo(()=>clientDraft || (typeof clientId==='number'?clients.find(c=>c.id===clientId)||null:null),[clients,clientId,clientDraft])
 const subtotal=items.reduce((a,i)=>a+i.total,0)
 const discountValue=Math.max(0,Number(discount)||0)
 const discountAmount=Math.min(subtotal,discountType==='percent'?subtotal*discountValue/100:discountValue)
 const total=Math.max(0,subtotal-discountAmount)

 const addItem=(p:Product)=>setItems(v=>{const existing=v.find(i=>i.productId===p.id);if(existing)return v.map(i=>i.id===existing.id?{...i,quantity:i.quantity+1,total:(i.quantity+1)*i.unitPrice}:i);return [...v,{id:Date.now()+p.id,productId:p.id,name:p.name,quantity:1,unitPrice:p.price,total:p.price}]})
 const updateQty=(id:number,q:number)=>setItems(v=>v.map(i=>i.id===id?{...i,quantity:Math.max(1,q||1),total:Math.max(1,q||1)*i.unitPrice}:i))
 const removeItem=(id:number)=>setItems(v=>v.filter(i=>i.id!==id))
 const selectedProductIds=new Set(items.map(i=>i.productId))

 const createClient=()=>{const name=window.prompt('Nombre y apellido del nuevo cliente');if(!name?.trim())return;const phone=window.prompt('WhatsApp / teléfono (opcional)')||'';setClientDraft({id:-Date.now(),name:name.trim(),phone,contact:phone});setClientId('')}
 const selectLogo=(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>setLogo(String(reader.result||'/icon-512.png'));reader.readAsDataURL(file)}

 const currentBudget=():Budget=>({id:Date.now(),number:budgetNumber,date:todayInput(),validUntil,client:selectedClient,items,discount:discountValue,discountType,payment,notes,logo,businessName:businessName||'CASA ALLEGRA APP'})
 const saveBudget=()=>{if(!items.length){onNotice('Agregá al menos un producto al presupuesto.');return}if(!validUntil){onNotice('Ingresá la fecha de validez del presupuesto.');return}const d=new Date(`${validUntil}T00:00:00`);const t=new Date();t.setHours(0,0,0,0);if(d<t){onNotice('La fecha de validez no puede ser anterior a hoy.');return}const b=currentBudget();setSaved(v=>[b,...v]);setBudgetNumber(`PRES-${String(Date.now()+1).slice(-6)}`);onNotice(`✅ ${b.number} guardado correctamente.`)}
 const loadBudget=(b:Budget)=>{setBudgetNumber(b.number);setItems(b.items||[]);setDiscount(b.discount||0);setDiscountType(b.discountType||'percent');setPayment(b.payment||'Efectivo');setValidUntil(b.validUntil||plusDays(7));setNotes(b.notes||'');setLogo(b.logo||'/icon-512.png');setClientDraft(b.client);setClientId('');setShowHistory(false);onNotice(`${b.number} cargado.`)}
 const clear=()=>{setItems([]);setClientId('');setClientDraft(null);setDiscount(0);setDiscountType('percent');setPayment('Efectivo');setValidUntil(plusDays(7));setNotes('');setBudgetNumber(`PRES-${String(Date.now()).slice(-6)}`)}

 const logoToDataUrl=async(src:string)=>{
  if(!src)return ''
  if(src.startsWith('data:image/'))return src
  try{
   const response=await fetch(src)
   if(!response.ok)return ''
   const blob=await response.blob()
   return await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result||''));reader.onerror=reject;reader.readAsDataURL(blob)})
  }catch{return ''}
 }

 const renderSvg=async(logoData:string)=>{
  const rows=items.map((i,idx)=>`<tr><td>${idx+1}</td><td>${esc(i.name)}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">${esc(money(i.unitPrice))}</td><td style="text-align:right">${esc(money(i.total))}</td></tr>`).join('')
  const clientText=selectedClient?`${esc(selectedClient.name)}<br/>${selectedClient.phone||selectedClient.contact?`Tel: ${esc(selectedClient.phone||selectedClient.contact||'')}<br/>`:''}${selectedClient.email?`Email: ${esc(selectedClient.email)}<br/>`:''}${selectedClient.address?`Dirección: ${esc(selectedClient.address)}<br/>`:''}${selectedClient.dni?`DNI: ${esc(selectedClient.dni)}<br/>`:''}${selectedClient.cuil?`CUIL: ${esc(selectedClient.cuil)}`:''}`:'Consumidor final'
  const logoImage=logoData?`<image href="${esc(logoData)}" x="70" y="58" width="120" height="90" preserveAspectRatio="xMidYMid meet"/>`:''
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1414" viewBox="0 0 1000 1414"><rect width="1000" height="1414" fill="#fff"/><rect x="40" y="40" width="920" height="1334" rx="24" fill="#fff" stroke="#d8cfff" stroke-width="4"/>${logoImage}<text x="210" y="105" font-family="Arial" font-size="40" font-weight="700" fill="#3f3158">${esc(businessName||'CASA ALLEGRA APP')}</text><text x="210" y="145" font-family="Arial" font-size="20" fill="#6c6480">PRESUPUESTO</text><text x="930" y="105" text-anchor="end" font-family="Arial" font-size="34" font-weight="700" fill="#3f3158">${esc(budgetNumber)}</text><text x="930" y="138" text-anchor="end" font-family="Arial" font-size="18" fill="#6c6480">Fecha: ${dateAR(todayInput())}</text><line x1="70" y1="175" x2="930" y2="175" stroke="#ece7f8" stroke-width="3"/><text x="70" y="215" font-family="Arial" font-size="24" font-weight="700" fill="#3f3158">DATOS DEL CLIENTE</text><foreignObject x="70" y="230" width="420" height="130"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial;font-size:18px;line-height:1.5;color:#514b63">${clientText}</div></foreignObject><text x="70" y="390" font-family="Arial" font-size="24" font-weight="700" fill="#3f3158">DETALLE</text><foreignObject x="70" y="410" width="860" height="620"><div xmlns="http://www.w3.org/1999/xhtml"><table style="width:100%;border-collapse:collapse;font-family:Arial;font-size:18px;color:#393345"><thead><tr style="background:#f5f2fb"><th style="padding:12px;text-align:left">#</th><th style="padding:12px;text-align:left">Producto / servicio</th><th style="padding:12px">Cant.</th><th style="padding:12px;text-align:right">Precio</th><th style="padding:12px;text-align:right">Subtotal</th></tr></thead><tbody>${rows}</tbody></table></div></foreignObject><line x1="620" y1="1080" x2="930" y2="1080" stroke="#ece7f8" stroke-width="3"/><text x="620" y="1120" font-family="Arial" font-size="20" fill="#625b72">Subtotal</text><text x="930" y="1120" text-anchor="end" font-family="Arial" font-size="20" font-weight="700">${esc(money(subtotal))}</text><text x="620" y="1155" font-family="Arial" font-size="20" fill="#625b72">Descuento</text><text x="930" y="1155" text-anchor="end" font-family="Arial" font-size="20" font-weight="700">-${esc(money(discountAmount))}</text><text x="620" y="1208" font-family="Arial" font-size="28" font-weight="700" fill="#3f3158">TOTAL</text><text x="930" y="1208" text-anchor="end" font-family="Arial" font-size="32" font-weight="700" fill="#3f3158">${esc(money(total))}</text><text x="70" y="1100" font-family="Arial" font-size="18" fill="#625b72">Medio de pago: ${esc(payment)}</text><text x="70" y="1135" font-family="Arial" font-size="18" fill="#625b72">Válido hasta: ${dateAR(validUntil)}</text><foreignObject x="70" y="1170" width="500" height="90"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial;font-size:18px;color:#625b72">${notes?`<b>Observaciones:</b> ${esc(notes)}`:''}</div></foreignObject><text x="70" y="1305" font-family="Arial" font-size="22" font-weight="700" fill="#b33a4b">PRESUPUESTO NO VÁLIDO COMO FACTURA</text><text x="890" y="1320" text-anchor="end" font-family="Arial" font-size="110" font-weight="700" fill="#b33a4b">X</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
 }
 const downloadImage=async()=>{if(!items.length){onNotice('Agregá productos antes de descargar el presupuesto.');return}const logoData=await logoToDataUrl(logo);const svg=await renderSvg(logoData);const img=new Image();img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=1000;canvas.height=1414;const ctx=canvas.getContext('2d');if(!ctx)return;ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0);const a=document.createElement('a');a.href=canvas.toDataURL('image/png');a.download=`${budgetNumber}.png`;a.click()};img.src=svg}
 const downloadSvg=async()=>{const logoData=await logoToDataUrl(logo);const svg=await renderSvg(logoData);const blob=new Blob([decodeURIComponent(svg.split(',')[1])],{type:'image/svg+xml'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${budgetNumber}.svg`;a.click()}
 const downloadPdf=async()=>{if(!items.length){onNotice('Agregá productos antes de descargar el PDF.');return}const logoData=await logoToDataUrl(logo);const svg=await renderSvg(logoData);const w=window.open('','_blank','width=1100,height=1500');if(!w){onNotice('El navegador bloqueó la ventana del PDF. Permití ventanas emergentes para CASA ALLEGRA.');return}w.document.write(`<html><head><title>${budgetNumber}</title><style>body{margin:0;background:white}img{display:block;width:100%;max-width:1000px;margin:0 auto}@media print{body{margin:0}img{width:100%}}</style></head><body><img src="${svg}" onload="setTimeout(()=>window.print(),300)"/></body></html>`);w.document.close()}
 const whatsapp=async()=>{if(!items.length){onNotice('Agregá productos antes de compartir.');return}await downloadImage();const text=`Hola ${selectedClient?.name||''}, te envío el presupuesto ${budgetNumber}. Total: ${money(total)}. Válido hasta ${dateAR(validUntil)}. PRESUPUESTO NO VÁLIDO COMO FACTURA.`;window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank');onNotice('Se descargó la imagen del presupuesto y se abrió WhatsApp para enviarla.')}

 return <section className="large-section">
  <div className="panel-heading"><div><span className="eyebrow">CASA ALLEGRA APP</span><h2>Presupuestos</h2><small>Presupuestos comerciales no fiscales, listos para entregar al cliente.</small></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button type="button" className="secondary-btn" onClick={()=>setShowHistory(v=>!v)}>📋 Historial</button><button type="button" className="primary-btn" onClick={saveBudget}>💾 Guardar presupuesto</button></div></div>
  <div className="two-col">
   <div className="panel form-panel">
    <h3>1. Cliente</h3><label>Seleccionar cliente</label><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><select value={clientId} onChange={e=>{setClientId(e.target.value?Number(e.target.value):'');setClientDraft(null)}} style={{flex:1,minWidth:220}}><option value="">Sin cliente / consumidor final</option>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button type="button" className="secondary-btn" onClick={createClient}>＋ Nuevo</button></div>{selectedClient&&<small style={{marginTop:6,display:'block'}}>{selectedClient.phone||selectedClient.contact||''}{selectedClient.email?` · ${selectedClient.email}`:''}</small>}
    <h3 style={{marginTop:22}}>2. Productos</h3><div className="product-grid">{products.map(p=><article key={p.id} className="mini-product" style={{padding:12}}><h4 style={{margin:'4px 0'}}>{p.name}</h4><small>{money(p.price)} · SKU {p.sku||'Sin SKU'}</small><button type="button" className={selectedProductIds.has(p.id)?'secondary-btn':'primary-btn'} style={{marginTop:8,width:'100%'}} onClick={()=>addItem(p)}>{selectedProductIds.has(p.id)?'＋ Agregar otra vez':'＋ Agregar'}</button></article>)}</div>
    {!products.length&&<div className="empty-state">Primero cargá productos en Productos.</div>}
    <h3 style={{marginTop:22}}>3. Descuento y pago</h3><div style={{display:'grid',gridTemplateColumns:'1fr 150px',gap:8}}><div><label>Descuento</label><input value={discount} onChange={e=>setDiscount(e.target.value)} inputMode="decimal" placeholder="0"/></div><div><label>Tipo</label><select value={discountType} onChange={e=>setDiscountType(e.target.value as 'percent'|'amount')}><option value="percent">%</option><option value="amount">$</option></select></div></div><label>Medio de pago</label><select value={payment} onChange={e=>setPayment(e.target.value)}><option>Efectivo</option><option>Transferencia</option><option>Mercado Pago</option><option>Tarjeta</option><option>Otro</option></select>
    <label>Válido hasta</label><input type="date" value={validUntil} min={todayInput()} onChange={e=>setValidUntil(e.target.value)}/><label>Observaciones</label><textarea rows={4} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Condiciones, tiempos de entrega, etc."/>
    <label>Logo del presupuesto</label><input type="file" accept="image/*" onChange={selectLogo}/><img src={logo} alt="Logo" style={{width:90,height:90,objectFit:'contain',borderRadius:12,border:'1px solid #eee'}}/>
   </div>
   <div className="panel">
    <div className="panel-heading"><div><h3>Vista previa</h3><small>{budgetNumber}</small></div></div>
    <div ref={previewRef} style={{background:'#fff',border:'1px solid #ece7f8',borderRadius:18,padding:24,color:'#393345'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:20,alignItems:'flex-start'}}><div style={{display:'flex',gap:12,alignItems:'center'}}><img src={logo} alt="Logo" style={{width:72,height:72,objectFit:'contain',borderRadius:12}}/><div><h2 style={{margin:0}}>{businessName||'CASA ALLEGRA APP'}</h2><small>PRESUPUESTO</small></div></div><div style={{textAlign:'right'}}><b style={{fontSize:24}}>{budgetNumber}</b><br/><small>Fecha: {dateAR(todayInput())}</small></div></div>
      <hr style={{border:0,borderTop:'1px solid #ece7f8',margin:'18px 0'}}/>
      <h4>DATOS DEL CLIENTE</h4><div style={{fontSize:14,lineHeight:1.6}}>{selectedClient?<><b>{selectedClient.name}</b><br/>{selectedClient.phone||selectedClient.contact?`Tel: ${selectedClient.phone||selectedClient.contact}`:''}{selectedClient.email?<><br/>Email: {selectedClient.email}</>:null}{selectedClient.address?<><br/>Dirección: {selectedClient.address}</>:null}{selectedClient.dni?<><br/>DNI: {selectedClient.dni}</>:null}{selectedClient.cuil?<><br/>CUIL: {selectedClient.cuil}</>:null}</>:'Consumidor final'}</div>
      <h4 style={{marginTop:20}}>DETALLE</h4><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr style={{background:'#f5f2fb'}}><th style={{padding:9,textAlign:'left'}}>Producto</th><th style={{padding:9}}>Cant.</th><th style={{padding:9,textAlign:'right'}}>Precio</th><th style={{padding:9,textAlign:'right'}}>Subtotal</th><th style={{padding:9}}></th></tr></thead><tbody>{items.map(i=><tr key={i.id}><td style={{padding:9,borderBottom:'1px solid #eee'}}>{i.name}</td><td style={{padding:9,textAlign:'center',borderBottom:'1px solid #eee'}}><input type="number" min="1" value={i.quantity} onChange={e=>updateQty(i.id,Number(e.target.value))} style={{width:70}}/></td><td style={{padding:9,textAlign:'right',borderBottom:'1px solid #eee'}}>{money(i.unitPrice)}</td><td style={{padding:9,textAlign:'right',borderBottom:'1px solid #eee'}}>{money(i.total)}</td><td style={{padding:9,borderBottom:'1px solid #eee'}}><button type="button" className="secondary-btn" onClick={()=>removeItem(i.id)}>×</button></td></tr>)}</tbody></table>
      <div style={{marginLeft:'auto',maxWidth:320,marginTop:18}}><div style={{display:'flex',justifyContent:'space-between'}}><span>Subtotal</span><b>{money(subtotal)}</b></div><div style={{display:'flex',justifyContent:'space-between'}}><span>Descuento</span><b>-{money(discountAmount)}</b></div><div style={{display:'flex',justifyContent:'space-between',fontSize:24,marginTop:8}}><strong>TOTAL</strong><strong>{money(total)}</strong></div></div>
      <div style={{marginTop:18,fontSize:13}}>Medio de pago: <b>{payment}</b><br/>Válido hasta: <b>{dateAR(validUntil)}</b>{notes?<><br/>Observaciones: {notes}</>:null}</div>
      <div style={{marginTop:24,paddingTop:16,borderTop:'2px solid #b33a4b',display:'flex',justifyContent:'space-between',alignItems:'center',color:'#b33a4b'}}><b>PRESUPUESTO NO VÁLIDO COMO FACTURA</b><span style={{fontSize:54,fontWeight:900}}>X</span></div>
    </div>
    <div className="toolbar" style={{marginTop:14}}><button type="button" className="primary-btn" onClick={downloadPdf}>📄 PDF</button><button type="button" className="secondary-btn" onClick={downloadImage}>🖼️ PNG</button><button type="button" className="secondary-btn" onClick={downloadSvg}>◇ SVG</button><button type="button" className="secondary-btn" onClick={whatsapp}>💬 WhatsApp</button><button type="button" className="secondary-btn" onClick={clear}>Nuevo</button></div>
    {showHistory&&<div className="panel" style={{marginTop:16}}><h4>Historial de presupuestos</h4>{saved.length?saved.slice(0,20).map(b=><div className="trow" key={b.id}><span><b>{b.number}</b><small>{b.client?.name||'Consumidor final'} · {dateAR(b.date)} · {money((b.items||[]).reduce((a,i)=>a+i.total,0)-((b.discountType==='percent'?((b.items||[]).reduce((a,i)=>a+i.total,0)*b.discount/100):b.discount)||0))}</small></span><button type="button" className="secondary-btn" onClick={()=>loadBudget(b)}>Abrir</button></div>):<div className="empty-state">Todavía no guardaste presupuestos.</div>}</div>}
   </div>
  </div>
 </section>
}
