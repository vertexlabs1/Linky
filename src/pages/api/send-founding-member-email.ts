export async function sendFoundingMemberEmail(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  try {
    const { email, firstName, sessionId } = await req.json()

    if (!email || !firstName || !sessionId) {
      return new Response(JSON.stringify({ error: 'Email, firstName, and sessionId are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Call the Supabase Edge Function
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-founding-member-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ email, firstName, sessionId })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Edge function error: ${error}`)
    }

    const result = await response.json()
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error sending founding member email:', error)
    return new Response(JSON.stringify({ error: 'Failed to send founding member email' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
} 