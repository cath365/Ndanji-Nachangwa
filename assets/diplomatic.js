(function(){
  function ensureRecognitionStyles(){
    if(document.querySelector('link[href^="/assets/engagements.css"]')) return;
    var link=document.createElement('link');
    link.rel='stylesheet';
    link.href='/assets/engagements.css';
    document.head.appendChild(link);
  }

  function ensureLaptopStyles(){
    if(document.querySelector('link[data-laptop-fit]')) return;
    var fit=document.createElement('link');
    fit.rel='stylesheet';
    fit.href='/assets/laptop-fit.css?v=3';
    fit.setAttribute('data-laptop-fit','true');
    document.head.appendChild(fit);
  }

  function ensureCmsBlockStyles(){
    if(document.querySelector('link[data-cms-blocks]')) return;
    var style=document.createElement('link');
    style.rel='stylesheet';
    style.href='/assets/cms-blocks.css?v=1';
    style.setAttribute('data-cms-blocks','true');
    document.head.appendChild(style);
  }

  function ensurePremiumLayer(){
    if(!document.querySelector('link[data-premium-polish]')){
      var style=document.createElement('link');
      style.rel='stylesheet';
      style.href='/assets/premium-polish.css?v=1';
      style.setAttribute('data-premium-polish','true');
      document.head.appendChild(style);
    }
    if(!document.querySelector('script[data-premium-polish]')){
      var script=document.createElement('script');
      script.src='/assets/premium-polish.js?v=1';
      script.defer=true;
      script.setAttribute('data-premium-polish','true');
      document.head.appendChild(script);
    }
  }

  function enhancePublicNavigation(){
    document.querySelectorAll('[data-nav]').forEach(function(nav){
      if(!nav.querySelector('a[href="/engagements.html"]')){
        var link=document.createElement('a');
        link.href='/engagements.html';
        link.textContent='Engagements';
        var publications=nav.querySelector('a[href="/insights.html"]');
        if(publications) nav.insertBefore(link,publications); else nav.appendChild(link);
      }
      var path=(location.pathname||'/').replace(/\/$/,'')||'/';
      nav.querySelectorAll('a[href]').forEach(function(a){
        var href=(a.getAttribute('href')||'').replace(/\/$/,'')||'/';
        a.classList.toggle('active',href===path);
      });
    });

    document.querySelectorAll('.footer-links').forEach(function(group){
      if(group.querySelector('a[href="/engagements.html"]')) return;
      var publications=group.querySelector('a[href="/insights.html"]');
      if(!publications) return;
      var link=document.createElement('a');
      link.href='/engagements.html';
      link.textContent='Engagements & Recognition';
      group.insertBefore(link,publications);
    });
  }

  function addHomeRecognitionFeature(){
    var path=(location.pathname||'/').toLowerCase();
    if(!(path==='/'||path.endsWith('/index.html'))) return;
    if(document.querySelector('.recognition-home')) return;
    var footer=document.querySelector('.footer');
    if(!footer) return;
    var section=document.createElement('section');
    section.className='recognition-home';
    section.innerHTML=`
      <div class="recognition-home-grid">
        <div class="monogram-panel" aria-hidden="true"></div>
        <div>
          <div class="eyebrow">Engagements & recognition</div>
          <h2>A record built for the rooms that matter.</h2>
          <p>Beyond a conventional portfolio, Ndanji's public record brings together programme leadership, field work, professional development, mentorship and thought leadership in one formal dossier. The emphasis is on evidence, service and institutional readiness.</p>
          <div class="mini-records">
            <div class="mini-record"><b>Technovation Girls</b><span>Volunteer coaching within a cohort whose senior team reached the Global Semifinals.</span></div>
            <div class="mini-record"><b>Northmead STEAM</b><span>40 Grade 6 learners and five functional prototypes.</span></div>
            <div class="mini-record"><b>Professional Development</b><span>AI in Leadership and YALI digital marketing credentials.</span></div>
            <div class="mini-record"><b>Public Thought Leadership</b><span>Writing on STEM, AI, children, technology and social responsibility.</span></div>
          </div>
          <div class="actions"><a class="btn ink" href="/engagements.html">Open engagements & recognition</a><a class="btn ink" href="/contact.html">Request engagement</a></div>
        </div>
      </div>`;
    footer.parentNode.insertBefore(section,footer);
  }

  function protectProfileImages(){
    if(!document.querySelector('#portrait-fallback-styles')){
      var style=document.createElement('style');
      style.id='portrait-fallback-styles';
      style.textContent='.portrait-fallback{position:absolute;inset:10px;display:grid;place-items:center;text-align:center;background:linear-gradient(145deg,#cdb47f,#9f7a3e);color:#07172e;padding:34px;overflow:hidden}.portrait-fallback:before{content:"";position:absolute;inset:18px;border:1px solid rgba(255,255,255,.6)}.portrait-fallback-mark{position:relative;font:600 clamp(6rem,12vw,11rem) "Cormorant Garamond",serif;color:#f7f3e8;line-height:.8}.portrait-fallback-copy{position:relative;margin-top:18px;padding-top:14px;border-top:1px solid rgba(7,23,46,.3);max-width:270px}.portrait-fallback-copy strong{display:block;font-family:"Cormorant Garamond",serif;font-size:1.35rem}.portrait-fallback-copy span{display:block;margin-top:5px;font-size:.7rem;line-height:1.5;color:#25344d}';
      document.head.appendChild(style);
    }
    document.querySelectorAll('.portrait-frame img').forEach(function(img){
      if(img.dataset.fallbackReady==='true') return;
      img.dataset.fallbackReady='true';
      function showFallback(){
        var frame=img.closest('.portrait-frame');
        if(!frame||frame.querySelector('.portrait-fallback')) return;
        img.style.display='none';
        var fallback=document.createElement('div');
        fallback.className='portrait-fallback';
        fallback.innerHTML='<div><div class="portrait-fallback-mark">NN</div><div class="portrait-fallback-copy"><strong>Ndanji Nachangwa</strong><span>Professional portrait can be updated from the private portfolio admin.</span></div></div>';
        frame.insertBefore(fallback,frame.firstChild);
      }
      img.addEventListener('error',showFallback,{once:true});
      if(img.complete&&img.naturalWidth===0) showFallback();
    });
  }

  function addDiscreetAdminPortal(){
    if(document.querySelector('.footer-admin-portal')) return;
    var footerBottom=document.querySelector('.footer-bottom');
    if(!footerBottom) return;
    if(!document.querySelector('#footer-admin-portal-style')){
      var style=document.createElement('style');
      style.id='footer-admin-portal-style';
      style.textContent='.footer-admin-portal{display:inline-flex;align-items:center;justify-content:center;margin-left:auto;padding:2px 5px;font-size:.52rem;letter-spacing:.08em;text-transform:uppercase;color:inherit;opacity:.22;transition:opacity .2s ease,color .2s ease;white-space:nowrap}.footer-admin-portal:hover,.footer-admin-portal:focus-visible{opacity:.78;color:#d4bc8a;outline:none}.footer-admin-portal:focus-visible{box-shadow:0 0 0 1px rgba(212,188,138,.6)}@media(max-width:650px){.footer-admin-portal{font-size:.48rem;opacity:.18;padding:2px 3px}}';
      document.head.appendChild(style);
    }
    var link=document.createElement('a');
    link.className='footer-admin-portal';
    link.href='/admin.html';
    link.textContent='Portal';
    link.setAttribute('aria-label','Administrator login');
    link.setAttribute('title','Administrator login');
    footerBottom.appendChild(link);
  }

  ensureRecognitionStyles();
  ensureLaptopStyles();
  ensureCmsBlockStyles();
  ensurePremiumLayer();
  enhancePublicNavigation();
  addHomeRecognitionFeature();
  protectProfileImages();
  addDiscreetAdminPortal();

  var menu=document.querySelector('[data-menu]');
  var nav=document.querySelector('[data-nav]');
  if(menu&&nav){
    menu.setAttribute('aria-expanded','false');
    menu.addEventListener('click',function(){
      var open=nav.classList.toggle('open');
      menu.setAttribute('aria-expanded',String(open));
    });
    nav.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false')})});
  }

  function bytesFromBase64(b64){
    b64=b64.replace(/[^A-Za-z0-9+/=]/g,'');
    var pad=(4-b64.length%4)%4;b64+='='.repeat(pad);
    var bin=atob(b64),bytes=new Uint8Array(bin.length);
    for(var i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
    return bytes;
  }
  document.querySelectorAll('.recovered-art[data-source]').forEach(async function(box){
    try{
      var r=await fetch(box.dataset.source,{cache:'no-store'});
      if(!r.ok)throw new Error('HTTP '+r.status);
      var text=await r.text(),marker='base64,',start=text.indexOf(marker);
      if(start<0)throw new Error('No embedded image');
      var payload=text.slice(start+marker.length),end=payload.lastIndexOf('"');
      if(end>0)payload=payload.slice(0,end);
      var bytes=bytesFromBase64(payload);
      if(bytes[0]!==255||bytes[1]!==216)throw new Error('Invalid JPEG');
      var url=URL.createObjectURL(new Blob([bytes],{type:'image/jpeg'}));
      var img=new Image();
      img.alt=box.dataset.alt||'Portfolio image';
      img.onload=function(){box.textContent='';box.appendChild(img)};
      img.onerror=function(){box.textContent='Image unavailable'};
      img.src=url;
    }catch(e){console.error('Artwork recovery failed',e);box.textContent='Image unavailable'}
  });
})();
