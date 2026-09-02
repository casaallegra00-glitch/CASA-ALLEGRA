const fs=require('fs')
const path=require('path')
const file=path.join(process.cwd(),'app','page.tsx')
let source=fs.readFileSync(file,'utf8')

if(!source.includes('showPassword,setShowPassword')){
  source=source.replace("const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [confirmPassword,setConfirmPassword]=useState('');", "const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [confirmPassword,setConfirmPassword]=useState(''); const [showPassword,setShowPassword]=useState(false); const [showConfirmPassword,setShowConfirmPassword]=useState(false);")
}

source=source.replace("const openAuth=(mode:'login'|'signup')=>{setAuthMode(mode);setAuthMessage('');setEmail('');setPassword('');setConfirmPassword('');setBusinessNameInput('')};", "const openAuth=(mode:'login'|'signup')=>{setAuthMode(mode);setAuthMessage('');setEmail('');setPassword('');setConfirmPassword('');setShowPassword(false);setShowConfirmPassword(false);setBusinessNameInput('')}; const passwordStrength=password.length<6?'Baja':password.length<10?'Media':(/[A-Z]/.test(password)&&/[a-z]/.test(password)&&/[0-9]/.test(password)&&/[^A-Za-z0-9]/.test(password)?'Alta':'Media');")

const oldPassword='<label>Contraseña</label><input value={password} onChange={e=>setPassword(e.target.value)} type="password"/>'
const newPassword="<label>Contraseña</label><div style={{display:'flex',gap:8,alignItems:'center'}}><input value={password} onChange={e=>setPassword(e.target.value)} type={showPassword?'text':'password'} autoComplete={authMode==='signup'?'new-password':'current-password'} style={{flex:1}}/><button type='button' className='secondary-btn' aria-label={showPassword?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setShowPassword(v=>!v)} style={{minWidth:48,padding:'10px 12px'}}>{showPassword?'🙈':'👁️'}</button></div>{authMode==='signup'&&<div style={{marginTop:6,fontSize:13,fontWeight:600}}>Seguridad de la contraseña: <span>{password?passwordStrength:'—'}</span>{password&&<div style={{height:6,borderRadius:99,background:'#e5e7eb',marginTop:5,overflow:'hidden'}}><div style={{height:'100%',width:passwordStrength==='Alta'?'100%':passwordStrength==='Media'?'66%':'33%',background:passwordStrength==='Alta'?'#16a34a':passwordStrength==='Media'?'#f59e0b':'#dc2626',transition:'width .2s'}}/></div>}</div>}"
if(source.includes(oldPassword)) source=source.replace(oldPassword,newPassword)

const oldConfirm='<label>Repetir contraseña</label><input value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} type="password"/>'
const newConfirm="<label>Volver a poner la contraseña</label><div style={{display:'flex',gap:8,alignItems:'center'}}><input value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} type={showConfirmPassword?'text':'password'} autoComplete='new-password' style={{flex:1}}/><button type='button' className='secondary-btn' aria-label={showConfirmPassword?'Ocultar contraseña':'Mostrar contraseña'} onClick={()=>setShowConfirmPassword(v=>!v)} style={{minWidth:48,padding:'10px 12px'}}>{showConfirmPassword?'🙈':'👁️'}</button></div>"
if(source.includes(oldConfirm)) source=source.replace(oldConfirm,newConfirm)

fs.writeFileSync(file,source)
console.log('CASA ALLEGRA: formulario de registro actualizado con repetir contraseña, ojitos y nivel de seguridad.')
