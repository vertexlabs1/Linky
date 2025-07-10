import { useState, useEffect } from 'react';

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
        <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-between max-w-7xl mx-auto min-h-[80vh]">
          {/* Hero Mascot - Left Side */}
          <div className="flex flex-col items-center lg:items-start lg:w-1/2 mb-8 lg:mb-0">
            <h2 className="text-6xl lg:text-8xl font-bold text-primary mb-4">Linky</h2>
            <div className="flex justify-center lg:justify-start">
              <img 
                src="/lovable-uploads/04fea3ee-d055-40e5-9dae-0428d4e3487b.png" 
                alt="Linky Robot" 
                className="object-contain transition-smooth"
                style={{
                  width: '320px',
                  height: '320px',
                  opacity: heroMascotOpacity,
                  transform: `scale(${heroMascotScale}) translateY(${scrollY * 0.05}px)`
                }}
              />
            </div>
          </div>

          {/* Content - Right Side */}
          <div className="lg:w-1/2 text-center lg:text-left space-y-6">
            {/* Main Headline */}
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground leading-tight">
              Turn LinkedIn Likes into{' '}
              <span className="text-primary">Real Leads</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg lg:text-xl text-muted-foreground leading-relaxed max-w-2xl">
              Your AI-Powered LinkedIn Wingman: Track engagements, score leads, 
              generate comments, and automate outreach without the hassle.
            </p>
          </div>
        </div>
        
        {/* Demo Video */}
        <div className="pt-16 max-w-3xl mx-auto">
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
    </section>
  );
};

export default HeroSection;