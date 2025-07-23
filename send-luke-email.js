// Manually send Luke the founding member welcome email
const fetch = require('node-fetch');

async function sendLukeEmail() {
  console.log('📧 Sending Luke the founding member welcome email...');
  
  const emailUrl = 'https://jydldvvsxwosyzwttmui.supabase.co/functions/v1/send-founding-member-email';
  
  try {
    const response = await fetch(emailUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5ZGxkdnZzeHdvc3l6d3R0bXVpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjY5ODA1MCwiZXhwIjoyMDY4Mjc0MDUwfQ.ueILMQL5TXkfUKfBN7Sc6e1f_eFjVLFVWDGqK-X9H2c',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'luke@lukepauldine.com',
        firstName: 'Luke',
        sessionId: 'manual-fix-luke-account'
      })
    });
    
    console.log('📊 Response status:', response.status);
    
    const responseText = await response.text();
    console.log('📊 Response body:', responseText);
    
    if (response.ok) {
      console.log('✅ Luke\'s welcome email sent successfully!');
    } else {
      console.log('❌ Failed to send Luke\'s email');
    }
  } catch (error) {
    console.error('❌ Error sending Luke\'s email:', error);
  }
}

sendLukeEmail(); 