export async function uploadImageToCloudinary(file){
  if(!(file instanceof File))throw new TypeError('A valid image File is required.');
  if(!file.type.startsWith('image/'))throw new TypeError('Only image uploads are allowed.');
  const s=await fetch('/api/cloudinary-sign',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  if(!s.ok)throw new Error('Unable to prepare Cloudinary upload: '+await s.text());
  const c=await s.json(),f=new FormData();
  f.append('file',file);f.append('api_key',c.apiKey);f.append('timestamp',String(c.timestamp));f.append('folder',c.folder);f.append('overwrite',String(c.overwrite));f.append('signature',c.signature);
  const r=await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(c.cloudName)}/image/upload`,{method:'POST',body:f});
  if(!r.ok)throw new Error('Cloudinary image upload failed: '+await r.text());
  const x=await r.json();return{publicId:x.public_id,secureUrl:x.secure_url,width:x.width,height:x.height,format:x.format,bytes:x.bytes};
}
if(typeof window!=='undefined'){
  window.__ndanjiUploadImage=uploadImageToCloudinary;
  import('/assets/section-builder.js').catch(()=>{});
}
