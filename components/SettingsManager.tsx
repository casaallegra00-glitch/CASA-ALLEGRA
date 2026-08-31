'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

type Props={businessName:string;userEmail:string;storageKey:string;onBusinessNameChange:(value:string)=>void;onEmailChange:(value:string)=>void;onNotice:(message:string)=>void}
type Settings={brandName:string;phone:string;businessEmail:string;address:string;instagram:string;taxId:string;accountName:string;logo:string}

const read=(key:string,fallback:string)=>{try{return localStorage.getItem(key)||fallback}catch{return fallback}}
const write=(key:string,value:string)=>{try{localStorage.setItem(key,value)}catch{}}

export default function SettingsManager({businessName,userEmail,storageKey,onBusinessNameChange,onEmailChange,onNotice}:Props){
 const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL
 const supabaseKey=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
 const supabase=supabaseUrl&&supabaseKey?createClient(supabaseUrl,supabaseKey):null
 const [settings,setSettings]=useState<Settings>(()=>({brandName:businessName||'CASA ALLEGRA APP',phone:'',businessEmail:userEmail,address:'',instagram:'',taxId:'',accountName:'',logo:'/icon-512.png'}))
 const [currentPassword,setCurrentPassword]=useState('')
 const [newPassword,setNewPassword]=useState('')
 const [confirmPassword,setConfirmPassword]=useState('')
 const [showDelete,setShowDelete]=useState(false)
 const [deletePassword,setDeletePassword]=useState('')
 const [busy,setBusy]=useState(false)
 const [showCurrent,setShowCurrent]=useState(false)
 const [showNew,setShowNew]=useState(false)

 useEffect(()=>{
  setSettings(s=>({...s,brandName:businessName||s.brandName,businessEmail:userEmail||s.businessEmail}))
  try{
   const raw=localStorage.getItem(`${storageKey}-settings`)
   if(raw)setSettings(s=>({...s,...JSON.parse(raw),brandName:businessName||JSON.parse(raw).brandName||'CASA ALLEGRA APP',businessEmail:userEmail||JSON.parse(raw).businessEmail||''}))
   const savedLogo=localStorage.getItem(`${storageKey}-budget-logo`)
   if(savedLogo)setSettings(s=>({...s,logo:savedLogo}))
  }catch{}
 },[storageKey,businessName,userEmail])

 const patch=(key:keyof Settings,value:string)=>setSettings(s=>({...s,[key]:value}))
 const saveSettings=async()=>{
  const name=settings.brandName.trim()
  if(!name){onNotice('Ingresá el nombre de la marca.');return}
  setBusy(true)
  try{
   const next={...settings,brandName:name,businessEmail:settings.businessEmail.trim()}
   write(`${storageKey}-settings`,JSON.stringify(next))
   if(next.logo)write(`${storageKey}-budget-logo`,next.logo)
   if(supabase){const {error}=await supabase.auth.updateUser({data:{business_name:name,full_name:next.accountName.trim()||name}});if(error)throw error}
   onBusinessNameChange(name)
   onNotice('✅ Configuración guardada correctamente.')
  }catch(e){onNotice(e instanceof Error?e.message:'No pudimos guardar la configuración.')}finally{setBusy(false)}
 }
 const changeEmail=async()=>{
  if(!supabase){onNotice('La conexión de cuenta no está configurada.');return}
  const nextEmail=settings.businessEmail.trim().toLowerCase()
  if(!nextEmail||nextEmail===userEmail.toLowerCase())return
  if(!currentPassword){onNotice('Ingresá tu contraseña actual para cambiar el correo.');return}
  setBusy(true)
  try{
   const reauth=await supabase.auth.signInWithPassword({email:userEmail,password:currentPassword})
   if(reauth.error)throw reauth.error
   const {error}=await supabase.auth.updateUser({email:nextEmail})
   if(error)throw error
   onEmailChange(nextEmail)
   onNotice('✅ Solicitud enviada. Confirmá el nuevo correo desde tu email si Supabase lo solicita.')
   setCurrentPassword('')
  }catch(e){onNotice(e instanceof Error?e.message:'No pudimos cambiar el correo.')}finally{setBusy(false)}
 }
 const changePassword=async()=>{
  if(!supabase){onNotice('La conexión de cuenta no está configurada.');return}
  if(!currentPassword||!newPassword||!confirmPassword){onNotice('Completá contraseña actual, nueva y confirmación.');return}
  if(newPassword.length<6){onNotice('La nueva contraseña debe tener al menos 6 caracteres.');return}
  if(newPassword!==confirmPassword){onNotice('Las nuevas contraseñas no coinciden.');return}
  setBusy(true)
  try{
   const reauth=await supabase.auth.signInWithPassword({email:userEmail,password:currentPassword})
   if(reauth.error)throw reauth.error
   const {error}=await supabase.auth.updateUser({password:newPassword})
   if(error)throw error
   setCurrentPassword('');setNewPassword('');setConfirmPassword('');onNotice('✅ Contraseña actualizada correctamente.')
  }catch(e){onNotice(e instanceof Error?e.message:'No pudimos cambiar la contraseña.')}finally{setBusy(false)}
 }
 const selectLogo=(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{const logo=String(reader.result||'');patch('logo',logo);write(`${storageKey}-budget-logo`,logo);onNotice('Logo actualizado. También se usará en Presupuestos.')};reader.readAsDataURL(file)}
 const deleteAccount=async()=>{
  if(!supabase){onNotice('La conexión de cuenta no está configurada.');return}
  if(!deletePassword){onNotice('Ingresá tu contraseña para confirmar la eliminación.');return}
  setBusy(true)
  try{
   const reauth=await supabase.auth.signInWithPassword({email:userEmail,password:deletePassword})
   if(reauth.error)throw reauth.error
   const token=reauth.data.session?.access_token
   if(!token)throw new Error('No pudimos validar la sesión.')
   const res=await fetch('/api/account/delete',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'}})
   const data=await res.json().catch(()=>({}))
   if(!res.ok)throw new Error(data?.error||'No pudimos eliminar la cuenta.')
   try{Object.keys(localStorage).filter(k=>k.includes(storageKey)).forEach(k=>localStorage.removeItem(k))}catch{}
   await supabase.auth.signOut()
   setShowDelete(false);onNotice('✅ Tu cuenta fue eliminada.')
   window.location.href='/'
  }catch(e){onNotice(e instanceof Error?e.message:'No pudimos eliminar la cuenta.')}finally{setBusy(false)}
 }
 return <section className='panel large-section'>
  <div className='panel-heading'><div><span className='eyebrow'>CUENTA Y NEGOCIO</span><h2>Configuración</h2><small>Administrá tus datos, seguridad y personalización.</small></div></div>
  <div className='two-col'>
   <div className='panel form-panel'>
    <h3>🏪 Datos de la marca</h3>
    <label>Nombre de la marca / negocio *</label><input value={settings.brandName} onChange={e=>patch('brandName',e.target.value)} placeholder='CASA ALLEGRA'/>
    <label>WhatsApp / teléfono</label><input value={settings.phone} onChange={e=>patch('phone',e.target.value)} placeholder='11 1234-5678'/>
    <label>Gmail / email del negocio</label><input value={settings.businessEmail} onChange={e=>patch('businessEmail',e.target.value)} type='email' placeholder='tuemail@gmail.com'/>
    <label>Dirección</label><input value={settings.address} onChange={e=>patch('address',e.target.value)} placeholder='Dirección del negocio'/>
    <label>Instagram / redes</label><input value={settings.instagram} onChange={e=>patch('instagram',e.target.value)} placeholder='@casaallegra'/>
    <label>CUIL / CUIT (opcional)</label><input value={settings.taxId} onChange={e=>patch('taxId',e.target.value)} placeholder='20-12345678-9'/>
    <label>Logo del negocio</label><input type='file' accept='image/*' onChange={selectLogo}/>{settings.logo&&<img src={settings.logo} alt='Logo' style={{width:120,height:120,objectFit:'contain',borderRadius:14,border:'1px solid #ece7f8',padding:8}}/>}
    <button type='button' className='primary-btn' onClick={saveSettings} disabled={busy}>{busy?'Guardando…':'💾 Guardar datos'}</button>
   </div>
   <div className='panel form-panel'>
    <h3>👤 Datos de la cuenta</h3>
    <label>Nombre del usuario</label><input value={settings.accountName} onChange={e=>patch('accountName',e.target.value)} placeholder='Tu nombre'/>
    <label>Correo de acceso actual</label><input value={userEmail} disabled/>
    <label>Nuevo correo</label><input value={settings.businessEmail} onChange={e=>patch('businessEmail',e.target.value)} type='email' placeholder='nuevo@gmail.com'/>
    <label>Contraseña actual</label><div style={{display:'flex',gap:8}}><input value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} type={showCurrent?'text':'password'} style={{flex:1}}/><button type='button' className='secondary-btn' onClick={()=>setShowCurrent(v=>!v)}>{showCurrent?'Ocultar':'Mostrar'}</button></div>
    <button type='button' className='secondary-btn' onClick={changeEmail} disabled={busy}>✉️ Cambiar correo</button>
    <h3 style={{marginTop:22}}>🔐 Cambiar contraseña</h3>
    <label>Nueva contraseña</label><div style={{display:'flex',gap:8}}><input value={newPassword} onChange={e=>setNewPassword(e.target.value)} type={showNew?'text':'password'} style={{flex:1}}/><button type='button' className='secondary-btn' onClick={()=>setShowNew(v=>!v)}>{showNew?'Ocultar':'Mostrar'}</button></div>
    <label>Repetir nueva contraseña</label><input value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} type={showNew?'text':'password'}/>
    <button type='button' className='primary-btn' onClick={changePassword} disabled={busy}>🔑 Actualizar contraseña</button>
   </div>
  </div>
  <div className='panel' style={{marginTop:18,border:'1px solid #f0c5cd'}}>
   <h3 style={{marginTop:0}}>⚠️ Zona peligrosa</h3><p>Eliminar tu cuenta es permanente. Se eliminará el acceso a CASA ALLEGRA APP.</p>
   <button type='button' className='secondary-btn' onClick={()=>setShowDelete(true)}>Eliminar mi cuenta</button>
  </div>
  {showDelete&&<div className='auth-overlay' onClick={()=>setShowDelete(false)}><div className='auth-modal' onClick={e=>e.stopPropagation()}><button type='button' className='modal-close' onClick={()=>setShowDelete(false)}>×</button><span className='eyebrow'>VERIFICACIÓN DE SEGURIDAD</span><h2>¿Eliminar tu cuenta?</h2><p>Ingresá tu contraseña actual para confirmar. Esta acción no se puede deshacer.</p><label>Contraseña actual</label><input value={deletePassword} onChange={e=>setDeletePassword(e.target.value)} type='password' autoFocus/><div style={{display:'flex',gap:8,marginTop:14}}><button type='button' className='secondary-btn' onClick={()=>setShowDelete(false)}>Cancelar</button><button type='button' className='primary-btn' onClick={deleteAccount} disabled={busy}>{busy?'Verificando…':'Sí, eliminar definitivamente'}</button></div></div></div>}
 </section>
}
