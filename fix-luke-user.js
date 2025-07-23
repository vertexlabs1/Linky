import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Supabase client
const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixLukeUser() {
  console.log('🔧 Fixing Luke Pauldine\'s missing user record...');
  
  try {
    // Call the fix-missing-user function
    const { data, error } = await supabase.functions.invoke('fix-missing-user', {
      body: { email: 'luke@lukepauldine.com' }
    });

    if (error) {
      console.error('❌ Error calling fix function:', error);
      return;
    }

    console.log('✅ Fix result:', data);
    
    // Verify the user was created
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'luke@lukepauldine.com')
      .single();

    if (userError) {
      console.error('❌ Error fetching user:', userError);
    } else {
      console.log('✅ User verified in database:', {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        stripe_customer_id: user.stripe_customer_id,
        status: user.status,
        subscription_status: user.subscription_status
      });
    }

  } catch (error) {
    console.error('❌ Error fixing user:', error);
  }
}

fixLukeUser(); 