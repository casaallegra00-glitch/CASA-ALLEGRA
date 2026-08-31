'use client'
import { FormEvent, useState } from 'react'

type Context={sales:any[];cash:any[];products:any[];clients:any[];orders:any[]}
type Props={question:string;onQuestionChange:(v:string)=>void;onNotice:(v:string)=>void;context:Context}
const quickQuestions=[
 '¿Cuánto vendí este mes?',
 '¿Cuánto dinero tengo en caja?',
 '¿Qué productos tienen stock bajo?',
 '¿Cuántos clientes tengo?',
 '¿Cuántos pedidos están pendientes?',
 '¿Cuál es mi producto más vendido?'
]

export default function AIManager({question,onQuestionChange,onNotice,context}:Props){
 const [messages,setMessages]=useState<Array<{role:'user'|'angi';text:string}>>([])
 const [loading,setLoading]=useState(false)

 const ask=async(q:string)=>{
  const clean=q.trim()
  if(!clean){onNotice('Escribí una consulta para ANGI.');return}
  setLoading(true)
  setMessages(m=>[...m,{role:'user',text:clean},{role:'angi',text:''}])
  onQuestionChange('')
  try{
   const res=await fetch('/api/angi',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({question:clean,context})
   })
   if(!res.ok){
    const data=await res.json().catch(()=>({}))
    throw new Error(data?.error||'No pudimos conectar con ANGI.')
   }
   if(!res.body) throw new Error('ANGI no devolvió una respuesta.')
   const reader=res.body.getReader()
   const decoder=new TextDecoder()
   let full=''
   while(true){
    const {value,done}=await reader.read()
    if(done)break
    full+=decoder.decode(value,{stream:true})
    const answerText=full
    setMessages(m=>{
     const next=[...m]
     const last=next.length-1
     if(last>=0&&next[last].role==='angi') next[last]={role:'angi',text:answerText}
     return next
    })
   }
   full+=decoder.decode()
   if(!full.trim()) throw new Error('ANGI no recibió una respuesta de la IA.')
  }catch(err){
   const message=err instanceof Error?err.message:'No pudimos conectar con ANGI.'
   setMessages(m=>{const next=[...m];const last=next.length-1;if(last>=0&&next[last].role==='angi'&&next[last].text==='')next[last]={role:'angi',text:message};else next.push({role:'angi',text:message});return next})
   onNotice('ANGI no pudo responder esta vez.')
  }finally{
   setLoading(false)
  }
 }

 const answer=(e:FormEvent)=>{e.preventDefault();void ask(question)}

 return <section className="panel large-section">
  <div className="panel-heading">
   <div>
    <span className="eyebrow">CASA ALLEGRA APP</span>
    <h2>ANGI</h2>
    <small>El asistente virtual de CASA ALLEGRA APP</small>
   </div>
   <span>{loading?'Pensando…':'IA conectada'}</span>
  </div>
  <div className="panel" style={{marginBottom:16}}>
   <h3>Preguntas rápidas</h3>
   <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
    {quickQuestions.map(q=><button type="button" key={q} className="secondary-btn" onClick={()=>void ask(q)} disabled={loading}>{q}</button>)}
   </div>
  </div>
  <div className="panel" style={{minHeight:220,marginBottom:16}}>
   {messages.length?messages.map((m,i)=><div key={i} className="trow"><span><b>{m.role==='angi'?'ANGI':'Vos'}</b><small>{m.text||(m.role==='angi'&&loading?'Escribiendo…':'')}</small></span></div>):<div className="empty-state">Hola, soy ANGI 👋. Elegí una pregunta rápida o escribime lo que necesitás.</div>}
  </div>
  <form onSubmit={answer} className="form-panel">
   <label>Escribile a ANGI</label>
   <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
    <input value={question} onChange={e=>onQuestionChange(e.target.value)} placeholder="Ej.: ¿Cuánto vendí este mes?" style={{flex:1,minWidth:220}} disabled={loading}/>
    <button className="primary-btn" disabled={loading}>{loading?'Pensando…':'Preguntar a ANGI'}</button>
   </div>
  </form>
 </section>
}
