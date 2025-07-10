import { useState, useEffect } from 'react';
import { Menu, X, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AuthModals from './AuthModals';

const Navigation = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  return (
    <>
      {/* Progress Bar */}
      <div className="scroll-progress" style={{ transform: `scaleX(${isScrolled ? 0.3 : 0})` }} />
      
      <nav className={`fixed top-0 w-full z-50 transition-smooth ${
        isScrolled 
          ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-card' 
          : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/04fea3ee-d055-40e5-9dae-0428d4e3487b.png" 
                alt="Linky Robot" 
                className="h-10 w-10 transition-smooth hover:scale-110"
              />
              <span className="text-2xl font-bold text-foreground">Linky</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('home')}
                className="text-foreground hover:text-primary transition-smooth font-medium"
              >
                Home
              </button>
              <button 
                onClick={() => scrollToSection('features')}
                className="text-foreground hover:text-primary transition-smooth font-medium"
              >
                Features
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="text-foreground hover:text-primary transition-smooth font-medium"
              >
                Pricing
              </button>
              <button 
                onClick={() => scrollToSection('faqs')}
                className="text-foreground hover:text-primary transition-smooth font-medium"
              >
                FAQs
              </button>
            </div>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="transition-smooth"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button 
                variant="ghost" 
                className="font-medium"
                onClick={() => setIsLoginOpen(true)}
              >
                Login
              </Button>
              <Button 
                className="font-semibold bg-accent hover:bg-accent/90 text-accent-foreground btn-pulse"
                onClick={() => setIsSignUpOpen(true)}
              >
                Sign Up Free
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden bg-background border-t border-border">
              <div className="px-4 py-4 space-y-4">
                <button 
                  onClick={() => scrollToSection('home')}
                  className="block w-full text-left text-foreground hover:text-primary transition-smooth font-medium py-2"
                >
                  Home
                </button>
                <button 
                  onClick={() => scrollToSection('features')}
                  className="block w-full text-left text-foreground hover:text-primary transition-smooth font-medium py-2"
                >
                  Features
                </button>
                <button 
                  onClick={() => scrollToSection('pricing')}
                  className="block w-full text-left text-foreground hover:text-primary transition-smooth font-medium py-2"
                >
                  Pricing
                </button>
                <button 
                  onClick={() => scrollToSection('faqs')}
                  className="block w-full text-left text-foreground hover:text-primary transition-smooth font-medium py-2"
                >
                  FAQs
                </button>
                <div className="flex items-center space-x-4 pt-4">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleDarkMode}
                  >
                    {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                  </Button>
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
          )}
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