// Test the email function directly
const SUPABASE_URL = 'https://jydldvvsxwosyzwttmui.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdHZzd3dvc3l6d3R0bXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMjI5NzI5MCwiZXhwIjoyMDQ3ODczMjkwfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

async function testEmailFunction() {
  try {
    console.log('📧 Testing email function for tyleramos2019@gmail.com...\n');
    
    const emailUrl = `${SUPABASE_URL}/functions/v1/send-founding-member-email`;
    console.log('🎯 Calling URL:', emailUrl);
    
    const response = await fetch(emailUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'tyleramos2019@gmail.com',
        firstName: 'Tyler',
        sessionId: 'test_session_' + Date.now()
      })
    });
    
    console.log('📧 Response status:', response.status);
    console.log('📧 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Email sent successfully!');
      console.log('📧 Response:', result);
    } else {
      const errorText = await response.text();
      console.error('❌ Email function failed:');
      console.error('Status:', response.status);
      console.error('Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testEmailFunction(); 