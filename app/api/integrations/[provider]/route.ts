import { NextResponse } from 'next/server'

export const dynamic='force-dynamic'

type Params={params:Promise<{provider:string}>}

export async function GET(_req:Request,{params}:Params){
 const {provider}=await params
 const config={
  mercadopago:{keys:['MP_CLIENT_ID','MP_CLIENT_SECRET','MP_REDIRECT_URI'],label:'Mercado Pago'},
  mercadolibre:{keys:['ML_CLIENT_ID','ML_CLIENT_SECRET','ML_REDIRECT_URI'],label:'Mercado Libre'},
  mercadoenvios:{keys:['ML_CLIENT_ID','ML_CLIENT_SECRET','ML_REDIRECT_URI'],label:'Mercado Envíos'},
  andreani:{keys:['ANDREANI_API_URL','ANDREANI_API_KEY'],label:'Andreani'},
  correoargentino:{keys:['CORREO_ARGENTINO_API_URL','CORREO_ARGENTINO_API_KEY'],label:'Correo Argentino'}
 } as const
 const item=(config as Record<string,{keys:string[];label:string}>)[provider]
 if(!item)return NextResponse.json({connected:false,error:'Integración no reconocida.'},{status:404})
 const missing=item.keys.filter(k=>!process.env[k])
 return NextResponse.json({connected:missing.length===0,configured:missing.length===0,missing,message:missing.length===0?`${item.label} está configurado en el servidor.`:`${item.label} todavía no está configurado. Faltan credenciales de servidor.`})
}
