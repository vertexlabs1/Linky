import { useState, useEffect } from 'react';
import { Play, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  const [leadsCount, setLeadsCount] = useState(0);

  useEffect(() => {
    // Animate counter
    const targetCount = 134;
    const duration = 2000;
    const increment = targetCount / (duration / 50);
    
    const timer = setInterval(() => {
      setLeadsCount(prev => {
        const next = prev + increment;
        if (next >= targetCount) {
          clearInterval(timer);
          return targetCount;
        }
        return next;
      });
    }, 50);

    return () => clearInterval(timer);
  }, []);

  return (
    <section id="home" className="relative min-h-screen flex items-center bg-gradient-hero overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/20 to-transparent" />
      <div className="absolute top-1/4 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-10 w-48 h-48 bg-accent/10 rounded-full blur-2xl animate-pulse delay-1000" />

      <div className="container mx-auto px-4 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8 fade-in-up">
            {/* Logo + Brand */}
            <div className="flex items-center space-x-4 mb-6">
              <img 
                src="/lovable-uploads/04fea3ee-d055-40e5-9dae-0428d4e3487b.png" 
                alt="Linky Robot" 
                className="h-16 w-16 transition-smooth hover:scale-110 shadow-glow"
              />
              <h1 className="text-5xl lg:text-6xl font-black text-foreground">
                Linky
              </h1>
            </div>

            {/* Main Headline */}
            <h2 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
              Turn LinkedIn Likes into{' '}
              <span className="text-primary">Real Leads</span>
            </h2>

            {/* Subheadline */}
            <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
              Your AI-Powered LinkedIn Wingman: Track engagements, score leads, 
              generate comments, and automate outreach without the hassle.
            </p>

            {/* Social Proof */}
            <div className="flex items-center space-x-4 bg-card/50 backdrop-blur-sm rounded-lg px-6 py-4 shadow-card">
              <TrendingUp className="h-8 w-8 text-primary animate-pulse" />
              <div>
                <div className="text-3xl font-bold text-foreground">
                  {Math.floor(leadsCount)}+
                </div>
                <div className="text-muted-foreground font-medium">
                  Leads Generated
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                size="lg" 
                className="text-lg px-8 py-6 bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg hover:shadow-xl transition-smooth hover-lift"
              >
                Get Started Free
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="text-lg px-8 py-6 border-2 hover:bg-primary/10 transition-smooth group"
              >
                <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-smooth" />
                Watch Demo
              </Button>
            </div>

            {/* Demo Video Embed Placeholder */}
            <div className="pt-8">
              <div className="relative bg-card rounded-xl shadow-card overflow-hidden hover-lift">
                <div className="aspect-video bg-muted flex items-center justify-center relative group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20" />
                  <div className="relative flex items-center space-x-4 bg-background/90 backdrop-blur-sm rounded-lg px-6 py-4">
                    <Play className="w-12 h-12 text-accent group-hover:scale-110 transition-smooth" />
                    <div>
                      <div className="font-semibold text-foreground">10-Second Demo</div>
                      <div className="text-sm text-muted-foreground">See Linky in action</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Dashboard Preview */}
          <div className="relative fade-in-up delay-300">
            <div className="relative bg-card rounded-2xl shadow-card overflow-hidden hover-lift">
              <div className="bg-gradient-to-r from-primary to-accent h-4" />
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Lead Dashboard</h3>
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-destructive rounded-full" />
                      <div className="w-3 h-3 bg-primary rounded-full" />
                      <div className="w-3 h-3 bg-accent rounded-full" />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {[
                      { name: 'Sarah Johnson', score: 95, industry: 'Tech', status: 'Hot Lead' },
                      { name: 'Mike Chen', score: 87, industry: 'Finance', status: 'Warm' },
                      { name: 'Lisa Davis', score: 92, industry: 'Marketing', status: 'Hot Lead' },
                      { name: 'Tom Wilson', score: 78, industry: 'Sales', status: 'Cold' },
                    ].map((lead, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {lead.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-sm text-foreground">{lead.name}</div>
                            <div className="text-xs text-muted-foreground">{lead.industry}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-primary">{lead.score}</div>
                          <div className={`text-xs px-2 py-1 rounded-full ${
                            lead.status === 'Hot Lead' ? 'bg-destructive/20 text-destructive' :
                            lead.status === 'Warm' ? 'bg-primary/20 text-primary' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {lead.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;