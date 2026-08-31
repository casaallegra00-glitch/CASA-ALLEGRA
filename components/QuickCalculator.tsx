'use client'
import {useState} from 'react'

type Op='+'|'-'|'×'|'÷'|null
const clean=(v:string)=>{const n=Number(v);return Number.isFinite(n)?n:0}
const fmt=(n:number)=>{if(!Number.isFinite(n))return 'Error';if(Object.is(n,-0))n=0;const rounded=Math.round((n+Number.EPSILON)*1e10)/1e10;return String(rounded)}

export default function QuickCalculator(){
 const [display,setDisplay]=useState('0')
 const [stored,setStored]=useState<number|null>(null)
 const [op,setOp]=useState<Op>(null)
 const [waiting,setWaiting]=useState(false)
 const [memory,setMemory]=useState<number|null>(null)
 const enter=(digit:string)=>{
  if(waiting){setDisplay(digit);setWaiting(false);return}
  if(display==='0'&&digit!=='0'){setDisplay(digit);return}
  if(display==='0'&&digit==='0')return
  if(display==='-0'){setDisplay('-'+digit);return}
  setDisplay(v=>v+digit)
 }
 const decimal=()=>{if(waiting){setDisplay('0.');setWaiting(false);return}if(!display.includes('.'))setDisplay(v=>v+'.')}
 const clear=()=>{setDisplay('0');setStored(null);setOp(null);setWaiting(false)}
 const toggleSign=()=>setDisplay(v=>v.startsWith('-')?v.slice(1):v==='0'?'0':'-'+v)
 const percent=()=>{
  const current=clean(display)
  if(stored!==null&&op){
   const p=(op==='+'||op==='-')?stored*current/100:current/100
   setDisplay(fmt(p))
  }else setDisplay(fmt(current/100))
 }
 const apply=(a:number,b:number,operation:Op)=>{
  if(operation==='+')return a+b
  if(operation==='-')return a-b
  if(operation==='×')return a*b
  if(operation==='÷')return b===0?NaN:a/b
  return b
 }
 const chooseOp=(next:Op)=>{
  const current=clean(display)
  if(stored!==null&&op&&!waiting){
   const result=apply(stored,current,op)
   setStored(result);setDisplay(fmt(result))
  }else setStored(current)
  setOp(next);setWaiting(true)
 }
 const equals=()=>{
  if(stored===null||!op)return
  const result=apply(stored,clean(display),op)
  setDisplay(fmt(result));setStored(null);setOp(null);setWaiting(true)
 }
 const memoryAdd=()=>setMemory((memory??0)+clean(display))
 const memorySubtract=()=>setMemory((memory??0)-clean(display))
 const memoryRecall=()=>setDisplay(fmt(memory??0))
 const memoryClear=()=>setMemory(null)
 const key=(label:string,action:()=>void,wide=false)=> <button type='button' onClick={action} style={{...kbutton,gridColumn:wide?'span 2':'span 1'}}>{label}</button>
 return <section style={wrap}>
  <div style={head}><div><span style={eyebrow}>INICIO RÁPIDO</span><h2 style={{margin:'4px 0'}}>Calculadora rápida</h2><small>Usala para cuentas normales y porcentajes, sin configurar nada.</small></div><span style={chip}>{memory!==null?'Memoria guardada':'Lista para usar'}</span></div>
  <div style={calc}><div style={screen}>{display}</div>
   <div style={memoryRow}>{key('MC',memoryClear)}{key('MR',memoryRecall)}{key('M−',memorySubtract)}{key('M+',memoryAdd)}</div>
   <div style={grid}>{key('AC',clear)}{key('±',toggleSign)}{key('%',percent)}{key('÷',()=>chooseOp('÷'),false)}{key('7',()=>enter('7'))}{key('8',()=>enter('8'))}{key('9',()=>enter('9'))}{key('×',()=>chooseOp('×'))}{key('4',()=>enter('4'))}{key('5',()=>enter('5'))}{key('6',()=>enter('6'))}{key('−',()=>chooseOp('-'))}{key('1',()=>enter('1'))}{key('2',()=>enter('2'))}{key('3',()=>enter('3'))}{key('+',()=>chooseOp('+'))}{key('0',()=>enter('0'),true)}{key('.',decimal)}{key('=',equals)}</div>
  </div>
  <div style={hint}><b>Ejemplo:</b> 100 → + → 20 → % → = da <b>120</b>. 100 → − → 20 → % → = da <b>80</b>.</div>
 </section>
}

const wrap:React.CSSProperties={background:'#fff',border:'1px solid #dfe7eb',borderRadius:20,padding:20,marginBottom:16,boxShadow:'0 10px 28px rgba(52,74,87,.07)'}
const head:React.CSSProperties={display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',marginBottom:14}
const eyebrow:React.CSSProperties={fontSize:11,fontWeight:900,letterSpacing:'.12em',color:'#3d999c'}
const chip:React.CSSProperties={padding:'7px 10px',borderRadius:999,background:'#eef6f5',fontSize:12,fontWeight:800,color:'#2f6669'}
const calc:React.CSSProperties={maxWidth:420,margin:'0 auto',background:'#101416',borderRadius:22,padding:14}
const screen:React.CSSProperties={background:'#101416',color:'#fff',fontSize:42,textAlign:'right',padding:'20px 10px',minHeight:62,overflow:'hidden',fontVariantNumeric:'tabular-nums'}
const memoryRow:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8,marginBottom:8}
const grid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}
const kbutton:React.CSSProperties={border:0,borderRadius:14,minHeight:58,fontSize:20,fontWeight:800,cursor:'pointer',background:'#283035',color:'#fff'}
const hint:React.CSSProperties={marginTop:14,padding:12,borderRadius:12,background:'#f6f8f9',color:'#596872',fontSize:13,lineHeight:1.5}
