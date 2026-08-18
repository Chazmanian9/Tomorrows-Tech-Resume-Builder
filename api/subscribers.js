// Vercel serverless function — fetches all subscriber emails (admin only)
// GET /api/subscribers  with ?password=xxx

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const password = req.query.password;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    return res.status(500).json({ error: 'Admin password not configured.' });
  }

  if (password !== adminPassword) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ 
      error: 'Server configuration error.',
      debug: {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
        urlStartsWith: supabaseUrl ? supabaseUrl.substring(0, 8) : 'MISSING',
        keyStartsWith: supabaseKey ? supabaseKey.substring(0, 10) : 'MISSING'
      }
    });
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/subscribers?select=email,created_at&order=created_at.desc`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });

    if (!response.ok) {
      return res.status(500).json({ error: 'Could not fetch subscribers.' });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, count: data.length, subscribers: data });
  } catch (err) {
    console.error('Fetch error:', err);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
}
