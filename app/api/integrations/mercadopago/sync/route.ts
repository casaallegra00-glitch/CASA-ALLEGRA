import { NextResponse } from 'next/server'
import { oauthConfig, readOAuthToken, saveOAuthToken } from '@/lib/mercadopago-oauth'

export const dynamic='force-dynamic'

async function refreshIfNeeded(token:{access_token:string;refresh_token?:string;expires_at?:number;user_id?:string}){
 if(token.expires_at && Date.now() < token.expires_at-60_000) return token
 if(!token.refresh_token) return token
 const {clientId,clientSecret,redirectUri}=oauthConfig()
 const response=await fetch('https://api.mercadopago.com/oauth/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_id:clientId,client_secret:clientSecret,grant_type:'refresh_token',refresh_token:token.refresh_token,redirect_uri:redirectUri})})
 const data=await response.json()
 if(!response.ok||!data.access_token) throw new Error(data?.message||data?.error||'No se pudo renovar la autorización de Mercado Pago.')
 const fresh={access_token:data.access_token,refresh_token:data.refresh_token||token.refresh_token,expires_at:Date.now()+Number(data.expires_in||15552000)*1000,user_id:token.user_id}
 await saveOAuthToken(fresh)
 return fresh
}

export async function GET(){
 try{
  let token=await readOAuthToken()
  if(!token) return NextResponse.json({connected:false,message:'Primero conectá tu cuenta de Mercado Pago.'},{status:401})
  token=await refreshIfNeeded(token)
  const headers={Authorization:`Bearer ${token.access_token}`,'Content-Type':'application/json'}
  const [paymentsRes,meRes]=await Promise.all([
   fetch('https://api.mercadopago.com/v1/payments/search?limit=100&sort=date_created&criteria=desc',{headers,cache:'no-store'}),
   fetch('https://api.mercadopago.com/users/me',{headers,cache:'no-store'})
  ])
  const payments=await paymentsRes.json(); const me=await meRes.json()
  if(!paymentsRes.ok) throw new Error(payments?.message||payments?.error||'Mercado Pago rechazó la consulta de pagos.')
  const rows=Array.isArray(payments?.results)?payments.results:[]
  const movements=rows.map((p:any)=>{
   const approved=p.status==='approved'
   const reversed=['refunded','charged_back','cancelled'].includes(p.status)
   const amount=Number(p.transaction_amount||p.transaction_details?.net_received_amount||0)
   const type=approved&&!reversed?'ingreso':'egreso'
   const payer=p.payer||{}
   const identification=payer.identification||{}
   return {id:String(p.id),date:p.date_approved||p.date_created||new Date().toISOString(),type,title:approved?'Cobro Mercado Pago':'Movimiento Mercado Pago',amount,client:[payer.first_name,payer.last_name].filter(Boolean).join(' ')||payer.email||undefined,dni:identification.type==='DNI'?identification.number:undefined,status:p.status,detail:p.description||p.external_reference||''}
  }).filter((m:any)=>m.amount>0)
  return NextResponse.json({connected:true,movements,user:{id:me?.id,name:[me?.first_name,me?.last_name].filter(Boolean).join(' '),email:me?.email},message:`Mercado Pago sincronizado: ${movements.length} movimientos de pagos.`})
 }catch(err){
  return NextResponse.json({connected:false,error:err instanceof Error?err.message:'No se pudo sincronizar Mercado Pago.'},{status:500})
 }
}
