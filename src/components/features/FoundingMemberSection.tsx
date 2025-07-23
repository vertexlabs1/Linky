import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Crown, Star, Sparkles, Trophy, Zap } from 'lucide-react';
import { api } from '@/lib/api/api';

const FoundingMemberSection = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [formError, setFormError] = useState('');

  const handleFoundingMemberSignup = () => {
    setShowModal(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      // Format phone number as (XXX) XXX-XXXX
      const cleaned = value.replace(/\D/g, '');
      const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
      if (match) {
        const formatted = [
          match[1] && `(${match[1]}`,
          match[2] && `) ${match[2]}`,
          match[3] && `-${match[3]}`
        ].filter(Boolean).join('');
        setForm({ ...form, [name]: formatted });
      }
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Validation
    if (!form.firstName || !form.lastName || !form.email || !form.phone) {
      setFormError('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      // Create checkout session directly - user creation handled by Edge Function
      const { url } = await api.createFoundingMemberSchedule({
        customerEmail: form.email,
        successUrl: `https://uselinky.app/founding-member-success?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `https://uselinky.app`,
        metadata: {
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone,
        },
        phone: form.phone,
      });
      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (error: any) {
      setFormError(error.message || "There was an error creating your checkout session. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <section id="founding-member" className="py-2 bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-0.5 fade-in-up">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Simple and Affordable Pricing Plans
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            We offer plans that help any business get there. Choose your path to LinkedIn success.
          </p>
        </div>

        {/* Founding Member Section */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-2xl p-8 shadow-lg border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-white px-4 flex items-center gap-1">
                <Star className="w-3 h-3" />
                Limited Time
              </Badge>
            </div>
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Crown className="w-6 h-6 text-yellow-600" />
                  <h3 className="text-2xl font-bold text-foreground">Founding Member</h3>
                </div>
                <Badge className="bg-primary text-primary-foreground px-3 py-1">
                  Limited Time
                </Badge>
              </div>
              <div className="text-center mb-8">
                <div className="text-4xl font-bold text-foreground mb-2">$50</div>
                <p className="text-muted-foreground text-lg">One-time payment</p>
                <div className="text-sm text-muted-foreground mt-2">
                  <span className="line-through">$75/month</span>
                  <span className="font-medium text-primary ml-2">$50 for 3 months</span>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">3months of full MVP features</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Unlimited monitoring & AI suggestions</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Real-time lead scoring & analytics</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Feature requests & voting rights</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Private dev roadmap & community</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-foreground font-bold text-lg mb-2">Only 40 founding spots</div>
                <p className="text-sm text-muted-foreground mb-4">with auto renewal</p>
                <Button 
                  className="w-full py-3 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground transform hover:scale-105 transition-all duration-200"
                  onClick={handleFoundingMemberSignup}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processing...' : 'Claim Your Founding Spot'}
                </Button>
              </div>
          </div>
          
          {/* Connect to Waitlist */}
          <div className="text-center mt-12">
            <p className="text-xl text-muted-foreground mb-4">
              Not ready to commit? 
            </p>
            <p className="text-lg text-muted-foreground font-medium">
              👇 <span className="text-primary">Join the waitlist below</span> for free early access
            </p>
          </div>
        </div>
      </div>
      
      {/* Enhanced Modal for founding member info */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md animate-in zoom-in-95 duration-300">
          <DialogHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-6 h-6 text-yellow-600" />
              <DialogTitle className="text-2xl font-bold">Claim Your Founding Spot</DialogTitle>
              <Sparkles className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-muted-foreground">Join the exclusive founding members and shape the future of LinkedIn lead generation!</p>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input id="firstName" name="firstName" value={form.firstName} onChange={handleInputChange} required disabled={isLoading} />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input id="lastName" name="lastName" value={form.lastName} onChange={handleInputChange} required disabled={isLoading} />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleInputChange} required disabled={isLoading} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleInputChange} placeholder="(555) 123-4567" required disabled={isLoading} />
            </div>
            
            {formError && <div className="text-red-600 text-sm">{formError}</div>}
            <Button type="submit" className="w-full py-3 text-lg font-semibold bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground transform hover:scale-105 transition-all duration-200" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Continue to Payment
                </div>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default FoundingMemberSection; 