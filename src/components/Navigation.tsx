import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import AuthModals from './AuthModals';

const Navigation = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation mascot appears as hero mascot fades (starts invisible)
  const mascotOpacity = Math.min(1, Math.max(0, (scrollY - 100) / 100)); // Starts appearing at 100px scroll
  const isScrolled = scrollY > 50;

  return (
    <>
      <nav className="fixed top-0 w-full z-50 transition-smooth bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center p-2">
              <div 
                className="transition-smooth"
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