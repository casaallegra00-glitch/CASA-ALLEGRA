'use client'
import {useEffect,useMemo,useState} from 'react'
const money=(v:number)=>new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',maximumFractionDigits:2}).format(v||0)
type Cost={id:number;name:string;amount:number}
type Material={id:number;name:string;unitCost:number;quantity:number}
type SavedCalc={id:number;name:string;data:Record<string,unknown>}
type SectionProps={id:string;title:string;icon:string;children:React.ReactNode;openId:string;setOpenId:(id:string)=>void}
function Icon({name,size=20}:{name:string,size?:number}){const p:Record<string,React.ReactNode>={calculator:<><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 11h2M14 11h2M8 15h2M14 15h2M8 19h8"/></>,box:<><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></>,work:<><rect x="4" y="7" width="16" height="12" rx="2"/><path d="M9 7V5h6v2M4 12h16M10 12v2h4v-2"/></>,tools:<><path d="m14.5 6.5 3-3 3 3-3 3"/><path d="m16 8-9.5 9.5a2.1 2.1 0 0 1-3-3L13 5"/><path d="m6 19 2 2"/></>,home:<><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-6h6v6"/></>,money:<><rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M7 9h.01M17 15h.01"/></>,chart:<><path d="M4 19V5M4 19h17"/><path d="m7 15 4-5 3 3 5-7"/></>,percent:<><circle cx="7" cy="7" r="2"/><circle cx="17" cy="17" r="2"/><path d="m5 19 14-14"/></>,save:<><path d="M5 4h12l2 2v14H5z"/><path d="M8 4v5h8V4M8 20v-5h8v5"/></>,refresh:<><path d="M20 11a8 8 0 0 0-14-5L4 8"/><path d="M4 4v4h4M4 13a8 8 0 0 0 14 5l2-2"/><path d="M20 20v-4h-4"/></>};return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{p[name]||p.calculator}</svg>}
function Section({id,title,icon,children,openId,setOpenId}:SectionProps){const open=openId===id;return <section style={details}><button type="button" onClick={()=>setOpenId(open?'':id)} aria-expanded={open} style={summary}><span style={{display:'flex',alignItems:'center',gap:10}}><span style={iconBox}><Icon name={icon}/></span>{title}</span><span style={{fontSize:18,color:'#64727d'}}>{open?'−':'+'}</span></button>{open&&<div style={{padding:'0 0 18px'}}>{children}</div>}</section>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label style={{display:'grid',gap:6,marginBottom:12,fontWeight:600}}>{label}{children}</label>}
const card:React.CSSProperties={background:'#fff',border:'1px solid #e4ebef',borderRadius:18,padding:22,boxShadow:'0 8px 24px rgba(52,74,87,.06)'}
const input:React.CSSProperties={padding:11,border:'1px solid #d8e1e6',borderRadius:10,fontSize:15,width:'100%',boxSizing:'border-box',outline:'none'}
const button:React.CSSProperties={padding:11,border:0,borderRadius:10,background:'#2f7f83',color:'#fff',cursor:'pointer',fontWeight:750}
const ghost:React.CSSProperties={...button,background:'#eef6f5',color:'#2f6669'}
const result:React.CSSProperties={display:'flex',justifyContent:'space-between',gap:15,padding:'12px 0',borderBottom:'1px solid #edf0f2'}
const details:React.CSSProperties={background:'#fff',border:'1px solid #e4ebef',borderRadius:16,padding:'0 18px',marginBottom:12,overflow:'hidden',boxShadow:'0 6px 20px rgba(52,74,87,.04)'}
const summary:React.CSSProperties={width:'100%',background:'transparent',border:0,cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center',fontWeight:800,fontSize:17,padding:'17px 0',color:'#293640',textAlign:'left'}
const iconBox:React.CSSProperties={width:34,height:34,borderRadius:10,display:'grid',placeItems:'center',background:'#e8f7f6',color:'#3d999c',flexShrink:0}
const num=(v:string)=>Number.isFinite(Number(v))?Number(v):0
export default function Costos(){
 const [openId,setOpenId]=useState('producto')
 const [product,setProduct]=useState('')
 const [purchase,setPurchase]=useState('0')
 const [units,setUnits]=useState('1')
 const [hours,setHours]=useState('0')
 const [hourValue,setHourValue]=useState('0')
 const [margin,setMargin]=useState('30')
 const [markup,setMarkup]=useState('50')
 const [pricingMode,setPricingMode]=useState<'margin'|'markup'|'profit'>('margin')
 const [targetProfit,setTargetProfit]=useState('0')
 const [amort,setAmort]=useState('0')
 const [waste,setWaste]=useState('0')
 const [commission,setCommission]=useState('0')
 const [commissionMode,setCommissionMode]=useState<'percent'|'amount'>('percent')
 const [wholesaleDiscount,setWholesaleDiscount]=useState('10')
 const [promoDiscount,setPromoDiscount]=useState('0')
 const [roundTo,setRoundTo]=useState('0')
 const [monthlySalesTarget,setMonthlySalesTarget]=useState('0')
 const [fixedPerUnit,setFixedPerUnit]=useState('0')
 const [costs,setCosts]=useState<Cost[]>([])
 const [materials,setMaterials]=useState<Material[]>([])
 const [costName,setCostName]=useState('')
 const [costAmount,setCostAmount]=useState('0')
 const [materialName,setMaterialName]=useState('')
 const [materialCost,setMaterialCost]=useState('0')
 const [materialQty,setMaterialQty]=useState('1')
 const [saved,setSaved]=useState<SavedCalc[]>([])
 const [saveName,setSaveName]=useState('')
 const [comparePrice,setComparePrice]=useState('0')
 const [scenarioMaterial,setScenarioMaterial]=useState('0')
 const [scenarioPrice,setScenarioPrice]=useState('0')
 useEffect(()=>{try{const v=localStorage.getItem('casa-allegra-cost-calculations');if(v)setSaved(JSON.parse(v))}catch{}},[])
 useEffect(()=>{try{localStorage.setItem('casa-allegra-cost-calculations',JSON.stringify(saved))}catch{}},[saved])
 const fixed=costs.reduce((a,c)=>a+c.amount,0)
 const materialBase=materials.reduce((a,m)=>a+m.unitCost*m.quantity,0)
 const purchaseCost=num(purchase),u=Math.max(1,num(units)),h=num(hours),hv=num(hourValue),am=num(amort),wa=Math.max(0,num(waste)),comm=Math.max(0,num(commission))
 const monthlyLabor=h*hv
 const fixedPart=(fixed+am)/u+num(fixedPerUnit)
 const materialPerUnit=(purchaseCost/u+materialBase)*(1+wa/100)
 const laborPerUnit=(monthlyLabor/u)
 const real=materialPerUnit+laborPerUnit+fixedPart
 const targetMargin=Math.min(99,Math.max(0,num(margin)))
 const targetMarkup=Math.max(0,num(markup))
 const desiredProfit=Math.max(0,num(targetProfit))
 let baseSale=pricingMode==='margin'?(targetMargin>=99?real*100:real/(1-targetMargin/100)):pricingMode==='markup'?real*(1+targetMarkup/100):real+desiredProfit
 const commissionRate=commissionMode==='percent'?Math.min(99,comm)/100:0
 const commissionAmount=commissionMode==='percent'?baseSale*commissionRate:comm
 const saleNeeded=commissionMode==='percent'&&commissionRate<1?baseSale/(1-commissionRate):baseSale+commissionAmount
 const round=Math.max(0,num(roundTo))
 const recommended=round>0?Math.ceil(saleNeeded/round)*round:saleNeeded
 const promoPrice= Math.max(0,recommended*(1-Math.min(99,num(promoDiscount))/100))
 const wholesalePrice= Math.max(0,recommended*(1-Math.min(99,num(wholesaleDiscount))/100))
 const profitRecommended=recommended-real-(commissionMode==='percent'?recommended*commissionRate:comm)
 const marginRecommended=recommended>0?profitRecommended/recommended*100:0
 const minPrice=real+(commissionMode==='percent'&&commissionRate<1?real*commissionRate/(1-commissionRate):comm)
 const premiumPrice=round>0?Math.ceil((real*1.8)/(round))*round:real*1.8
 const breakEvenUnits=monthlySalesTarget==='0'?0:Math.ceil((fixed+am)/Math.max(1,recommended-(purchaseCost/u+materialBase+laborPerUnit)))
 const compareProfit=num(comparePrice)-real-(commissionMode==='percent'?num(comparePrice)*commissionRate:comm)
 const scenarioReal=real+(purchaseCost/u)*num(scenarioMaterial)/100
 const scenarioGain=num(scenarioPrice)-scenarioReal-(commissionMode==='percent'?num(scenarioPrice)*commissionRate:comm)
 const addCost=()=>{const a=num(costAmount);if(costName.trim())setCosts(v=>[...v,{id:Date.now(),name:costName.trim(),amount:a}]);setCostName('');setCostAmount('0')}
 const addMaterial=()=>{if(materialName.trim())setMaterials(v=>[...v,{id:Date.now(),name:materialName.trim(),unitCost:num(materialCost),quantity:Math.max(0,num(materialQty))}]);setMaterialName('');setMaterialCost('0');setMaterialQty('1')}
 const reset=()=>{setProduct('');setPurchase('0');setUnits('1');setHours('0');setHourValue('0');setMargin('30');setMarkup('50');setPricingMode('margin');setTargetProfit('0');setAmort('0');setWaste('0');setCommission('0');setCommissionMode('percent');setWholesaleDiscount('10');setPromoDiscount('0');setRoundTo('0');setMonthlySalesTarget('0');setFixedPerUnit('0');setCosts([]);setMaterials([]);setComparePrice('0');setScenarioMaterial('0');setScenarioPrice('0');setOpenId('producto')}
 const saveCalculation=()=>{const name=(saveName.trim()||product.trim()||'Cálculo sin nombre');const data={product,purchase,units,hours,hourValue,margin,markup,pricingMode,targetProfit,amort,waste,commission,commissionMode,wholesaleDiscount,promoDiscount,roundTo,monthlySalesTarget,fixedPerUnit,costs,materials};setSaved(v=>[{id:Date.now(),name,data},...v]);setSaveName('')}
 const loadCalculation=(s:SavedCalc)=>{const d=s.data as any;setProduct(d.product||'');setPurchase(d.purchase||'0');setUnits(d.units||'1');setHours(d.hours||'0');setHourValue(d.hourValue||'0');setMargin(d.margin||'30');setMarkup(d.markup||'50');setPricingMode(d.pricingMode||'margin');setTargetProfit(d.targetProfit||'0');setAmort(d.amort||'0');setWaste(d.waste||'0');setCommission(d.commission||'0');setCommissionMode(d.commissionMode||'percent');setWholesaleDiscount(d.wholesaleDiscount||'10');setPromoDiscount(d.promoDiscount||'0');setRoundTo(d.roundTo||'0');setMonthlySalesTarget(d.monthlySalesTarget||'0');setFixedPerUnit(d.fixedPerUnit||'0');setCosts(d.costs||[]);setMaterials(d.materials||[]);setOpenId('result')}
 const commonNumber=(label:string,value:string,set:(v:string)=>void,step='1')=><Field label={label}><input style={input} type="number" min="0" step={step} value={value} onChange={e=>set(e.target.value)}/></Field>
 return <main style={{minHeight:'100vh',background:'#f8fbfd',fontFamily:'Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',padding:28,color:'#293640'}}><div style={{maxWidth:1100,margin:'auto'}}><header style={{marginBottom:22}}><div style={{fontWeight:900,fontSize:24,letterSpacing:'.04em',color:'#30414e'}}>CASAALLEGRA <span style={{color:'#63bfc2'}}>APP</span></div><div style={{display:'flex',alignItems:'center',gap:12,marginTop:16}}><span style={{...iconBox,width:44,height:44}}><Icon name="calculator" size={25}/></span><div><h1 style={{margin:0,fontSize:32}}>Calculadora de costos y precios</h1><p style={{margin:'7px 0 0',color:'#71808b'}}>Calculá el costo real, compará precios y encontrá una rentabilidad saludable.</p></div></div></header>
 <Section id="producto" title="Producto y compra" icon="box" openId={openId} setOpenId={setOpenId}><Field label="Producto o insumo"><input style={input} placeholder="Ej.: Cuaderno A5" value={product} onChange={e=>setProduct(e.target.value)}/></Field>{commonNumber('Costo total de compra',purchase,setPurchase)}{commonNumber('Cantidad de unidades que contiene',units,setUnits)}</Section>
 <Section id="materials" title="Materiales detallados" icon="tools" openId={openId} setOpenId={setOpenId}><p style={{marginTop:0}}>Agregá materiales adicionales usados por unidad.</p><div style={{display:'grid',gridTemplateColumns:'1fr 170px 130px 110px',gap:10}}><input style={input} placeholder="Ej.: Tinta" value={materialName} onChange={e=>setMaterialName(e.target.value)}/><input style={input} type="number" min="0" value={materialCost} onChange={e=>setMaterialCost(e.target.value)}/><input style={input} type="number" min="0" step="0.1" value={materialQty} onChange={e=>setMaterialQty(e.target.value)}/><button style={button} onClick={addMaterial}>Agregar</button></div>{materials.map(m=><div key={m.id} style={result}><span>{m.name} · {m.quantity} × {money(m.unitCost)}</span><b>{money(m.unitCost*m.quantity)}</b><button style={{...ghost,padding:6}} onClick={()=>setMaterials(v=>v.filter(x=>x.id!==m.id))}>Eliminar</button></div>)}<b>Costo de materiales: {money(materialBase)}</b></Section>
 <Section id="labor" title="Mano de obra" icon="work" openId={openId} setOpenId={setOpenId}>{commonNumber('Horas de trabajo',hours,setHours,'0.1')}{commonNumber('Valor de tu hora',hourValue,setHourValue)}</Section>
 <Section id="amort" title="Amortización y desperdicio" icon="tools" openId={openId} setOpenId={setOpenId}>{commonNumber('Amortización mensual',amort,setAmort)}{commonNumber('Desperdicio / merma (%)',waste,setWaste,'0.1')}<p>La merma aumenta automáticamente el costo de materiales.</p></Section>
 <Section id="fixed" title="Costos fijos mensuales" icon="home" openId={openId} setOpenId={setOpenId}><p>Agregá alquiler, luz, internet, herramientas, etc.</p><div style={{display:'grid',gridTemplateColumns:'1fr 180px 120px',gap:10}}><input style={input} placeholder="Ej.: Luz" value={costName} onChange={e=>setCostName(e.target.value)}/><input style={input} type="number" min="0" value={costAmount} onChange={e=>setCostAmount(e.target.value)}/><button style={button} onClick={addCost}>Agregar</button></div>{costs.map(c=><div key={c.id} style={result}><span>{c.name}</span><b>{money(c.amount)}</b><button style={{...ghost,padding:6}} onClick={()=>setCosts(v=>v.filter(x=>x.id!==c.id))}>Eliminar</button></div>)}{commonNumber('Costo fijo adicional por unidad',fixedPerUnit,setFixedPerUnit)}<b>Total fijo mensual: {money(fixed)}</b></Section>
 <Section id="pricing" title="Cómo definir el precio" icon="percent" openId={openId} setOpenId={setOpenId}><Field label="Método"><select style={input} value={pricingMode} onChange={e=>setPricingMode(e.target.value as 'margin'|'markup'|'profit')}><option value="margin">Margen sobre el precio</option><option value="markup">Aumento sobre el costo</option><option value="profit">Quiero ganar un monto fijo</option></select></Field>{pricingMode==='margin'?commonNumber('Margen deseado (%)',margin,setMargin,'0.1'):pricingMode==='markup'?commonNumber('Aumento sobre costo (%)',markup,setMarkup,'0.1'):commonNumber('Ganancia deseada por unidad',targetProfit,setTargetProfit)}<p style={{marginBottom:0}}>El margen y el aumento no son lo mismo: elegí qué querés controlar.</p></Section>
 <Section id="fees" title="Comisiones y descuentos" icon="percent" openId={openId} setOpenId={setOpenId}>{commonNumber('Comisión del medio de pago',commission,setCommission,'0.1')}<Field label="Tipo de comisión"><select style={input} value={commissionMode} onChange={e=>setCommissionMode(e.target.value as 'percent'|'amount')}><option value="percent">Porcentaje (%)</option><option value="amount">Monto fijo ($)</option></select></Field>{commonNumber('Descuento mayorista (%)',wholesaleDiscount,setWholesaleDiscount,'0.1')}{commonNumber('Promoción / descuento simulado (%)',promoDiscount,setPromoDiscount,'0.1')}</Section>
 <Section id="round" title="Redondeo inteligente" icon="calculator" openId={openId} setOpenId={setOpenId}><Field label="Redondear precio a"><select style={input} value={roundTo} onChange={e=>setRoundTo(e.target.value)}><option value="0">Sin redondeo</option><option value="100">$100</option><option value="500">$500</option><option value="1000">$1.000</option><option value="5000">$5.000</option></select></Field></Section>
 <Section id="result" title="Resultado y precios recomendados" icon="chart" openId={openId} setOpenId={setOpenId}><div style={card}>{[['Materiales por unidad',materialPerUnit],['Trabajo por unidad',laborPerUnit],['Fijos + amortización',fixedPart],['Costo real por unidad',real],['Precio mínimo sin perder',minPrice],['Precio recomendado',recommended],['Ganancia por unidad',profitRecommended],['Margen real',marginRecommended]].map(([k,v])=><div key={String(k)} style={result}><span>{k}</span><b style={{fontSize:20}}>{String(k).includes('Margen')?`${Number(v).toFixed(1)}%`:money(Number(v))}</b></div>)}<div style={{marginTop:16,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}><div style={{...card,margin:0}}><small>PRECIO MÍNIMO</small><h3>{money(minPrice)}</h3><small>No deberías vender por debajo de este valor.</small></div><div style={{...card,margin:0}}><small>RECOMENDADO</small><h3>{money(recommended)}</h3><small>Equilibrio entre precio y rentabilidad.</small></div><div style={{...card,margin:0}}><small>PREMIUM</small><h3>{money(premiumPrice)}</h3><small>Mayor margen, orientado a valor agregado.</small></div></div><div style={{marginTop:14,...card}}><b>Mayorista:</b> {money(wholesalePrice)} · <b>Promo:</b> {money(promoPrice)} · <b>Ganancia promo:</b> {money(promoPrice-real-(commissionMode==='percent'?promoPrice*commissionRate:comm))}</div></div></Section>
 <Section id="break" title="Punto de equilibrio" icon="chart" openId={openId} setOpenId={setOpenId}>{commonNumber('Objetivo de ventas mensuales ($)',monthlySalesTarget,setMonthlySalesTarget)}<div style={card}><div style={result}><span>Unidades aproximadas para cubrir costos</span><b>{breakEvenUnits?breakEvenUnits:'—'}</b></div><small>Es una estimación basada en costos fijos y precio recomendado.</small></div></Section>
 <Section id="compare" title="Comparador de precios" icon="chart" openId={openId} setOpenId={setOpenId}>{commonNumber('Precio que estás pensando cobrar',comparePrice,setComparePrice)}<div style={result}><span>Ganancia real a ese precio</span><b>{money(compareProfit)}</b></div><div style={result}><span>Margen estimado</span><b>{num(comparePrice)>0?`${((compareProfit/num(comparePrice))*100).toFixed(1)}%`:'—'}</b></div></Section>
 <Section id="scenario" title="¿Qué pasa si...?" icon="refresh" openId={openId} setOpenId={setOpenId}>{commonNumber('Cambio en materiales (%)',scenarioMaterial,setScenarioMaterial,'0.1')}{commonNumber('Precio que probarías',scenarioPrice,setScenarioPrice)}<div style={card}><div style={result}><span>Costo estimado con cambio</span><b>{money(scenarioReal)}</b></div><div style={result}><span>Ganancia estimada</span><b>{money(scenarioGain)}</b></div></div></Section>
 <Section id="save" title="Guardar cálculos" icon="save" openId={openId} setOpenId={setOpenId}><div style={{display:'grid',gridTemplateColumns:'1fr 140px',gap:10}}><input style={input} placeholder="Ej.: Cuaderno A5 tapa dura" value={saveName} onChange={e=>setSaveName(e.target.value)}/><button style={button} onClick={saveCalculation}>Guardar</button></div>{saved.map(s=><div key={s.id} style={result}><span><b>{s.name}</b></span><div style={{display:'flex',gap:6}}><button style={{...ghost,padding:7}} onClick={()=>loadCalculation(s)}>Abrir</button><button style={{...ghost,padding:7}} onClick={()=>setSaved(v=>v.filter(x=>x.id!==s.id))}>Eliminar</button></div></div>)}{!saved.length&&<p style={{marginBottom:0}}>Todavía no guardaste cálculos.</p>}</Section>
 <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginTop:16,...card}}><div><b>{product||'Producto sin nombre'}</b><div style={{color:'#71808b'}}>Costo real: {money(real)} · Precio recomendado: {money(recommended)}</div></div><button type="button" style={ghost} onClick={reset}><Icon name="refresh" size={17}/> Reiniciar cálculo</button></div>
 </div></main>}
