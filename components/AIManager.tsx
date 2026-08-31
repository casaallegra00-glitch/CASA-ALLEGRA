'use client'
import { FormEvent, useState } from 'react'

type Props={question:string;onQuestionChange:(v:string)=>void;onNotice:(v:string)=>void}
export default function AIManager({question,onQuestionChange,onNotice}:Props){
 const [messages,setMessages]=useState<Array<{role:'user'|'angi';text:string}>>([])
 const answer=(e:FormEvent)=>{e.preventDefault();const q=question.trim();if(!q){onNotice('Escribí una consulta para ANGI.');return}const a='Soy ANGI, el asistente virtual de CASA ALLEGRA APP. Puedo ayudarte a consultar ventas, productos, stock, clientes, pedidos, caja y reportes.';setMessages(m=>[...m,{role:'user',text:q},{role:'angi',text:a}]);onQuestionChange('')}
 return <section className="panel large-section"><div className="panel-heading"><div><span className="eyebrow">CASA ALLEGRA APP</span><h2>ANGI</h2><small>El asistente virtual de CASA ALLEGRA APP</small></div></div><div className="panel" style={{minHeight:220,marginBottom:16}}>{messages.length?messages.map((m,i)=><div key={i} className="trow"><span><b>{m.role==='angi'?'ANGI':'Vos'}</b><small>{m.text}</small></span></div>):<div className="empty-state">Hola, soy ANGI 👋. ¿En qué te ayudo con tu negocio?</div>}</div><form onSubmit={answer} className="form-panel"><label>Preguntale a ANGI</label><input value={question} onChange={e=>onQuestionChange(e.target.value)} placeholder="Ej.: ¿Cuánto vendí este mes?"/><button className="primary-btn">Preguntar a ANGI</button></form></section>
}
