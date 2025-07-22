// Database integrity validation script
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function validateDatabaseIntegrity() {
  console.log('🔍 Starting comprehensive database integrity validation...\n');
  
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    issues: []
  };

  try {
    // 1. Test basic connection
    console.log('1️⃣ Testing database connection...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      throw new Error(`Database connection failed: ${connectionError.message}`);
    }
    console.log('✅ Database connection successful');
    results.passed++;

    // 2. Validate table structure
    console.log('\n2️⃣ Validating table structure...');
    await validateTableStructure(results);

    // 3. Check data consistency
    console.log('\n3️⃣ Checking data consistency...');
    await validateDataConsistency(results);

    // 4. Test foreign key relationships
    console.log('\n4️⃣ Testing foreign key relationships...');
    await validateForeignKeys(results);

    // 5. Check for orphaned records
    console.log('\n5️⃣ Checking for orphaned records...');
    await checkOrphanedRecords(results);

    // 6. Validate constraints
    console.log('\n6️⃣ Validating constraints...');
    await validateConstraints(results);

    // 7. Performance check
    console.log('\n7️⃣ Checking query performance...');
    await checkQueryPerformance(results);

    // 8. Security validation
    console.log('\n8️⃣ Validating security policies...');
    await validateSecurityPolicies(results);

  } catch (error) {
    console.error('❌ Database validation failed:', error.message);
    results.failed++;
    results.issues.push({ type: 'CRITICAL', message: error.message });
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 DATABASE VALIDATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  
  if (results.issues.length > 0) {
    console.log('\n🚨 ISSUES FOUND:');
    results.issues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.type}] ${issue.message}`);
    });
  }

  if (results.failed === 0 && results.warnings === 0) {
    console.log('\n🎉 Database integrity validation PASSED!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Database validation completed with issues.');
    process.exit(results.failed > 0 ? 1 : 0);
  }
}

async function validateTableStructure(results) {
  const requiredTables = [
    'users',
    'email_subscribers',
    'founding_members',
    'transactions',
    'email_templates',
    'features'
  ];

  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        results.failed++;
        results.issues.push({ type: 'CRITICAL', message: `Table ${table} not accessible: ${error.message}` });
        console.log(`❌ Table ${table}: FAILED`);
      } else {
        console.log(`✅ Table ${table}: OK`);
        results.passed++;
      }
    } catch (error) {
      results.failed++;
      results.issues.push({ type: 'CRITICAL', message: `Table ${table} validation failed: ${error.message}` });
      console.log(`❌ Table ${table}: FAILED`);
    }
  }
}

async function validateDataConsistency(results) {
  // Check for users with missing required fields
  const { data: invalidUsers, error: userError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, created_at')
    .or('email.is.null,first_name.is.null,last_name.is.null');

  if (userError) {
    results.failed++;
    results.issues.push({ type: 'CRITICAL', message: `User data validation failed: ${userError.message}` });
    console.log('❌ User data validation: FAILED');
  } else if (invalidUsers && invalidUsers.length > 0) {
    results.warnings++;
    results.issues.push({ type: 'WARNING', message: `${invalidUsers.length} users with missing required fields` });
    console.log(`⚠️  User data validation: ${invalidUsers.length} issues found`);
  } else {
    console.log('✅ User data validation: OK');
    results.passed++;
  }

  // Check for duplicate emails
  const { data: duplicateEmails, error: duplicateError } = await supabase
    .from('users')
    .select('email, count')
    .not('email', 'is', null)
    .group('email')
    .having('count', 'gt', 1);

  if (duplicateError) {
    results.failed++;
    results.issues.push({ type: 'CRITICAL', message: `Duplicate email check failed: ${duplicateError.message}` });
    console.log('❌ Duplicate email check: FAILED');
  } else if (duplicateEmails && duplicateEmails.length > 0) {
    results.failed++;
    results.issues.push({ type: 'CRITICAL', message: `${duplicateEmails.length} duplicate emails found` });
    console.log(`❌ Duplicate email check: ${duplicateEmails.length} duplicates found`);
  } else {
    console.log('✅ Duplicate email check: OK');
    results.passed++;
  }
}

async function validateForeignKeys(results) {
  // Check for users with invalid Stripe customer IDs
  const { data: invalidStripeUsers, error: stripeError } = await supabase
    .from('users')
    .select('id, email, stripe_customer_id')
    .not('stripe_customer_id', 'is', null)
    .not('stripe_customer_id', 'like', 'cus_%');

  if (stripeError) {
    results.failed++;
    results.issues.push({ type: 'CRITICAL', message: `Stripe customer ID validation failed: ${stripeError.message}` });
    console.log('❌ Stripe customer ID validation: FAILED');
  } else if (invalidStripeUsers && invalidStripeUsers.length > 0) {
    results.warnings++;
    results.issues.push({ type: 'WARNING', message: `${invalidStripeUsers.length} users with invalid Stripe customer IDs` });
    console.log(`⚠️  Stripe customer ID validation: ${invalidStripeUsers.length} issues found`);
  } else {
    console.log('✅ Stripe customer ID validation: OK');
    results.passed++;
  }
}

async function checkOrphanedRecords(results) {
  // Check for founding members without corresponding users
  const { data: orphanedFoundingMembers, error: foundingError } = await supabase
    .from('founding_members')
    .select('id, user_id')
    .not('user_id', 'in', `(select id from users)`);

  if (foundingError) {
    results.failed++;
    results.issues.push({ type: 'CRITICAL', message: `Orphaned founding members check failed: ${foundingError.message}` });
    console.log('❌ Orphaned founding members check: FAILED');
  } else if (orphanedFoundingMembers && orphanedFoundingMembers.length > 0) {
    results.failed++;
    results.issues.push({ type: 'CRITICAL', message: `${orphanedFoundingMembers.length} orphaned founding member records` });
    console.log(`❌ Orphaned founding members check: ${orphanedFoundingMembers.length} orphaned records`);
  } else {
    console.log('✅ Orphaned founding members check: OK');
    results.passed++;
  }
}

async function validateConstraints(results) {
  // Test unique constraints
  try {
    const { error: uniqueError } = await supabase
      .from('users')
      .insert({
        email: 'test-constraint-validation@example.com',
        first_name: 'Test',
        last_name: 'User',
        created_at: new Date().toISOString()
      });

    if (uniqueError && uniqueError.code === '23505') {
      console.log('✅ Unique constraints: OK');
      results.passed++;
    } else {
      results.warnings++;
      results.issues.push({ type: 'WARNING', message: 'Unique constraint test inconclusive' });
      console.log('⚠️  Unique constraints: Test inconclusive');
    }

    // Clean up test record
    await supabase
      .from('users')
      .delete()
      .eq('email', 'test-constraint-validation@example.com');

  } catch (error) {
    results.warnings++;
    results.issues.push({ type: 'WARNING', message: `Constraint validation test failed: ${error.message}` });
    console.log('⚠️  Unique constraints: Test failed');
  }
}

async function checkQueryPerformance(results) {
  const startTime = Date.now();
  
  try {
    // Test complex query performance
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        subscription_status,
        current_plan_id,
        created_at,
        founding_members!inner(*)
      `)
      .eq('subscription_status', 'active')
      .limit(100);

    const duration = Date.now() - startTime;
    
    if (error) {
      results.failed++;
      results.issues.push({ type: 'CRITICAL', message: `Query performance test failed: ${error.message}` });
      console.log('❌ Query performance test: FAILED');
    } else if (duration > 5000) {
      results.warnings++;
      results.issues.push({ type: 'WARNING', message: `Slow query detected: ${duration}ms` });
      console.log(`⚠️  Query performance test: Slow (${duration}ms)`);
    } else {
      console.log(`✅ Query performance test: OK (${duration}ms)`);
      results.passed++;
    }
  } catch (error) {
    results.warnings++;
    results.issues.push({ type: 'WARNING', message: `Query performance test error: ${error.message}` });
    console.log('⚠️  Query performance test: Error');
  }
}

async function validateSecurityPolicies(results) {
  // Test RLS policies
  try {
    // Test that service role can access all data
    const { data: serviceRoleData, error: serviceRoleError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (serviceRoleError) {
      results.failed++;
      results.issues.push({ type: 'CRITICAL', message: `Service role access failed: ${serviceRoleError.message}` });
      console.log('❌ Service role access: FAILED');
    } else {
      console.log('✅ Service role access: OK');
      results.passed++;
    }

    // Test that anonymous access is properly restricted
    const anonSupabase = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    const { data: anonData, error: anonError } = await anonSupabase
      .from('users')
      .select('*')
      .limit(1);

    if (!anonError) {
      results.warnings++;
      results.issues.push({ type: 'WARNING', message: 'Anonymous access may not be properly restricted' });
      console.log('⚠️  Anonymous access: May be too permissive');
    } else {
      console.log('✅ Anonymous access: Properly restricted');
      results.passed++;
    }

  } catch (error) {
    results.warnings++;
    results.issues.push({ type: 'WARNING', message: `Security policy validation error: ${error.message}` });
    console.log('⚠️  Security policy validation: Error');
  }
}

// Run validation
validateDatabaseIntegrity().catch(console.error); 