(function(){
  const DEFAULT_LINKEDIN='https://zm.linkedin.com/in/ndanji-nachangwa-59468321a';

  function ensureSuiteStyles(){
    if(document.querySelector('link[data-professional-suite]'))return;
    var link=document.createElement('link');link.rel='stylesheet';link.href='/assets/professional-suite.css?v=1';link.dataset.professionalSuite='true';document.head.appendChild(link);
  }

  function ensureNavLink(nav,href,label,beforeHref){
    if(nav.querySelector('a[href="'+href+'"]'))return;
    var a=document.createElement('a');a.href=href;a.textContent=label;
    var before=beforeHref?nav.querySelector('a[href="'+beforeHref+'"]'):null;
    if(before)nav.insertBefore(a,before);else nav.appendChild(a);
  }

  function enhanceNavigation(){
    document.querySelectorAll('[data-nav]').forEach(function(nav){
      ensureNavLink(nav,'/projects.html','Projects','/engagements.html');
      var path=(location.pathname||'/').replace(/\/$/,'')||'/';
      var projectCase=path.indexOf('/case-study-')===0;
      nav.querySelectorAll('a[href]').forEach(function(a){var href=(a.getAttribute('href')||'').replace(/\/$/,'')||'/';a.classList.toggle('active',href===path||(projectCase&&href==='/projects.html'))});
    });
  }

  function addFooterRecordLinks(){
    document.querySelectorAll('.footer-links').forEach(function(group){
      if(group.querySelector('a[href="/impact.html"]')&&!group.querySelector('a[href="/projects.html"]')){
        var p=document.createElement('a');p.href='/projects.html';p.textContent='Projects & Case Studies';group.appendChild(p);
      }
      if(group.querySelector('a[href="/insights.html"]')){
        if(!group.querySelector('a[href="/speaking.html"]')){var s=document.createElement('a');s.href='/speaking.html';s.textContent='Speaking & Public Engagement';group.appendChild(s)}
        if(!group.querySelector('a[href="/recommendations.html"]')){var r=document.createElement('a');r.href='/recommendations.html';r.textContent='Recommendations & References';group.appendChild(r)}
      }
    });
  }

  function setLinkedInLabels(url){
    document.querySelectorAll('a[href*="linkedin.com"]').forEach(function(a){
      if(/linkedin/i.test(a.textContent||''))a.textContent='Follow on LinkedIn';
      a.href=url||DEFAULT_LINKEDIN;a.target='_blank';a.rel='noopener';
    });
  }

  function addHomeActions(config){
    var path=(location.pathname||'/').toLowerCase();if(!(path==='/'||path.endsWith('/index.html')))return;
    var actions=document.querySelector('.hero-copy .actions');if(!actions)return;
    if(!actions.querySelector('[data-prof-linkedin]')){var li=document.createElement('a');li.className='btn secondary';li.href=config.linkedinUrl||DEFAULT_LINKEDIN;li.target='_blank';li.rel='noopener';li.textContent='Follow on LinkedIn';li.dataset.profLinkedin='true';actions.appendChild(li)}
    if(config.cvUrl&&!actions.querySelector('[data-prof-cv]')){var cv=document.createElement('a');cv.className='btn secondary';cv.href=config.cvUrl;cv.target='_blank';cv.rel='noopener';cv.textContent=config.cvLabel||'Download CV';cv.dataset.profCv='true';actions.appendChild(cv)}
    if(config.availability&&!document.querySelector('.hero-copy .availability-chip')){var chip=document.createElement('div');chip.className='availability-chip';chip.textContent=config.availability;actions.insertAdjacentElement('afterend',chip)}
  }

  function addProfessionalStrip(config){
    var footer=document.querySelector('.footer'),bottom=footer&&footer.querySelector('.footer-bottom');if(!footer||!bottom||footer.querySelector('.professional-action-strip'))return;
    var strip=document.createElement('div');strip.className='professional-action-strip';
    var cv=config.cvUrl?'<a class="primary" href="'+escapeAttr(config.cvUrl)+'" target="_blank" rel="noopener">'+escapeHtml(config.cvLabel||'Download CV')+'</a>':'<a class="primary" href="/contact.html">Request CV</a>';
    strip.innerHTML='<div class="professional-action-copy"><strong>Professional engagement</strong><span>'+escapeHtml(config.availability||'Available for selected professional engagements.')+'</span></div><div class="professional-action-buttons">'+cv+'<a class="secondary" href="'+escapeAttr(config.linkedinUrl||DEFAULT_LINKEDIN)+'" target="_blank" rel="noopener">Follow on LinkedIn</a><a class="secondary" href="mailto:'+escapeAttr(config.email||'ndanjizoe@gmail.com')+'">Email Ndanji</a></div>';
    footer.insertBefore(strip,bottom);
  }

  function escapeHtml(value){return String(value||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function escapeAttr(value){return escapeHtml(value).replace(/`/g,'&#96;')}

  function addStructuredData(config){
    if(document.querySelector('script[data-person-schema]'))return;
    var data={
      '@context':'https://schema.org','@type':'Person',name:'Ndanji Nachangwa',url:location.origin+'/',jobTitle:'Aeronautical Engineer, Innovation Leader and STEM Advocate',address:{'@type':'PostalAddress',addressRegion:'Lusaka Province',addressCountry:'ZM'},sameAs:[config.linkedinUrl||DEFAULT_LINKEDIN],email:'mailto:'+(config.email||'ndanjizoe@gmail.com'),telephone:config.phoneInternational||'+260973006049'
    };
    var script=document.createElement('script');script.type='application/ld+json';script.dataset.personSchema='true';script.textContent=JSON.stringify(data);document.head.appendChild(script);
  }

  async function loadProfessionalProfile(){
    ensureSuiteStyles();enhanceNavigation();addFooterRecordLinks();
    var config={linkedinUrl:DEFAULT_LINKEDIN,cvUrl:'',cvLabel:'Download CV',availability:'Available for selected speaking, STEM, engineering and partnership engagements.',email:'ndanjizoe@gmail.com',phoneInternational:'+260973006049'};
    try{var response=await fetch('/assets/portfolio-config.json?ts='+Date.now(),{cache:'no-store'});if(response.ok)config=Object.assign(config,await response.json())}catch(e){}
    setLinkedInLabels(config.linkedinUrl||DEFAULT_LINKEDIN);addHomeActions(config);addProfessionalStrip(config);addStructuredData(config);
  }

  function init(){
    var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var mast=document.querySelector('.masthead');
    function syncHeader(){if(mast)mast.classList.toggle('is-scrolled',window.scrollY>18)}
    syncHeader();window.addEventListener('scroll',syncHeader,{passive:true});

    var targets=[...document.querySelectorAll('.section-head,.dossier,.case-row,.visual-card,.publication,.principle,.engagement,.timeline-item,.credential,.distinction,.protocol,.record-line,.ledger-item,.recognition-home-grid,.cms-added-block,.case-study-card,.reference-card,.speaking-card')];
    targets.forEach(function(el,i){el.classList.add('premium-reveal');el.dataset.delay=String(i%4)});
    if(!reduce&&'IntersectionObserver'in window){
      document.documentElement.classList.add('reveal-ready');
      var io=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target)}})},{threshold:.08,rootMargin:'0px 0px -5% 0px'});
      targets.forEach(function(el){io.observe(el)});
    }else targets.forEach(function(el){el.classList.add('is-visible')});

    var top=document.createElement('button');top.type='button';top.className='back-to-top';top.setAttribute('aria-label','Back to top');top.textContent='↑';document.body.appendChild(top);
    function syncTop(){top.classList.toggle('show',window.scrollY>700)}syncTop();window.addEventListener('scroll',syncTop,{passive:true});top.addEventListener('click',function(){window.scrollTo({top:0,behavior:reduce?'auto':'smooth'})});

    document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var id=a.getAttribute('href');if(!id||id==='#')return;var el=document.querySelector(id);if(!el)return;e.preventDefault();el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})})});
    loadProfessionalProfile();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
