import crypto from 'node:crypto';

const REPO=process.env.CMS_GITHUB_REPO||'cath365/Ndanji-Nachangwa';
const BRANCH=process.env.CMS_GITHUB_BRANCH||'main';
const FILE='content/portfolio.json';

function safeEqual(a,b){
  const aa=Buffer.from(String(a||'')),bb=Buffer.from(String(b||''));
  return aa.length===bb.length && crypto.timingSafeEqual(aa,bb);
}
function authorized(req){
  const supplied=(req.headers.authorization||'').replace(/^Bearer\s+/i,'');
  return process.env.ADMIN_KEY && safeEqual(supplied,process.env.ADMIN_KEY);
}
async function gh(path,options={}){
  const r=await fetch(`https://api.github.com/repos/${REPO}${path}`,{...options,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:`Bearer ${process.env.CMS_GITHUB_TOKEN}`,'Content-Type':'application/json',...(options.headers||{})}});
  if(!r.ok) throw new Error(`GitHub ${r.status}: ${await r.text()}`);
  return r.json();
}
export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!authorized(req)) return res.status(401).json({error:'Unauthorized'});
  if(!process.env.CMS_GITHUB_TOKEN) return res.status(500).json({error:'CMS_GITHUB_TOKEN is not configured'});
  const content=req.body?.content;
  if(!content||typeof content!=='object'||Array.isArray(content)) return res.status(400).json({error:'Invalid content payload'});
  const encoded=Buffer.from(JSON.stringify(content,null,2)+'\n').toString('base64');
  try{
    const current=await gh(`/contents/${FILE}?ref=${encodeURIComponent(BRANCH)}`);
    const result=await gh(`/contents/${FILE}`,{method:'PUT',body:JSON.stringify({message:'Publish portfolio content from admin dashboard',content:encoded,sha:current.sha,branch:BRANCH})});
    return res.status(200).json({ok:true,commit:result.commit?.sha||null});
  }catch(error){return res.status(500).json({error:'Publish failed',detail:error.message})}
}
