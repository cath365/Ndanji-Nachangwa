const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const MEDIA_KEY='ndanji-cloudinary-images';

function latestLocalMedia(){
  try{return JSON.parse(localStorage.getItem(MEDIA_KEY)||'[]')[0]||null}catch{return null}
}
function parseWorking(){
  const ta=$('#advancedHtml');
  if(!ta?.value.trim())return null;
  return new DOMParser().parseFromString(ta.value,'text/html');
}
function applyWorking(doc,message){
  const ta=$('#advancedHtml'),apply=$('#applyAdvancedBtn');
  if(!ta||!apply||!doc)return;
  ta.value='<!doctype html>\n'+doc.documentElement.outerHTML;
  apply.click();
  const global=$('#globalMessage');
  if(global){global.textContent=message||'Working copy updated. Preview and publish when ready.';global.className='msg ok'}
}
function safeUrl(v){
  const x=String(v||'').trim();
  return /^(https?:\/\/|\/)/i.test(x)?x:'';
}

function installContentSearch(){
  const editor=$('#textEditor');
  if(!editor||$('#contentSearch'))return;
  const wrap=document.createElement('div');
  wrap.className='field';
  wrap.style.marginBottom='12px';
  wrap.innerHTML='<label for="contentSearch">Find information on this page</label><input id="contentSearch" type="search" placeholder="Search headings, paragraphs, labels…">';
  editor.parentElement.insertBefore(wrap,editor);
  $('#contentSearch').addEventListener('input',e=>{
    const q=e.target.value.trim().toLowerCase();
    $$('.edit-item',editor).forEach(item=>{
      const hay=(item.textContent+' '+(item.querySelector('textarea')?.value||'')).toLowerCase();
      item.style.display=!q||hay.includes(q)?'':'none';
    });
  });
}

function installOverviewGuide(){
  const panel=$('#section-overview .panel');
  if(!panel||$('#powerGuide'))return;
  const box=document.createElement('div');
  box.id='powerGuide';box.className='notice blue';box.style.marginTop='16px';
  box.innerHTML='<strong>Full control:</strong> Content edits existing wording. Section Builder adds new information, media, files and new public sections. Media replaces current images. SEO controls search/social previews. Version History restores earlier public versions.';
  panel.appendChild(box);
  const quick=panel.querySelector('.quick');
  if(quick&&!quick.querySelector('[data-open-builder]')){
    const b=document.createElement('button');
    b.className='quick-card';b.type='button';b.setAttribute('data-open-builder','true');
    b.innerHTML='<b>Section Builder</b><span>Add new information, images, video, documents or a complete section without touching HTML.</span>';
    b.addEventListener('click',()=>document.querySelector('[data-section="builder"]')?.click());
    quick.appendChild(b);
  }
}

const templates={
  achievement:{type:'card',label:'Recognition • 2026',title:'Achievement title',body:'Describe what was achieved, why it matters and the evidence or outcome.',linkText:'View evidence'},
  engagement:{type:'card',label:'Professional engagement',title:'Event or programme name',body:'Describe the institution, Ndanji’s role, audience, contribution and outcome.',linkText:'View engagement'},
  publication:{type:'text',label:'Publication • Thought leadership',title:'Publication title',body:'Add a concise summary of the article, paper or public reflection.',linkText:'Read publication'},
  credential:{type:'card',label:'Credential • Professional development',title:'Qualification or certificate',body:'Add the issuing institution, year and why this credential matters.',linkText:'View credential'},
  testimonial:{type:'quote',label:'Professional recommendation',title:'',body:'Paste an approved genuine testimonial or recommendation here.'},
  media:{type:'image',label:'Field record',title:'Photo story title',body:'Explain what is happening in this image, the context and why it matters.',linkText:''},
  video:{type:'video',label:'Video record',title:'Video title',body:'Add context explaining the programme, event or work shown in this video.',linkText:''},
  document:{type:'document',label:'Professional resource',title:'Document title',body:'Explain what this document contains and why it is relevant.',linkText:'Open document'},
  speaking:{type:'card',label:'Speaking • Public engagement',title:'Event / panel / workshop',body:'Add the host institution, audience, topic, Ndanji’s contribution and outcome.',linkText:'View engagement'},
  milestone:{type:'stat',label:'Verified result',title:'00',body:'Explain what this number represents and why it matters.',linkText:''}
};
function fillTemplate(key){
  const t=templates[key];if(!t)return;
  const type=$('#sbType'),label=$('#sbLabel'),title=$('#sbTitle'),body=$('#sbBody'),linkText=$('#sbLinkText'),link=$('#sbLink');
  if(!type||!label||!title||!body)return;
  type.value=t.type;label.value=t.label;title.value=t.title;body.value=t.body;
  if(linkText)linkText.value=t.linkText||'';if(link)link.value='';title.focus();
}
function installBuilderTemplates(){
  const builder=$('#section-builder .panel');
  if(!builder||$('#builderTemplates'))return;
  const box=document.createElement('div');
  box.id='builderTemplates';box.className='builder-templates';
  box.innerHTML='<div class="small"><strong>Quick templates</strong> — choose a structure, then replace the placeholder wording with verified information.</div><div class="template-buttons"><button class="btn light" data-template="achievement">Achievement</button><button class="btn light" data-template="engagement">Engagement</button><button class="btn light" data-template="speaking">Speaking</button><button class="btn light" data-template="publication">Publication</button><button class="btn light" data-template="credential">Credential</button><button class="btn light" data-template="testimonial">Testimonial</button><button class="btn light" data-template="media">Photo story</button><button class="btn light" data-template="video">Video</button><button class="btn light" data-template="document">Document</button><button class="btn light" data-template="milestone">Statistic</button></div>';
  const firstField=builder.querySelector('.field');
  builder.insertBefore(box,firstField||builder.firstChild);
  $$('[data-template]',box).forEach(b=>b.addEventListener('click',()=>fillTemplate(b.dataset.template)));
}

function replaceArtwork(index,url){
  const doc=parseWorking();if(!doc)return;
  const arts=$$('.recovered-art[data-source]',doc),old=arts[index];if(!old)return;
  const img=doc.createElement('img');
  img.src=url;img.alt=old.getAttribute('data-alt')||'Portfolio image';img.className='cms-replaced-art';
  old.replaceWith(img);
  applyWorking(doc,'Special artwork replaced in the working copy. Preview and publish when ready.');
  setTimeout(renderSpecialArtwork,150);
}
function renderSpecialArtwork(){
  const host=$('#specialArtworkTargets');if(!host)return;
  const doc=parseWorking();
  if(!doc){host.innerHTML='<div class="small">Load a public page first.</div>';return}
  const arts=$$('.recovered-art[data-source]',doc);
  host.replaceChildren();
  if(!arts.length){host.innerHTML='<div class="notice">No legacy artwork targets remain on this page. Normal images are managed above.</div>';return}
  arts.forEach((art,i)=>{
    const row=document.createElement('div');row.className='special-art-row';
    const alt=art.getAttribute('data-alt')||`Artwork ${i+1}`;
    row.innerHTML=`<div><b>${alt.replace(/</g,'&lt;')}</b><small>${(art.getAttribute('data-source')||'').replace(/</g,'&lt;')}</small></div><div class="special-art-controls"><input type="text" placeholder="Paste Cloudinary/image URL"><button class="btn light latest" type="button">Use latest upload</button><button class="btn replace" type="button">Replace</button></div>`;
    const input=row.querySelector('input');
    row.querySelector('.latest').addEventListener('click',()=>{const m=latestLocalMedia();if(!m?.secureUrl)return alert('Upload an image first in Media Library.');input.value=m.secureUrl});
    row.querySelector('.replace').addEventListener('click',()=>{const u=safeUrl(input.value);if(!u)return alert('Enter a valid image URL or use the latest upload.');replaceArtwork(i,u)});
    host.appendChild(row);
  });
}
function installSpecialArtworkManager(){
  const media=$('#section-media');if(!media||$('#specialArtworkPanel'))return;
  const panel=document.createElement('div');panel.id='specialArtworkPanel';panel.className='panel';
  panel.innerHTML='<div class="panel-head"><div><div class="eyebrow">Special artwork</div><h2>Replace legacy visuals</h2><p class="small">Replace older project artwork once with a Cloudinary image and it becomes a normal editable image afterwards.</p></div><button class="btn light" id="refreshSpecialArtwork" type="button">Refresh</button></div><div id="specialArtworkTargets"></div>';
  media.appendChild(panel);
  $('#refreshSpecialArtwork').addEventListener('click',renderSpecialArtwork);
  $('#pageSelect')?.addEventListener('change',()=>setTimeout(renderSpecialArtwork,900));
  renderSpecialArtwork();
}

function installStyles(){
  if($('#adminPowerSafeStyles'))return;
  const style=document.createElement('style');style.id='adminPowerSafeStyles';style.textContent=`
  .builder-templates{padding:14px;border:1px solid rgba(7,23,46,.1);background:#f8f3e8;margin-bottom:15px}.template-buttons{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}.template-buttons .btn{min-height:34px;padding:7px 10px;font-size:.58rem}
  .special-art-row{display:grid;grid-template-columns:minmax(180px,.65fr) minmax(0,1.35fr);gap:14px;padding:13px 0;border-bottom:1px solid rgba(7,23,46,.11)}.special-art-row:last-child{border-bottom:0}.special-art-row b{display:block;font:600 1.15rem 'Cormorant Garamond',serif;color:#07172e}.special-art-row small{display:block;margin-top:4px;color:#78859a;font-size:.64rem;overflow-wrap:anywhere}.special-art-controls{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:7px;align-items:center}
  #section-overview .quick{grid-template-columns:repeat(auto-fit,minmax(180px,1fr))}
  @media(max-width:760px){.special-art-row,.special-art-controls{grid-template-columns:1fr}.template-buttons .btn{flex:1 1 42%}}
  `;document.head.appendChild(style);
}

function sync(){
  installStyles();installContentSearch();installOverviewGuide();installBuilderTemplates();installSpecialArtworkManager();
}

function boot(){
  sync();
  let tries=0;
  const timer=setInterval(()=>{
    sync();tries++;
    if(($('#builderTemplates')&&$('#specialArtworkPanel'))||tries>=16)clearInterval(timer);
  },500);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
