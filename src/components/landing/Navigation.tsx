import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import AuthModals from './AuthModals';

const Navigation = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      // More responsive on mobile - less throttling
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', checkMobile);
    checkMobile(); // Check on initial load

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Snappier fade calculation for mobile
  const fadeStart = 100;
  const fadeDistance = isMobile ? 800 : 600; // Shorter distance for snappier response
  const mascotOpacity = Math.max(0, Math.min(1, (scrollY - fadeStart) / fadeDistance));

  return (
    <>
      <nav className="fixed top-12 w-full z-50 transition-smooth bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center p-2">
              <div 
                className="transition-smooth nav-logo"
                style={{ opacity: mascotOpacity }}
              >
                <img 
                  src="/lovable-uploads/04fea3ee-d055-40e5-9dae-0428d4e3487b.png" 
                  alt="Linky Robot" 
                  className="w-16 h-16 object-contain transition-smooth hover:scale-110"
                />
              </div>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="font-medium"
                onClick={() => setIsLoginOpen(true)}
              >
                Login
              </Button>
              <Button 
                className="font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6"
                onClick={() => setIsSignUpOpen(true)}
              >
                Sign Up Free
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      <AuthModals
        isLoginOpen={isLoginOpen}
        isSignUpOpen={isSignUpOpen}
        onLoginClose={() => setIsLoginOpen(false)}
        onSignUpClose={() => setIsSignUpOpen(false)}
        onSwitchToSignUp={() => {
          setIsLoginOpen(false);
          setIsSignUpOpen(true);
        }}
        onSwitchToLogin={() => {
          setIsSignUpOpen(false);
          setIsLoginOpen(true);
        }}
      />
    </>
  );
};

export default Navigation;