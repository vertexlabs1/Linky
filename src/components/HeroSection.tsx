import { useState, useEffect } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HeroSection = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // Track scroll for mascot animation
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Calculate hero mascot scale (starts large, shrinks and fades as user scrolls)
  const heroMascotOpacity = Math.max(0, 1 - (scrollY / 200));
  const heroMascotScale = Math.max(0.3, 1 - (scrollY / 400));

  return (
    <section id="home" className="relative min-h-screen flex items-center bg-gradient-hero overflow-hidden pt-20">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-r from-background/20 to-transparent" />
      <div className="absolute top-1/4 right-10 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-10 w-48 h-48 bg-accent/10 rounded-full blur-2xl animate-pulse delay-1000" />

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Hero Mascot */}
          <div className="flex justify-center mb-8">
            <img 
              src="/lovable-uploads/04fea3ee-d055-40e5-9dae-0428d4e3487b.png" 
              alt="Linky Robot" 
              className="h-48 w-48 lg:h-60 lg:w-60 transition-smooth"
              style={{
                opacity: heroMascotOpacity,
                transform: `scale(${heroMascotScale}) translateY(${scrollY * 0.05}px)`
              }}
            />
          </div>

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
          <div className="pt-8 max-w-2xl mx-auto">
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