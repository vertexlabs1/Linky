// Secure CORS configuration for Supabase Edge Functions
export const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGINS') || 'https://uselinky.app,https://localhost:8082',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-info, apikey, stripe-signature',
  'Access-Control-Max-Age': '86400',
}

export const handleCORS = (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }
  return null
}

export const createResponse = (data: any, status = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  })
}

export const createErrorResponse = (error: string, status = 400) => {
  return new Response(
    JSON.stringify({ 
      error,
      timestamp: new Date().toISOString()
    }),
    { 
      status, 
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      } 
    }
  )
} 