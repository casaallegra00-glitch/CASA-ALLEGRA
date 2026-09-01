import crypto from 'crypto'
import { cookies } from 'next/headers'

const COOKIE_NAME='casa_allegra_mp_oauth'
const STATE_COOKIE='casa_allegra_mp_oauth_state'
const KEY_ENV='MP_TOKEN_ENCRYPTION_KEY'

type TokenData={access_token:string;refresh_token?:string;expires_at?:number;user_id?:string}
type OAuthState={state:string;verifier:string}

function getKey(){
 const raw=process.env[KEY_ENV]
 if(!raw) throw new Error(`Falta ${KEY_ENV} en Vercel.`)
 return crypto.createHash('sha256').update(raw).digest()
}
function encrypt(value:string){
 const iv=crypto.randomBytes(12)
 const cipher=crypto.createCipheriv('aes-256-gcm',getKey(),iv)
 const encrypted=Buffer.concat([cipher.update(value,'utf8'),cipher.final()])
 const tag=cipher.getAuthTag()
 return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`
}
function decrypt(value:string){
 const [ivRaw,tagRaw,dataRaw]=value.split('.')
 if(!ivRaw||!tagRaw||!dataRaw) throw new Error('Valor OAuth inválido.')
 const decipher=crypto.createDecipheriv('aes-256-gcm',getKey(),Buffer.from(ivRaw,'base64url'))
 decipher.setAuthTag(Buffer.from(tagRaw,'base64url'))
 return Buffer.concat([decipher.update(Buffer.from(dataRaw,'base64url')),decipher.final()]).toString('utf8')
}

export async function saveOAuthToken(token:TokenData){
 (await cookies()).set(COOKIE_NAME,encrypt(JSON.stringify(token)),{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:60*60*24*180})
}
export async function readOAuthToken():Promise<TokenData|null>{
 try{const value=(await cookies()).get(COOKIE_NAME)?.value;if(!value)return null;return JSON.parse(decrypt(value)) as TokenData}catch{return null}
}
export async function clearOAuthToken(){
 (await cookies()).set(COOKIE_NAME,'',{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:0})
}
export async function saveOAuthState(value:OAuthState){
 (await cookies()).set(STATE_COOKIE,encrypt(JSON.stringify(value)),{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:10*60})
}
export async function consumeOAuthState():Promise<OAuthState|null>{
 try{const store=await cookies();const value=store.get(STATE_COOKIE)?.value;store.set(STATE_COOKIE,'',{httpOnly:true,secure:true,sameSite:'lax',path:'/',maxAge:0});if(!value)return null;return JSON.parse(decrypt(value)) as OAuthState}catch{return null}
}
export function oauthConfig(){
 const clientId=process.env.MP_CLIENT_ID,clientSecret=process.env.MP_CLIENT_SECRET,redirectUri=process.env.MP_REDIRECT_URI
 if(!clientId||!clientSecret||!redirectUri) throw new Error('Configurá MP_CLIENT_ID, MP_CLIENT_SECRET y MP_REDIRECT_URI en Vercel.')
 return {clientId,clientSecret,redirectUri}
}
export function createPkce(){
 const verifier=crypto.randomBytes(48).toString('base64url')
 const challenge=crypto.createHash('sha256').update(verifier).digest('base64url')
 return {verifier,challenge}
}
