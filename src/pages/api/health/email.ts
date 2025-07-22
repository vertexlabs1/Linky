import { log } from '../../../lib/logger';

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const startTime = Date.now();
    
    // Test email service by checking if Resend API key is configured
    const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;
    
    if (!resendApiKey) {
      log.error('Email health check failed - no API key configured', new Error('Missing Resend API key'));
      
      return new Response(JSON.stringify({
        status: 'unhealthy',
        message: 'Email service not configured',
        error: 'Missing Resend API key'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Test Resend API connection
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    const duration = Date.now() - startTime;
    
    if (!response.ok) {
      log.error('Email health check failed - API error', new Error(`Resend API error: ${response.status}`), { 
        duration, 
        status: response.status 
      });
      
      return new Response(JSON.stringify({
        status: 'degraded',
        message: 'Email service API issues',
        error: `API responded with ${response.status}`,
        duration
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    log.info('Email health check passed', { duration });
    
    return new Response(JSON.stringify({
      status: 'healthy',
      message: 'Email service operational',
      duration,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    log.error('Email health check error', error);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      message: 'Email service failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 