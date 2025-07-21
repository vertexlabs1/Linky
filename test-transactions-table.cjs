const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzAsImV4cCI6MjA1MDU0ODk3MH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testTransactionsTable() {
  console.log('🔍 Testing transactions table...');
  
  try {
    // First, check if the table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('transactions')
      .select('count')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Transactions table does not exist or has issues:', tableError.message);
      
      // Create the table
      console.log('🔧 Creating transactions table...');
      const { error: createError } = await supabase.rpc('exec_sql', {
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
      });
      
      if (createError) {
        console.error('❌ Error creating transactions table:', createError);
        return;
      }
      
      console.log('✅ Transactions table created successfully');
    } else {
      console.log('✅ Transactions table exists');
    }
    
    // Test inserting a sample transaction
    console.log('🧪 Testing transaction insertion...');
    const { data: testUser } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();
    
    if (testUser) {
      const { data: insertData, error: insertError } = await supabase
        .from('transactions')
        .insert({
          user_id: testUser.id,
          amount: 2500, // $25.00
          currency: 'usd',
          status: 'succeeded',
          description: 'Test transaction for payment history',
          stripe_payment_intent_id: 'pi_test_' + Date.now()
        })
        .select();
      
      if (insertError) {
        console.error('❌ Error inserting test transaction:', insertError);
      } else {
        console.log('✅ Test transaction inserted successfully:', insertData);
        
        // Clean up test data
        await supabase
          .from('transactions')
          .delete()
          .eq('stripe_payment_intent_id', insertData[0].stripe_payment_intent_id);
        
        console.log('🧹 Test transaction cleaned up');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing transactions table:', error);
  }
}

testTransactionsTable(); 