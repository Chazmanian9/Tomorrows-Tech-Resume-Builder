// Vercel serverless function — stores subscriber emails in Supabase
// POST /api/subscribe  { email: "user@example.com" }

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { email } = req.body || {};

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
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
    const response = await fetch(`${supabaseUrl}/rest/v1/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({ email: email.toLowerCase().trim() })
    });

    if (!response.ok) {
      if (response.status === 409) {
        return res.status(200).json({ success: true, message: "You're already subscribed!" });
      }
      const errText = await response.text();
      console.error('Supabase error:', errText);
      return res.status(500).json({ error: 'Could not save your email. Please try again.' });
    }

    return res.status(200).json({ success: true, message: "You're subscribed! 🎉" });
  } catch (err) {
    console.error('Subscribe error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
