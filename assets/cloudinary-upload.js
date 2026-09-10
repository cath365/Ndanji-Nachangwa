export async function uploadImageToCloudinary(file) {
  if (!(file instanceof File)) {
    throw new TypeError('A valid image File is required.');
  }

  if (!file.type.startsWith('image/')) {
    throw new TypeError('Only image uploads are allowed.');
  }

  const signResponse = await fetch('/api/cloudinary-sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}'
  });

  if (!signResponse.ok) {
    const message = await signResponse.text();
    throw new Error(`Unable to prepare Cloudinary upload: ${message}`);
  }

  const config = await signResponse.json();
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', config.apiKey);
  form.append('timestamp', String(config.timestamp));
  form.append('folder', config.folder);
  form.append('overwrite', String(config.overwrite));
  form.append('signature', config.signature);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(config.cloudName)}/image/upload`,
    { method: 'POST', body: form }
  );

  if (!uploadResponse.ok) {
    const message = await uploadResponse.text();
    throw new Error(`Cloudinary image upload failed: ${message}`);
  }

  const result = await uploadResponse.json();
  return {
    publicId: result.public_id,
    secureUrl: result.secure_url,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes
  };
}
