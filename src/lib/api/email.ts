import resend from './resend';

export interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (emailData: EmailData) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Linky <hello@linky.com>', // Update with your verified domain
      to: emailData.to,
      subject: emailData.subject,
      html: emailData.html,
      replyTo: 'support@linky.com', // Add reply-to to improve deliverability
    });

    if (error) {
      console.error('Email sending failed:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};

export const sendWelcomeEmail = async (email: string, firstName?: string, lastName?: string) => {
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || 'there';
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Linky</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f8fafc;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
          padding: 40px 30px; 
          text-align: center; 
          color: white;
        }
        .logo { 
          font-size: 32px; 
          font-weight: bold; 
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .logo-icon {
          background: #fbbf24;
          color: #1f2937;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 24px;
        }
        .subtitle { 
          font-size: 18px; 
          opacity: 0.9; 
          margin: 0;
        }
        .content { 
          padding: 40px 30px; 
        }
        .welcome-text { 
          font-size: 24px; 
          font-weight: 600; 
          color: #1f2937; 
          margin-bottom: 20px;
        }
        .description { 
          font-size: 16px; 
          color: #6b7280; 
          margin-bottom: 30px;
          line-height: 1.7;
        }
        .features { 
          background: #f8fafc; 
          padding: 25px; 
          border-radius: 8px; 
          margin: 30px 0;
        }
        .feature { 
          display: flex; 
          align-items: center; 
          margin-bottom: 15px;
          font-size: 16px;
          color: #374151;
        }
        .feature:last-child { 
          margin-bottom: 0; 
        }
        .feature-icon { 
          color: #10b981; 
          margin-right: 12px; 
          font-size: 18px;
        }
        .cta-button { 
          display: inline-block; 
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
          color: white; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 16px;
          margin: 20px 0;
          text-align: center;
        }
        .footer { 
          background: #f8fafc; 
          padding: 30px; 
          text-align: center; 
          color: #6b7280;
          font-size: 14px;
        }
        .social-links { 
          margin: 20px 0; 
        }
        .social-link { 
          display: inline-block; 
          margin: 0 10px; 
          color: #6b7280; 
          text-decoration: none;
        }
        .unsubscribe { 
          font-size: 12px; 
          color: #9ca3af; 
          margin-top: 20px;
        }
        @media (max-width: 600px) {
          .container { margin: 10px; }
          .header { padding: 30px 20px; }
          .content { padding: 30px 20px; }
          .footer { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <span class="logo-icon">🤖</span>
            Linky
          </div>
          <p class="subtitle">Your AI-Powered LinkedIn Wingman</p>
        </div>
        
        <div class="content">
          <h1 class="welcome-text">Welcome to the future, ${firstName || 'there'}! 🎉</h1>
          
          <p class="description">
            You're now on the exclusive waitlist for Linky - the revolutionary AI platform that will transform how you generate leads on LinkedIn.
          </p>
          
          <div class="features">
            <div class="feature">
              <span class="feature-icon">⚡</span>
              <strong>Smart Engagement Tracking:</strong> Never miss a potential lead again
            </div>
            <div class="feature">
              <span class="feature-icon">🎯</span>
              <strong>AI-Powered Lead Scoring:</strong> Focus on your highest-value prospects
            </div>
            <div class="feature">
              <span class="feature-icon">🤖</span>
              <strong>Automated Outreach:</strong> Generate personalized comments and messages
            </div>
            <div class="feature">
              <span class="feature-icon">📊</span>
              <strong>Analytics Dashboard:</strong> Track your LinkedIn performance in real-time
            </div>
          </div>
          
          <p class="description">
            We're working hard to bring you the most powerful LinkedIn lead generation tool ever created. You'll be among the first to experience the future of social selling.
          </p>
          
          <p class="description">
            <strong>What's next?</strong><br>
            We'll notify you as soon as Linky is ready for early access. Founding members will get exclusive pricing and priority access to all features.
          </p>
          
          <div style="text-align: center;">
            <a href="https://linky.com" class="cta-button">
              Learn More About Linky
            </a>
          </div>
        </div>
        
        <div class="footer">
          <div class="social-links">
            <a href="https://twitter.com/linky" class="social-link">Twitter</a>
            <a href="https://linkedin.com/company/linky" class="social-link">LinkedIn</a>
            <a href="https://linky.com" class="social-link">Website</a>
          </div>
          
          <p>
            <strong>The Linky Team</strong><br>
            Building the future of LinkedIn lead generation
          </p>
          
          <div class="unsubscribe">
            <p>
              You received this email because you joined the Linky waitlist.<br>
              <a href="https://linky.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #9ca3af;">Unsubscribe</a> | 
              <a href="https://linky.com/privacy" style="color: #9ca3af;">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Linky - You\'re on the waitlist! 🚀',
    html,
  });
};

export const sendFoundingMemberEmail = async (email: string, firstName?: string, lastName?: string) => {
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || 'there';
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Linky - Founding Member</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
          line-height: 1.6; 
          color: #333; 
          margin: 0; 
          padding: 0; 
          background-color: #f8fafc;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: white; 
          border-radius: 12px; 
          overflow: hidden; 
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header { 
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); 
          padding: 40px 30px; 
          text-align: center; 
          color: #1f2937;
        }
        .logo { 
          font-size: 32px; 
          font-weight: bold; 
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }
        .logo-icon {
          background: #1f2937;
          color: #fbbf24;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 24px;
        }
        .subtitle { 
          font-size: 18px; 
          opacity: 0.9; 
          margin: 0;
        }
        .content { 
          padding: 40px 30px; 
        }
        .welcome-text { 
          font-size: 24px; 
          font-weight: 600; 
          color: #1f2937; 
          margin-bottom: 20px;
        }
        .description { 
          font-size: 16px; 
          color: #6b7280; 
          margin-bottom: 30px;
          line-height: 1.7;
        }
        .benefits { 
          background: #fef3c7; 
          padding: 25px; 
          border-radius: 8px; 
          margin: 30px 0;
          border-left: 4px solid #fbbf24;
        }
        .benefit { 
          display: flex; 
          align-items: center; 
          margin-bottom: 15px;
          font-size: 16px;
          color: #92400e;
        }
        .benefit:last-child { 
          margin-bottom: 0; 
        }
        .benefit-icon { 
          color: #d97706; 
          margin-right: 12px; 
          font-size: 18px;
        }
        .cta-button { 
          display: inline-block; 
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); 
          color: #1f2937; 
          padding: 16px 32px; 
          text-decoration: none; 
          border-radius: 8px; 
          font-weight: 600; 
          font-size: 16px;
          margin: 20px 0;
          text-align: center;
        }
        .footer { 
          background: #f8fafc; 
          padding: 30px; 
          text-align: center; 
          color: #6b7280;
          font-size: 14px;
        }
        .social-links { 
          margin: 20px 0; 
        }
        .social-link { 
          display: inline-block; 
          margin: 0 10px; 
          color: #6b7280; 
          text-decoration: none;
        }
        .unsubscribe { 
          font-size: 12px; 
          color: #9ca3af; 
          margin-top: 20px;
        }
        @media (max-width: 600px) {
          .container { margin: 10px; }
          .header { padding: 30px 20px; }
          .content { padding: 30px 20px; }
          .footer { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">
            <span class="logo-icon">👑</span>
            Linky
          </div>
          <p class="subtitle">Founding Member Exclusive</p>
        </div>
        
        <div class="content">
          <h1 class="welcome-text">🎉 Congratulations, ${firstName || 'there'}!</h1>
          
          <p class="description">
            You're now a <strong>Founding Member</strong> of Linky - the revolutionary AI platform that will transform how you generate leads on LinkedIn.
          </p>
          
          <div class="benefits">
            <div class="benefit">
              <span class="benefit-icon">💰</span>
              <strong>50% Off First Year:</strong> Lock in exclusive founding member pricing
            </div>
            <div class="benefit">
              <span class="benefit-icon">⚡</span>
              <strong>Priority Access:</strong> Be among the first to try new features
            </div>
            <div class="benefit">
              <span class="benefit-icon">🎯</span>
              <strong>Exclusive Support:</strong> Direct access to our founding member team
            </div>
            <div class="benefit">
              <span class="benefit-icon">🏆</span>
              <strong>Founding Member Badge:</strong> Special recognition in the community
            </div>
          </div>
          
          <p class="description">
            As a founding member, you'll have exclusive access to our most advanced features and dedicated support to help you maximize your LinkedIn lead generation.
          </p>
          
          <p class="description">
            <strong>What's next?</strong><br>
            We'll notify you as soon as Linky is ready for founding member onboarding. You'll get early access to set up your account and start generating leads before anyone else.
          </p>
          
          <div style="text-align: center;">
            <a href="https://linky.com/founding-member" class="cta-button">
              View Founding Member Benefits
            </a>
          </div>
        </div>
        
        <div class="footer">
          <div class="social-links">
            <a href="https://twitter.com/linky" class="social-link">Twitter</a>
            <a href="https://linkedin.com/company/linky" class="social-link">LinkedIn</a>
            <a href="https://linky.com" class="social-link">Website</a>
          </div>
          
          <p>
            <strong>The Linky Team</strong><br>
            Building the future of LinkedIn lead generation
          </p>
          
          <div class="unsubscribe">
            <p>
              You received this email because you're a founding member of Linky.<br>
              <a href="https://linky.com/unsubscribe?email=${encodeURIComponent(email)}" style="color: #9ca3af;">Unsubscribe</a> | 
              <a href="https://linky.com/privacy" style="color: #9ca3af;">Privacy Policy</a>
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🎉 Welcome to Linky - You\'re a Founding Member!',
    html,
  });
}; 