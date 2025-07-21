import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  console.log('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.log('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupData() {
  console.log('🧹 Starting complete data cleanup...');
  
  try {
    // Clean up all tables in reverse dependency order
    console.log('🗑️  Cleaning up user_promotions...');
    await supabase.from('user_promotions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('🗑️  Cleaning up user_roles...');
    await supabase.from('user_roles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('🗑️  Cleaning up stripe_events...');
    await supabase.from('stripe_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('🗑️  Cleaning up newsletter_subscriptions...');
    await supabase.from('newsletter_subscriptions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('🗑️  Cleaning up subscriptions...');
    await supabase.from('subscriptions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('🗑️  Cleaning up promotions...');
    await supabase.from('promotions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('🗑️  Cleaning up users...');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    console.log('✅ Data cleanup completed successfully!');
    
    // Verify cleanup
    console.log('\n📊 Current table row counts:');
    
    const tables = ['users', 'user_roles', 'subscriptions', 'newsletter_subscriptions', 'promotions', 'user_promotions', 'stripe_events', 'roles'];
    
    for (const table of tables) {
      const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
      if (error) {
        console.log(`❌ Error checking ${table}:`, error.message);
      } else {
        console.log(`  ${table}: ${count} rows`);
      }
    }
    
    // Show roles
    console.log('\n👥 Available roles:');
    const { data: roles, error: rolesError } = await supabase.from('roles').select('name, description');
    if (rolesError) {
      console.log('❌ Error fetching roles:', rolesError.message);
    } else {
      roles.forEach(role => {
        console.log(`  - ${role.name}: ${role.description}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupData(); 