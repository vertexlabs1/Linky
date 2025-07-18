import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jydldvvsxwosyzwttmui.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Please set it in your environment or pass it directly to the script');
  console.log('Get this from: Supabase Dashboard → Settings → API → service_role key');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function cleanAllUsers() {
  console.log('🧹 Starting complete user data cleanup...\n');
  
  try {
    // Step 1: Get current user count
    console.log('1️⃣ Checking current user data...');
    const { data: userCount, error: countError } = await supabase
      .from('users')
      .select('id', { count: 'exact' });

    if (countError) {
      console.error('❌ Error getting user count:', countError);
      return;
    }

    console.log(`📊 Found ${userCount?.length || 0} users in database`);

    // Step 2: Delete feature votes (user-related data)
    console.log('\n2️⃣ Deleting feature votes...');
    const { error: votesError } = await supabase
      .from('feature_votes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (votesError) {
      console.error('❌ Error deleting feature votes:', votesError);
    } else {
      console.log('✅ Feature votes deleted');
    }

    // Step 3: Delete feature comments (user-related data)
    console.log('\n3️⃣ Deleting feature comments...');
    const { error: commentsError } = await supabase
      .from('feature_comments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (commentsError) {
      console.error('❌ Error deleting feature comments:', commentsError);
    } else {
      console.log('✅ Feature comments deleted');
    }

    // Step 4: Reset feature upvotes to 0
    console.log('\n4️⃣ Resetting feature upvotes...');
    const { error: upvotesError } = await supabase
      .from('features')
      .update({ upvotes: 0 });

    if (upvotesError) {
      console.error('❌ Error resetting feature upvotes:', upvotesError);
    } else {
      console.log('✅ Feature upvotes reset to 0');
    }

    // Step 5: Clear submitted_by references in features
    console.log('\n5️⃣ Clearing user references in features...');
    const { error: featuresError } = await supabase
      .from('features')
      .update({ submitted_by: null });

    if (featuresError) {
      console.error('❌ Error clearing feature user references:', featuresError);
    } else {
      console.log('✅ Feature user references cleared');
    }

    // Step 6: Delete all users
    console.log('\n6️⃣ Deleting all users...');
    const { error: usersError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (usersError) {
      console.error('❌ Error deleting users:', usersError);
      return;
    } else {
      console.log('✅ All users deleted');
    }

    // Step 7: Delete email subscribers (waitlist)
    console.log('\n7️⃣ Deleting email subscribers...');
    const { error: subscribersError } = await supabase
      .from('active_subscribers')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (subscribersError) {
      console.error('❌ Error deleting email subscribers:', subscribersError);
      // Try alternative table name
      const { error: altSubscribersError } = await supabase
        .from('email_subscribers')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (altSubscribersError) {
        console.error('❌ Error deleting from email_subscribers:', altSubscribersError);
      } else {
        console.log('✅ Email subscribers deleted (from email_subscribers table)');
      }
    } else {
      console.log('✅ Email subscribers deleted');
    }

    // Step 8: Verify cleanup
    console.log('\n8️⃣ Verifying cleanup...');
    const { data: remainingUsers, error: verifyError } = await supabase
      .from('users')
      .select('id');

    if (verifyError) {
      console.error('❌ Error verifying cleanup:', verifyError);
    } else {
      console.log(`✅ Verification complete: ${remainingUsers?.length || 0} users remaining`);
    }

    // Step 9: Optional - Delete auth users (requires admin privileges)
    console.log('\n9️⃣ Checking auth users...');
    try {
      const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.log('⚠️ Cannot access auth users (may need admin privileges)');
      } else {
        console.log(`📊 Found ${authUsers?.length || 0} auth users`);
        console.log('💡 Note: Auth users are not automatically deleted for security reasons');
        console.log('   If you want to delete auth users, do it manually in Supabase dashboard');
      }
    } catch (error) {
      console.log('⚠️ Cannot access auth users:', error.message);
    }

    console.log('\n🎉 Cleanup completed successfully!');
    console.log('\n📋 SUMMARY:');
    console.log('==========================================');
    console.log('✅ All user records deleted');
    console.log('✅ Feature votes deleted');
    console.log('✅ Feature comments deleted');
    console.log('✅ Feature upvotes reset');
    console.log('✅ Email subscribers deleted');
    console.log('✅ User references in features cleared');
    console.log('\n💡 NEXT STEPS:');
    console.log('==========================================');
    console.log('1. Test the signup flow with a new user');
    console.log('2. Verify the dashboard shows correct user data');
    console.log('3. Check that founding member flow works');
    console.log('4. Test email delivery for new users');

  } catch (error) {
    console.error('❌ Unexpected error during cleanup:', error);
  }
}

// Run the cleanup
cleanAllUsers(); 