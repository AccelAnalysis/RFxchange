import {writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {existsSync} from 'node:fs';
import {loadEnvFile} from 'node:process';
const appRoot=fileURLToPath(new URL('../',import.meta.url));
// Match local Next.js env precedence; injected deployment variables win.
for (const name of ['.env.local','.env']) { const file=`${appRoot}/${name}`; if(existsSync(file))loadEnvFile(file); }
let auto={};
if(process.env.FIREBASE_WEBAPP_CONFIG){try{auto=JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG);}catch{throw new Error('FIREBASE_WEBAPP_CONFIG is not valid JSON.');}}
const names={apiKey:'API_KEY',appId:'APP_ID',authDomain:'AUTH_DOMAIN',projectId:'PROJECT_ID',storageBucket:'STORAGE_BUCKET',messagingSenderId:'MESSAGING_SENDER_ID'};
const firebase=Object.fromEntries(Object.entries(names).map(([key,suffix])=>[key,auto[key]||process.env[`NEXT_PUBLIC_FIREBASE_${suffix}`]||'']));
if(firebase.projectId&&firebase.projectId!=='rfxchange'&&!firebase.projectId.startsWith('demo-'))throw new Error('RFxchange RFx must use rfxchange or an explicit demo project.');
const configured=Boolean(firebase.apiKey&&firebase.appId&&firebase.authDomain&&firebase.projectId);
if(process.env.RFX_REQUIRE_CONFIGURATION==='true'&&!configured)throw new Error('Attach App Hosting to the existing Firebase web app RFxchange RFx, or supply its public Firebase SDK configuration.');
function origin(value,fallback){const u=new URL(value||fallback);if(u.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(u.hostname))throw new Error('Application origin must be HTTPS.');if(u.username||u.password||u.pathname!=='/'||u.search||u.hash)throw new Error('Application origin must not contain credentials, paths or parameters.');return u.origin;}
const config={configured,firebase,
 mapboxToken:process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN||'',
 exchangeOrigin:origin(process.env.RFXCHANGE_LEGACY_EXCHANGE_ORIGIN,'https://rfxchange--rfxchange.us-east4.hosted.app'),
 purchasingOrigin:origin(process.env.RFXCHANGE_PURCHASING_ORIGIN,'https://rfxchange-purchasing.web.app')};
// Only explicitly whitelisted public web configuration is emitted. No provider secrets.
await mkdir(`${appRoot}/public`,{recursive:true});
await writeFile(`${appRoot}/public/runtime-config.json`,`${JSON.stringify(config,null,2)}\n`);
console.log(`RFxchange RFx public configuration: ${configured?'ready':'not configured (local shell only)'}`);
