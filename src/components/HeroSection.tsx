import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Users, Zap, Play } from 'lucide-react';

const HeroSection = () => {
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Track scroll for parallax effects
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Calculate parallax effects - faster fade for mobile
  const heroMascotOpacity = Math.max(0, 1 - (scrollY / 150));
  const heroMascotScale = Math.max(0.3, 1 - (scrollY / 300));
  const textParallax = scrollY * 0.1;
  
  // Calculate dynamic height reduction to eliminate blank space
  const heroHeight = Math.max(60, 80 - (scrollY / 10));
  const gridCollapseProgress = Math.min(1, scrollY / 200);
  const isScrolled = scrollY > 50;

  return (
    <section id="home" className="relative min-h-screen flex items-center overflow-hidden pt-20 hero-bg-pattern">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-xl float-animation" />
        <div className="absolute top-3/4 right-1/3 w-24 h-24 bg-accent/20 rounded-full blur-lg float-animation" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-primary/30 rounded-full blur-md float-animation" style={{ animationDelay: '4s' }} />
        
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.3) 1px, transparent 0)`,
          backgroundSize: '50px 50px'
        }} />
      </div>
      
      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div 
          className={`grid items-center max-w-7xl mx-auto transition-all duration-500 ${
            isScrolled 
              ? 'grid-cols-1 gap-6 min-h-[60vh] lg:grid-cols-2 lg:gap-12 lg:min-h-[80vh]' 
              : 'lg:grid-cols-2 gap-12 min-h-[80vh]'
          }`}
          style={{ minHeight: window.innerWidth < 1024 ? `${heroHeight}vh` : '80vh' }}
        >
          
          {/* Content - Left Side */}
          <div className={`space-y-8 ${mounted ? 'slide-in-left' : 'opacity-0'}`} style={{ transform: `translateY(${textParallax}px)` }}>
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium pulse-glow">
              <Sparkles className="w-4 h-4" />
              AI-Powered LinkedIn Automation
            </div>

            {/* Main Headline with gradient text */}
            <div className="space-y-4">
              <h1 className="text-6xl lg:text-8xl font-black leading-none text-reveal">
                Turn LinkedIn{' '}
                <span className="bg-gradient-text bg-clip-text text-transparent">
                  Likes
                </span>
              </h1>
              <h1 className="text-6xl lg:text-8xl font-black leading-none text-reveal" style={{ animationDelay: '0.5s' }}>
                Into{' '}
                <span className="bg-gradient-text bg-clip-text text-transparent">
                  Leads
                </span>
              </h1>
            </div>

            {/* Subheadline */}
            <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-xl text-reveal" style={{ animationDelay: '1s' }}>
              Your AI-powered LinkedIn wingman that tracks engagements, scores leads, 
              and automates outreach while you focus on closing deals.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 text-reveal" style={{ animationDelay: '1.5s' }}>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">300% More Leads</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                <span className="text-sm font-medium">10k+ Users</span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">5 Min Setup</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4 text-reveal" style={{ animationDelay: '2s' }}>
              <button className="bg-gradient-button text-primary-foreground font-bold text-lg px-8 py-4 rounded-2xl btn-hover-lift shadow-button">
                Start Free Trial
              </button>
              <button className="border-2 border-primary text-primary font-bold text-lg px-8 py-4 rounded-2xl transition-smooth hover:bg-primary hover:text-primary-foreground">
                Watch Demo
              </button>
            </div>
          </div>

          {/* Hero Mascot - Right Side - Responsive positioning */}
          <div 
            className={`${
              isScrolled && window.innerWidth < 1024
                ? 'absolute top-4 right-4 z-0' 
                : 'flex justify-center lg:justify-end relative'
            } ${mounted ? 'slide-in-right' : 'opacity-0'} transition-all duration-500`}
            style={{
              opacity: heroMascotOpacity,
              transform: `scale(${
                isScrolled && window.innerWidth < 1024 ? 0.3 : heroMascotScale
              }) translateY(${scrollY * 0.05}px)`,
              pointerEvents: (isScrolled && window.innerWidth < 1024) ? 'none' : 'auto'
            }}
          >
            <div className="relative">
              {/* Glow effect behind mascot */}
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-150 pulse-glow" />
              
              <img 
                src="/lovable-uploads/04fea3ee-d055-40e5-9dae-0428d4e3487b.png" 
                alt="Linky Robot" 
                className="relative object-contain float-animation"
                style={{
                  width: (isScrolled && window.innerWidth < 1024) ? '120px' : '500px',
                  height: (isScrolled && window.innerWidth < 1024) ? '120px' : '500px',
                }}
              />
              
              {/* Floating UI elements around mascot - hide on mobile when scrolled */}
              {!(isScrolled && window.innerWidth < 1024) && (
                <>
                  <div className="absolute top-10 -left-10 bg-card p-3 rounded-xl shadow-lg float-animation border border-primary/20 hidden lg:block" style={{ animationDelay: '1s' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="text-sm font-medium">New Lead!</span>
                    </div>
                  </div>
                  
                  <div className="absolute bottom-20 -right-10 bg-card p-3 rounded-xl shadow-lg float-animation border border-accent/20 hidden lg:block" style={{ animationDelay: '3s' }}>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-accent" />
                      <span className="text-sm font-medium">+247% ROI</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Demo Video */}
        <div className="pt-12 max-w-4xl mx-auto opacity-100 visible"
             style={{ animationDelay: '2.5s' }}>
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-2">See Linky in Action</h3>
            <p className="text-muted-foreground">Watch how easy it is to create and manage your LinkedIn automation</p>
          </div>
          
          <div className="relative bg-card rounded-3xl shadow-card overflow-hidden hover-lift border border-primary/10 group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
            
            {/* Video Container */}
            <div className="relative aspect-video">
              <iframe
                className="w-full h-full relative z-10"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?controls=0&showinfo=0&rel=0&modestbranding=1&iv_load_policy=3"
                title="Linky Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onLoad={() => setIsVideoPlaying(false)}
              />
              
              {/* Custom Play Button Overlay */}
              {!isVideoPlaying && (
                <div 
                  className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm z-20 cursor-pointer transition-all duration-300 group-hover:bg-black/10"
                  onClick={() => setIsVideoPlaying(true)}
                >
                  <div className="bg-white/90 hover:bg-white rounded-full p-6 shadow-2xl transition-all duration-300 hover:scale-110 pulse-glow">
                    <Play className="w-12 h-12 text-primary ml-1" fill="currentColor" />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Video caption */}
          <p className="text-center text-muted-foreground mt-6 text-lg">
            Transform your LinkedIn presence in under 2 minutes
          </p>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;