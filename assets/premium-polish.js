(function(){
  function init(){
    var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var mast=document.querySelector('.masthead');
    function syncHeader(){if(mast)mast.classList.toggle('is-scrolled',window.scrollY>18)}
    syncHeader();window.addEventListener('scroll',syncHeader,{passive:true});

    var targets=[...document.querySelectorAll('.section-head,.dossier,.case-row,.visual-card,.publication,.principle,.engagement,.timeline-item,.credential,.distinction,.protocol,.record-line,.ledger-item,.recognition-home-grid,.cms-added-block')];
    targets.forEach(function(el,i){el.classList.add('premium-reveal');el.dataset.delay=String(i%4)});
    if(!reduce&&'IntersectionObserver'in window){
      document.documentElement.classList.add('reveal-ready');
      var io=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target)}})},{threshold:.08,rootMargin:'0px 0px -5% 0px'});
      targets.forEach(function(el){io.observe(el)});
    }else targets.forEach(function(el){el.classList.add('is-visible')});

    var top=document.createElement('button');top.type='button';top.className='back-to-top';top.setAttribute('aria-label','Back to top');top.textContent='↑';document.body.appendChild(top);
    function syncTop(){top.classList.toggle('show',window.scrollY>700)}syncTop();window.addEventListener('scroll',syncTop,{passive:true});top.addEventListener('click',function(){window.scrollTo({top:0,behavior:reduce?'auto':'smooth'})});

    document.querySelectorAll('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var id=a.getAttribute('href');if(!id||id==='#')return;var el=document.querySelector(id);if(!el)return;e.preventDefault();el.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'})})});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
