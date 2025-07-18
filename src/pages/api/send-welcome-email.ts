import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, firstName } = req.body

    if (!email || !firstName) {
      return res.status(400).json({ error: 'Email and firstName are required' })
    }

    // Call the Supabase Edge Function
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-welcome-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({ email, firstName })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Edge function error: ${error}`)
    }

    const result = await response.json()
    res.status(200).json(result)
  } catch (error) {
    console.error('Error sending welcome email:', error)
    res.status(500).json({ error: 'Failed to send welcome email' })
  }
} 