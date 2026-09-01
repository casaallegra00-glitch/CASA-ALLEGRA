const fs=require('fs')
const path=require('path')
const file=path.join(process.cwd(),'app','costos','page.tsx')
let source=fs.readFileSync(file,'utf8')

// Producto y compra: permitir agregar tantas compras como se necesiten.
const purchaseType="type PurchaseLine={id:number;name:string;cost:string;units:string}\n"
if(!source.includes('type PurchaseLine=')){
  source=source.replace("type Material={id:number;name:string;unitCost:number;quantity:number}\n", "type Material={id:number;name:string;unitCost:number;quantity:number}\n"+purchaseType)
}
if(!source.includes('const [purchaseLines,setPurchaseLines]')){
  source=source.replace(" const [scenarioPrice,setScenarioPrice]=useState('0')\n", " const [scenarioPrice,setScenarioPrice]=useState('0')\n const [purchaseLines,setPurchaseLines]=useState<PurchaseLine[]>([{id:Date.now(),name:'',cost:'0',units:'1'}])\n")
}

// Reemplazar la sección Producto y compra por una lista dinámica.
const productSection=/\s*<Section id="producto"[\s\S]*?<\/Section>\n/
if(productSection.test(source)){
 const replacement=`\n <Section id="producto" title="Producto y compra" icon="box" openId={openId} setOpenId={setOpenId}><Field label="Producto o insumo"><input style={input} placeholder="Ej.: Cuaderno A5" value={product} onChange={e=>setProduct(e.target.value)}/></Field><p style={{marginTop:0}}>Agregá todas las compras o presentaciones que uses para fabricar el producto.</p>{purchaseLines.map((p,i)=><div key={p.id} style={{display:'grid',gridTemplateColumns:'1fr 160px 130px 95px',gap:10,marginBottom:10,alignItems:'end'}}><Field label={i===0?'Descripción de la compra':''}><input style={input} placeholder="Ej.: Resma de papel" value={p.name} onChange={e=>setPurchaseLines(v=>v.map(x=>x.id===p.id?{...x,name:e.target.value}:x))}/></Field><Field label={i===0?'Costo total':''}><input style={input} type="number" min="0" step="0.01" value={p.cost} onChange={e=>setPurchaseLines(v=>v.map(x=>x.id===p.id?{...x,cost:e.target.value}:x))}/></Field><Field label={i===0?'Unidades':''}><input style={input} type="number" min="0.01" step="0.01" value={p.units} onChange={e=>setPurchaseLines(v=>v.map(x=>x.id===p.id?{...x,units:e.target.value}:x))}/></Field><button type="button" style={{...ghost,background:'#fff3f3',color:'#a33d3d'}} onClick={()=>setPurchaseLines(v=>v.length<=1?v:v.filter(x=>x.id!==p.id))}>Eliminar</button></div>)}<div style={{display:'flex',gap:10,flexWrap:'wrap'}}><button type="button" style={button} onClick={()=>setPurchaseLines(v=>[...v,{id:Date.now()+Math.floor(Math.random()*1000),name:'',cost:'0',units:'1'}])}>+ Agregar otra compra</button><button type="button" style={ghost} onClick={()=>setPurchaseLines(v=>[...v,{id:Date.now()+Math.floor(Math.random()*1000),name:'',cost:'0',units:'1'}])}>+ Otra opción</button></div><div style={{...result,marginTop:10}}><span><b>Total de compras</b></span><b>{money(purchaseLines.reduce((a,p)=>a+num(p.cost),0))}</b></div></Section>\n `
 source=source.replace(productSection,replacement)
}

// Usar las compras múltiples en el cálculo sin cambiar el resto de la lógica.
source=source.replace(
 " const purchaseCost=num(purchase),u=Math.max(1,num(units)),h=num(hours),hv=num(hourValue),am=num(amort),wa=Math.max(0,num(waste)),comm=Math.max(0,num(commission))",
 " const purchaseTotal=purchaseLines.reduce((a,p)=>a+num(p.cost),0); const purchaseUnitCount=purchaseLines.reduce((a,p)=>a+Math.max(0,num(p.units)),0); const purchaseCost=purchaseLines.length?purchaseTotal:num(purchase); const u=purchaseLines.length?Math.max(1,purchaseUnitCount):Math.max(1,num(units)); const h=num(hours),hv=num(hourValue),am=num(amort),wa=Math.max(0,num(waste)),comm=Math.max(0,num(commission))"
)

