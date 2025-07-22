import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateFoundingMembers() {
  try {
    console.log('🔄 Fetching existing founding members...');
    
    // Get all founding members
    const { data: foundingMembers, error } = await supabase
      .from('users')
      .select('*')
      .eq('founding_member', true);

    if (error) {
      console.error('❌ Error fetching founding members:', error);
      return;
    }

    console.log(`📊 Found ${foundingMembers.length} founding members`);

    for (const member of foundingMembers) {
      console.log(`\n🔄 Processing ${member.email}...`);
      
      // If they already have a purchase date, skip
      if (member.founding_member_purchased_at) {
        console.log(`  ⏭️  Already has purchase date: ${member.founding_member_purchased_at}`);
        continue;
      }

      // Set purchase date to their created_at date (or 3 months ago if they're already transitioned)
      let purchaseDate;
      if (member.founding_member_transitioned_at) {
        // If already transitioned, set purchase date to 3 months before transition
        purchaseDate = new Date(member.founding_member_transitioned_at);
        purchaseDate.setMonth(purchaseDate.getMonth() - 3);
      } else {
        // Use created_at as purchase date
        purchaseDate = new Date(member.created_at);
      }

      console.log(`  📅 Setting purchase date to: ${purchaseDate.toISOString()}`);

      // Update the user
      const { error: updateError } = await supabase
        .from('users')
        .update({
          founding_member_purchased_at: purchaseDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', member.id);

      if (updateError) {
        console.error(`  ❌ Error updating ${member.email}:`, updateError);
      } else {
        console.log(`  ✅ Updated ${member.email}`);
      }
    }

    console.log('\n✅ Founding member update complete!');
    
    // Show summary
    const { data: updatedMembers } = await supabase
      .from('founding_member_status_overview')
      .select('*');

    console.log('\n📊 Current Founding Member Status:');
    updatedMembers?.forEach(member => {
      const status = member.status;
      const daysRemaining = member.days_remaining;
      console.log(`  ${member.email}: ${status}${daysRemaining !== null ? ` (${daysRemaining} days)` : ''}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateFoundingMembers(); 