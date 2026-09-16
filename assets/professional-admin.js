(function(){
  const $=(s)=>document.querySelector(s);
  const esc=(s)=>String(s||'').replace(/[&<>"']/g,(c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pageOptions=[
    ['projects','Projects / Case Studies'],
    ['speaking','Speaking & Public Engagement'],
    ['recommendations','Recommendations & References'],
    ['northmead','Case Study — Northmead STEAM'],
    ['technovation','Case Study — Technovation Girls'],
    ['remp','Case Study — REMP']
  ];

  function addPageOptions(){
    const select=$('#pageSelect');
    if(!select)return;
    pageOptions.forEach(([value,label])=>{
      if(select.querySelector(`option[value="${value}"]`))return;
      const option=document.createElement('option');option.value=value;option.textContent=label;select.appendChild(option);
    });
  }

  function init(){
    if($('#section-professional-profile')){addPageOptions();return;}
    const side=$('.sidebar'),workspace=$('.workspace');
    if(!side||!workspace){setTimeout(init,180);return;}
    addPageOptions();

    const nav=document.createElement('button');
    nav.className='nav-btn';
    nav.dataset.section='professional-profile';
    nav.innerHTML='<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/></svg>CV & Public Profile';
    const security=side.querySelector('[data-section="security"]');
    if(security)security.insertAdjacentElement('beforebegin',nav);else side.querySelector('.nav-group')?.appendChild(nav);

    const section=document.createElement('section');
    section.className='section';section.id='section-professional-profile';
    section.innerHTML=`
      <div class="grid-2">
        <div class="panel">
          <div class="panel-head"><div><div class="eyebrow">Professional assets</div><h2>CV Manager</h2><p class="small">Upload a PDF once. The CV is stored with the public portfolio so it opens reliably on phones and laptops.</p></div><span class="badge ok">GitHub + Vercel</span></div>
          <div class="field"><label for="profCvFile">CV / résumé PDF</label><input id="profCvFile" type="file" accept="application/pdf,.pdf"></div>
          <div class="notice" style="margin-top:10px">For reliable public delivery, keep the PDF below 3 MB. Re-upload the CV once if an older Cloudinary CV link does not open.</div>
          <div class="actions" style="margin-top:12px"><button class="btn gold" id="profCvUpload">Upload & make public</button><a class="btn light hidden" id="profCvOpen" target="_blank" rel="noopener">Open current CV</a><button class="btn danger" id="profCvRemove" type="button">Remove public CV</button></div>
          <div class="field" style="margin-top:14px"><label for="profCvUrl">Current CV URL</label><input id="profCvUrl" type="text" placeholder="No public CV uploaded yet"></div>
          <div class="field"><label for="profCvLabel">Public button label</label><input id="profCvLabel" type="text" value="Download CV"></div>
          <div class="msg" id="profCvMsg"></div>
        </div>
        <div class="panel">
          <div class="panel-head"><div><div class="eyebrow">Public profile links</div><h2>Professional identity</h2><p class="small">These details power the site-wide LinkedIn follow button, availability notice and professional contact metadata.</p></div><span class="badge">Site-wide</span></div>
          <div class="field"><label for="profLinkedIn">LinkedIn profile</label><input id="profLinkedIn" type="url" placeholder="https://www.linkedin.com/in/..."></div>
          <div class="field"><label for="profAvailability">Availability statement</label><textarea id="profAvailability" maxlength="240"></textarea></div>
          <div class="field"><label for="profEmail">Professional email</label><input id="profEmail" type="email"></div>
          <div class="field"><label for="profPhoneDisplay">Public phone display</label><input id="profPhoneDisplay" type="text"></div>
          <div class="field"><label for="profPhoneIntl">International phone value</label><input id="profPhoneIntl" type="text" placeholder="+260..."></div>
          <div class="actions" style="margin-top:14px"><button class="btn" id="profSave">Save public profile</button><a class="btn light" id="profLinkedInOpen" target="_blank" rel="noopener">Open LinkedIn</a></div>
          <div class="msg" id="profMsg"></div>
        </div>
      </div>
      <div class="panel"><div class="eyebrow">New portfolio sections</div><h3 style="margin-top:8px">Case studies, speaking and recommendations are now editable.</h3><p class="small">They have been added to the Page to manage selector. Use the normal Content, Media, Preview, SEO and Version History tools for those pages exactly as you do for the existing portfolio pages.</p></div>`;
    $('#section-security')?.insertAdjacentElement('beforebegin',section) || workspace.appendChild(section);

    const style=document.createElement('style');style.textContent='#section-professional-profile input[type=file]{background:#fff}.prof-saving{opacity:.65;pointer-events:none}';document.head.appendChild(style);

    let config={};
    const msg=(id,text,type='')=>{const el=$(id);if(!el)return;el.textContent=text||'';el.className='msg'+(type?' '+type:'')};
    function readForm(){return{
      linkedinUrl:$('#profLinkedIn').value.trim(),cvUrl:$('#profCvUrl').value.trim(),cvLabel:$('#profCvLabel').value.trim()||'Download CV',availability:$('#profAvailability').value.trim(),email:$('#profEmail').value.trim(),phoneDisplay:$('#profPhoneDisplay').value.trim(),phoneInternational:$('#profPhoneIntl').value.trim()
    }}
    function fill(c){config=c||{};$('#profLinkedIn').value=c.linkedinUrl||'';$('#profCvUrl').value=c.cvUrl||'';$('#profCvLabel').value=c.cvLabel||'Download CV';$('#profAvailability').value=c.availability||'';$('#profEmail').value=c.email||'';$('#profPhoneDisplay').value=c.phoneDisplay||'';$('#profPhoneIntl').value=c.phoneInternational||'';syncLinks();}
    function syncLinks(){const cv=$('#profCvUrl').value.trim(),li=$('#profLinkedIn').value.trim();const open=$('#profCvOpen');if(cv){open.href=cv;open.classList.remove('hidden')}else{open.removeAttribute('href');open.classList.add('hidden')}const l=$('#profLinkedInOpen');if(li)l.href=li;else l.removeAttribute('href');}
    async function load(){msg('#profMsg','Loading public profile…');try{const r=await fetch('/api/portfolio-config',{cache:'no-store'}),d=await r.json();if(r.status===401)return;if(!r.ok)throw new Error(d.error||'Unable to load profile configuration.');fill(d.config||{});msg('#profMsg','Public profile settings loaded.','ok')}catch(e){msg('#profMsg',e.message,'error')}}
    async function save(overrides={},messageTarget='#profMsg'){const payload={...readForm(),...overrides};msg(messageTarget,'Saving and preparing deployment…');try{const r=await fetch('/api/portfolio-config',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}),d=await r.json();if(!r.ok)throw new Error(d.error||'Unable to save public profile.');fill(d.config||payload);const suffix=d.deployment?.triggered?' Public deployment triggered.':' GitHub updated; Git-connected Vercel deployment should follow.';msg(messageTarget,'Saved.'+suffix,'ok');return d.config||payload}catch(e){msg(messageTarget,e.message,'error');throw e}}

    function fileToBase64(file){
      return new Promise((resolve,reject)=>{
        const reader=new FileReader();
        reader.onload=()=>{const value=String(reader.result||'');resolve(value.includes(',')?value.split(',').pop():value)};
        reader.onerror=()=>reject(new Error('Unable to read the selected PDF.'));
        reader.readAsDataURL(file);
      });
    }

    $('#profSave').onclick=()=>save();
    $('#profCvUrl').addEventListener('input',syncLinks);$('#profLinkedIn').addEventListener('input',syncLinks);
    $('#profCvRemove').onclick=async()=>{if(!$('#profCvUrl').value.trim())return msg('#profCvMsg','There is no public CV to remove.','warn');if(!confirm('Remove the Download CV button from the public portfolio? The stored PDF will remain in the repository.'))return;$('#profCvUrl').value='';syncLinks();try{await save({cvUrl:''},'#profCvMsg')}catch{}};
    $('#profCvUpload').onclick=async()=>{
      const file=$('#profCvFile').files?.[0];
      if(!file)return msg('#profCvMsg','Choose a PDF first.','error');
      if(file.type!=='application/pdf'&&!/\.pdf$/i.test(file.name))return msg('#profCvMsg','Please choose a PDF CV.','error');
      if(file.size>3*1024*1024)return msg('#profCvMsg','Please keep the CV PDF below 3 MB.','error');
      const b=$('#profCvUpload');b.disabled=true;msg('#profCvMsg','Uploading CV to the public portfolio…');
      try{
        const dataBase64=await fileToBase64(file);
        const r=await fetch('/api/cv-upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({dataBase64,fileName:file.name})});
        const d=await r.json();
        if(!r.ok)throw new Error(d.error||'CV upload failed.');
        $('#profCvUrl').value=d.cvUrl;
        syncLinks();
        await save({cvUrl:d.cvUrl},'#profCvMsg');
        $('#profCvFile').value='';
        msg('#profCvMsg','CV uploaded successfully. After the Vercel deployment finishes, Open current CV and Download CV will use the new public PDF.','ok');
      }catch(e){msg('#profCvMsg',e.message||'CV upload failed.','error')}finally{b.disabled=false}
    };

    nav.onclick=()=>{document.querySelectorAll('[data-section]').forEach(b=>b.classList.toggle('active',b===nav));document.querySelectorAll('.workspace > .section').forEach(s=>s.classList.toggle('active',s===section));load();};
    load();
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
