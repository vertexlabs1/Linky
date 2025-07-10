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

  // Navigation mascot appears as hero mascot fades (starts invisible, grows as user scrolls)
  const mascotOpacity = Math.min(1, Math.max(0, (scrollY - 100) / 100)); // Starts appearing at 100px scroll
  const mascotScale = Math.min(1, Math.max(0, (scrollY - 100) / 100)); // Grows from 0 to 1
  const isScrolled = scrollY > 50;

  return (
    <>
      <nav className="fixed top-0 w-full z-50 transition-smooth bg-gradient-to-br from-primary/15 via-background/90 to-accent/15 backdrop-blur-md border-b border-primary/10">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/04fea3ee-d055-40e5-9dae-0428d4e3487b.png" 
                alt="Linky Robot" 
                className="transition-smooth hover:scale-110"
                style={{
                  width: '60px',
                  height: '60px',
                  opacity: mascotOpacity,
                  transform: `scale(${mascotScale})`
                }}
              />
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