(function(){
  const $=s=>document.querySelector(s);
  const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const txt=v=>String(v||'').trim();
  const validUrl=v=>/^(https?:\/\/|\/|#)/i.test(txt(v))?txt(v):'';
  const id=()=>`work-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;

  function init(){
    const side=$('.sidebar'), workspace=$('.workspace'), adv=$('#advancedHtml'), apply=$('#applyAdvancedBtn');
    if(!side||!workspace||!adv||!apply||$('#section-work-gallery')) return;

    const nav=document.createElement('button');
    nav.className='nav-btn';
    nav.dataset.section='work-gallery';
    nav.innerHTML='<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 15-5-5L5 20"/></svg>Work Gallery';
    const anchor=side.querySelector('[data-section="content"]');
    anchor?.insertAdjacentElement('afterend',nav);

    const sec=document.createElement('section');
    sec.id='section-work-gallery';
    sec.className='section';
    sec.innerHTML=`
      <div class="grid-2">
        <div class="panel">
          <div class="panel-head">
            <div>
              <div class="eyebrow">Homepage visual record</div>
              <h2>Work that can be seen.</h2>
              <p class="small">Add a new project, outreach activity, field record or mentorship feature directly to the visual gallery on the public homepage.</p>
            </div>
            <span class="badge ok">Cloudinary enabled</span>
          </div>
          <div id="wgHomeNotice" class="notice blue"></div>
          <div class="wg-form">
            <div class="field"><label>Image</label><input id="wgFile" type="file" accept="image/*"></div>
            <div class="actions"><button class="btn light" id="wgUpload">Upload image</button><button class="btn light" id="wgClear">Clear form</button></div>
            <div class="field"><label>Image URL</label><input id="wgImage" placeholder="Uploaded Cloudinary URL appears here"></div>
            <div class="field"><label>Image description / alt text</label><input id="wgAlt" placeholder="Describe what is shown in the image"></div>
            <div class="field"><label>Optional label</label><input id="wgLabel" placeholder="Robotics outreach • 2026"></div>
            <div class="field"><label>Feature title</label><input id="wgTitle" placeholder="Project or activity name"></div>
            <div class="field"><label>Description</label><textarea id="wgBody" placeholder="Explain what happened, the role, and the value or outcome."></textarea></div>
            <div class="wg-two"><div class="field"><label>Optional link label</label><input id="wgLinkText" placeholder="View programme"></div><div class="field"><label>Optional link URL</label><input id="wgLink" placeholder="https://... or /impact.html"></div></div>
            <div class="actions"><button class="btn gold" id="wgSave">Add visual record</button><button class="btn" id="wgUpdate" style="display:none">Update selected record</button></div>
            <div class="msg" id="wgMsg"></div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-head"><div><div class="eyebrow">Current gallery</div><h3>Manage visual records.</h3><p class="small">Edit text, replace an image, change the order or remove a card. Changes remain a working copy until you press Publish Changes.</p></div><button class="btn light" id="wgRefresh">Refresh</button></div>
          <div id="wgList" class="wg-list"></div>
        </div>
      </div>`;
    $('#section-content')?.insertAdjacentElement('afterend',sec);

    const style=document.createElement('style');
    style.textContent=`
      .wg-two{display:grid;grid-template-columns:1fr 1fr;gap:12px}.wg-list{display:grid;gap:10px}.wg-item{display:grid;grid-template-columns:86px minmax(0,1fr);gap:12px;padding:10px;border:1px solid var(--line);background:#fff}.wg-thumb{width:86px;height:70px;object-fit:cover;background:#eee8dc;border:1px solid var(--line)}.wg-thumb.placeholder{display:grid;place-items:center;font-size:.58rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);text-align:center;padding:6px}.wg-meta b{display:block;font-family:'Cormorant Garamond',serif;font-size:1.12rem;color:var(--navy)}.wg-meta small{display:block;color:var(--muted);line-height:1.4;margin:2px 0 8px}.wg-actions{display:flex;gap:5px;flex-wrap:wrap}.wg-actions .btn{min-height:30px;padding:6px 8px;font-size:.55rem}.wg-selected{outline:2px solid var(--gold)}@media(max-width:760px){.wg-two{grid-template-columns:1fr}.wg-item{grid-template-columns:70px 1fr}.wg-thumb{width:70px;height:62px}}`;
    document.head.appendChild(style);

    let selectedIndex=null, file=null;
    const message=(t,c='')=>{const e=$('#wgMsg');e.textContent=t||'';e.className='msg'+(c?' '+c:'')};
    const parse=()=>adv.value.trim()?new DOMParser().parseFromString(adv.value,'text/html'):null;
    const findSection=d=>{
      const byId=d.querySelector('#work-seen');
      if(byId) return byId;
      return [...d.querySelectorAll('section')].find(s=>/work that can be seen\.?/i.test(txt(s.querySelector('h2')?.textContent)))||null;
    };
    const findGrid=d=>findSection(d)?.querySelector('.image-grid')||null;
    const saveDoc=(d,note)=>{
      const section=findSection(d); if(section&&!section.id)section.id='work-seen';
      adv.value='<!doctype html>\n'+d.documentElement.outerHTML;
      apply.click();
      message(note||'Updated working copy. Preview and publish when ready.','ok');
      setTimeout(refresh,120);
    };
    const imageInfo=card=>{
      const im=card.querySelector('.visual img');
      if(im) return {src:im.getAttribute('src')||'',alt:im.getAttribute('alt')||''};
      const legacy=card.querySelector('.recovered-art');
      return {src:legacy?.dataset.source||'',alt:legacy?.dataset.alt||''};
    };
    const cards=d=>[...(findGrid(d)?.querySelectorAll(':scope > .visual-card')||[])];
    const ensureWorkId=(card,i)=>{if(!card.dataset.workId)card.dataset.workId=`work-existing-${i+1}`;return card.dataset.workId};

    function clearForm(){
      selectedIndex=null;file=null;
      ['wgFile','wgImage','wgAlt','wgLabel','wgTitle','wgBody','wgLinkText','wgLink'].forEach(x=>{const e=$('#'+x);if(e)e.value=''});
      $('#wgSave').style.display='inline-flex';$('#wgUpdate').style.display='none';
      message('');refresh();
    }

    function fillFrom(index){
      const d=parse(),list=cards(d),card=list[index]; if(!card)return;
      selectedIndex=index;
      const info=imageInfo(card),copy=card.querySelector('.visual-copy');
      $('#wgImage').value=info.src||'';$('#wgAlt').value=info.alt||'';
      $('#wgLabel').value=txt(copy?.querySelector('.eyebrow')?.textContent);
      $('#wgTitle').value=txt(copy?.querySelector('h3')?.textContent);
      $('#wgBody').value=txt(copy?.querySelector('p')?.textContent);
      const a=copy?.querySelector('a');$('#wgLinkText').value=txt(a?.textContent);$('#wgLink').value=a?.getAttribute('href')||'';
      $('#wgSave').style.display='none';$('#wgUpdate').style.display='inline-flex';
      message('Editing selected visual record. Upload a new image only if you want to replace the current one.','warn');refresh();
    }

    function buildCard(d){
      const image=validUrl($('#wgImage').value),title=txt($('#wgTitle').value),body=txt($('#wgBody').value),alt=txt($('#wgAlt').value)||title||'Portfolio visual record';
      if(!image)throw new Error('Upload an image first.'); if(!title)throw new Error('Enter a feature title.');
      const card=d.createElement('article');card.className='visual-card cms-added-block';card.dataset.cmsAdded='true';card.dataset.cmsType='visual-record';card.dataset.cmsId='cms-visual-'+id();card.dataset.workId=id();
      const visual=d.createElement('div');visual.className='visual';const img=d.createElement('img');img.className='cms-replaced-art';img.src=image;img.alt=alt;img.loading='lazy';visual.appendChild(img);card.appendChild(visual);
      const copy=d.createElement('div');copy.className='visual-copy';
      const label=txt($('#wgLabel').value);if(label){const e=d.createElement('div');e.className='eyebrow';e.textContent=label;copy.appendChild(e)}
      const h=d.createElement('h3');h.textContent=title;copy.appendChild(h);if(body){const p=d.createElement('p');p.textContent=body;copy.appendChild(p)}
      const url=validUrl($('#wgLink').value),lt=txt($('#wgLinkText').value);if(url&&lt){const a=d.createElement('a');a.className='case-link';a.href=url;a.textContent=lt;if(/^https?:\/\//i.test(url)){a.target='_blank';a.rel='noopener'}copy.appendChild(a)}
      card.appendChild(copy);return card;
    }

    function updateCard(){
      try{
        if(selectedIndex===null)throw new Error('Select a gallery record to edit.');
        const d=parse(),list=cards(d),card=list[selectedIndex];if(!card)throw new Error('Selected record was not found. Refresh and try again.');
        ensureWorkId(card,selectedIndex);
        const title=txt($('#wgTitle').value);if(!title)throw new Error('Enter a feature title.');
        const copy=card.querySelector('.visual-copy')||d.createElement('div');copy.className='visual-copy';copy.innerHTML='';
        const label=txt($('#wgLabel').value);if(label){const e=d.createElement('div');e.className='eyebrow';e.textContent=label;copy.appendChild(e)}
        const h=d.createElement('h3');h.textContent=title;copy.appendChild(h);
        const body=txt($('#wgBody').value);if(body){const p=d.createElement('p');p.textContent=body;copy.appendChild(p)}
        const url=validUrl($('#wgLink').value),lt=txt($('#wgLinkText').value);if(url&&lt){const a=d.createElement('a');a.className='case-link';a.href=url;a.textContent=lt;if(/^https?:\/\//i.test(url)){a.target='_blank';a.rel='noopener'}copy.appendChild(a)}
        if(!card.querySelector('.visual-copy'))card.appendChild(copy);
        const image=validUrl($('#wgImage').value),alt=txt($('#wgAlt').value)||title;
        if(image&&image!==imageInfo(card).src){const visual=card.querySelector('.visual')||d.createElement('div');visual.className='visual';visual.innerHTML='';const im=d.createElement('img');im.className='cms-replaced-art';im.src=image;im.alt=alt;im.loading='lazy';visual.appendChild(im);if(!card.querySelector('.visual'))card.insertBefore(visual,card.firstChild)}else{const im=card.querySelector('.visual img');if(im)im.alt=alt}
        saveDoc(d,'Visual record updated.');clearForm();
      }catch(e){message(e.message,'error')}
    }

    function move(index,dir){const d=parse(),list=cards(d),card=list[index],grid=findGrid(d);if(!card||!grid)return;if(dir<0&&card.previousElementSibling)grid.insertBefore(card,card.previousElementSibling);else if(dir>0&&card.nextElementSibling)grid.insertBefore(card.nextElementSibling,card);saveDoc(d,'Gallery order updated.')}
    function remove(index){const d=parse(),list=cards(d),card=list[index];if(!card)return;if(!confirm('Remove this visual record from the public homepage?'))return;card.remove();saveDoc(d,'Visual record removed.');clearForm()}

    function refresh(){
      const d=parse(),section=findSection(d),grid=findGrid(d),notice=$('#wgHomeNotice'),host=$('#wgList');if(!host)return;
      const page=$('#pageSelect')?.value||'';
      if(!section||!grid){notice.innerHTML=`This manager edits the <b>Work that can be seen</b> section on the Profile/Home page. ${page&&page!=='home'?'<button class="btn light" id="wgGoHome" style="margin-left:8px">Open Home page</button>':''}`;host.innerHTML='<div class="notice">The gallery is not present in the currently loaded page.</div>';$('#wgGoHome')?.addEventListener('click',()=>{const p=$('#pageSelect');if(p){p.value='home';p.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(refresh,900)}});return}
      notice.innerHTML='<b>Connected:</b> Home → Work that can be seen → image gallery. New cards are stored in the page HTML and images are stored in Cloudinary.';
      const list=cards(d);host.innerHTML='';
      list.forEach((card,i)=>{
        const info=imageInfo(card),title=txt(card.querySelector('.visual-copy h3')?.textContent)||`Visual record ${i+1}`,body=txt(card.querySelector('.visual-copy p')?.textContent);
        const row=document.createElement('div');row.className='wg-item'+(selectedIndex===i?' wg-selected':'');
        const thumb=info.src&&/^https?:\/\//i.test(info.src)?`<img class="wg-thumb" src="${esc(info.src)}" alt="">`:`<div class="wg-thumb placeholder">${info.src?'Legacy image':'No image'}</div>`;
        row.innerHTML=`${thumb}<div class="wg-meta"><b>${esc(title)}</b><small>${esc(body.slice(0,105))}${body.length>105?'…':''}</small><div class="wg-actions"><button class="btn light edit">Edit</button><button class="btn light up">←</button><button class="btn light down">→</button><button class="btn danger del">Remove</button></div></div>`;
        row.querySelector('.edit').onclick=()=>fillFrom(i);row.querySelector('.up').onclick=()=>move(i,-1);row.querySelector('.down').onclick=()=>move(i,1);row.querySelector('.del').onclick=()=>remove(i);host.appendChild(row)
      });
      if(!list.length)host.innerHTML='<div class="notice">No visual records yet. Add the first one using the form.</div>';
    }

    $('#wgFile').onchange=e=>{file=e.target.files?.[0]||null;if(file)message(file.name+' selected. Click Upload image.','warn')};
    $('#wgUpload').onclick=async()=>{if(!file)return message('Choose an image first.','error');if(!window.__ndanjiUploadImage)return message('Cloudinary uploader is not ready. Reload the admin page.','error');const b=$('#wgUpload');b.disabled=true;message('Uploading image securely…');try{const r=await window.__ndanjiUploadImage(file);$('#wgImage').value=r.secureUrl;file=null;$('#wgFile').value='';message('Image uploaded. Add the title and description, then save the visual record.','ok')}catch(e){message(e.message,'error')}finally{b.disabled=false}};
    $('#wgSave').onclick=()=>{try{const d=parse(),grid=findGrid(d);if(!grid)throw new Error('Open the Home page first. The Work that can be seen gallery was not found.');grid.appendChild(buildCard(d));saveDoc(d,'New visual record added to Work that can be seen.');clearForm()}catch(e){message(e.message,'error')}};
    $('#wgUpdate').onclick=updateCard;$('#wgClear').onclick=clearForm;$('#wgRefresh').onclick=refresh;
    nav.onclick=()=>{document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b===nav));document.querySelectorAll('.workspace > .section').forEach(s=>s.classList.toggle('active',s.id==='section-work-gallery'));setTimeout(refresh,50)};
    $('#pageSelect')?.addEventListener('change',()=>{selectedIndex=null;setTimeout(refresh,900)});
    setTimeout(refresh,650);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,200));else setTimeout(init,200);
})();
