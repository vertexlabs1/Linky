import Stripe from 'stripe';
import { log } from '../../../lib/logger';

const stripe = new Stripe(import.meta.env.VITE_STRIPE_SECRET_KEY, {
  apiVersion: '2025-06-30.basil'
});

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const startTime = Date.now();
    
    // Test Stripe connection by fetching account details
    const account = await stripe.accounts.retrieve();
    
    const duration = Date.now() - startTime;
    
    if (!account || account.object !== 'account') {
      log.error('Stripe health check failed - invalid account response', new Error('Invalid account response'), { duration });
      
      return new Response(JSON.stringify({
        status: 'unhealthy',
        message: 'Stripe connection failed - invalid account',
        duration
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    log.info('Stripe health check passed', { 
      duration, 
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled
    });
    
    return new Response(JSON.stringify({
      status: 'healthy',
      message: 'Stripe connection successful',
      duration,
      accountId: account.id,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    log.error('Stripe health check error', error);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      message: 'Stripe connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 