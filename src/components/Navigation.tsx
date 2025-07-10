import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import AuthModals from './AuthModals';
import FullLogo from './FullLogo';

const Navigation = () => {
  const [scrollY, setScrollY] = useState(0);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Enhanced logo animation logic
  const shouldShowLogo = scrollY > 150;
  const isScrolled = scrollY > 50;
  
  // Trigger animation only once when logo should appear
  useEffect(() => {
    if (shouldShowLogo && !hasAnimated) {
      setHasAnimated(true);
    } else if (!shouldShowLogo && hasAnimated) {
      setHasAnimated(false);
    }
  }, [shouldShowLogo, hasAnimated]);

  return (
    <>
      <motion.nav 
        className={`fixed top-0 w-full z-50 transition-smooth ${
          isScrolled ? 'bg-background/80 backdrop-blur-md shadow-card border-b border-border/20' : 'bg-transparent'
        }`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Animated Logo */}
            <div className="flex items-center">
              <AnimatePresence mode="wait">
                {shouldShowLogo && (
                  <motion.div
                    key="nav-logo"
                    initial={{ 
                      opacity: 0, 
                      scale: 0.3,
                      x: -200,
                      y: 200,
                      rotate: -45
                    }}
                    animate={{ 
                      opacity: 1, 
                      scale: 1,
                      x: 0,
                      y: 0,
                      rotate: 0
                    }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.3,
                      transition: { duration: 0.3 }
                    }}
                    transition={{
                      type: "spring",
                      damping: 20,
                      stiffness: 300,
                      duration: 0.8
                    }}
                  >
                    <FullLogo 
                      size="small" 
                      className="hover:scale-105 transition-transform duration-200"
                      animate={hasAnimated}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Enhanced Navigation */}
            <div className="flex items-center space-x-4">
              {/* Dark Mode Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="rounded-full hover:bg-accent/50"
              >
                <motion.div
                  animate={{ rotate: isDarkMode ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </motion.div>
              </Button>
              
              <Button 
                variant="ghost" 
                className="font-medium hover:bg-accent/50 transition-colors"
                onClick={() => setIsLoginOpen(true)}
              >
                Login
              </Button>
              <Button 
                className="font-semibold bg-accent hover:bg-accent/90 text-accent-foreground rounded-full px-6 shadow-ai-glow hover:shadow-xl transition-all duration-300 hover:scale-105"
                onClick={() => setIsSignUpOpen(true)}
              >
                Sign Up Free
              </Button>
            </div>
          </div>
        </div>
      </motion.nav>
      
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