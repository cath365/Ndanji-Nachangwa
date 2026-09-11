const CONTENT_URL='/content/portfolio.json';
const path=(location.pathname.split('/').pop()||'index.html').toLowerCase();
const text=(el,value)=>{if(el&&value!=null)el.textContent=value};
const byText=(selector,needle)=>[...document.querySelectorAll(selector)].find(el=>el.textContent.trim()===needle);

async function loadContent(){
  const res=await fetch(CONTENT_URL+'?v='+Date.now(),{cache:'no-store'});
  if(!res.ok) throw new Error('Unable to load portfolio content');
  return res.json();
}

function applyGlobal(c){
  document.querySelectorAll('.brand,.name,.logo').forEach(el=>{if(/ndanji/i.test(el.textContent)) text(el,c.profile.name)});
  document.querySelectorAll('img').forEach(img=>{
    if(c.profile.profileImage && /ndanji-profile/i.test(img.getAttribute('src')||'')) img.src=c.profile.profileImage;
  });
}

function applyPage(c){
  const h1=document.querySelector('h1');
  if(path==='index.html'){
    text(h1,c.home.headline);
    const eyebrow=document.querySelector('.eyebrow'); text(eyebrow,c.home.eyebrow);
  } else if(path==='about.html') text(h1,c.about.headline);
  else if(path==='contact.html') text(h1,c.contact.headline);

  const replacements={
    'Lusaka Province, Zambia':c.profile.location,
    'Lusaka, Zambia':c.contact.location
  };
  document.querySelectorAll('p,span,div').forEach(el=>{
    if(el.children.length===0 && replacements[el.textContent.trim()]) text(el,replacements[el.textContent.trim()]);
  });
}

loadContent().then(c=>{applyGlobal(c);applyPage(c);window.portfolioContent=c;document.dispatchEvent(new CustomEvent('portfolio:content',{detail:c}))}).catch(err=>console.warn('[portfolio CMS]',err));
