(function(){
  var menu=document.querySelector('[data-menu]');
  var nav=document.querySelector('[data-nav]');
  if(menu&&nav){
    menu.addEventListener('click',function(){nav.classList.toggle('open')});
    nav.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('open')})});
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