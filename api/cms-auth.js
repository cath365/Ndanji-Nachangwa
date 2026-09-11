import crypto from 'node:crypto';
function safeEqual(a,b){const aa=Buffer.from(String(a||'')),bb=Buffer.from(String(b||''));return aa.length===bb.length&&crypto.timingSafeEqual(aa,bb)}
export default function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!process.env.ADMIN_KEY) return res.status(500).json({error:'ADMIN_KEY is not configured'});
  const key=req.body?.key||'';
  if(!safeEqual(key,process.env.ADMIN_KEY)) return res.status(401).json({error:'Invalid admin key'});
  return res.status(200).json({ok:true});
}
