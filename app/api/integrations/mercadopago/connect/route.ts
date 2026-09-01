import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { oauthConfig, saveOAuthState } from '@/lib/mercadopago-oauth'

export const dynamic='force-dynamic'

export async function GET(req:Request){
 try{
  const {clientId,redirectUri}=oauthConfig()
  const state=crypto.randomBytes(24).toString('hex')
  saveOAuthState(state)
  const url=new URL('https://auth.mercadopago.com/authorization')
  url.searchParams.set('response_type','code')
  url.searchParams.set('client_id',clientId)
  url.searchParams.set('platform_id','mp')
  url.searchParams.set('state',state)
  url.searchParams.set('redirect_uri',redirectUri)
  return NextResponse.redirect(url)
 }catch(err){
  const back=new URL(req.url)
  back.pathname='/'
  back.searchParams.set('integration','mercadopago')
  back.searchParams.set('error',err instanceof Error?err.message:'No se pudo iniciar Mercado Pago.')
  return NextResponse.redirect(back)
 }
}
