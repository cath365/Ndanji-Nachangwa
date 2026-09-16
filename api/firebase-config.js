export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = String(process.env.FIREBASE_API_KEY || '').trim();
  if (!apiKey) {
    return res.status(500).json({
      configured: false,
      error: 'FIREBASE_API_KEY is not configured for this deployment.'
    });
  }

  // Firebase Web API keys are public project identifiers. The sensitive admin
  // session and authorization checks remain server-side.
  return res.status(200).json({
    configured: true,
    apiKey
  });
}
