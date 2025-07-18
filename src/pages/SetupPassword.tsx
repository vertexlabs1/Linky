import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Crown, Sparkles, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SetupPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const email = searchParams.get('email');
  const sessionId = searchParams.get('session');

  const [form, setForm] = useState({
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (!email) {
      setError('Invalid setup link. Please check your email.');
    }
  }, [email]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.password || !form.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      // Create a new Supabase Auth user account WITHOUT emailRedirectTo to prevent automatic emails
      // Founding members already received the beautiful custom email, we don't want Supabase sending another one
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email!,
        password: form.password,
        options: {
          // Remove emailRedirectTo to prevent automatic emails
          data: {
            // Add user metadata for better tracking
            first_name: email!.split('@')[0], // Fallback name from email
            founding_member: true,
            source: 'founding_member_password_setup'
          }
        }
      });

      if (signUpError) {
        throw signUpError;
      }

      // Update the user record to mark password as set and link Auth user
      if (sessionId && data.user) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            auth_user_id: data.user.id,
            password_set: true,
            email_verified: true 
          })
          .eq('email', email)
          .eq('stripe_session_id', sessionId);

        if (updateError) {
          console.error('Error updating user record:', updateError);
        } else {
          console.log('✅ Successfully linked Auth user to users table');
        }
      }

      setSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);

    } catch (error: any) {
      setError(error.message || 'Failed to set password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-red-600 text-lg font-semibold mb-4">
                Invalid Setup Link
              </div>
              <p className="text-muted-foreground">
                Please check your email for the correct password setup link.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Crown className="w-8 h-8 text-yellow-600" />
              <CardTitle className="text-2xl">Welcome to Linky!</CardTitle>
              <Sparkles className="w-8 h-8 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="text-green-600 text-lg font-semibold">
                🎉 Password Set Successfully!
              </div>
              <p className="text-muted-foreground">
                Your account is now ready! Redirecting you to your exclusive founding member dashboard...
              </p>
              <div className="flex items-center justify-center gap-2 text-primary">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span>Setting up your dashboard...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="w-8 h-8 text-yellow-600" />
            <CardTitle className="text-2xl">Set Up Your Account</CardTitle>
            <Sparkles className="w-8 h-8 text-yellow-600" />
          </div>
          <p className="text-muted-foreground">
            Welcome to the Linky founding members! Create your password to access your exclusive dashboard.
          </p>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                disabled 
                className="bg-muted"
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                name="password" 
                type="password" 
                value={form.password} 
                onChange={handleInputChange} 
                required 
                disabled={isLoading}
                placeholder="Enter your password"
              />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input 
                id="confirmPassword" 
                name="confirmPassword" 
                type="password" 
                value={form.confirmPassword} 
                onChange={handleInputChange} 
                required 
                disabled={isLoading}
                placeholder="Confirm your password"
              />
            </div>
            
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground transform hover:scale-105 transition-all duration-200" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Setting up your account...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Create My Account
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Founding Member Benefits
            </h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                3 months of full MVP features
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Unlimited AI-powered monitoring
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Feature voting rights
              </li>
              <li className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                Private community access
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetupPassword; 