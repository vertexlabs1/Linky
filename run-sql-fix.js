// Run SQL fix for is_admin column
// This script will add the missing is_admin column to the users table

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jydldvvsxwosyzwttmui.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTgwNTAsImV4cCI6MjA2ODI3NDA1MH0.kt8G6d6ZlqxgpU4HFg_vDDBg-0FlozNF4XUq9bf22uw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addIsAdminColumn() {
  console.log('🔧 Adding is_admin column to users table...\n');

  try {
    // Add the is_admin column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$ 
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name = 'is_admin'
            AND table_schema = 'public'
          ) THEN
            ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
            RAISE NOTICE 'Added is_admin column to users table';
          ELSE
            RAISE NOTICE 'is_admin column already exists';
          END IF;
        END $$;
      `
    });

    if (alterError) {
      console.error('❌ Error adding is_admin column:', alterError);
      return;
    }

    console.log('✅ is_admin column added successfully');

    // Update Tyler to be an admin
    const { error: updateError } = await supabase
      .from('users')
      .update({ is_admin: true })
      .eq('email', 'tyler@vxlabs.co');

    if (updateError) {
      console.error('❌ Error updating Tyler:', updateError);
    } else {
      console.log('✅ Updated Tyler as admin');
    }

    // Verify the changes
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('email, first_name, last_name, is_admin, status')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError);
      return;
    }

    console.log('\n📊 Current users:');
    users?.forEach(user => {
      console.log(`- ${user.first_name} ${user.last_name} (${user.email}): Admin=${user.is_admin}, Status=${user.status}`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addIsAdminColumn(); 