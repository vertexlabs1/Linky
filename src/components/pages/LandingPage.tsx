import React from 'react';
import Navigation from '../layout/Navigation';
import HeroSection from '../HeroSection';
import WaitlistSection from '../features/WaitlistSection';
import FoundingMemberSection from '../features/FoundingMemberSection';
import Footer from '../Footer';

const LandingPage = () => {
  // Scroll progress indicator
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = (scrollTop / docHeight) * 100;
      
      const progressBar = document.querySelector('.scroll-progress') as HTMLElement;
      if (progressBar) {
        progressBar.style.transform = `scaleX(${scrollPercent / 100})`;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Logo fade effect
  const [mascotOpacity, setMascotOpacity] = React.useState(1);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const fadeStart = 100;
      const fadeEnd = 300;
      
      if (scrollY <= fadeStart) {
        setMascotOpacity(1);
      } else if (scrollY >= fadeEnd) {
        setMascotOpacity(0);
      } else {
        const fadeRange = fadeEnd - fadeStart;
        const fadeProgress = scrollY - fadeStart;
        setMascotOpacity(1 - (fadeProgress / fadeRange));
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="bg-background">

      {/* Scroll Progress Indicator */}
      <div className="scroll-progress fixed top-0 left-0 w-full h-1 bg-primary/20 z-50">
        <div className="scroll-progress h-full bg-primary origin-left transform scale-x-0 transition-transform duration-150"></div>
      </div>
      
      <Navigation />
      <HeroSection />
      {/* <ProblemSection /> */}
      <FoundingMemberSection />
      <WaitlistSection />
      {/* <FAQSection /> */}
      <Footer />
    </div>
  );
};

export default LandingPage;