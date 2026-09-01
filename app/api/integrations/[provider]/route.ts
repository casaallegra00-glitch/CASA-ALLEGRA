import { NextResponse } from 'next/server'
import { readOAuthToken } from '@/lib/mercadopago-oauth'

export const dynamic='force-dynamic'

type Params={params:Promise<{provider:string}>}
type ProviderConfig={keys:readonly string[];label:string}

export async function GET(_req:Request,{params}:Params){
 const {provider}=await params
 if(provider==='mercadopago'){
  const token=readOAuthToken()
  const ready=Boolean(process.env.MP_CLIENT_ID&&process.env.MP_CLIENT_SECRET&&process.env.MP_REDIRECT_URI&&process.env.MP_TOKEN_ENCRYPTION_KEY)
  return NextResponse.json({connected:Boolean(token),configured:ready,missing:ready?[]:['MP_CLIENT_ID','MP_CLIENT_SECRET','MP_REDIRECT_URI','MP_TOKEN_ENCRYPTION_KEY'].filter(k=>!process.env[k]),message:token?'Mercado Pago está conectado.':ready?'Mercado Pago está listo para conectar.':'Configurá primero las credenciales OAuth de Mercado Pago en Vercel.'})
 }
 const config={
  mercadolibre:{keys:['ML_CLIENT_ID','ML_CLIENT_SECRET','ML_REDIRECT_URI'],label:'Mercado Libre'},
  mercadoenvios:{keys:['ML_CLIENT_ID','ML_CLIENT_SECRET','ML_REDIRECT_URI'],label:'Mercado Envíos'},
  andreani:{keys:['ANDREANI_API_URL','ANDREANI_API_KEY'],label:'Andreani'},
  correoargentino:{keys:['CORREO_ARGENTINO_API_URL','CORREO_ARGENTINO_API_KEY'],label:'Correo Argentino'}
 } as const
 const item=(config as Record<string,ProviderConfig>)[provider]
 if(!item)return NextResponse.json({connected:false,error:'Integración no reconocida.'},{status:404})
 const missing=item.keys.filter(k=>!process.env[k])
 return NextResponse.json({connected:missing.length===0,configured:missing.length===0,missing,message:missing.length===0?`${item.label} está configurado en el servidor.`:`${item.label} todavía no está configurado. Faltan credenciales de servidor.`})
}
