import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
      apiVersion: '2024-12-18.acacia',
    })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { userEmail } = await req.json()

    console.log('💰 Syncing payment history for:', userEmail)

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', userEmail)
      .single()

    if (userError || !user) {
      console.error('❌ User not found:', userError)
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!user.stripe_customer_id) {
      console.error('❌ User has no Stripe customer ID')
      return new Response(
        JSON.stringify({ error: 'User has no Stripe customer' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Ensure transactions table exists
    console.log('🔧 Ensuring transactions table exists...')
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS transactions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          stripe_payment_intent_id TEXT,
          stripe_charge_id TEXT,
          stripe_invoice_id TEXT,
          amount INTEGER NOT NULL,
          currency TEXT DEFAULT 'usd',
          status TEXT NOT NULL CHECK (status IN (
            'succeeded',
            'pending',
            'failed',
            'canceled',
            'refunded',
            'partially_refunded'
          )),
          description TEXT,
          receipt_url TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_stripe_payment_intent_id ON transactions(stripe_payment_intent_id);
        CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
        CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
      `
    })

    if (tableError) {
      console.error('❌ Error ensuring transactions table exists:', tableError)
      // Continue anyway, the table might already exist
    }

    // Get payment intents from Stripe
    console.log('🔄 Fetching payment intents from Stripe...')
    const paymentIntents = await stripe.paymentIntents.list({
      customer: user.stripe_customer_id,
      limit: 50
    })

    // Get charges from Stripe
    console.log('🔄 Fetching charges from Stripe...')
    const charges = await stripe.charges.list({
      customer: user.stripe_customer_id,
      limit: 50
    })

    // Get invoices from Stripe
    console.log('🔄 Fetching invoices from Stripe...')
    const invoices = await stripe.invoices.list({
      customer: user.stripe_customer_id,
      limit: 50
    })

    console.log(`📊 Found ${paymentIntents.data.length} payment intents, ${charges.data.length} charges, ${invoices.data.length} invoices`)

    // Process and store transactions
    const transactions = []

    // Process payment intents
    for (const intent of paymentIntents.data) {
      const transaction = {
        user_id: user.id,
        stripe_payment_intent_id: intent.id,
        amount: intent.amount,
        currency: intent.currency,
        status: intent.status,
        description: intent.description || `Payment for ${intent.metadata?.product_name || 'service'}`,
        created_at: new Date(intent.created * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
      transactions.push(transaction)
    }

    // Process charges
    for (const charge of charges.data) {
      const transaction = {
        user_id: user.id,
        stripe_charge_id: charge.id,
        amount: charge.amount,
        currency: charge.currency,
        status: charge.status,
        description: charge.description || `Charge for ${charge.metadata?.product_name || 'service'}`,
        receipt_url: charge.receipt_url,
        created_at: new Date(charge.created * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
      transactions.push(transaction)
    }

    // Process invoices
    for (const invoice of invoices.data) {
      if (invoice.amount_paid > 0) {
        const transaction = {
          user_id: user.id,
          stripe_invoice_id: invoice.id,
          amount: invoice.amount_paid,
          currency: invoice.currency,
          status: invoice.status,
          description: `Invoice ${invoice.number} - ${invoice.description || 'Subscription payment'}`,
          receipt_url: invoice.hosted_invoice_url,
          created_at: new Date(invoice.created * 1000).toISOString(),
          updated_at: new Date().toISOString()
        }
        transactions.push(transaction)
      }
    }

    console.log(`💾 Storing ${transactions.length} transactions to database...`)

    // Upsert transactions to database
    if (transactions.length > 0) {
      const { error: upsertError } = await supabase
        .from('transactions')
        .upsert(transactions, { 
          onConflict: 'stripe_payment_intent_id,stripe_charge_id,stripe_invoice_id',
          ignoreDuplicates: false 
        })

      if (upsertError) {
        console.error('❌ Error upserting transactions:', upsertError)
        return new Response(
          JSON.stringify({ error: 'Failed to sync transactions', details: upsertError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Get payment methods
    console.log('🔄 Fetching payment methods from Stripe...')
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripe_customer_id,
      type: 'card'
    })

    // Ensure payment_methods table exists
    const { error: pmTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS payment_methods (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          stripe_payment_method_id TEXT UNIQUE NOT NULL,
          type TEXT NOT NULL CHECK (type IN ('card', 'bank_account')),
          card_brand TEXT,
          card_last4 TEXT,
          card_exp_month INTEGER,
          card_exp_year INTEGER,
          is_default BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
        CREATE INDEX IF NOT EXISTS idx_payment_methods_stripe_payment_method_id ON payment_methods(stripe_payment_method_id);
      `
    })

    if (pmTableError) {
      console.error('❌ Error ensuring payment_methods table exists:', pmTableError)
    }

    // Upsert payment methods
    const paymentMethodRecords = paymentMethods.data.map(pm => ({
      user_id: user.id,
      stripe_payment_method_id: pm.id,
      type: pm.type,
      card_brand: pm.card?.brand,
      card_last4: pm.card?.last4,
      card_exp_month: pm.card?.exp_month,
      card_exp_year: pm.card?.exp_year,
      is_default: pm.metadata?.is_default === 'true',
      created_at: new Date(pm.created * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }))

    if (paymentMethodRecords.length > 0) {
      const { error: pmError } = await supabase
        .from('payment_methods')
        .upsert(paymentMethodRecords, {
          onConflict: 'stripe_payment_method_id',
          ignoreDuplicates: false
        })

      if (pmError) {
        console.error('❌ Error upserting payment methods:', pmError)
      }
    }

    console.log('✅ Payment history synced successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Payment history synced successfully',
        transactions_synced: transactions.length,
        payment_methods_synced: paymentMethodRecords.length,
        user: {
          email: user.email,
          stripe_customer_id: user.stripe_customer_id
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in sync-payment-history:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 