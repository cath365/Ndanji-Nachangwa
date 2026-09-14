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
    fit.href='/assets/laptop-fit.css?v=2';
    fit.setAttribute('data-laptop-fit','true');
    document.head.appendChild(fit);
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

  ensureRecognitionStyles();
  ensureLaptopStyles();
  enhancePublicNavigation();
  addHomeRecognitionFeature();

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
