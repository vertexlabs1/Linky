import { createClient } from '@supabase/supabase-js';
import { log } from '../../../lib/logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req: Request) {
  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const startTime = Date.now();
    
    // Create Supabase client with service role key for health check
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Test database connection with a simple query
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    const duration = Date.now() - startTime;
    
    if (error) {
      log.error('Database health check failed', error, { duration });
      
      return new Response(JSON.stringify({
        status: 'unhealthy',
        message: 'Database connection failed',
        error: error.message,
        duration
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    log.info('Database health check passed', { duration });
    
    return new Response(JSON.stringify({
      status: 'healthy',
      message: 'Database connection successful',
      duration,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    log.error('Database health check error', error);
    
    return new Response(JSON.stringify({
      status: 'unhealthy',
      message: 'Database health check failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 