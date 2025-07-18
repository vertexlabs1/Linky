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

async function checkCurrentUsers() {
  console.log('🔍 Checking current user data in database...\n');
  
  try {
    // Check users table
    console.log('1️⃣ Checking users table...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('❌ Error getting users:', usersError);
    } else {
      console.log(`📊 Found ${users?.length || 0} users in users table`);
      if (users && users.length > 0) {
        console.log('👥 Users found:');
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email || 'No email'} (ID: ${user.id})`);
        });
      }
    }

    // Check feature_votes table
    console.log('\n2️⃣ Checking feature_votes table...');
    const { data: votes, error: votesError } = await supabase
      .from('feature_votes')
      .select('*');

    if (votesError) {
      console.error('❌ Error getting feature votes:', votesError);
    } else {
      console.log(`📊 Found ${votes?.length || 0} feature votes`);
    }

    // Check feature_comments table
    console.log('\n3️⃣ Checking feature_comments table...');
    const { data: comments, error: commentsError } = await supabase
      .from('feature_comments')
      .select('*');

    if (commentsError) {
      console.error('❌ Error getting feature comments:', commentsError);
    } else {
      console.log(`📊 Found ${comments?.length || 0} feature comments`);
    }

    // Check features table for user references
    console.log('\n4️⃣ Checking features table...');
    const { data: features, error: featuresError } = await supabase
      .from('features')
      .select('*');

    if (featuresError) {
      console.error('❌ Error getting features:', featuresError);
    } else {
      console.log(`📊 Found ${features?.length || 0} features`);
      const featuresWithUsers = features?.filter(f => f.submitted_by) || [];
      console.log(`📊 ${featuresWithUsers.length} features have user references`);
    }

    // Check active_subscribers table
    console.log('\n5️⃣ Checking active_subscribers table...');
    const { data: subscribers, error: subscribersError } = await supabase
      .from('active_subscribers')
      .select('*');

    if (subscribersError) {
      console.error('❌ Error getting active subscribers:', subscribersError);
      // Try alternative table name
      const { data: emailSubscribers, error: emailSubscribersError } = await supabase
        .from('email_subscribers')
        .select('*');

      if (emailSubscribersError) {
        console.error('❌ Error getting email subscribers:', emailSubscribersError);
      } else {
        console.log(`📊 Found ${emailSubscribers?.length || 0} email subscribers`);
      }
    } else {
      console.log(`📊 Found ${subscribers?.length || 0} active subscribers`);
    }

    // Check founding_members table
    console.log('\n6️⃣ Checking founding_members table...');
    const { data: foundingMembers, error: foundingMembersError } = await supabase
      .from('founding_members')
      .select('*');

    if (foundingMembersError) {
      console.error('❌ Error getting founding members:', foundingMembersError);
    } else {
      console.log(`📊 Found ${foundingMembers?.length || 0} founding members`);
    }

    // Summary
    console.log('\n📋 SUMMARY:');
    console.log('==========================================');
    console.log(`Users: ${users?.length || 0}`);
    console.log(`Feature votes: ${votes?.length || 0}`);
    console.log(`Feature comments: ${comments?.length || 0}`);
    console.log(`Features with user refs: ${features?.filter(f => f.submitted_by)?.length || 0}`);
    console.log(`Email subscribers: ${subscribers?.length || 0}`);
    console.log(`Founding members: ${foundingMembers?.length || 0}`);

    if ((users?.length || 0) > 0) {
      console.log('\n⚠️  WARNING: User data found from tests!');
      console.log('💡 Run clean-all-users.js to clean up test data');
    } else {
      console.log('\n✅ Database appears to be clean - no test users found');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkCurrentUsers(); 