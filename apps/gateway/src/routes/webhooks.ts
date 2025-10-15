import { Hono } from 'hono';
import { addCredits } from '../lib/metering';

export const webhooks = new Hono();

/**
 * Stripe webhook handler for checkout.session.completed events.
 * Expects metadata: { apiKey: string, credits: number }
 */
webhooks.post('/webhooks/stripe', async (c) => {
  const sig = c.req.header('stripe-signature');
  const secret = (c.env as any).STRIPE_WEBHOOK_SECRET;
  
  // Basic signature check
  if (!sig) {
    return c.json({ error: 'No signature provided' }, 400);
  }

  // TODO: Implement proper Stripe signature verification using crypto.subtle
  // For now, we do basic validation but accept the webhook
  // In production, you should verify the signature against the raw body
  // using the Stripe webhook secret and the stripe-signature header
  
  try {
    const event = await c.req.json();
    
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const apiKey = session.metadata?.apiKey;
      const credits = Number(session.metadata?.credits || 0);
      
      if (!apiKey) {
        console.error('Stripe webhook: missing apiKey in metadata');
        return c.json({ error: 'Missing apiKey in session metadata' }, 400);
      }
      
      if (credits <= 0) {
        console.error('Stripe webhook: invalid credits amount', credits);
        return c.json({ error: 'Invalid credits amount' }, 400);
      }
      
      // Add credits to user account
      await addCredits(c.env as any, apiKey, credits);
      console.log(`✓ Added ${credits} credits to ${apiKey} via Stripe webhook`);
      
      return c.json({ received: true, credited: { apiKey, credits } });
    }
    
    // Other event types we don't handle yet
    console.log('Stripe webhook: unhandled event type', event.type);
    return c.json({ received: true });
    
  } catch (err: any) {
    console.error('Stripe webhook error:', err);
    return c.json({ error: 'Webhook handler failed', detail: String(err) }, 500);
  }
});

/**
 * PayPal IPN/webhook handler (basic implementation)
 * This is a placeholder - you'll need to implement proper PayPal verification
 */
webhooks.post('/webhooks/paypal', async (c) => {
  try {
    const body = await c.req.json();
    
    // TODO: Verify PayPal IPN signature
    // See: https://developer.paypal.com/docs/api-basics/notifications/ipn/
    
    // Example: Look for completed payment
    if (body.payment_status === 'Completed') {
      const apiKey = body.custom; // Pass API key in 'custom' field
      const amount = Number(body.mc_gross || 0);
      
      // Convert amount to credits (e.g., $10 = 1000 credits at $0.01/credit)
      const usdPerCredit = Number((c.env as any).STRIPE_PRICE_USD_PER_CREDIT || 0.01);
      const credits = Math.floor(amount / usdPerCredit);
      
      if (apiKey && credits > 0) {
        await addCredits(c.env as any, apiKey, credits);
        console.log(`✓ Added ${credits} credits to ${apiKey} via PayPal webhook`);
      }
    }
    
    return c.json({ received: true });
    
  } catch (err: any) {
    console.error('PayPal webhook error:', err);
    return c.json({ error: 'Webhook handler failed', detail: String(err) }, 500);
  }
});

/**
 * Manual credit addition endpoint (for testing or admin use)
 * Should be protected with admin auth in production
 */
webhooks.post('/admin/add-credits', async (c) => {
  // TODO: Add admin authentication here
  const adminSecret = c.req.header('X-Admin-Secret');
  if (!adminSecret || adminSecret !== (c.env as any).ADMIN_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  
  try {
    const { apiKey, credits } = await c.req.json();
    
    if (!apiKey || !credits || credits <= 0) {
      return c.json({ error: 'Invalid apiKey or credits' }, 400);
    }
    
    await addCredits(c.env as any, apiKey, credits);
    console.log(`✓ Admin added ${credits} credits to ${apiKey}`);
    
    return c.json({ success: true, apiKey, credits });
    
  } catch (err: any) {
    console.error('Admin add credits error:', err);
    return c.json({ error: 'Failed to add credits', detail: String(err) }, 500);
  }
});
