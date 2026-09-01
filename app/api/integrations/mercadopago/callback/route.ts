import { NextResponse } from 'next/server'
import { consumeOAuthState, oauthConfig, saveOAuthToken } from '@/lib/mercadopago-oauth'

export const dynamic='force-dynamic'

export async function GET(req:Request){
 const input=new URL(req.url)
 const code=input.searchParams.get('code')||''
 const state=input.searchParams.get('state')||''
 const error=input.searchParams.get('error')
 const expected=await consumeOAuthState()
 const back=new URL(req.url);back.pathname='/';back.search='';back.searchParams.set('integration','mercadopago')
 if(error){back.searchParams.set('error',`Mercado Pago no autorizó la conexión: ${error}`);return NextResponse.redirect(back)}
 if(!code||!state||!expected||state!==expected.state){back.searchParams.set('error','La autorización de Mercado Pago no pudo verificarse. Volvé a intentarlo.');return NextResponse.redirect(back)}
 try{
  const {clientId,clientSecret,redirectUri}=oauthConfig()
  const response=await fetch('https://api.mercadopago.com/oauth/token',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({client_id:clientId,client_secret:clientSecret,code,grant_type:'authorization_code',redirect_uri:redirectUri,code_verifier:expected.verifier})})
  const data=await response.json()
  if(!response.ok||!data.access_token) throw new Error(data?.message||data?.error||'Mercado Pago no devolvió un Access Token válido.')
  await saveOAuthToken({access_token:data.access_token,refresh_token:data.refresh_token,expires_at:Date.now()+Number(data.expires_in||15552000)*1000,user_id:String(data.user_id||'')})
  back.searchParams.set('connected','1')
  return NextResponse.redirect(back)
 }catch(err){
  back.searchParams.set('error',err instanceof Error?err.message:'No se pudo completar la conexión OAuth con Mercado Pago.')
  return NextResponse.redirect(back)
 }
}
