#!/usr/bin/env node

/**
 * 🧪 Email Function Test Script
 * 
 * This script helps test the email functions to see if they're working properly.
 */

const https = require('https');

// Configuration
const SUPABASE_URL = 'https://jydldvvsxwosyzwttmui.supabase.co';
const FUNCTION_NAME = 'send-founding-member-email';

// Test data
const testData = {
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  sessionId: 'test_session_123'
};

function makeRequest(anonKey) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(testData);
    
    const options = {
      hostname: 'jydldvvsxwosyzwttmui.supabase.co',
      port: 443,
      path: `/functions/v1/${FUNCTION_NAME}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': `Bearer ${anonKey}`,
        'apikey': anonKey
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Headers:`, res.headers);
        console.log(`Response:`, data);
        resolve({ statusCode: res.statusCode, data });
      });
    });

    req.on('error', (error) => {
      console.error('Request error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function testEmailFunction() {
  console.log('🧪 Testing Email Function');
  console.log('==========================\n');
  
  console.log('📋 Test Data:');
  console.log(JSON.stringify(testData, null, 2));
  console.log('');
  
  // You need to replace this with your actual anon key from Supabase Dashboard
  const anonKey = 'YOUR_ACTUAL_ANON_KEY_HERE';
  
  if (anonKey === 'YOUR_ACTUAL_ANON_KEY_HERE') {
    console.log('❌ Please replace the anon key with your actual key from:');
    console.log('   https://supabase.com/dashboard/project/jydldvvsxwosyzwttmui/settings/api');
    console.log('');
    console.log('📋 Steps to get your anon key:');
    console.log('1. Go to Supabase Dashboard');
    console.log('2. Select your project');
    console.log('3. Go to Settings → API');
    console.log('4. Copy the "anon public" key');
    console.log('5. Replace YOUR_ACTUAL_ANON_KEY_HERE in this script');
    console.log('');
    return;
  }
  
  try {
    console.log('🚀 Testing email function...');
    const result = await makeRequest(anonKey);
    
    if (result.statusCode === 200) {
      console.log('✅ Email function is working!');
      console.log('📧 Email should be sent to:', testData.email);
    } else {
      console.log('❌ Email function failed');
      console.log('Response:', result.data);
    }
  } catch (error) {
    console.error('❌ Error testing email function:', error.message);
  }
}

// Run the test
testEmailFunction(); 