'use client'
import { useMemo } from 'react'

type Sale={date:string;amount:number}
export default function SalesChart({sales}:{sales:Sale[]}){
 const data=useMemo(()=>{const map=new Map<string,number>();for(const s of sales){const key=new Date(s.date).toLocaleDateString('es-AR',{day:'2-digit',month:'2-digit'});map.set(key,(map.get(key)||0)+s.amount)}return [...map.entries()].slice(-14)},[sales])
 const max=Math.max(1,...data.map(([,v])=>v))
 return <div className="panel" style={{marginTop:18}}><div className="panel-heading"><div><h3>Ventas por día</h3><small>Últimos 14 días con movimientos</small></div></div>{data.length?<div style={{height:260,display:'flex',alignItems:'flex-end',gap:10,padding:'18px 8px 8px',overflowX:'auto'}}>{data.map(([label,value])=><div key={label} style={{minWidth:42,height:'100%',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'flex-end',gap:6}}><small style={{fontSize:11}}>{new Intl.NumberFormat('es-AR',{maximumFractionDigits:0}).format(value)}</small><div title={`${label}: ${value}`} style={{width:28,height:`${Math.max(6,(value/max)*190)}px`,borderRadius:'8px 8px 3px 3px',background:'linear-gradient(180deg,#7c3aed,#22c55e)'}}/><small style={{fontSize:10,opacity:.7}}>{label}</small></div>)}</div>:<div className="empty-state">Todavía no hay ventas para graficar.</div>}</div>
}