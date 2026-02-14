
export default async function handler(req, res) {
  // CORS headers
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
    console.error("Missing DODO_PAYMENTS_API_KEY env var");
    return res.status(500).json({ error: 'Server misconfiguration: API Key missing' });
  }

  try {
    // Fallback for origin if running in a context where it's missing
    const origin = req.headers.origin || 'https://app.revuqai.com';
    const returnUrl = `${origin}/dashboard?payment=success`;

    console.log(`Creating checkout for ${email}, Product: ${productId}`);

    const response = await fetch('https://test.dodopayments.com/checkouts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DODO_PAYMENTS_API_KEY}`,
      },
      // Simplified payload matching user example exactly
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: quantity }],
        customer: { 
            email: email, 
            name: name || 'Valued Customer' 
        },
        return_url: returnUrl,
      }),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('Dodo API Error:', responseText);
      return res.status(response.status).json({ error: 'Payment gateway error', details: responseText });
    }

    let session;
    try {
        session = JSON.parse(responseText);
    } catch (e) {
        console.error("Failed to parse JSON:", responseText);
        return res.status(502).json({ error: 'Invalid JSON response from gateway', raw: responseText });
    }

    // Check for url, payment_link, or checkout_url
    const checkoutUrl = session.url || session.payment_link || session.checkout_url;

    if (!checkoutUrl) {
        console.error('Missing URL in Dodo response:', session);
        // Return the whole session for debugging on client side if needed
        return res.status(500).json({ error: 'No checkout URL received', debug: session });
    }

    return res.status(200).json({ url: checkoutUrl });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
