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
    <section id="home" className="relative min-h-screen flex items-center bg-gradient-hero overflow-hidden pt-20">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/20 to-transparent" />
      <div className="absolute top-1/4 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-10 w-48 h-48 bg-accent/10 rounded-full blur-2xl animate-pulse delay-1000" />

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Main Headline */}
          <h1 className="text-5xl lg:text-7xl font-bold text-foreground leading-tight">
            Turn LinkedIn Likes into{' '}
            <span className="text-primary">Real Leads</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
            Your AI-Powered LinkedIn Wingman: Track engagements, score leads, 
            generate comments, and automate outreach without the hassle.
          </p>

          {/* Social Proof */}
          <div className="flex items-center justify-center space-x-4 bg-card/50 backdrop-blur-sm rounded-lg px-6 py-4 shadow-card max-w-md mx-auto">
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
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

          {/* Demo Video */}
          <div className="pt-12 max-w-4xl mx-auto">
            <div className="relative bg-card rounded-xl shadow-card overflow-hidden hover-lift">
              <iframe
                className="w-full aspect-video"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                title="Linky Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;