async function getUploadConfig(){
  const s=await fetch('/api/cloudinary-sign',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}',cache:'no-store'});
  if(!s.ok)throw new Error('Unable to prepare Cloudinary upload: '+await s.text());
  return s.json();
}

async function signedUpload(file,resourceType='image'){
  const c=await getUploadConfig(),f=new FormData();
  f.append('file',file);f.append('api_key',c.apiKey);f.append('timestamp',String(c.timestamp));f.append('folder',c.folder);f.append('overwrite',String(c.overwrite));f.append('signature',c.signature);
  const endpoint=resourceType==='image'?'image':'auto';
  const r=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(c.cloudName)}/${endpoint}/upload`,{method:'POST',body:f,cache:'no-store'});
  if(!r.ok)throw new Error('Cloudinary upload failed: '+await r.text());
  const x=await r.json();
  return{publicId:x.public_id,secureUrl:x.secure_url,width:x.width||null,height:x.height||null,duration:x.duration||null,format:x.format||'',bytes:x.bytes||file.size,resourceType:x.resource_type||resourceType,mimeType:file.type||'',originalName:file.name||'',createdAt:x.created_at||new Date().toISOString()};
}

export async function uploadImageToCloudinary(file){
  if(!(file instanceof File))throw new TypeError('A valid image File is required.');
  if(!file.type.startsWith('image/'))throw new TypeError('Only image uploads are allowed here.');
  return signedUpload(file,'image');
}

export async function uploadAssetToCloudinary(file){
  if(!(file instanceof File))throw new TypeError('A valid File is required.');
  const type=String(file.type||'').toLowerCase();
  const allowed=type.startsWith('image/')||type.startsWith('video/')||[
    'application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','text/plain'
  ].includes(type);
  if(!allowed)throw new TypeError('Supported uploads are images, videos, PDFs, Word, PowerPoint, Excel and text files.');
  if(file.size>50*1024*1024)throw new TypeError('Please keep each uploaded file below 50 MB.');
  return signedUpload(file,type.startsWith('image/')?'image':'auto');
}

if(typeof window!=='undefined'){
  window.__ndanjiUploadImage=uploadImageToCloudinary;
  window.__ndanjiUploadAsset=uploadAssetToCloudinary;
  const path=(window.location.pathname||'').toLowerCase();
  if(path.endsWith('/admin.html')||path==='/admin'){
    const v='20260916-2';
    import(`/assets/login-hotfix.js?v=${v}`).catch(()=>{});
    import(`/assets/section-builder.js?v=${v}`).catch(()=>{});
    import(`/assets/work-gallery-admin.js?v=${v}`).catch(()=>{});
    import(`/assets/admin-power-safe.js?v=${v}`).catch(()=>{});
    import(`/assets/admin-extras.js?v=${v}`).catch(()=>{});
  }
}
