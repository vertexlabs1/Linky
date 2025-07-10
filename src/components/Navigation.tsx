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

  // Calculate mascot size based on scroll (starts small, grows as user scrolls)
  const mascotScale = Math.min(1, scrollY / 200); // Fully grown at 200px scroll
  const isScrolled = scrollY > 50;

  return (
    <>
      <nav className={`fixed top-0 w-full z-50 transition-smooth ${
        isScrolled 
          ? 'bg-background/95 backdrop-blur-md border-b border-border' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center">
              <img 
                src="/lovable-uploads/04fea3ee-d055-40e5-9dae-0428d4e3487b.png" 
                alt="Linky Robot" 
                className="transition-smooth hover:scale-110"
                style={{
                  height: `${12 + (20 * mascotScale)}px`,
                  width: `${12 + (20 * mascotScale)}px`,
                  opacity: mascotScale,
                  transform: `scale(${0.3 + (0.7 * mascotScale)})`
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
                className="font-semibold bg-accent hover:bg-accent/90 text-accent-foreground"
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