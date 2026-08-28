const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
let source = fs.readFileSync(file, 'utf8')

const replaceOnce = (from, to, label) => {
  if (source.includes(to)) return
  if (!source.includes(from)) {
    console.log(`CASA ALLEGRA: no se encontró el punto de inserción para ${label}; se omite.`)
    return
  }
  source = source.replace(from, to)
}

replaceOnce(
  "const [businessNameInput,setBusinessNameInput]=useState(''); const [businessName,setBusinessName]=useState(''); const [userEmail,setUserEmail]=useState('')",
  "const [businessNameInput,setBusinessNameInput]=useState(''); const [businessName,setBusinessName]=useState(''); const [businessLogo,setBusinessLogo]=useState(''); const [userEmail,setUserEmail]=useState('')",
  'estado del logo'
)

replaceOnce(
  "const stored=load(`${base}-business`,'');if(stored)setBusinessName(stored)",
  "const stored=load(`${base}-business`,'');if(stored)setBusinessName(stored);const logo=load(`${base}-logo`,'');if(logo)setBusinessLogo(logo)",
  'carga del logo'
)

replaceOnce(
  "useEffect(()=>{if(businessName)save(`${base}-business`,businessName)},[base,businessName])",
  "useEffect(()=>{if(businessName)save(`${base}-business`,businessName)},[base,businessName]);useEffect(()=>{if(businessLogo)save(`${base}-logo`,businessLogo)},[base,businessLogo])",
  'persistencia del logo'
)

replaceOnce(
  "const openAuth=(mode:'login'|'signup')=>{setAuthMode(mode);setAuthMessage('');setEmail('');setPassword('');setConfirmPassword('');setBusinessNameInput('')}",
  "const openAuth=(mode:'login'|'signup')=>{setAuthMode(mode);setAuthMessage('');setEmail('');setPassword('');setConfirmPassword('');setBusinessNameInput('')}; const handleLogoUpload=(e:React.ChangeEvent<HTMLInputElement>)=>{const file=e.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/')){setNotice('Elegí una imagen válida.');return}if(file.size>2*1024*1024){setNotice('El logo debe pesar menos de 2 MB.');return}const reader=new FileReader();reader.onload=()=>{const result=reader.result;if(typeof result==='string')setBusinessLogo(result)};reader.readAsDataURL(file)}; const removeLogo=()=>setBusinessLogo('')",
  'gestión del logo'
)

replaceOnce(
  "const headline=userEmail?`¡BIENVENIDO/A ${businessName||'A CASA ALLEGRA'}!`:'¡BIENVENIDO/A A CASA ALLEGRA APP!'",
  "const headline=businessName?`BIENVENIDO/A, ${businessName}`:'BIENVENIDO/A'",
  'saludo personalizado'
)

replaceOnce(
  "<div className=\"topbar-right\"><button className=\"icon-btn\" aria-label=\"Notificaciones\" onClick={()=>goTo('notificaciones')}><Icon name=\"bell\" size={20}/><span className=\"badge\">3</span></button>{userEmail?<div className=\"account\"><strong>{businessName||'CASA ALLEGRA'}</strong><small>Cuenta activa</small></div>:<button className=\"top-login\" onClick={()=>openAuth('login')}>Ingresar</button>}<button className=\"circle-brand\" aria-label=\"Marca CASA ALLEGRA\"><img src=\"/icon-512.png\" alt=\"\"/></button></div>",
  "<div className=\"topbar-right\"><button className=\"icon-btn\" aria-label=\"Notificaciones\" onClick={()=>goTo('notificaciones')}><Icon name=\"bell\" size={20}/><span className=\"badge\">3</span></button>{userEmail?<div className=\"account\"><strong>{businessName||'CASA ALLEGRA'}</strong><small>Cuenta activa</small></div>:<button className=\"top-login\" onClick={()=>openAuth('login')}>Ingresar</button>}<label className=\"circle-brand business-logo-picker\" title=\"Logo del negocio\"><input type=\"file\" accept=\"image/*\" onChange={handleLogoUpload} aria-label=\"Subir logo del negocio\"/><img src={businessLogo||'/icon-512.png'} alt=\"Logo del negocio\"/></label></div>",
  'logo circular superior'
)

replaceOnce(
  '<section className="welcome-card"><div><span className="eyebrow">CASA ALLEGRA APP</span><h1>{headline}</h1><p>GESTIONÁ TU NEGOCIO DE FORMA SIMPLE Y ORDENADA.</p>',
  '<section className="welcome-card"><div><span className="eyebrow">CASAALLEGRA APP</span><h1>{headline}</h1><div className="welcome-app-name">a CASAALLEGRA APP</div><p>GESTIONÁ TU NEGOCIO DE FORMA SIMPLE Y ORDENADA.</p>',
  'texto de bienvenida'
)

replaceOnce(
  "{section==='configuracion'&&<section className=\"panel large-section\"><h2>Configuración</h2><p>Negocio: <b>{businessName||'CASA ALLEGRA'}</b></p><p>Cuenta: <b>{userEmail}</b></p><button className=\"secondary-btn\" onClick={signOut}><Icon name=\"logout\"/>Cerrar sesión</button></section>}",
  "{section==='configuracion'&&<section className=\"panel large-section\"><h2>Configuración</h2><p>Personalizá la identidad de tu negocio.</p><div className=\"profile-settings\"><div className=\"profile-logo-preview\"><img src={businessLogo||'/icon-512.png'} alt=\"Logo del negocio\"/></div><div><strong>Logo del negocio</strong><small>PNG, JPG o WEBP · máximo 2 MB</small><div className=\"profile-actions\"><label className=\"secondary-btn\"><input type=\"file\" accept=\"image/*\" onChange={handleLogoUpload}/><Icon name=\"plus\"/>Cambiar logo</label>{businessLogo&&<button className=\"secondary-btn\" onClick={removeLogo}>Eliminar logo</button>}</div></div></div><div className=\"profile-business\"><label>Nombre del negocio</label><input value={businessName} onChange={e=>setBusinessName(e.target.value)} placeholder=\"Nombre de tu negocio\"/><small>Este nombre aparece en tu bienvenida y en tus módulos.</small></div><p>Cuenta: <b>{userEmail}</b></p><button className=\"secondary-btn\" onClick={signOut}><Icon name=\"logout\"/>Cerrar sesión</button></section>}",
  'configuración del perfil'
)

fs.writeFileSync(file, source)
console.log('CASA ALLEGRA: perfil de negocio personalizado aplicado durante el build.')
