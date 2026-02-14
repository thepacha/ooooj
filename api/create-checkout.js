
export default async function handler(req, res) {
  // CORS headers to allow requests from your frontend
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { productId, quantity = 1, email, name } = req.body;

  if (!productId) {
    return res.status(400).json({ error: 'Missing product ID' });
  }

  if (!process.env.DODO_PAYMENTS_API_KEY) {
    return res.status(500).json({ error: 'Server misconfiguration: API Key missing' });
  }

  try {
    const response = await fetch('https://test.dodopayments.com/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`,
      },
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: quantity }],
        billing_address: { 
            email: email, 
            name: name || 'Valued Customer',
            country: 'US' // Default country required by some payment providers, can be dynamic
        },
        customer: { 
            email: email, 
            name: name || 'Valued Customer' 
        },
        return_url: req.headers.origin + '/dashboard?payment=success',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Dodo API Error:', errorText);
      return res.status(response.status).json({ error: 'Payment gateway error', details: errorText });
    }

    const session = await response.json();
    return res.status(200).json({ url: session.url });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
