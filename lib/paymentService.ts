
import { User } from '../types';

export const initiateCheckout = async (productId: string, user: User | null, quantity: number = 1) => {
  try {
    const response = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        productId,
        quantity,
        email: user?.email || 'guest@example.com',
        name: user?.name || 'Guest User'
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Payment API Error Details:", data);
      throw new Error(data.error || data.details || 'Failed to initiate checkout');
    }

    if (data.url) {
      window.location.href = data.url;
    } else {
      console.error("Missing URL in successful response:", data);
      throw new Error('No checkout URL received in response');
    }
  } catch (error: any) {
    console.error('Checkout error:', error);
    alert(`Payment initialization failed: ${error.message}`);
    throw error;
  }
};
