import { Linkedin, Twitter, Mail, Github } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    Product: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'API Documentation', href: '#' },
      { name: 'Integrations', href: '#' }
    ],
    Company: [
      { name: 'About Us', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Contact', href: '#' }
    ],
    Resources: [
      { name: 'Help Center', href: '#' },
      { name: 'Community', href: '#' },
      { name: 'Tutorials', href: '#' },
      { name: 'Case Studies', href: '#' }
    ],
    Legal: [
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
      { name: 'Cookie Policy', href: '#' },
      { name: 'GDPR', href: '#' }
    ]
  };

  const socialLinks = [
    { name: 'LinkedIn', icon: Linkedin, href: '#', color: 'hover:text-accent' },
    { name: 'Twitter', icon: Twitter, href: '#', color: 'hover:text-blue-400' },
    { name: 'Email', icon: Mail, href: 'mailto:hello@uselinky.com', color: 'hover:text-primary' },
    { name: 'GitHub', icon: Github, href: '#', color: 'hover:text-foreground' }
  ];

  return (
    <footer className="bg-card border-t border-border">
      <div className="container mx-auto px-4 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img 
                src="/lovable-uploads/04fea3ee-d055-40e5-9dae-0428d4e3487b.png" 
                alt="Linky Robot" 
                className="h-10 w-10"
              />
              <span className="text-2xl font-bold text-foreground">Linky</span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-sm">
              Your AI-Powered LinkedIn Wingman. Turn LinkedIn likes into real leads 
              with smart engagement tracking and automated outreach.
            </p>
            
            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className={`w-10 h-10 bg-muted rounded-lg flex items-center justify-center transition-smooth hover-lift ${social.color}`}
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-semibold text-foreground mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.name}>
                    <a
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-smooth"
                    >
                      {link.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8 mb-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Stay Updated with Linky
            </h3>
            <p className="text-muted-foreground mb-6">
              Get the latest tips on LinkedIn lead generation and product updates delivered to your inbox.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button className="px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-smooth whitespace-nowrap">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-border">
          <div className="text-muted-foreground mb-4 md:mb-0">
            © {currentYear} Linky. All rights reserved.
          </div>
          
          <div className="flex items-center space-x-6 text-sm text-muted-foreground">
            <span>uselinky.com</span>
            <span>•</span>
            <a href="#" className="hover:text-primary transition-smooth">
              Status
            </a>
            <span>•</span>
            <a href="#" className="hover:text-primary transition-smooth">
              Security
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;