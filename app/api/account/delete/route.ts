import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request:Request){
 try{
  const auth=request.headers.get('authorization')||''
  const token=auth.startsWith('Bearer ')?auth.slice(7).trim():''
  if(!token)return NextResponse.json({error:'Sesión no autorizada.'},{status:401})
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const service=process.env.SUPABASE_SERVICE_ROLE_KEY
  if(!url||!anon)return NextResponse.json({error:'Supabase no está configurado.'},{status:500})
  if(!service)return NextResponse.json({error:'Falta SUPABASE_SERVICE_ROLE_KEY en Vercel para poder eliminar cuentas de forma segura.'},{status:503})
  const userClient=createClient(url,anon,{auth:{persistSession:false,autoRefreshToken:false}})
  const {data:{user},error:userError}=await userClient.auth.getUser(token)
  if(userError||!user)return NextResponse.json({error:'No pudimos verificar tu sesión.'},{status:401})
  const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}})
  const {error}=await admin.auth.admin.deleteUser(user.id)
  if(error)return NextResponse.json({error:error.message},{status:500})
  return NextResponse.json({ok:true})
 }catch(e){
  return NextResponse.json({error:e instanceof Error?e.message:'No pudimos eliminar la cuenta.'},{status:500})
 }
}
