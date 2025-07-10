import { useEffect } from 'react';
import Navigation from './Navigation';
import HeroSection from './HeroSection';
import ProblemSection from './ProblemSection';
import FeaturesSection from './FeaturesSection';
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
      <Navigation />
      <HeroSection />
      <ProblemSection />
      <FeaturesSection />
      <PricingSection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default LandingPage;