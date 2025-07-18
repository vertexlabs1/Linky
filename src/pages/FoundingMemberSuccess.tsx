import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Crown, Sparkles, Mail, CheckCircle, Trophy, Zap, Star } from 'lucide-react';
import confetti from 'canvas-confetti';

const FoundingMemberSuccess = () => {
  const [searchParams] = useSearchParams();
  const [showConfetti, setShowConfetti] = useState(false);
  
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Trigger confetti animation
    const triggerConfetti = () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      // Additional confetti bursts
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
      }, 250);
      
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 400);
    };

    // Trigger confetti after a short delay
    const timer = setTimeout(() => {
      triggerConfetti();
      setShowConfetti(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 animate-bounce">
          <Sparkles className="w-8 h-8 text-yellow-400 opacity-60" />
        </div>
        <div className="absolute top-20 right-20 animate-pulse">
          <Star className="w-6 h-6 text-yellow-500 opacity-70" />
        </div>
        <div className="absolute bottom-20 left-20 animate-spin">
          <Crown className="w-10 h-10 text-yellow-600 opacity-50" />
        </div>
        <div className="absolute bottom-10 right-10 animate-bounce">
          <Trophy className="w-8 h-8 text-yellow-400 opacity-60" />
        </div>
      </div>

      <Card className="w-full max-w-2xl relative z-10 animate-in zoom-in-95 duration-500">
        <CardHeader className="text-center pb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Crown className="w-12 h-12 text-yellow-600 animate-pulse" />
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-yellow-600 bg-clip-text text-transparent">
              🎉 CONGRATULATIONS! 🎉
            </CardTitle>
            <Sparkles className="w-12 h-12 text-yellow-600 animate-pulse" />
          </div>
          <div className="text-2xl font-semibold text-foreground mb-4">
            You're Now a <span className="text-primary">Founding Member</span>!
          </div>
          <p className="text-lg text-muted-foreground">
            Welcome to the exclusive club of visionaries who will shape the future of LinkedIn lead generation!
          </p>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* Success Message */}
          <div className="text-center p-6 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center justify-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <span className="text-xl font-semibold text-green-800">Payment Successful!</span>
            </div>
            <p className="text-green-700">
              Your founding member subscription has been activated. You now have access to all premium features!
            </p>
          </div>

          {/* Email Verification Section */}
          <div className="text-center p-6 bg-blue-50 border border-blue-200 rounded-xl">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Mail className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-semibold text-blue-800">Check Your Email</span>
            </div>
            <p className="text-blue-700 mb-4">
              We've sent you a special welcome email with your password setup link. 
              This will verify your email and complete your account setup.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
              <Zap className="w-4 h-4" />
              <span>Click the link in your email to get started!</span>
            </div>
          </div>

          {/* Founding Member Benefits */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="text-xl font-bold text-center mb-4 flex items-center justify-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-600" />
              Your Founding Member Benefits
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-semibold">3 Months Premium Access</h4>
                  <p className="text-sm text-muted-foreground">Full MVP features at founding member pricing</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-semibold">Unlimited AI Monitoring</h4>
                  <p className="text-sm text-muted-foreground">AI-powered lead discovery and scoring</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-semibold">Feature Voting Rights</h4>
                  <p className="text-sm text-muted-foreground">Help shape the future of Linky</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                  4
                </div>
                <div>
                  <h4 className="font-semibold">Private Community</h4>
                  <p className="text-sm text-muted-foreground">Connect with other founding members</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">What's Next?</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Check Email
              </Button>
              <Button className="flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Go to Dashboard
              </Button>
            </div>
          </div>

          {/* Session ID for debugging */}
          {sessionId && (
            <div className="text-center text-xs text-muted-foreground">
              Session ID: {sessionId}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FoundingMemberSuccess; 