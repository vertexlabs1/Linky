import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import FullLogo from './FullLogo';
import ParticleEffect from './ParticleEffect';
import SocialProof from './SocialProof';
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
    <section id="home" className="relative min-h-screen flex items-center bg-gradient-hero-ai overflow-hidden pt-20">
      {/* Advanced AI Background Effects */}
      <ParticleEffect />
      <div className="absolute inset-0 bg-gradient-ai-accent opacity-50" />
      <div className="absolute top-1/4 right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse shadow-ai-glow" />
      <div className="absolute bottom-1/4 left-10 w-48 h-48 bg-accent/20 rounded-full blur-2xl animate-pulse delay-1000 shadow-ai-glow" />
      <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-pulse delay-500" />

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-center justify-center lg:justify-start max-w-7xl mx-auto min-h-[80vh] gap-8">
          {/* Full Logo - Prominent Position */}
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: heroMascotOpacity, scale: heroMascotScale, y: scrollY * 0.05 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <FullLogo size="large" className="transform transition-smooth" />
          </motion.div>

          {/* Content - Flows with Logo */}
          <div className="flex-1 text-center lg:text-left space-y-8 max-w-3xl">
            {/* Main Headline with Glow */}
            <motion.h1 
              className="text-4xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight text-glow"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Turn LinkedIn Likes into{' '}
              <span className="text-primary shadow-ai-glow">Real Leads</span>
            </motion.h1>

            {/* Enhanced AI Subheadline */}
            <motion.p 
              className="text-lg lg:text-xl text-muted-foreground leading-relaxed"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <span className="text-primary font-semibold">Powered by advanced AI:</span>{' '}
              Track engagements, score leads, generate comments, and automate outreach with smart automation.
            </motion.p>

            {/* Social Proof */}
            <motion.div 
              className="flex justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
            >
              <SocialProof />
            </motion.div>

            {/* Enhanced CTA */}
            <motion.div 
              className="flex justify-center lg:justify-start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
            >
              <Button 
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold px-8 py-4 text-lg rounded-full shadow-ai-glow hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Sign Up Free
              </Button>
            </motion.div>
          </div>
        </div>
        
        {/* Demo Video with Enhanced Styling */}
        <motion.div 
          className="pt-16 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
          <div className="relative bg-card/90 backdrop-blur-sm rounded-2xl shadow-ai-glow overflow-hidden hover-lift border border-primary/20">
            <iframe
              className="w-full aspect-video"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="Linky Demo"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;