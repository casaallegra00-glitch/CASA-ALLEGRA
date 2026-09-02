const fs = require('fs')
const path = require('path')

const file = path.join(process.cwd(), 'app', 'page.tsx')
const templateFile = path.join(process.cwd(), 'templates', 'products-section.jsx.txt')
let source = fs.readFileSync(file, 'utf8')
const productBlock = fs.readFileSync(templateFile, 'utf8').trim()

if (!source.includes('const [editingProduct')) {
  const stateNeedle = "const [products,setProducts]=useState<Product[]>([]);"
  if (!source.includes(stateNeedle)) throw new Error('No se encontró el estado de productos.')
  source = source.replace(stateNeedle, stateNeedle + " const [editingProduct,setEditingProduct]=useState<Product|null>(null);")
}

// Mantener Product compatible con el nuevo campo Marca.
const productTypePattern = /type Product = \{([^\n]*)\}/
if (productTypePattern.test(source) && !/type Product = \{[^\n]*brand\?:string/.test(source)) {
  source = source.replace(productTypePattern, (m, body) => `type Product = {${body}; brand?:string}`)
}

if (!source.includes('const updateProduct=')) {
  const needle = " const registerSale="
  const insert = " const updateProduct=(id:number,patch:Partial<Product>)=>{setProducts(ps=>ps.map(p=>p.id===id?{...p,...patch}:p));setNotice('✅ Producto actualizado correctamente.')};\n const deleteProduct=async(product:Product)=>{if(!window.confirm('¿Eliminar el producto '+product.name+'?'))return;const nextProducts=products.filter(p=>p.id!==product.id);setProducts(nextProducts);save(`${base}-products`,nextProducts);setNotice('🗑️ Producto eliminado correctamente.');if(supabase&&userEmail){try{const {data:userData}=await supabase.auth.getUser();const uid=userData.user?.id;if(uid){const payload={products:nextProducts,sales,clients,orders,cash,businessCategories,businessName};const {error}=await supabase.from('business_state').upsert({user_id:uid,payload,updated_at:new Date().toISOString()},{onConflict:'user_id'});if(error)throw error}}catch(err){console.warn('CASA ALLEGRA: no se pudo confirmar la eliminación en la nube.',err)}}};\n const openProductEditor=(product:Product)=>setEditingProduct(product);\n"
  if (!source.includes(needle)) throw new Error('No se encontró el punto de inserción de Productos.')
  source = source.replace(needle, insert + needle)
}

// Asegurar que el alta de Productos guarde también la marca.
const addProductStart = source.indexOf(' const addProduct=')
const registerSaleStart = source.indexOf(' const registerSale=', addProductStart)
if (addProductStart !== -1 && registerSaleStart !== -1) {
  const oldAdd = source.slice(addProductStart, registerSaleStart)
  if (!oldAdd.includes("[name=brand]")) {
    const updatedAdd = oldAdd.replace(
      "const name=f.querySelector<HTMLInputElement>('[name=name]')?.value.trim()||'';",
      "const name=f.querySelector<HTMLInputElement>('[name=name]')?.value.trim()||'';const brand=f.querySelector<HTMLInputElement>('[name=brand]')?.value.trim()||'';"
    ).replace(
      'setProducts(p=>[...p,{id:Date.now(),name,category:cat,price,stock,sku,cost,minStock,unit:',
      'setProducts(p=>[...p,{id:Date.now(),name,brand,category:cat,price,stock,sku,cost,minStock,unit:'
    )
    source = source.slice(0, addProductStart) + updatedAdd + source.slice(registerSaleStart)
  }
}

const productsMarker = "{section==='productos'&&"
const ventasMarker = "{section==='ventas'&&"
const start = source.indexOf(productsMarker)
const end = source.indexOf(ventasMarker, start + productsMarker.length)
if (start === -1 || end === -1) throw new Error('No se encontró el bloque visual de Productos.')
source = source.slice(0, start) + productBlock + '\n' + source.slice(end)

fs.writeFileSync(file, source)
console.log('CASA ALLEGRA: Productos ahora permite editar, cambiar marca, imagen, precio, stock, categoría, SKU y eliminar con guardado inmediato en la nube.')
