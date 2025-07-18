import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api/api';
import { PRICE_IDS } from '@/lib/stripe/stripe-service';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface AuthModalsProps {
  isLoginOpen: boolean;
  isSignUpOpen: boolean;
  onLoginClose: () => void;
  onSignUpClose: () => void;
  onSwitchToSignUp: () => void;
  onSwitchToLogin: () => void;
}

const AuthModals = ({
  isLoginOpen,
  isSignUpOpen,
  onLoginClose,
  onSignUpClose,
  onSwitchToSignUp,
  onSwitchToLogin
}: AuthModalsProps) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [signUpError, setSignUpError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      logger.userAction('login_attempt', undefined, { email: loginData.email });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });
      
      if (error) {
        logger.error('Login failed', { error: error.message, email: loginData.email }, 'AUTH');
        
        // Handle specific error types with user-friendly messages
        let userMessage = 'Login failed. Please try again.';
        if (error.message.includes('Invalid login credentials')) {
          userMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          userMessage = 'Please check your email and confirm your account before signing in.';
        } else if (error.message.includes('Too many requests')) {
          userMessage = 'Too many login attempts. Please wait a moment and try again.';
        }
        
        setLoginError(userMessage);
      } else {
        logger.userAction('login_success', data.user?.id, { email: loginData.email });
        
        // Close modal and redirect to dashboard
        onLoginClose();
        navigate('/dashboard');
        
        // Clear form data
        setLoginData({ email: '', password: '' });
      }
    } catch (error: any) {
      logger.errorWithContext(error, 'AUTH', { email: loginData.email });
      setLoginError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signUpData.password !== signUpData.confirmPassword) {
      console.error('Passwords do not match');
      return;
    }
    
    setSignUpError('');
    setIsLoading(true);

    try {
      console.log('Attempting sign up for:', signUpData.email);
      
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          // Don't use emailRedirectTo to prevent automatic Supabase emails
          // We send our own custom welcome email below
          data: {
            name: signUpData.name,
            source: 'regular_signup'
          }
        }
      });
      
      if (error) {
        console.error('Sign up error:', error.message);
        
        // Handle specific error types with user-friendly messages
        let userMessage = 'Sign up failed. Please try again.';
        if (error.message.includes('Email already in use')) {
          userMessage = 'This email is already in use. Please choose another one.';
        } else if (error.message.includes('Invalid email')) {
          userMessage = 'Please enter a valid email address.';
        } else if (error.message.includes('Password too weak')) {
          userMessage = 'Your password must be at least 6 characters long.';
        }
        
        setSignUpError(userMessage);
      } else {
        console.log('Sign up successful:', data);
        
        // Send welcome email
        try {
          await api.sendWelcomeEmail(signUpData.email, signUpData.name);
          console.log('Welcome email sent successfully');
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
        }
        
        onSignUpClose();
        // Show success message to user
        toast.success('Account created successfully! Please check your email to verify your account.')
      }
    } catch (error: any) {
      console.error('Sign up error:', error);
      setSignUpError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFoundingMemberSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signUpData.password !== signUpData.confirmPassword) {
      console.error('Passwords do not match');
      return;
    }
    
    setSignUpError('');
    setIsLoading(true);

    try {
      console.log('Attempting founding member sign up for:', signUpData.email);
      
      // First create the user account
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            name: signUpData.name
          }
        }
      });
      
      if (error) {
        console.error('Sign up error:', error.message);
        setSignUpError('Failed to create user account. Please try again.');
        return;
      }

      // Note: Email will be sent by Stripe webhook after payment completion
      // No need to send email here to avoid duplicates

              // Redirect to Stripe checkout for founding member plan
        try {
          const { url } = await api.createCheckoutSession({
            priceId: PRICE_IDS.FOUNDING_MEMBER,
            customerEmail: signUpData.email,
            successUrl: `http://localhost:8082/dashboard?session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `http://localhost:8082/`,
          });
          
          // Redirect to Stripe checkout
          window.location.href = url;
        } catch (stripeError) {
          console.error('Stripe checkout error:', stripeError);
          setSignUpError('Failed to initiate payment. Please try again.');
        }
      
    onSignUpClose();
    } catch (error: any) {
      console.error('Founding member sign up error:', error);
      setSignUpError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear errors when modals open/close
  const handleLoginClose = () => {
    setLoginError('');
    setLoginData({ email: '', password: '' });
    onLoginClose();
  };

  const handleSignUpClose = () => {
    setSignUpError('');
    setSignUpData({ name: '', email: '', password: '', confirmPassword: '' });
    onSignUpClose();
  };

  return (
    <>
      {/* Login Modal */}
      <Dialog open={isLoginOpen} onOpenChange={handleLoginClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Welcome Back</DialogTitle>
            <DialogDescription className="text-center">
              Sign in to your Linky account to continue
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  value={loginData.email}
                  onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={loginData.password}
                  onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {loginError && (
              <Alert variant="destructive" className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{loginError}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 text-sm">
                <input type="checkbox" className="rounded" disabled={isLoading} />
                <span>Remember me</span>
              </label>
              <button type="button" className="text-sm text-primary hover:underline" disabled={isLoading}>
                Forgot password?
              </button>
            </div>

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>

            <Separator className="my-4" />

            <div className="text-center">
              <span className="text-muted-foreground">Don't have an account? </span>
              <button
                type="button"
                onClick={onSwitchToSignUp}
                className="text-primary hover:underline font-medium"
                disabled={isLoading}
              >
                Sign up
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sign Up Modal */}
      <Dialog open={isSignUpOpen} onOpenChange={onSignUpClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Create Account</DialogTitle>
            <DialogDescription className="text-center">
              Join thousands of professionals using Linky
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signup-name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Enter your full name"
                  value={signUpData.name}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Enter your email"
                  value={signUpData.email}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={signUpData.password}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-confirm-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  id="signup-confirm-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  value={signUpData.confirmPassword}
                  onChange={(e) => setSignUpData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {signUpError && (
              <Alert variant="destructive" className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{signUpError}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-start space-x-2">
              <input type="checkbox" className="rounded mt-1" required disabled={isLoading} />
              <span className="text-sm text-muted-foreground">
                I agree to the{' '}
                <a href="#" className="text-primary hover:underline">Terms of Service</a>
                {' '}and{' '}
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </span>
            </div>

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold py-6" disabled={isLoading}>
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <Separator className="my-4" />

            <div className="text-center">
              <span className="text-muted-foreground">Already have an account? </span>
              <button
                type="button"
                onClick={onSwitchToLogin}
                className="text-primary hover:underline font-medium"
                disabled={isLoading}
              >
                Sign in
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthModals;