import { useEffect } from 'react';
import Navigation from './Navigation';
import HeroSection from './HeroSection';
import ProblemSection from './ProblemSection';
import PricingSection from './PricingSection';
import FAQSection from './FAQSection';
import Footer from './Footer';

const LandingPage = () => {
  useEffect(() => {
    // Intersection Observer for fade-in animations
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, observerOptions);

    // Observe all fade-in elements
    const fadeElements = document.querySelectorAll('.fade-in-up');
    fadeElements.forEach((el) => observer.observe(el));

    // Scroll progress indicator
    const updateScrollProgress = () => {
      const scrollProgress = document.querySelector('.scroll-progress') as HTMLElement;
      if (scrollProgress) {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = scrollTop / docHeight;
        scrollProgress.style.transform = `scaleX(${scrollPercent})`;
      }
    };

    window.addEventListener('scroll', updateScrollProgress);

    return () => {
      fadeElements.forEach((el) => observer.unobserve(el));
      window.removeEventListener('scroll', updateScrollProgress);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Demo Banner */}
      <div className="fixed top-0 left-0 right-0 bg-yellow-200 border-b border-yellow-300 z-[60]">
        <div className="container mx-auto px-4 py-2">
          <p className="text-red-600 font-bold text-center text-lg">
            THIS IS A DEMO SITE FOR LUKE.
          </p>
        </div>
      </div>

      {/* Scroll Progress Indicator */}
      <div className="scroll-progress fixed top-0 left-0 w-full h-1 bg-primary/20 z-50">
        <div className="scroll-progress h-full bg-primary origin-left transform scale-x-0 transition-transform duration-150"></div>
      </div>
      
      <Navigation />
      <HeroSection />
      <ProblemSection />
      <PricingSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default LandingPage;