import { useState } from 'react';
import { Check, X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

const PricingSection = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  const plans = [
    {
      name: "Prospector",
      price: isAnnual ? 100 : 125,
      description: "Perfect for individual professionals",
      popular: false,
      features: {
        "LinkedIn Profiles Monitored": 5,
        "Profiles Tracked": 100,
        "AI Lead Scoring": true,
        "Comment Generation": true,
        "Basic Analytics": true,
        "Email Support": true,
        "Advanced AI Research": false,
        "Email Automation": false,
        "Custom Integrations": false,
        "Priority Support": false
      }
    },
    {
      name: "Networker", 
      price: isAnnual ? 240 : 300,
      description: "Ideal for growing teams",
      popular: true,
      features: {
        "LinkedIn Profiles Monitored": 10,
        "Profiles Tracked": 300,
        "AI Lead Scoring": true,
        "Comment Generation": true,
        "Basic Analytics": true,
        "Email Support": true,
        "Advanced AI Research": true,
        "Email Automation": true,
        "Custom Integrations": false,
        "Priority Support": false
      }
    },
    {
      name: "Rainmaker",
      price: isAnnual ? 360 : 450,
      description: "For sales teams and agencies",
      popular: false,
      features: {
        "LinkedIn Profiles Monitored": 20,
        "Profiles Tracked": 500,
        "AI Lead Scoring": true,
        "Comment Generation": true,
        "Basic Analytics": true,
        "Email Support": true,
        "Advanced AI Research": true,
        "Email Automation": true,
        "Custom Integrations": true,
        "Priority Support": true
      }
    }
  ];

  const addOns = [
    {
      id: "extra-monitoring",
      name: "Extra Profile Monitoring",
      price: 25,
      description: "+10 additional profiles to monitor"
    },
    {
      id: "advanced-analytics",
      name: "Advanced Analytics Dashboard",
      price: 50,
      description: "Deep insights and custom reports"
    },
    {
      id: "white-label",
      name: "White Label Solution",
      price: 200,
      description: "Rebrand Linky as your own tool"
    }
  ];

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOns(prev => 
      prev.includes(addOnId) 
        ? prev.filter(id => id !== addOnId)
        : [...prev, addOnId]
    );
  };

  const getAddOnTotal = () => {
    return addOns
      .filter(addOn => selectedAddOns.includes(addOn.id))
      .reduce((total, addOn) => total + addOn.price, 0);
  };

  return (
    <section id="pricing" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16 fade-in-up">
          <h2 className="text-4xl lg:text-5xl font-bold text-foreground mb-6">
            Choose Your{' '}
            <span className="text-primary">Plan</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
            Select the perfect plan for your LinkedIn lead generation needs. All plans include our core AI features.
          </p>
          
          {/* Annual Toggle */}
          <div className="flex items-center justify-center space-x-4 bg-card rounded-lg p-4 inline-flex">
            <span className={`font-medium ${!isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`font-medium ${isAnnual ? 'text-foreground' : 'text-muted-foreground'}`}>
              Annual
            </span>
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              Save 20%
            </Badge>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div 
              key={plan.name}
              className={`relative bg-card rounded-2xl p-8 shadow-card hover-lift transition-smooth fade-in-up ${
                plan.popular ? 'border-2 border-primary shadow-glow' : ''
              }`}
              style={{ animationDelay: `${index * 200}ms` }}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                  Most Popular
                </Badge>
              )}

              {/* Header */}
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-4">{plan.description}</p>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-foreground">
                    ${plan.price}
                    <span className="text-lg text-muted-foreground font-normal">
                      /{isAnnual ? 'month' : 'month'}
                    </span>
                  </div>
                  {isAnnual && (
                    <div className="text-sm text-muted-foreground line-through">
                      ${plan.name === 'Prospector' ? 125 : plan.name === 'Networker' ? 300 : 450}/month
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {Object.entries(plan.features).map(([feature, value]) => (
                  <div key={feature} className="flex items-center justify-between">
                    <span className="text-foreground">{feature}</span>
                    <div className="flex items-center">
                      {typeof value === 'boolean' ? (
                        value ? (
                          <Check className="w-5 h-5 text-primary" />
                        ) : (
                          <X className="w-5 h-5 text-muted-foreground" />
                        )
                      ) : (
                        <span className="font-semibold text-primary">{value}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button 
                className={`w-full py-6 text-lg font-semibold transition-smooth ${
                  plan.popular 
                    ? 'bg-primary hover:bg-primary/90 text-primary-foreground' 
                    : 'bg-accent hover:bg-accent/90 text-accent-foreground'
                }`}
              >
                Choose {plan.name}
              </Button>
            </div>
          ))}
        </div>

        {/* Add-ons Section */}
        <div className="max-w-4xl mx-auto fade-in-up">
          <h3 className="text-2xl font-bold text-center text-foreground mb-8">
            Customize Your Plan
          </h3>
          
          <div className="bg-card rounded-2xl p-8 shadow-card">
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {addOns.map((addOn) => (
                <div 
                  key={addOn.id}
                  className={`border-2 rounded-lg p-6 cursor-pointer transition-smooth hover-lift ${
                    selectedAddOns.includes(addOn.id)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleAddOn(addOn.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center ${
                          selectedAddOns.includes(addOn.id)
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border'
                        }`}>
                          {selectedAddOns.includes(addOn.id) && (
                            <Check className="w-4 h-4" />
                          )}
                        </div>
                        <h4 className="font-semibold text-foreground">{addOn.name}</h4>
                      </div>
                      <p className="text-muted-foreground mb-3">{addOn.description}</p>
                      <div className="text-lg font-bold text-primary">
                        +${addOn.price}/month
                      </div>
                    </div>
                    <Plus className={`w-6 h-6 transition-smooth ${
                      selectedAddOns.includes(addOn.id) ? 'rotate-45 text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                </div>
              ))}
            </div>

            {selectedAddOns.length > 0 && (
              <div className="border-t border-border pt-6">
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span className="text-foreground">Add-ons Total:</span>
                  <span className="text-primary">+${getAddOnTotal()}/month</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 fade-in-up">
          <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Questions About Pricing?
            </h3>
            <p className="text-muted-foreground mb-6">
              Need a custom plan or have questions? Our team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" size="lg">
                Contact Sales
              </Button>
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;