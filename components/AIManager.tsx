'use client'
import { FormEvent, useState } from 'react'

type Props={question:string;onQuestionChange:(v:string)=>void;onNotice:(v:string)=>void}
const quickQuestions=[
 '¿Cuánto vendí este mes?',
 '¿Cuánto dinero tengo en caja?',
 '¿Qué productos tienen stock bajo?',
 '¿Cuántos clientes tengo?',
 '¿Cuántos pedidos están pendientes?',
 '¿Cuál es mi producto más vendido?'
]
export default function AIManager({question,onQuestionChange,onNotice}:Props){
 const [messages,setMessages]=useState<Array<{role:'user'|'angi';text:string}>>([])
 const ask=(q:string)=>{const clean=q.trim();if(!clean){onNotice('Escribí una consulta para ANGI.');return}const a='Soy ANGI, el asistente virtual de CASA ALLEGRA APP. Puedo ayudarte a consultar ventas, productos, stock, clientes, pedidos, caja y reportes.';setMessages(m=>[...m,{role:'user',text:clean},{role:'angi',text:a}]);onQuestionChange('')}
 const answer=(e:FormEvent)=>{e.preventDefault();ask(question)}
 return <section className="panel large-section"><div className="panel-heading"><div><span className="eyebrow">CASA ALLEGRA APP</span><h2>ANGI</h2><small>El asistente virtual de CASA ALLEGRA APP</small></div></div><div className="panel" style={{marginBottom:16}}><h3>Preguntas rápidas</h3><div style={{display:'flex',gap:8,flexWrap:'wrap'}}>{quickQuestions.map(q=><button type="button" key={q} className="secondary-btn" onClick={()=>ask(q)}>{q}</button>)}</div></div><div className="panel" style={{minHeight:220,marginBottom:16}}>{messages.length?messages.map((m,i)=><div key={i} className="trow"><span><b>{m.role==='angi'?'ANGI':'Vos'}</b><small>{m.text}</small></span></div>):<div className="empty-state">Hola, soy ANGI 👋. Elegí una pregunta rápida o escribime lo que necesitás.</div>}</div><form onSubmit={answer} className="form-panel"><label>Escribile a ANGI</label><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><input value={question} onChange={e=>onQuestionChange(e.target.value)} placeholder="Ej.: ¿Cuánto vendí este mes?" style={{flex:1,minWidth:220}}/><button className="primary-btn">Preguntar a ANGI</button></div></form></section>
}