// Eliminar el impacto de amortización y desperdicio de las fórmulas.
source=source.replace(" const fixedPart=(fixed+am)/u+num(fixedPerUnit)"," const fixedPart=fixed/u+num(fixedPerUnit)")
source=source.replace(" const materialPerUnit=(purchaseCost/u+materialBase)*(1+wa/100)"," const materialPerUnit=(purchaseCost/u+materialBase)")
source=source.replace(" const breakEvenUnits=monthlySalesTarget==='0'?0:Math.ceil((fixed+am)/Math.max(1,recommended-(purchaseCost/u+materialBase+laborPerUnit)))", " const breakEvenUnits=monthlySalesTarget==='0'?0:Math.ceil(fixed/Math.max(1,recommended-(purchaseCost/u+materialBase+laborPerUnit)))")

// Sin redondeo inteligente: el precio recomendado pasa a ser el precio exacto calculado.
source=source.replace(" const round=Math.max(0,num(roundTo))\n const recommended=round>0?Math.ceil(saleNeeded/round)*round:saleNeeded", " const round=0\n const recommended=saleNeeded")
source=source.replace(" const premiumPrice=round>0?Math.ceil((real*1.8)/(round))*round:real*1.8", " const premiumPrice=real*1.8")

// Persistencia compatible con cálculos anteriores.
source=source.replace("const data={product,purchase,units,hours,hourValue,margin,markup,pricingMode,targetProfit,amort,waste,commission,commissionMode,wholesaleDiscount,promoDiscount,roundTo,monthlySalesTarget,fixedPerUnit,costs,materials}", "const data={product,purchase,units,purchaseLines,hours,hourValue,margin,markup,pricingMode,targetProfit,commission,commissionMode,wholesaleDiscount,promoDiscount,monthlySalesTarget,fixedPerUnit,costs,materials}")
source=source.replace("setProduct(d.product||'');setPurchase(d.purchase||'0');setUnits(d.units||'1');", "setProduct(d.product||'');setPurchase(d.purchase||'0');setUnits(d.units||'1');setPurchaseLines(Array.isArray(d.purchaseLines)&&d.purchaseLines.length?d.purchaseLines:[{id:Date.now(),name:'',cost:d.purchase||'0',units:d.units||'1'}]);")
source=source.replace("setProduct('');setPurchase('0');setUnits('1');", "setProduct('');setPurchase('0');setUnits('1');setPurchaseLines([{id:Date.now(),name:'',cost:'0',units:'1'}]);")

// Eliminar de la interfaz Amortización y desperdicio y Redondeo inteligente.
source=source.replace(/\s*<Section id="amort"[\s\S]*?<\/Section>\n/,'\n')
source=source.replace(/\s*<Section id="round"[\s\S]*?<\/Section>\n/,'\n')

// Precio exacto de venta visible en el resultado.
if(!source.includes('Precio exacto de venta')){
 const marker=/(\s*<Section id="result" title="Resultado"[^>]*>)/
 source=source.replace(marker,`$1<div style={{...card,marginBottom:14,border:'2px solid #63bfc2',background:'#f5ffff'}}><div style={{fontSize:12,fontWeight:900,letterSpacing:'.08em',color:'#2f7f83'}}>PRECIO EXACTO DE VENTA</div><div style={{fontSize:34,fontWeight:950,marginTop:6}}>{money(saleNeeded)}</div><small style={{display:'block',marginTop:5,color:'#65757e'}}>Importe exacto calculado antes de cualquier redondeo.</small></div>`)
}

// Limpiar estados que ya no deben intervenir aunque queden guardados para compatibilidad.
source=source.replace("setAmort('0');setWaste('0');","")
source=source.replace("setRoundTo('0');","")

fs.writeFileSync(file,source)
console.log('CASA ALLEGRA: Calculadora de costos ajustada: compras ilimitadas, amortización/desperdicio y redondeo eliminados, precio exacto agregado.')
