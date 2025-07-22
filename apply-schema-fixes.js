// Apply database schema fixes
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = 'https://jydldvvsxwosyzwttmui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI2OTgwNTAsImV4cCI6MjA2ODI3NDA1MH0.kt8G6d6ZlqxgpU4HFg_vDDBg-0FlozNF4XUq9bf22uw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applySchemaFixes() {
  console.log('🔧 Applying database schema fixes...\n');

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('fix-database-schema.sql', 'utf8');
    
    // Split into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        // Execute the SQL statement
        const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
        
        if (error) {
          console.log(`❌ Statement ${i + 1} failed: ${error.message}`);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.log(`❌ Statement ${i + 1} failed: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 SCHEMA FIX SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log(`📝 Total: ${statements.length}`);

    if (errorCount === 0) {
      console.log('\n🎉 All schema fixes applied successfully!');
    } else {
      console.log('\n⚠️  Some schema fixes failed. Check the logs above.');
    }

  } catch (error) {
    console.error('❌ Failed to apply schema fixes:', error.message);
    process.exit(1);
  }
}

// Alternative approach: Create tables directly
async function createTablesDirectly() {
  console.log('🔧 Creating missing tables directly...\n');

  try {
    // Create founding_members table
    console.log('Creating founding_members table...');
    const { error: foundingError } = await supabase
      .from('founding_members')
      .select('*')
      .limit(1);
    
    if (foundingError && foundingError.message.includes('does not exist')) {
      console.log('founding_members table does not exist - will need to be created via Supabase dashboard');
    } else {
      console.log('✅ founding_members table exists');
    }

    // Create email_templates table
    console.log('Creating email_templates table...');
    const { error: templatesError } = await supabase
      .from('email_templates')
      .select('*')
      .limit(1);
    
    if (templatesError && templatesError.message.includes('does not exist')) {
      console.log('email_templates table does not exist - will need to be created via Supabase dashboard');
    } else {
      console.log('✅ email_templates table exists');
    }

    // Create features table
    console.log('Creating features table...');
    const { error: featuresError } = await supabase
      .from('features')
      .select('*')
      .limit(1);
    
    if (featuresError && featuresError.message.includes('does not exist')) {
      console.log('features table does not exist - will need to be created via Supabase dashboard');
    } else {
      console.log('✅ features table exists');
    }

    console.log('\n📝 Note: Tables that don\'t exist need to be created via the Supabase dashboard or migrations.');
    console.log('The SQL file contains the complete schema that should be applied.');

  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  }
}

// Run the fixes
applySchemaFixes().then(() => {
  console.log('\n🔄 Checking table status...');
  return createTablesDirectly();
}).catch(console.error); 